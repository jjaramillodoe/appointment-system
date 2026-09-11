import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminToken, isAdmin } from '@/lib/adminPermissions';
import Hub from '@/models/Hub';
import AppointmentSlot from '@/models/AppointmentSlot';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const adminUser = verifyAdminToken(token);

    if (!isAdmin(adminUser)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      startDate,
      endDate,
      openDays, // Array of day numbers: [0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat]
      timeSlots, // Array of times like ['09:00', '09:30', '10:00', ...]
      capacity,
      hubIds, // Array of hub IDs to generate for
    } = body;

    // Validate inputs
    if (!startDate || !endDate || !openDays || !timeSlots || !capacity || !hubIds || hubIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Get hubs to get their names
    const hubs = await Hub.find({ _id: { $in: hubIds } });
    if (hubs.length === 0) {
      return NextResponse.json(
        { error: 'No hubs found' },
        { status: 404 }
      );
    }

    let recordsCreated = 0;
    const slots: any[] = [];

    // Generate slots for each day in range
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();

      // Check if this day should be open
      if (openDays.includes(dayOfWeek)) {
        // Create slot for each hub and each time
        for (const hub of hubs) {
          for (const time of timeSlots) {
            // Convert 24-hour format (HH:MM) to 12-hour format (H:MM AM/PM)
            const [hours, minutes] = time.split(':').map(Number);
            let displayHours = hours;
            const ampm = hours >= 12 ? 'PM' : 'AM';
            displayHours = displayHours % 12;
            displayHours = displayHours || 12;
            const displayTime = `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;

            slots.push({
              hubName: hub.name,
              date: new Date(currentDate), // Create Date object
              time: displayTime, // 12-hour format
              capacity,
              bookedCount: 0,
              isActive: true,
            });
          }
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Bulk insert slots
    if (slots.length > 0) {
      const result = await AppointmentSlot.insertMany(slots, { ordered: false }).catch((err: any) => {
        // If some inserts fail (duplicates), continue with successful ones
        return err.result;
      });
      recordsCreated = slots.length;
    }

    // Calculate stats
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const openDaysInRange = Math.ceil(days * (openDays.length / 7));

    return NextResponse.json({
      success: true,
      message: `Generated ${recordsCreated} appointment slots`,
      stats: {
        recordsCreated,
        dateRange: {
          start: startDate,
          end: endDate,
          totalDays: days,
          openDays: openDaysInRange,
        },
        configuration: {
          hubs: hubs.length,
          timeSlotsPerDay: timeSlots.length,
          capacityPerSlot: capacity,
        },
      },
    });
  } catch (error: any) {
    console.error('Schedule generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate schedule' },
      { status: 500 }
    );
  }
}
