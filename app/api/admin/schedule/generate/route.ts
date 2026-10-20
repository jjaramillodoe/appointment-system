import { NextRequest, NextResponse } from 'next/server';
import { DateTime } from 'luxon';
import { logger } from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { verifyAdminToken, isSuperAdmin } from '@/lib/adminPermissions';
import Hub from '@/models/Hub';
import AppointmentSlot from '@/models/AppointmentSlot';
import { utcDayBounds } from '@/lib/slotDateTime';
import {
  TIME_PREFERENCES,
  clocksForTimePreference,
  dateMatchesTimePreference,
  isTimePreference,
  type TimePreference,
} from '@/lib/timePreference';

const WRITE_CHUNK = 2000;

function selectedWindows(body: { windows?: unknown; timePreferences?: unknown }): TimePreference[] {
  const raw = Array.isArray(body.windows) ? body.windows : body.timePreferences;
  if (!Array.isArray(raw) || raw.length === 0) return [...TIME_PREFERENCES];
  return raw.filter((value): value is TimePreference => isTimePreference(String(value)));
}

function calendarDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let cursor = DateTime.fromISO(startDate, { zone: 'utc' });
  const last = DateTime.fromISO(endDate, { zone: 'utc' });
  if (!cursor.isValid || !last.isValid) return dates;

  while (cursor <= last) {
    const iso = cursor.toISODate();
    if (iso) dates.push(iso);
    cursor = cursor.plus({ days: 1 });
  }
  return dates;
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const adminUser = await verifyAdminToken(authHeader.substring(7));
    if (!isSuperAdmin(adminUser)) {
      return NextResponse.json({ error: 'Only super admins can generate schedules' }, { status: 403 });
    }

    const body = await request.json();
    const { startDate, endDate, capacity, hubIds } = body;
    const windows = selectedWindows(body);

    if (!startDate || !endDate || !capacity || !Array.isArray(hubIds) || hubIds.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (windows.length === 0) {
      return NextResponse.json({ error: 'Select at least one intake window' }, { status: 400 });
    }
    if (String(startDate) >= String(endDate)) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
    }

    const hubs = await Hub.find({ _id: { $in: hubIds } });
    if (hubs.length === 0) {
      return NextResponse.json({ error: 'No hubs found' }, { status: 404 });
    }

    const dates = calendarDates(String(startDate), String(endDate));
    const ops: Array<{
      updateOne: {
        filter: { hubName: string; date: Date; time: string };
        update: { $set: { capacity: number; isActive: true }; $setOnInsert: { bookedCount: 0 } };
        upsert: true;
      };
    }> = [];
    const byWindow: Record<TimePreference, number> = {
      Morning: 0,
      Evening: 0,
      Saturday: 0,
    };

    for (const dateStr of dates) {
      const date = utcDayBounds(dateStr).start;
      for (const window of windows) {
        if (!dateMatchesTimePreference(window, dateStr)) continue;
        for (const time of clocksForTimePreference(window)) {
          for (const hub of hubs) {
            byWindow[window] += 1;
            ops.push({
              updateOne: {
                filter: { hubName: hub.name, date, time },
                update: {
                  $set: { capacity: Number(capacity), isActive: true },
                  $setOnInsert: { bookedCount: 0 },
                },
                upsert: true,
              },
            });
          }
        }
      }
    }

    let created = 0;
    let updated = 0;
    for (let i = 0; i < ops.length; i += WRITE_CHUNK) {
      const result = await AppointmentSlot.bulkWrite(ops.slice(i, i + WRITE_CHUNK), { ordered: false });
      created += result.upsertedCount || 0;
      updated += result.modifiedCount || 0;
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${created.toLocaleString()} new slots and updated ${updated.toLocaleString()} existing slots`,
      stats: {
        recordsCreated: created,
        recordsUpdated: updated,
        recordsPlanned: ops.length,
        dateRange: {
          start: startDate,
          end: endDate,
          totalDays: dates.length,
          weekdayDays: dates.filter((date) => dateMatchesTimePreference('Morning', date)).length,
          saturdayDays: dates.filter((date) => dateMatchesTimePreference('Saturday', date)).length,
        },
        configuration: {
          hubs: hubs.length,
          windows,
          capacityPerSlot: Number(capacity),
          morningSlots: windows.includes('Morning') ? clocksForTimePreference('Morning').length : 0,
          eveningSlots: windows.includes('Evening') ? clocksForTimePreference('Evening').length : 0,
          saturdaySlots: windows.includes('Saturday') ? clocksForTimePreference('Saturday').length : 0,
        },
        byWindow,
      },
    });
  } catch (error: any) {
    logger.error('Schedule generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate schedule' },
      { status: 500 }
    );
  }
}
