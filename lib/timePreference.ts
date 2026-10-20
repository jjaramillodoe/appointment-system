import { DateTime } from 'luxon';
import { SLOT_DURATION_MINUTES } from '@/lib/slotDateTime';

export const TIME_PREFERENCES = ['Morning', 'Evening', 'Saturday'] as const;
export type TimePreference = (typeof TIME_PREFERENCES)[number];

const WINDOWS: Record<
  TimePreference,
  { startMinutes: number; endMinutes: number; days: 'weekday' | 'saturday' }
> = {
  Morning: { startMinutes: 8 * 60, endMinutes: 12 * 60, days: 'weekday' },
  Evening: { startMinutes: 17 * 60, endMinutes: 21 * 60, days: 'weekday' },
  Saturday: { startMinutes: 9 * 60, endMinutes: 14 * 60, days: 'saturday' },
};

export function isTimePreference(value: string | null | undefined): value is TimePreference {
  return TIME_PREFERENCES.includes(value as TimePreference);
}

export function timePreferenceLabel(preference: TimePreference): string {
  switch (preference) {
    case 'Morning':
      return 'Morning (8:00 AM - 12:00 PM)';
    case 'Evening':
      return 'Evening (5:00 PM - 9:00 PM)';
    case 'Saturday':
      return 'Saturday (9:00 AM - 2:00 PM)';
  }
}

function minutesToClock(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  return `${hours24 % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export function clocksForTimePreference(preference: TimePreference): string[] {
  const window = WINDOWS[preference];
  const clocks: string[] = [];
  for (let minutes = window.startMinutes; minutes <= window.endMinutes; minutes += SLOT_DURATION_MINUTES) {
    clocks.push(minutesToClock(minutes));
  }
  return clocks;
}

export function parseClockToMinutes(time: string): number | null {
  const twelveHour = time.trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (twelveHour) {
    let hours = Number(twelveHour[1]);
    const minutes = Number(twelveHour[2]);
    const meridiem = twelveHour[3].toUpperCase();
    if (hours === 12) hours = 0;
    if (meridiem === 'PM') hours += 12;
    return hours * 60 + minutes;
  }

  const twentyFour = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFour) {
    return Number(twentyFour[1]) * 60 + Number(twentyFour[2]);
  }

  return null;
}

function calendarDateString(date: Date | string): string {
  if (typeof date === 'string') return date.slice(0, 10);
  return DateTime.fromJSDate(date, { zone: 'utc' }).toISODate() ?? '';
}

export function dateMatchesTimePreference(
  preference: TimePreference,
  date: Date | string
): boolean {
  const dateStr = calendarDateString(date);
  if (!dateStr) return false;

  const weekday = DateTime.fromISO(dateStr, { zone: 'utc' }).weekday;
  if (WINDOWS[preference].days === 'saturday') return weekday === 6;
  return weekday >= 1 && weekday <= 5;
}

export function slotMatchesTimePreference(
  preference: TimePreference,
  time: string,
  date: Date | string
): boolean {
  const minutes = parseClockToMinutes(time);
  if (minutes === null) return false;

  const window = WINDOWS[preference];
  if (minutes < window.startMinutes || minutes > window.endMinutes) {
    return false;
  }

  return dateMatchesTimePreference(preference, date);
}
