import { NextRequest, NextResponse } from 'next/server';
import AppointmentSlot from '@/models/AppointmentSlot';
import dbConnect from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const hubId = searchParams.get('hubId');

    if (!hubId) {
      return NextResponse.json(
        { error: 'hubId is required' },
        { status: 400 }
      );
    }

    // Get available slots for the next 30 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const slots = await AppointmentSlot.find({
      hubId,
      startTime: {
        $gte: today,
        $lte: thirtyDaysLater,
      },
      isFull: false,
    }).sort({ startTime: 1 }).limit(20);

    if (!slots || slots.length === 0) {
      // Generate sample slots if none exist
      const sampleSlots = generateSampleSlots(hubId, today);
      return NextResponse.json(
        { slots: sampleSlots },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        slots: slots.map((slot: any) => ({
          _id: slot._id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          availableSpots: slot.availableSpots,
          isFull: slot.isFull,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching appointment slots:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch appointment slots' },
      { status: 500 }
    );
  }
}

interface SlotData {
  _id: string;
  startTime: string;
  endTime: string;
  availableSpots: number;
  isFull: boolean;
}

function generateSampleSlots(hubId: string, startDate: Date): SlotData[] {
  const slots: SlotData[] = [];
  const times = [
    { hour: 9, minute: 0 },
    { hour: 10, minute: 0 },
    { hour: 11, minute: 0 },
    { hour: 2, minute: 0, pm: true },
    { hour: 3, minute: 0, pm: true },
    { hour: 5, minute: 0, pm: true },
    { hour: 6, minute: 0, pm: true },
  ];

  // Create slots for the next 10 business days
  for (let day = 0; day < 10; day++) {
    const slotDate = new Date(startDate);
    slotDate.setDate(slotDate.getDate() + day);

    // Skip weekends
    if (slotDate.getDay() === 0 || slotDate.getDay() === 6) continue;

    times.forEach((time) => {
      const startTime = new Date(slotDate);
      startTime.setHours(time.pm ? time.hour + 12 : time.hour, time.minute, 0, 0);

      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1);

      slots.push({
        _id: `slot_${day}_${time.hour}_${time.minute}`,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        availableSpots: Math.floor(Math.random() * 5) + 1,
        isFull: Math.random() > 0.8,
      });
    });
  }

  return slots;
}
