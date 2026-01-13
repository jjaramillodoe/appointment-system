import { NextRequest, NextResponse } from 'next/server';
import { AvailabilityService } from '../../../lib/availabilityService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hubId = searchParams.get('hubId');
    const hubIds = searchParams.get('hubIds'); // Comma-separated list
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Date must be in YYYY-MM-DD format' },
        { status: 400 }
      );
    }

    let availability;

    if (hubIds) {
      // Get availability for multiple hubs
      const hubIdArray = hubIds.split(',').map(id => id.trim());
      availability = await AvailabilityService.getMultiHubAvailability(hubIdArray, date);
    } else if (hubId) {
      // Get availability for a single hub
      availability = await AvailabilityService.getAvailability(hubId, date);
    } else {
      return NextResponse.json(
        { error: 'Either hubId or hubIds parameter is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: availability,
      cached: true // This will be true if data came from Redis cache
    });

  } catch (error) {
    console.error('Availability API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, hubId, date, time, userId, slots } = body;

    console.log('📥 Availability API POST request:', { action, hubId, date, time, userId });

    if (!hubId || !date) {
      console.log('❌ Missing required fields: hubId or date');
      return NextResponse.json(
        { error: 'hubId and date are required' },
        { status: 400 }
      );
    }

    let result: any = false;

    switch (action) {
      case 'book':
        console.log('📝 Processing booking request...');
        if (!time || !userId) {
          console.log('❌ Missing required fields for booking:', { time: !!time, userId: !!userId });
          return NextResponse.json(
            { error: 'time and userId are required for booking' },
            { status: 400 }
          );
        }
        console.log('🎯 Calling AvailabilityService.bookSlot...');
        result = await AvailabilityService.bookSlot(hubId, date, time, userId);
        console.log('📊 Booking result:', result);
        break;

      case 'cancel':
        if (!time || !userId) {
          return NextResponse.json(
            { error: 'time and userId are required for cancellation' },
            { status: 400 }
          );
        }
        result = await AvailabilityService.cancelBooking(hubId, date, time, userId);
        // For consistency, wrap boolean result in object
        result = result ? { success: true } : { success: false, error: 'Cancellation failed' };
        break;

      case 'markDayOff':
        result = await AvailabilityService.markDayOff(hubId, date);
        result = result ? { success: true } : { success: false, error: 'Failed to mark day off' };
        break;

      case 'markDayOpen':
        result = await AvailabilityService.markDayOpen(hubId, date);
        result = result ? { success: true } : { success: false, error: 'Failed to mark day as open' };
        break;

      case 'updateSlots':
        if (!slots || !Array.isArray(slots)) {
          return NextResponse.json(
            { error: 'slots array is required for updating slots' },
            { status: 400 }
          );
        }
        result = await AvailabilityService.updateDaySlots(hubId, date, slots);
        result = result ? { success: true } : { success: false, error: 'Failed to update slots' };
        break;

      case 'preGenerate':
        const { endDate } = body;
        if (!endDate) {
          return NextResponse.json(
            { error: 'endDate is required for pre-generation' },
            { status: 400 }
          );
        }
        await AvailabilityService.preGenerateAvailability(hubId, date, endDate);
        result = { success: true };
        break;

      default:
        console.log('❌ Invalid action:', action);
        return NextResponse.json(
          { error: 'Invalid action. Supported: book, cancel, markDayOff, markDayOpen, updateSlots, preGenerate' },
          { status: 400 }
        );
    }

    console.log('🔍 Final result before response:', result);

    if (result.success) {
      console.log('✅ Operation successful');
      return NextResponse.json({
        success: true,
        message: `${action} completed successfully`
      });
    } else {
      console.log('❌ Operation failed:', result.error);
      return NextResponse.json(
        { error: result.error || `Failed to ${action}` },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('💥 Availability API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 