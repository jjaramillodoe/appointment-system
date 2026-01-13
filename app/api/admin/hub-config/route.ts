import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import HubConfig from '@/models/HubConfig';
import AppointmentSlot from '@/models/AppointmentSlot';

// GET: Fetch all hub configs
export async function GET() {
  await dbConnect();
  const configs = await HubConfig.find({});
  return NextResponse.json(configs);
}

// POST: Update or create a hub config (admin only)
export async function POST(request: NextRequest) {
  await dbConnect();
  const body = await request.json();
  const { hubName, daysOff, customSlots, defaultSlots, action, date, slots } = body;

  console.log('POST /api/admin/hub-config payload:', body);

  // For now, we'll skip admin check since the frontend handles it
  // In production, you should verify the admin status here

  let config = await HubConfig.findOne({ hubName });
  if (!config) {
    config = new HubConfig({ 
      hubName, 
      daysOff: [], 
      customSlots: {}, 
      defaultSlots: [
        '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
        '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
        '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
        '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'
      ]
    });
  }

  // Handle different actions
  if (action === 'markDayOff') {
    const dateStr = new Date(date).toISOString().split('T')[0];
    if (!config.daysOff.includes(dateStr)) {
      config.daysOff.push(dateStr);
    }
  } else if (action === 'markDayOpen') {
    const dateStr = new Date(date).toISOString().split('T')[0];
    config.daysOff = config.daysOff.filter(day => day !== dateStr);
  } else if (action === 'updateSlots') {
    if (!config.customSlots) {
      config.customSlots = {};
    }
    console.log('customSlots before update:', JSON.stringify(config.customSlots));
    config.customSlots[date] = slots;
    console.log('customSlots after update:', JSON.stringify(config.customSlots));
    
    // Also create/update AppointmentSlot documents for each time slot
    for (const time of slots) {
      console.log('Upserting AppointmentSlot for schedule update:', { hubName, date, time });
      await AppointmentSlot.findOneAndUpdate(
        { hubName, date: new Date(date), time },
        {
          $setOnInsert: { 
            capacity: 20, // Default capacity
            bookedCount: 0,
            isActive: true
          }
        },
        { upsert: true, new: true }
      );
    }
    console.log('Upserted AppointmentSlot documents for schedule update on', date);
  } else {
    // Handle legacy updates
    if (daysOff) config.daysOff = daysOff;
    if (customSlots) {
      // Merge customSlots by date
      config.customSlots = { ...config.customSlots, ...customSlots };
    }
    if (defaultSlots) config.defaultSlots = defaultSlots;
  }

  await config.save();
  console.log('Config saved for hub:', hubName);
  return NextResponse.json(config);
} 