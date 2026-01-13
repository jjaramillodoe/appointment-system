import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import HubConfig from '@/models/HubConfig';
import Appointment from '@/models/Appointment';
import AppointmentSlot from '@/models/AppointmentSlot';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hubName = searchParams.get('hubName');
    const date = searchParams.get('date');

    if (!hubName || !date) {
      return NextResponse.json({ error: 'Hub name and date are required' }, { status: 400 });
    }

    await connectToDatabase();

    // Get hub configuration for the specified hub and date
    const hubConfig = await HubConfig.findOne({ hubName });
    
    // Get appointments for the specified hub and date to calculate booked counts
    const appointments = await Appointment.find({
      hubName,
      date: new Date(date)
    });

    // Calculate booked counts for each time slot
    const bookedCounts: { [time: string]: number } = {};
    appointments.forEach(appointment => {
      const time = appointment.time;
      bookedCounts[time] = (bookedCounts[time] || 0) + 1;
    });

    // Get slot capacities from hub config
    const slotCapacities = hubConfig?.slotCapacities?.[date] || {};
    
    // Merge with booked counts
    const result: { [time: string]: { capacity: number; bookedCount: number; isActive: boolean } } = {};
    
    // Default time slots
    const timeSlots = [
      '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
      '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
      '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'
    ];

    timeSlots.forEach(time => {
      const existingCapacity = slotCapacities[time];
      result[time] = {
        capacity: existingCapacity?.capacity || 20,
        bookedCount: bookedCounts[time] || 0,
        isActive: existingCapacity?.isActive !== false // Default to true unless explicitly set to false
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching slot capacities:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hubName, date, capacities } = body;

    console.log('POST /api/admin/slot-capacities - Request body:', body);

    if (!hubName || !date || !capacities) {
      return NextResponse.json({ error: 'Hub name, date, and capacities are required' }, { status: 400 });
    }

    await connectToDatabase();

    // Find existing hub config or create new one
    let hubConfig = await HubConfig.findOne({ hubName });
    
    console.log('Found hub config:', hubConfig ? 'Yes' : 'No');
    if (hubConfig) {
      console.log('Current slotCapacities:', JSON.stringify(hubConfig.slotCapacities));
    }
    
    if (!hubConfig) {
      hubConfig = new HubConfig({
        hubName,
        daysOff: [],
        customSlots: {},
        defaultSlots: [],
        slotCapacities: {}
      });
      console.log('Created new hub config for:', hubName);
    }

    // Initialize slotCapacities if it doesn't exist
    if (!hubConfig.slotCapacities) {
      hubConfig.slotCapacities = {};
      console.log('Initialized empty slotCapacities');
    }

    console.log('Before update - slotCapacities for date', date, ':', JSON.stringify(hubConfig.slotCapacities[date]));

    // Update capacities for the specified date
    hubConfig.slotCapacities[date] = capacities;

    console.log('After update - slotCapacities for date', date, ':', JSON.stringify(hubConfig.slotCapacities[date]));
    console.log('Full slotCapacities object:', JSON.stringify(hubConfig.slotCapacities));

    // Mark the slotCapacities field as modified
    hubConfig.markModified('slotCapacities');

    const savedConfig = await hubConfig.save();
    console.log('Save completed. Saved config slotCapacities:', JSON.stringify(savedConfig.slotCapacities));

    // --- NEW: Upsert AppointmentSlot documents for each slot ---
    const slotTimes = Object.keys(capacities);
    for (const time of slotTimes) {
      const { capacity, isActive } = capacities[time];
      console.log('Upserting AppointmentSlot:', { hubName, date, time, capacity, isActive });
      // Upsert: update if exists, otherwise create
      const upsertResult = await AppointmentSlot.findOneAndUpdate(
        { hubName, date, time }, // use date as string
        {
          $set: { capacity, isActive },
          $setOnInsert: { bookedCount: 0 }
        },
        { upsert: true, new: true }
      );
      console.log('Upserted AppointmentSlot result:', upsertResult);
    }
    console.log('Upserted AppointmentSlot documents for all slots on', date);
    // --- END NEW ---

    return NextResponse.json({ 
      message: 'Slot capacities updated successfully',
      capacities: savedConfig.slotCapacities[date]
    });
  } catch (error) {
    console.error('Error updating slot capacities:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 