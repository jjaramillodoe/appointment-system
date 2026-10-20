import { DateTime } from 'luxon';
import AppointmentSlot from '@/models/AppointmentSlot';
import {
  BOOKING_WINDOW_DAYS,
  SLOT_DURATION_MINUTES,
  combineSlotDateTime,
  getBookingWindow,
  getHubTimezone,
  slotCalendarDate,
} from '@/lib/slotDateTime';
import { loadUnifiedClosures } from '@/lib/closures';
import { getSystemSettings } from '@/lib/systemSettings';
import {
  type TimePreference,
  dateMatchesTimePreference,
  slotMatchesTimePreference,
} from '@/lib/timePreference';

export interface AvailableSlotResult {
  _id: string;
  startTime: string;
  endTime: string;
  availableSpots: number;
  isFull: boolean;
  date: string;
  time: string;
  hubName: string;
}

export interface ClosedDayResult {
  date: string;
  reason: string;
  hubId: string;
  hubName: string;
}

export async function queryAvailableSlots(options: {
  hubs: Array<{ _id: unknown; name: string; timezone?: string | null }>;
  timePreference?: TimePreference | null;
  classInterest?: 'ESL' | 'BE/HSE' | null;
}): Promise<{
  slots: AvailableSlotResult[];
  closedDays: ClosedDayResult[];
  windowDays: number;
}> {
  const { hubs, timePreference, classInterest } = options;
  if (hubs.length === 0) {
    return { slots: [], closedDays: [], windowDays: BOOKING_WINDOW_DAYS };
  }

  const settings = await getSystemSettings();
  const timezone = getHubTimezone(hubs[0]?.timezone);
  const configuredDays = settings.bookingWindowDays || BOOKING_WINDOW_DAYS;
  const { now, windowStart, windowEnd: defaultWindowEnd } = getBookingWindow(timezone, DateTime.now(), configuredDays);
  const windowDays = timePreference === 'Saturday' ? Math.max(14, configuredDays) : configuredDays;
  const windowEnd = timePreference === 'Saturday'
    ? windowStart.plus({ days: windowDays })
    : defaultWindowEnd;
  const windowStartDate = windowStart.toISODate();
  const windowEndDate = windowEnd.toISODate();
  const windowStartUtc = new Date(`${windowStartDate}T00:00:00.000Z`);
  const windowEndUtc = new Date(`${windowEndDate}T00:00:00.000Z`);

  const hubNames = hubs.map((hub) => hub.name);
  const hubsByName = new Map(hubs.map((hub) => [hub.name, hub]));

  const [slots, closures] = await Promise.all([
    AppointmentSlot.find({
      hubName: { $in: hubNames },
      isActive: true,
      date: {
        $gte: windowStartUtc,
        $lt: windowEndUtc,
      },
      $expr: { $lt: ['$bookedCount', '$capacity'] },
    }).lean(),
    loadUnifiedClosures({
      hubs,
      windowStart: windowStartDate || '',
      windowEnd: windowEndDate || '',
    }),
  ]);

  const closedDays = closures
    .filter((day) => !timePreference || dateMatchesTimePreference(timePreference, day.date))
    .map(({ date, reason, hubId, hubName }) => ({ date, reason, hubId, hubName }));

  const closedDatesByHub = new Map<string, Set<string>>();
  for (const day of closedDays) {
    const dates = closedDatesByHub.get(day.hubName) ?? new Set<string>();
    dates.add(day.date);
    closedDatesByHub.set(day.hubName, dates);
  }

  const availableSlots = slots
    .map((slot) => {
      const hub = hubsByName.get(slot.hubName);
      if (!hub) return null;

      const calendarDate = slotCalendarDate(slot.date);
      if (closedDatesByHub.get(slot.hubName)?.has(calendarDate)) return null;
      if (timePreference && !slotMatchesTimePreference(timePreference, slot.time, calendarDate)) {
        return null;
      }

      const hubTimezone = getHubTimezone(hub.timezone);
      const startTime = combineSlotDateTime(slot.date, slot.time, hubTimezone);
      if (!startTime.isValid) return null;
      if (startTime <= now) return null;
      if (startTime >= windowEnd) return null;

      const availableSpots = Math.max(0, slot.capacity - slot.bookedCount);
      if (availableSpots <= 0) return null;

      return {
        _id: String(slot._id),
        startTime: startTime.toISO() ?? '',
        endTime: startTime.plus({ minutes: SLOT_DURATION_MINUTES }).toISO() ?? '',
        availableSpots,
        isFull: false,
        date: calendarDate,
        time: slot.time,
        hubName: slot.hubName,
      };
    })
    .filter((slot): slot is AvailableSlotResult => slot !== null && Boolean(slot.startTime))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return {
    slots: availableSlots,
    closedDays,
    windowDays,
  };
}
