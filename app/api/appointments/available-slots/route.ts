import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Hub from '@/models/Hub';
import dbConnect from '@/lib/mongodb';
import { queryAvailableSlots } from '@/lib/availableSlotsQuery';
import { getHubTimezone } from '@/lib/slotDateTime';
import { isTimePreference } from '@/lib/timePreference';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const hubId = searchParams.get('hubId');
    const timePreferenceParam = searchParams.get('timePreference');
    const timePreference = isTimePreference(timePreferenceParam) ? timePreferenceParam : null;

    if (!hubId) {
      return NextResponse.json(
        { error: 'hubId is required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(hubId)) {
      return NextResponse.json(
        { error: 'Invalid hubId' },
        { status: 400 }
      );
    }

    const hub = await Hub.findById(hubId);
    if (!hub) {
      return NextResponse.json(
        { error: 'Hub not found' },
        { status: 404 }
      );
    }

    const timezone = getHubTimezone(hub.timezone);
    const classInterest = searchParams.get('classInterest');
    const { slots, closedDays, windowDays } = await queryAvailableSlots({
      hubs: [hub],
      timePreference,
      classInterest: classInterest === 'ESL' || classInterest === 'BE/HSE' ? classInterest : null,
    });

    return NextResponse.json(
      {
        slots: slots.map(({ hubName: _hubName, ...slot }) => slot),
        closedDays: closedDays.map(({ date, reason }) => ({ date, reason })),
        timezone,
        windowDays,
        timePreference,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error('Error fetching appointment slots:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch appointment slots';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
