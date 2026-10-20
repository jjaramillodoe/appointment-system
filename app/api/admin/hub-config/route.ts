import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import HubConfig from '@/models/HubConfig';
import AppointmentSlot from '@/models/AppointmentSlot';
import Hub from '@/models/Hub';
import { isAdmin, verifyAdminToken, canAccessHub } from '@/lib/adminPermissions';
import { logAuditEvent, getClientIpAddress, getUserAgent } from '@/lib/auditLogger';

export async function GET(request: NextRequest) {
  await dbConnect();
  const adminUser = await verifyAdminToken((request.headers.get('authorization') || '').replace('Bearer ', ''));
  if (!isAdmin(adminUser)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const configs = await HubConfig.find({});
  return NextResponse.json(configs);
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const adminUser = await verifyAdminToken((request.headers.get('authorization') || '').replace('Bearer ', ''));
  if (!isAdmin(adminUser) || !adminUser) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const { hubName, daysOff, customSlots, defaultSlots, action, date, slots } = body;
  if (!hubName) {
    return NextResponse.json({ error: 'hubName is required' }, { status: 400 });
  }

  const hub = await Hub.findOne({ name: hubName }).select('_id name');
  if (hub && !canAccessHub(adminUser, String(hub._id))) {
    return NextResponse.json({ error: 'You can only update your assigned hub' }, { status: 403 });
  }

  let config = await HubConfig.findOne({ hubName });
  if (!config) {
    config = new HubConfig({
      hubName,
      daysOff: [],
      customSlots: {},
      defaultSlots: [
        '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
        '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
        '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
        '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM',
      ],
    });
  }

  if (action === 'markDayOff') {
    const dateStr = new Date(date).toISOString().split('T')[0];
    if (!config.daysOff.includes(dateStr)) {
      config.daysOff.push(dateStr);
    }
  } else if (action === 'markDayOpen') {
    const dateStr = new Date(date).toISOString().split('T')[0];
    config.daysOff = config.daysOff.filter((day: string) => day !== dateStr);
  } else if (action === 'updateSlots') {
    if (!config.customSlots) {
      config.customSlots = {};
    }
    config.customSlots[date] = slots;
    for (const time of slots) {
      await AppointmentSlot.findOneAndUpdate(
        { hubName, date: new Date(date), time },
        {
          $setOnInsert: {
            capacity: 20,
            bookedCount: 0,
            isActive: true,
          },
        },
        { upsert: true, returnDocument: 'after' }
      );
    }
  } else {
    if (daysOff) config.daysOff = daysOff;
    if (customSlots) {
      config.customSlots = { ...config.customSlots, ...customSlots };
    }
    if (defaultSlots) config.defaultSlots = defaultSlots;
  }

  await config.save();
  await logAuditEvent({
    adminId: adminUser.userId,
    adminEmail: adminUser.email,
    adminName: adminUser.email,
    action: 'update',
    resourceType: 'schedule',
    resourceName: hubName,
    description: `${action || 'update'} hub config for ${hubName}`,
    ipAddress: getClientIpAddress(request),
    userAgent: getUserAgent(request),
  });

  return NextResponse.json(config);
}
