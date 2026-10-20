import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { verifyStudentToken } from '@/lib/studentAuth';
import { APPOINTMENT_STATUS } from '@/lib/appointmentStatus';
import { notifyStudent } from '@/lib/studentNotifications';
import { combineSlotDateTime, DEFAULT_HUB_TIMEZONE, slotCalendarDate } from '@/lib/slotDateTime';
import { getSystemSettings } from '@/lib/systemSettings';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const decoded = verifyStudentToken(request.headers.get('authorization'));
    if (!decoded) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const appointment = await Appointment.findOne({
      userId: decoded.userId,
      status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.PENDING_PROFILE] },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'No appointment found' }, { status: 404 });
    }

    const settings = await getSystemSettings();
    if (settings.requireProfileBeforeConfirm && appointment.status === APPOINTMENT_STATUS.PENDING_PROFILE) {
      return NextResponse.json(
        { error: 'Complete your profile before confirming this appointment' },
        { status: 400 }
      );
    }

    const slot = combineSlotDateTime(
      appointment.appointmentDate,
      appointment.appointmentTime || '9:00 AM',
      DEFAULT_HUB_TIMEZONE
    );
    if (slot.isValid && slot.toMillis() < Date.now()) {
      return NextResponse.json({ error: 'Cannot confirm an appointment that has already passed' }, { status: 400 });
    }

    appointment.status = APPOINTMENT_STATUS.CONFIRMED;
    await appointment.save();

    const dateLabel = slot.isValid ? slot.toFormat('EEEE, MMMM d') : slotCalendarDate(appointment.appointmentDate);
    await notifyStudent({
      userId: decoded.userId,
      title: 'Cita confirmada / Appointment confirmed',
      message: `Su cita en ${appointment.hubName || 'su centro'} está confirmada para ${dateLabel} a las ${appointment.appointmentTime}. / Your appointment at ${appointment.hubName || 'your site'} is confirmed for ${dateLabel} at ${appointment.appointmentTime}.`,
      hubName: appointment.hubName,
      appointmentId: String(appointment._id),
    });

    return NextResponse.json({
      message: 'Appointment confirmed successfully',
      appointment,
    });
  } catch (error: any) {
    logger.error('Confirm appointment error:', error);
    return NextResponse.json({ error: 'Failed to confirm appointment' }, { status: 500 });
  }
}
