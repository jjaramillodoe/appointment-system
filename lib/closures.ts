import BlackoutDate from '@/models/BlackoutDate';
import HubSchedule from '@/models/HubSchedule';
import { normalizeDayOffReason } from '@/lib/dayOffReason';
import { calendarDateFromValue } from '@/lib/appointmentTime';

export interface ClosureDay {
  date: string;
  reason: string;
  hubId: string;
  hubName: string;
  source: 'schedule' | 'blackout';
}

export async function loadUnifiedClosures(options: {
  hubs: Array<{ _id: unknown; name: string }>;
  windowStart: string;
  windowEnd: string;
}): Promise<ClosureDay[]> {
  const { hubs, windowStart, windowEnd } = options;
  if (hubs.length === 0) return [];

  const hubIds = hubs.map((hub) => hub._id);
  const hubsById = new Map(hubs.map((hub) => [String(hub._id), hub]));
  const windowStartUtc = new Date(`${windowStart}T00:00:00.000Z`);
  const windowEndUtc = new Date(`${windowEnd}T00:00:00.000Z`);

  const [schedules, blackouts] = await Promise.all([
    HubSchedule.find({
      hubId: { $in: hubIds },
      isDayOff: true,
      date: { $gte: windowStart, $lt: windowEnd },
    } as Record<string, unknown>).select('hubId date dayOffReason').lean(),
    BlackoutDate.find({
      date: { $gte: windowStartUtc, $lt: windowEndUtc },
    }).lean(),
  ]);

  const closures: ClosureDay[] = [];

  for (const schedule of schedules) {
    const hub = hubsById.get(String(schedule.hubId));
    if (!hub) continue;
    closures.push({
      date: schedule.date,
      reason: normalizeDayOffReason(schedule.dayOffReason),
      hubId: String(schedule.hubId),
      hubName: hub.name,
      source: 'schedule',
    });
  }

  for (const blackout of blackouts) {
    const date = calendarDateFromValue(blackout.date);
    const title = blackout.title || 'District closure';
    const affected = (blackout.affectedHubs || []).map((id: unknown) => String(id));
    const targets = affected.length === 0
      ? hubs
      : hubs.filter((hub) => affected.includes(String(hub._id)));

    for (const hub of targets) {
      closures.push({
        date,
        reason: title,
        hubId: String(hub._id),
        hubName: hub.name,
        source: 'blackout',
      });
    }
  }

  return closures.sort((a, b) => a.date.localeCompare(b.date) || a.hubName.localeCompare(b.hubName));
}

export async function isDateClosed(hubId: string, date: string): Promise<{ closed: boolean; reason?: string }> {
  const [schedule, blackouts] = await Promise.all([
    HubSchedule.findOne({ hubId, date, isDayOff: true }).select('dayOffReason').lean(),
    BlackoutDate.find({
      date: {
        $gte: new Date(`${date}T00:00:00.000Z`),
        $lt: new Date(`${date}T23:59:59.999Z`),
      },
    }).lean(),
  ]);

  if (schedule) {
    return { closed: true, reason: normalizeDayOffReason(schedule.dayOffReason) };
  }

  const matching = blackouts.find((blackout) => {
    const affected = (blackout.affectedHubs || []).map((id: unknown) => String(id));
    return affected.length === 0 || affected.includes(String(hubId));
  });

  if (matching) {
    return { closed: true, reason: matching.title || 'District closure' };
  }

  return { closed: false };
}
