import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import HubConfig from '@/models/HubConfig';
import Appointment from '@/models/Appointment';
import AppointmentSlot from '@/models/AppointmentSlot';
import { verifyAdminToken, isAdmin, type AdminUser } from '@/lib/adminPermissions';
import { resolveRequestedHub, appointmentHubFilter } from '@/lib/adminUserAccess';
import { logAuditEvent, getClientIpAddress, getUserAgent } from '@/lib/auditLogger';

const DEFAULT_TIMES = [
  '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM',
];

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Authorization token required' }, { status: 401 }) };
  }

  const adminUser = await verifyAdminToken(authHeader.substring(7));
  if (!isAdmin(adminUser) || !adminUser) {
    return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) };
  }

  return { adminUser };
}

async function resolveCapacityHub(
  adminUser: AdminUser,
  hubName: string
) {
  const resolved = await resolveRequestedHub(adminUser, hubName);
  if (resolved.error) {
    return { error: NextResponse.json({ error: resolved.error }, { status: resolved.error === 'Hub not found' ? 404 : 403 }) };
  }
  if (!resolved.hub) {
    return { error: NextResponse.json({ error: 'A specific hub is required' }, { status: 400 }) };
  }
  if (resolved.hub.name !== hubName) {
    return { error: NextResponse.json({ error: 'You can only view capacity for your assigned hub' }, { status: 403 }) };
  }
  return { hub: resolved.hub };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const hubName = searchParams.get('hubName');
    const date = searchParams.get('date');

    if (!hubName || !date) {
      return NextResponse.json({ error: 'Hub name and date are required' }, { status: 400 });
    }

    const scoped = await resolveCapacityHub(auth.adminUser, hubName);
    if ('error' in scoped) return scoped.error;

    await connectToDatabase();

    const startDate = new Date(`${date}T00:00:00.000Z`);
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 1);

    const [hubConfig, appointments, storedSlots] = await Promise.all([
      HubConfig.findOne({ hubName: scoped.hub.name }),
      Appointment.find({
        ...appointmentHubFilter(scoped.hub),
        appointmentDate: { $gte: startDate, $lt: endDate },
        status: { $ne: 'cancelled' },
      }).select('appointmentTime'),
      AppointmentSlot.find({
        hubName: scoped.hub.name,
        date: { $gte: startDate, $lt: endDate },
      }).lean(),
    ]);

    const bookedCounts: { [time: string]: number } = {};
    appointments.forEach((appointment: { appointmentTime?: string }) => {
      const time = appointment.appointmentTime;
      if (time) {
        bookedCounts[time] = (bookedCounts[time] || 0) + 1;
      }
    });

    const slotCapacities = hubConfig?.slotCapacities?.[date] || {};
    const result: { [time: string]: { capacity: number; bookedCount: number; isActive: boolean } } = {};

    if (storedSlots.length > 0) {
      storedSlots.forEach((slot: any) => {
        result[slot.time] = {
          capacity: slot.capacity || slotCapacities[slot.time]?.capacity || 20,
          bookedCount: Math.max(slot.bookedCount || 0, bookedCounts[slot.time] || 0),
          isActive: slot.isActive !== false,
        };
      });
    } else {
      DEFAULT_TIMES.forEach((time) => {
        const existingCapacity = slotCapacities[time];
        result[time] = {
          capacity: existingCapacity?.capacity || 20,
          bookedCount: bookedCounts[time] || 0,
          isActive: existingCapacity?.isActive !== false,
        };
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error fetching slot capacities:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;

    const body = await request.json();
    const { hubName, date, capacities } = body;

    if (!hubName || !date || !capacities) {
      return NextResponse.json({ error: 'Hub name, date, and capacities are required' }, { status: 400 });
    }

    const scoped = await resolveCapacityHub(auth.adminUser, hubName);
    if ('error' in scoped) return scoped.error;

    await connectToDatabase();

    let hubConfig = await HubConfig.findOne({ hubName: scoped.hub.name });
    if (!hubConfig) {
      hubConfig = new HubConfig({
        hubName: scoped.hub.name,
        daysOff: [],
        customSlots: {},
        defaultSlots: [],
        slotCapacities: {},
      });
    }

    if (!hubConfig.slotCapacities) {
      hubConfig.slotCapacities = {};
    }

    hubConfig.slotCapacities[date] = {
      ...(hubConfig.slotCapacities[date] || {}),
      ...capacities,
    };
    hubConfig.markModified('slotCapacities');
    const savedConfig = await hubConfig.save();

    const slotDate = new Date(`${date}T00:00:00.000Z`);
    const slotTimes = Object.keys(capacities);
    for (const time of slotTimes) {
      const { capacity, isActive } = capacities[time];
      await AppointmentSlot.findOneAndUpdate(
        { hubName: scoped.hub.name, date: slotDate, time },
        {
          $set: { capacity, isActive },
          $setOnInsert: { bookedCount: 0 },
        },
        { upsert: true, returnDocument: 'after' }
      );
    }

    await logAuditEvent({
      adminId: auth.adminUser.userId,
      adminEmail: auth.adminUser.email,
      adminName: auth.adminUser.email,
      action: 'update',
      resourceType: 'schedule',
      resourceName: scoped.hub.name,
      description: `Updated slot capacities for ${scoped.hub.name} on ${date}`,
      ipAddress: getClientIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({
      message: 'Slot capacities updated successfully',
      capacities: savedConfig.slotCapacities[date],
    });
  } catch (error) {
    logger.error('Error updating slot capacities:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
