import { DateTime } from 'luxon';
import Waitlist from '@/models/Waitlist';
import User from '@/models/User';
import Appointment from '@/models/Appointment';
import Hub from '@/models/Hub';
import { sendWaitlistAvailableEmail } from '@/lib/emailService';
import { notifyStudent } from '@/lib/studentNotifications';
import { ACTIVE_APPOINTMENT_STATUSES } from '@/lib/appointmentStatus';
import { combineSlotDateTime, getHubTimezone } from '@/lib/slotDateTime';
import { isTimePreference, slotMatchesTimePreference } from '@/lib/timePreference';

/** Don't offer seats that start too soon to realistically book and travel to. */
const MIN_LEAD_HOURS = 2;
/** An unanswered offer lets the person be offered the next opening after this long. */
const OFFER_EXPIRES_HOURS = 24;
const CANDIDATE_BATCH = 25;

export interface FreedSeat {
  /** YYYY-MM-DD calendar day */
  date: string;
  /** Wall-clock time, e.g. "9:00 AM" */
  time: string;
}

function formatSeat(seat: FreedSeat | undefined, timezone: string) {
  if (!seat) return { date: '', time: '' };
  const start = combineSlotDateTime(seat.date, seat.time, timezone);
  return {
    date: start.isValid ? start.setLocale('en-US').toFormat('cccc, LLLL d') : seat.date,
    time: seat.time,
  };
}

export async function notifyWaitlistEntry(
  entry: { userId: unknown; hubName?: string },
  hubName: string,
  seat?: { date: string; time: string }
) {
  const user = await User.findById(entry.userId);
  if (!user?.email) return;
  const site = hubName || entry.hubName || 'your learning center';
  const when = seat?.date && seat.time ? ` (${seat.date}, ${seat.time})` : '';
  await sendWaitlistAvailableEmail({
    recipientEmail: user.email,
    recipientName: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'there',
    appointmentDate: seat?.date || '',
    appointmentTime: seat?.time || '',
    hubName: site,
    profileUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
  });
  await notifyStudent({
    userId: String(user._id),
    title: 'Se abrió un cupo / A seat opened',
    message: `Se abrió un cupo en ${site}${when}. Resérvelo desde su panel. / A seat opened at ${site}${when}. Book it from your dashboard.`,
    hubName: site,
    type: 'appointment',
  });
}

/**
 * Offer a freed seat to the longest-waiting person it actually suits.
 * With `seat`, skips seats starting within MIN_LEAD_HOURS (e.g. a no-show marked after the
 * start time) and people whose time preference doesn't match. Each entry is claimed
 * atomically so concurrent cancellations never notify the same person twice.
 */
export async function promoteWaitlist(hubId: string, hubName: string, seat?: FreedSeat) {
  const now = DateTime.now();

  let timezone = getHubTimezone();
  if (seat) {
    const hub = await Hub.findById(hubId).select('timezone').lean<{ timezone?: string }>();
    timezone = getHubTimezone(hub?.timezone);
    const start = combineSlotDateTime(seat.date, seat.time, timezone);
    if (!start.isValid || start <= now.plus({ hours: MIN_LEAD_HOURS })) return null;
  }

  const offerExpired = now.minus({ hours: OFFER_EXPIRES_HOURS }).toJSDate();
  const eligible = {
    hubId,
    $or: [
      { status: 'waiting' },
      { status: 'notified', notifiedAt: { $lt: offerExpired } },
      { status: 'notified', notifiedAt: { $exists: false } },
    ],
  };

  const candidates = await Waitlist.find(eligible).sort({ createdAt: 1 }).limit(CANDIDATE_BATCH).lean();
  for (const candidate of candidates as any[]) {
    if (seat && isTimePreference(candidate.timePreference) &&
        !slotMatchesTimePreference(candidate.timePreference, seat.time, seat.date)) {
      continue;
    }

    // Already booked somewhere: close out their waitlist entries instead of offering
    const hasBooking = await Appointment.exists({
      userId: candidate.userId,
      status: { $in: [...ACTIVE_APPOINTMENT_STATUSES] },
    });
    if (hasBooking) {
      await markWaitlistBooked(candidate.userId);
      continue;
    }

    const claimed = await Waitlist.findOneAndUpdate(
      { _id: candidate._id, status: candidate.status, notifiedAt: candidate.notifiedAt ?? { $exists: false } },
      { $set: { status: 'notified', notifiedAt: now.toJSDate() } },
      { returnDocument: 'after' }
    );
    if (!claimed) continue; // another release got there first

    await notifyWaitlistEntry(claimed, hubName, formatSeat(seat, timezone));
    return claimed;
  }

  return null;
}

/** A booked student no longer needs (or should get) waitlist offers. */
export async function markWaitlistBooked(userId: unknown) {
  await Waitlist.updateMany(
    { userId, status: { $in: ['waiting', 'notified'] } },
    { $set: { status: 'booked' } }
  );
}
