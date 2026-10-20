import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Hub from '@/models/Hub';
import { verifyStudentToken } from '@/lib/studentAuth';
import { ACTIVE_APPOINTMENT_STATUSES } from '@/lib/appointmentStatus';
import { markAppointmentCancelled } from '@/lib/appointmentLifecycle';

async function withHub(appointment: any) {
  let hub = appointment.hubId ? await Hub.findById(appointment.hubId) : null;
  if (!hub && appointment.hubName) {
    hub = await Hub.findOne({ name: appointment.hubName });
  }

  return {
    ...appointment.toObject(),
    hubName: hub?.name || appointment.hubName || 'Unknown Hub',
    hubLocation: hub?.location || '',
    publicTransitDirections: hub?.publicTransitDirections || '',
  };
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const decoded = verifyStudentToken(request.headers.get('authorization'));
    if (!decoded) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const [appointment, history] = await Promise.all([
      Appointment.findOne({
        userId: decoded.userId,
        status: { $in: [...ACTIVE_APPOINTMENT_STATUSES] },
      }).sort({ appointmentDate: -1, createdAt: -1 }),
      Appointment.find({
        userId: decoded.userId,
        status: { $nin: [...ACTIVE_APPOINTMENT_STATUSES] },
      }).sort({ appointmentDate: -1, createdAt: -1 }).limit(25),
    ]);

    return NextResponse.json({
      appointment: appointment ? await withHub(appointment) : null,
      history: await Promise.all(history.map((item) => withHub(item))),
    });
  } catch (error: any) {
    logger.error('Student appointments API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const decoded = verifyStudentToken(request.headers.get('authorization'));
    if (!decoded) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const appointment = await Appointment.findOne({
      userId: decoded.userId,
      status: { $in: [...ACTIVE_APPOINTMENT_STATUSES] },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'No active appointment found to cancel' }, { status: 404 });
    }

    await markAppointmentCancelled(String(appointment._id));

    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled successfully',
    });
  } catch (error: any) {
    logger.error('Cancel appointment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
