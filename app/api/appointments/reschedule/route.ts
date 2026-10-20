import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import AppointmentOptimized from '@/models/AppointmentOptimized';
import AppointmentSlot from '@/models/AppointmentSlot';
import Availability from '@/models/Availability';
import Hub from '@/models/Hub';
import { verifyStudentToken } from '@/lib/studentAuth';
import { isAdmin, verifyAdminToken } from '@/lib/adminPermissions';
import { ACTIVE_APPOINTMENT_STATUSES } from '@/lib/appointmentStatus';
import { freeAppointmentSeat } from '@/lib/appointmentLifecycle';
import { calendarDateFromValue, toAppointmentClock, toTwentyFourHour } from '@/lib/appointmentTime';
import { notifyAppointmentBooked } from '@/lib/appointmentNotifications';
import { notifyStudent } from '@/lib/studentNotifications';
import { AvailabilityCache } from '@/lib/redis';
import { isDateClosed } from '@/lib/closures';
import User from '@/models/User';

export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();

    const student = verifyStudentToken(request.headers.get('authorization'));
    const adminUser = await verifyAdminToken((request.headers.get('authorization') || '').replace('Bearer ', ''));
    const body = await request.json();
    const { date, time, hubId, userId: requestedUserId } = body;
    const userId = isAdmin(adminUser) ? (requestedUserId || student?.userId) : student?.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    if (!date || !time) {
      return NextResponse.json({ error: 'date and time are required' }, { status: 400 });
    }

    const appointment = await Appointment.findOne({
      userId,
      status: { $in: [...ACTIVE_APPOINTMENT_STATUSES] },
    });
    if (!appointment) {
      return NextResponse.json({ error: 'No active appointment to reschedule' }, { status: 404 });
    }

    const nextHub = hubId
      ? await Hub.findById(hubId)
      : appointment.hubId
        ? await Hub.findById(appointment.hubId)
        : await Hub.findOne({ name: appointment.hubName });
    if (!nextHub) {
      return NextResponse.json({ error: 'Hub not found' }, { status: 404 });
    }

    const closed = await isDateClosed(String(nextHub._id), date);
    if (closed.closed) {
      return NextResponse.json({ error: closed.reason || 'That day is closed' }, { status: 409 });
    }

    const displayTime = toAppointmentClock(time);
    const twentyFour = toTwentyFourHour(time);
    const previousDate = calendarDateFromValue(appointment.appointmentDate);
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const slot = await AppointmentSlot.findOne({
      hubName: nextHub.name,
      date: { $gte: dayStart, $lt: dayEnd },
      time: displayTime,
      isActive: true,
    });
    if (slot && slot.bookedCount >= slot.capacity) {
      return NextResponse.json({ error: 'That time slot is fully booked' }, { status: 409 });
    }

    await freeAppointmentSeat(appointment);

    appointment.hubId = nextHub._id;
    appointment.hubName = nextHub.name;
    appointment.appointmentDate = dayStart;
    appointment.appointmentTime = displayTime as typeof appointment.appointmentTime;
    await appointment.save();

    if (slot) {
      await AppointmentSlot.findByIdAndUpdate(slot._id, { $inc: { bookedCount: 1 } }, { returnDocument: 'after' });
    }

    const availability = await Availability.findOne({ hubId: nextHub._id, date });
    if (availability) {
      try {
        await availability.bookSlot(twentyFour);
      } catch {
        try {
          await availability.bookSlot(displayTime);
        } catch {
          // Availability rows are optional.
        }
      }
    }

    if (previousDate && previousDate !== date) {
      await AppointmentOptimized.deleteMany({ userId, date: previousDate });
    }
    await AppointmentOptimized.findOneAndUpdate(
      { userId, date },
      {
        userId,
        hubId: nextHub._id,
        date,
        time: twentyFour,
        status: appointment.status,
        intakeType: 'adult-education',
      },
      { upsert: true }
    );
    await AvailabilityCache.invalidate(String(nextHub._id), date);

    const user = await User.findById(userId);
    if (user) {
      void notifyAppointmentBooked(user, { date, time: displayTime, hubName: nextHub.name }, true);
      void notifyStudent({
        userId,
        title: 'Cita cambiada / Appointment rescheduled',
        message: `Su cita ahora es el ${date} a las ${displayTime} en ${nextHub.name}. / Your appointment is now ${date} at ${displayTime} at ${nextHub.name}.`,
        hubName: nextHub.name,
        appointmentId: String(appointment._id),
      });
    }

    return NextResponse.json({ success: true, appointment });
  } catch (error: any) {
    logger.error('Reschedule error:', error);
    return NextResponse.json({ error: error.message || 'Failed to reschedule' }, { status: 500 });
  }
}
