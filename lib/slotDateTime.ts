import { DateTime } from 'luxon';

export const DEFAULT_HUB_TIMEZONE = 'America/New_York';
export const BOOKING_WINDOW_DAYS = 7;
export const SLOT_DURATION_MINUTES = 30;

export function getHubTimezone(timezone?: string | null): string {
  return timezone || DEFAULT_HUB_TIMEZONE;
}

export function hubCalendarToday(timezone: string = DEFAULT_HUB_TIMEZONE): string {
  return DateTime.now().setZone(timezone).toISODate() ?? '';
}

export function hubCalendarDaysAgo(days: number, timezone: string = DEFAULT_HUB_TIMEZONE): string {
  return DateTime.now().setZone(timezone).minus({ days }).toISODate() ?? '';
}

export function utcDayBounds(date: string): { start: Date; end: Date } {
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

/** Calendar date (YYYY-MM-DD) from a stored slot date (UTC midnight). */
export function slotCalendarDate(date: Date | string): string {
  if (typeof date === 'string') {
    return date.slice(0, 10);
  }
  return DateTime.fromJSDate(date, { zone: 'utc' }).toISODate() ?? '';
}

/**
 * Combine a stored slot date + "9:00 AM" time into a DateTime in the hub timezone.
 * Dates are persisted as UTC midnight for the calendar day, so we read the date in UTC
 * and interpret the wall-clock time in the hub zone.
 */
export function combineSlotDateTime(
  date: Date | string,
  time: string,
  timezone: string
): DateTime {
  const dateStr = slotCalendarDate(date);
  return DateTime.fromFormat(`${dateStr} ${time}`, 'yyyy-MM-dd h:mm a', {
    zone: timezone,
    locale: 'en-US',
  });
}

/**
 * Start time of a stored appointment. Most writers persist UTC midnight + a wall-clock
 * time; older quick bookings stored the exact instant, so honor that when present.
 */
export function appointmentStartDateTime(
  appointmentDate: Date | string,
  appointmentTime: string | undefined,
  timezone: string
): DateTime {
  const instant = DateTime.fromJSDate(new Date(appointmentDate), { zone: 'utc' });
  const isUtcMidnight = instant.isValid && instant.hour === 0 && instant.minute === 0;
  if (!isUtcMidnight && instant.isValid) {
    return instant.setZone(timezone);
  }
  return combineSlotDateTime(appointmentDate, appointmentTime || '9:00 AM', timezone);
}

export function getBookingWindow(
  timezone: string,
  now: DateTime = DateTime.now(),
  days: number = BOOKING_WINDOW_DAYS
) {
  const zonedNow = now.setZone(timezone);
  const windowStart = zonedNow.startOf('day');
  const windowEnd = windowStart.plus({ days });
  return { now: zonedNow, windowStart, windowEnd };
}

export function formatAppointmentTime(dateTime: DateTime): string {
  return dateTime.setLocale('en-US').toFormat('h:mm a');
}
