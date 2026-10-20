import Appointment from '@/models/Appointment';
import AppointmentOptimized from '@/models/AppointmentOptimized';
import AppointmentSlot from '@/models/AppointmentSlot';
import Availability from '@/models/Availability';
import Hub from '@/models/Hub';
import { AvailabilityCache } from '@/lib/redis';
import { APPOINTMENT_STATUS, ACTIVE_APPOINTMENT_STATUSES } from '@/lib/appointmentStatus';
import { calendarDateFromValue, toAppointmentClock, toTwentyFourHour } from '@/lib/appointmentTime';
import { promoteWaitlist } from '@/lib/waitlistService';
import { appointmentStartDateTime, getHubTimezone } from '@/lib/slotDateTime';

export function appointmentDateKey(value?: Date | string | null): string {
  return calendarDateFromValue(value);
}

export async function freeAppointmentSeat(appointment: {
  hubId?: unknown;
  hubName?: string;
  appointmentDate?: Date | string;
  appointmentTime?: string;
}) {
  const date = appointmentDateKey(appointment.appointmentDate);
  const displayTime = toAppointmentClock(appointment.appointmentTime || '');
  const twentyFour = toTwentyFourHour(appointment.appointmentTime || '');
  if (!date || !displayTime) return;

  const hub = appointment.hubId
    ? await Hub.findById(appointment.hubId).select('_id name')
    : appointment.hubName
      ? await Hub.findOne({ name: appointment.hubName }).select('_id name')
      : null;

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  await AppointmentSlot.updateOne(
    {
      hubName: hub?.name || appointment.hubName,
      date: { $gte: dayStart, $lt: dayEnd },
      time: displayTime,
    },
    { $inc: { bookedCount: -1 } }
  );

  if (hub) {
    const availability = await Availability.findOne({ hubId: hub._id, date });
    if (availability) {
      try {
        await availability.cancelBooking(twentyFour);
      } catch {
        try {
          await availability.cancelBooking(displayTime);
        } catch {
          // Slot documents are optional on some days.
        }
      }
    }
    await AvailabilityCache.invalidate(String(hub._id), date);
    await promoteWaitlist(String(hub._id), hub.name, { date, time: displayTime });
  }
}

/**
 * Undo of freeAppointmentSeat (e.g. a no-show reverted because the student did arrive).
 * No capacity check: the person is physically at the desk, even if the seat was re-booked.
 */
export async function retakeAppointmentSeat(appointment: {
  hubId?: unknown;
  hubName?: string;
  appointmentDate?: Date | string;
  appointmentTime?: string;
}) {
  const date = appointmentDateKey(appointment.appointmentDate);
  const displayTime = toAppointmentClock(appointment.appointmentTime || '');
  const twentyFour = toTwentyFourHour(appointment.appointmentTime || '');
  if (!date || !displayTime) return;

  const hub = appointment.hubId
    ? await Hub.findById(appointment.hubId).select('_id name')
    : appointment.hubName
      ? await Hub.findOne({ name: appointment.hubName }).select('_id name')
      : null;

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  await AppointmentSlot.updateOne(
    {
      hubName: hub?.name || appointment.hubName,
      date: { $gte: dayStart, $lt: dayEnd },
      time: displayTime,
    },
    { $inc: { bookedCount: 1 } }
  );

  if (hub) {
    const availability = await Availability.findOne({ hubId: hub._id, date });
    if (availability) {
      try {
        await availability.bookSlot(twentyFour);
      } catch {
        try {
          await availability.bookSlot(displayTime);
        } catch {
          // Full or missing slot documents are fine here; the AppointmentSlot count is authoritative.
        }
      }
    }
    await AvailabilityCache.invalidate(String(hub._id), date);
  }
}

export async function markAppointmentCancelled(appointmentId: string) {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) return null;
  if (!ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status as typeof ACTIVE_APPOINTMENT_STATUSES[number])) {
    return appointment;
  }

  appointment.status = APPOINTMENT_STATUS.CANCELLED;
  await appointment.save();

  const date = appointmentDateKey(appointment.appointmentDate);
  await AppointmentOptimized.findOneAndUpdate(
    { userId: appointment.userId, date },
    { status: 'cancelled' }
  );
  await freeAppointmentSeat(appointment);
  return appointment;
}

export async function expirePastAppointments() {
  const appointments = await Appointment.find({
    status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.PENDING_PROFILE, APPOINTMENT_STATUS.CONFIRMED] },
  });

  let expired = 0;
  const now = Date.now();

  for (const appointment of appointments) {
    const hub = appointment.hubId
      ? await Hub.findById(appointment.hubId).select('timezone')
      : appointment.hubName
        ? await Hub.findOne({ name: appointment.hubName }).select('timezone')
        : null;
    const start = appointmentStartDateTime(
      appointment.appointmentDate,
      appointment.appointmentTime,
      getHubTimezone(hub?.timezone)
    );
    if (!start.isValid || start.toMillis() > now) continue;

    appointment.status = APPOINTMENT_STATUS.EXPIRED;
    await appointment.save();
    expired += 1;
  }

  return expired;
}
