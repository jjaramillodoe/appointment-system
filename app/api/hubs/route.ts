import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import Hub from '@/models/Hub';
import dbConnect from '@/lib/mongodb';
import { queryAvailableSlots } from '@/lib/availableSlotsQuery';
import { isTimePreference } from '@/lib/timePreference';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const timePreferenceParam = request.nextUrl.searchParams.get('timePreference');
    const timePreference = isTimePreference(timePreferenceParam) ? timePreferenceParam : null;
    const schoolId = request.nextUrl.searchParams.get('schoolId');

    const hubQuery: Record<string, unknown> = { isActive: true };
    if (schoolId) {
      hubQuery.schoolId = schoolId;
    }

    const hubs = await Hub.find(hubQuery)
      .select('_id name location defaultSlots timezone schoolId')
      .sort({ name: 1 });

    if (!hubs || hubs.length === 0) {
      return NextResponse.json(
        { hubs: [], message: 'No hubs available for selected options' },
        { status: 200 }
      );
    }

    let matchingHubNames: Set<string> | null = null;
    let slotCounts = new Map<string, number>();

    if (timePreference) {
      const { slots } = await queryAvailableSlots({ hubs, timePreference });
      matchingHubNames = new Set(slots.map((slot) => slot.hubName));
      slotCounts = slots.reduce((counts, slot) => {
        counts.set(slot.hubName, (counts.get(slot.hubName) || 0) + 1);
        return counts;
      }, new Map<string, number>());
    }

    const filteredHubs = matchingHubNames
      ? hubs.filter((hub) => matchingHubNames.has(hub.name))
      : hubs;

    return NextResponse.json(
      {
        hubs: filteredHubs.map((hub) => ({
          _id: hub._id,
          name: hub.name,
          location: hub.location,
          defaultSlots: hub.defaultSlots,
          timezone: hub.timezone,
          schoolId: hub.schoolId,
          availableSlotCount: timePreference ? slotCounts.get(hub.name) || 0 : undefined,
        })),
        timePreference,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error('Error fetching hubs:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch hubs';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
