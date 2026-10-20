import { DateTime } from 'luxon';
import { logger } from '@/lib/logger';
import Appointment from '@/models/Appointment';
import Hub from '@/models/Hub';
import ReminderSettings from '@/models/ReminderSettings';
import SentReminder from '@/models/SentReminder';
import '@/models/User';
import { isSmtpConfigured, sendReminderEmail } from '@/lib/emailService';
import { notifyStudent } from '@/lib/studentNotifications';
import { calendarDateFromValue } from '@/lib/appointmentTime';
import { APPOINTMENT_STATUS } from '@/lib/appointmentStatus';
import { appointmentStartDateTime, getHubTimezone } from '@/lib/slotDateTime';

/** Used until an admin saves reminder settings. */
const DEFAULT_REMINDER_HOURS = [24];

const REMINDABLE_STATUSES = [
  APPOINTMENT_STATUS.PENDING,
  APPOINTMENT_STATUS.PENDING_PROFILE,
  APPOINTMENT_STATUS.CONFIRMED,
];

export interface ReminderRunResult {
  enabled: boolean;
  checked: number;
  sent: number;
  failed: number;
  skippedReason?: 'smtp_not_configured' | 'disabled';
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
}

async function enabledReminderHours(): Promise<number[] | null> {
  const settings = await ReminderSettings.findOne().lean<{
    isEnabled?: boolean;
    reminders?: { enabled?: boolean; hoursBeforeAppointment: number }[];
  }>();
  if (!settings) return DEFAULT_REMINDER_HOURS;
  if (settings.isEnabled === false) return null;
  // Only email delivery exists today; 'sms' and 'both' rules still send the email
  return (settings.reminders || [])
    .filter((rule) => rule.enabled !== false)
    .map((rule) => rule.hoursBeforeAppointment);
}

/**
 * The reminder to send now, if any: the closest lead time whose send moment has passed.
 * A rule never fires for a booking made after its send moment (no "24h" email
 * right after booking 3 hours ahead).
 */
export function dueReminderHours(
  start: DateTime,
  createdAt: Date | undefined,
  now: DateTime,
  hours: number[]
): number | null {
  if (start <= now) return null;
  const due = hours
    .filter((h) => start.minus({ hours: h }) <= now)
    .filter((h) => !createdAt || DateTime.fromJSDate(createdAt) <= start.minus({ hours: h }))
    .sort((a, b) => a - b);
  return due[0] ?? null;
}

function whenLabel(start: DateTime, now: DateTime): 'today' | 'tomorrow' | 'upcoming' {
  const days = start.startOf('day').diff(now.setZone(start.zone).startOf('day'), 'days').days;
  if (days < 1) return 'today';
  if (days < 2) return 'tomorrow';
  return 'upcoming';
}

function isDuplicateKeyError(error: unknown) {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;
}

/**
 * Send every reminder that is currently due. Safe to run repeatedly and concurrently:
 * each (appointment, lead time) is claimed via SentReminder's unique index before sending.
 */
export async function sendDueReminders(now: DateTime = DateTime.now()): Promise<ReminderRunResult> {
  // Without SMTP every send would be recorded as failed and never retried, so don't start
  if (!isSmtpConfigured()) {
    logger.warn('Appointment reminders skipped: SMTP_HOST is not configured');
    return { enabled: false, checked: 0, sent: 0, failed: 0, skippedReason: 'smtp_not_configured' };
  }

  const hours = await enabledReminderHours();
  if (!hours || hours.length === 0) {
    return { enabled: false, checked: 0, sent: 0, failed: 0, skippedReason: 'disabled' };
  }

  // Coarse date filter; exact start times are resolved per hub timezone below
  const maxHours = Math.max(...hours);
  const appointments = await Appointment.find({
    status: { $in: REMINDABLE_STATUSES },
    appointmentDate: {
      $gte: now.minus({ days: 1 }).toJSDate(),
      $lte: now.plus({ hours: maxHours, days: 1 }).toJSDate(),
    },
  }).populate('userId', 'email firstName');

  const timezoneCache = new Map<string, string>();
  async function hubTimezone(appointment: { hubId?: unknown; hubName?: string }) {
    const key = String(appointment.hubId || appointment.hubName || '');
    if (!timezoneCache.has(key)) {
      const hub = appointment.hubId
        ? await Hub.findById(appointment.hubId).select('timezone').lean<{ timezone?: string }>()
        : appointment.hubName
          ? await Hub.findOne({ name: appointment.hubName }).select('timezone').lean<{ timezone?: string }>()
          : null;
      timezoneCache.set(key, getHubTimezone(hub?.timezone));
    }
    return timezoneCache.get(key)!;
  }

  const result: ReminderRunResult = { enabled: true, checked: appointments.length, sent: 0, failed: 0 };

  for (const appointment of appointments) {
    const user = appointment.userId as unknown as { _id: unknown; email?: string; firstName?: string } | null;
    if (!user?.email) continue;

    const start = appointmentStartDateTime(
      appointment.appointmentDate,
      appointment.appointmentTime,
      await hubTimezone(appointment)
    );
    if (!start.isValid) continue;

    const leadHours = dueReminderHours(start, appointment.createdAt, now, hours);
    if (leadHours === null) continue;

    let claim;
    try {
      claim = await SentReminder.create({
        appointmentId: appointment._id,
        userId: user._id,
        hoursBeforeAppointment: leadHours,
        channel: 'email',
        status: 'sent',
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) continue; // already sent (or being sent by another run)
      throw error;
    }

    const hubName = appointment.hubName || 'Learning Center';
    const appointmentDate = start.setLocale('en-US').toFormat('cccc, LLLL d, yyyy');
    const appointmentTime = appointment.appointmentTime || start.setLocale('en-US').toFormat('h:mm a');

    try {
      const emailSent = await sendReminderEmail({
        recipientEmail: user.email,
        recipientName: user.firstName || 'there',
        appointmentTime,
        appointmentDate,
        hubName,
        hoursUntilAppointment: leadHours,
        calendarDate: calendarDateFromValue(start.toISODate()),
        when: whenLabel(start, now),
        dashboardUrl: `${appUrl()}/dashboard`,
      });

      if (!emailSent) {
        claim.status = 'failed';
        claim.error = 'Email service error or SMTP not configured';
        await claim.save();
        result.failed += 1;
        continue;
      }

      await notifyStudent({
        userId: String(user._id),
        type: 'reminder',
        title: 'Recordatorio de cita / Appointment reminder',
        message: `Su cita en ${hubName} es el ${appointmentDate} a las ${appointmentTime}. / Your appointment at ${hubName} is on ${appointmentDate} at ${appointmentTime}.`,
        hubName,
        appointmentId: String(appointment._id),
      });
      result.sent += 1;
    } catch (error) {
      logger.error('Error sending appointment reminder:', error);
      claim.status = 'failed';
      claim.error = error instanceof Error ? error.message : 'Unknown error';
      await claim.save();
      result.failed += 1;
    }
  }

  return result;
}
