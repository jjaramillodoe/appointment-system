import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { DateTime } from 'luxon';
import Appointment from '@/models/Appointment';
import AppointmentSlot from '@/models/AppointmentSlot';
import Hub from '@/models/Hub';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';
import { verifyStudentToken } from '@/lib/studentAuth';
import { formatAppointmentTime, getHubTimezone, utcDayBounds } from '@/lib/slotDateTime';
import { isTimePreference, slotMatchesTimePreference } from '@/lib/timePreference';
import crypto from 'crypto';
import { calculateProfileCompletion } from '@/lib/profileCompletion';
import { bookingStatusForProfile } from '@/lib/appointmentStatus';
import { notifyAppointmentBooked } from '@/lib/appointmentNotifications';
import { getSystemSettings } from '@/lib/systemSettings';
import { ACTIVE_APPOINTMENT_STATUSES } from '@/lib/appointmentStatus';
import { notifyStudent } from '@/lib/studentNotifications';
import { isDateClosed } from '@/lib/closures';
import { assertProgramQuota } from '@/lib/programQuotas';

export async function POST(request: NextRequest) {
  try {
    const decoded = verifyStudentToken(request.headers.get('authorization'));
    if (!decoded) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    // Always book for the authenticated student, never a userId from the body
    const userId = decoded.userId;
    const {
      classInterest,
      timePreference,
      hubId,
      slotId,
      preferredSlot,
    } = body;

    // Validate required fields
    if (!userId || !classInterest || !timePreference || !hubId || !preferredSlot) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const hub = await Hub.findById(hubId);
    if (!hub) {
      return NextResponse.json(
        { error: 'Hub not found' },
        { status: 404 }
      );
    }

    const settings = await getSystemSettings();
    const activeCount = await Appointment.countDocuments({
      userId,
      status: { $in: [...ACTIVE_APPOINTMENT_STATUSES] },
    });
    if (activeCount >= (settings.maxActiveAppointments || 1)) {
      return NextResponse.json({ error: 'You already have an active appointment' }, { status: 409 });
    }

    const timezone = getHubTimezone(hub.timezone);
    const appointmentDateTime = DateTime.fromISO(preferredSlot, { setZone: true }).setZone(timezone);

    if (!appointmentDateTime.isValid) {
      return NextResponse.json(
        { error: 'Invalid appointment time' },
        { status: 400 }
      );
    }

    if (appointmentDateTime <= DateTime.now().setZone(timezone)) {
      return NextResponse.json(
        { error: 'That appointment time has already passed. Please choose a later slot.' },
        { status: 409 }
      );
    }

    const appointmentTime = formatAppointmentTime(appointmentDateTime);
    const dateStr = appointmentDateTime.toISODate();
    const nextDateStr = appointmentDateTime.plus({ days: 1 }).toISODate();
    if (dateStr) {
      const closed = await isDateClosed(String(hub._id), dateStr);
      if (closed.closed) {
        return NextResponse.json({ error: closed.reason || 'That day is closed' }, { status: 409 });
      }
    }

    if (
      isTimePreference(timePreference) &&
      dateStr &&
      !slotMatchesTimePreference(timePreference, appointmentTime, dateStr)
    ) {
      return NextResponse.json(
        { error: 'That time does not match the selected morning, evening, or Saturday window.' },
        { status: 400 }
      );
    }

    const appointmentSlot = await AppointmentSlot.findOne({
      hubName: hub.name,
      date: {
        $gte: new Date(`${dateStr}T00:00:00.000Z`),
        $lt: new Date(`${nextDateStr}T00:00:00.000Z`),
      },
      time: appointmentTime,
    });

    if (!appointmentSlot) {
      return NextResponse.json(
        { error: 'Appointment slot not available for the selected date and time' },
        { status: 404 }
      );
    }

    // Check if slot has available capacity
    if (appointmentSlot.bookedCount >= appointmentSlot.capacity) {
      return NextResponse.json(
        { error: 'No available slots for the selected date and time', waitlist: true },
        { status: 409 }
      );
    }

    const quota = await assertProgramQuota({
      hubName: hub.name,
      date: dateStr || appointmentDateTime.toJSDate(),
      time: appointmentTime,
      classInterest,
      capacity: appointmentSlot.capacity,
    });
    if (!quota.ok) {
      return NextResponse.json({ error: quota.error, waitlist: true }, { status: 409 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const completion = calculateProfileCompletion(user);
    if (completion.isComplete && !user.profileCompleted) {
      user.profileCompleted = true;
      await user.save();
    }

    const status = bookingStatusForProfile(completion.isComplete);
    const confirmationToken = crypto.randomBytes(32).toString('hex');
    const appointment = new Appointment({
      userId,
      hubId,
      hubName: hub.name,
      slotId,
      // Same convention as every other writer: UTC midnight of the hub calendar day + wall-clock time
      appointmentDate: dateStr ? utcDayBounds(dateStr).start : appointmentDateTime.toJSDate(),
      appointmentTime,
      status,
      preferredLanguage: user.preferredLanguage || '',
      notes: `${classInterest} - ${timePreference}`,
      confirmationToken,
      classInterest,
      timePreference,
    });

    await appointment.save();
    void notifyAppointmentBooked(user, appointment, completion.isComplete);
    void notifyStudent({
      userId: String(user._id),
      title: completion.isComplete ? 'Cita confirmada / Appointment confirmed' : 'Complete su perfil / Complete your profile',
      message: completion.isComplete
        ? `Su cita en ${hub.name} está confirmada para ${dateStr} a las ${appointmentTime}. / Your appointment at ${hub.name} is confirmed for ${dateStr} at ${appointmentTime}.`
        : `Su cupo está reservado para ${dateStr} a las ${appointmentTime}. Complete su perfil para confirmarlo. / Your slot is reserved for ${dateStr} at ${appointmentTime}. Complete your profile to confirm it.`,
      hubName: hub.name,
      appointmentId: String(appointment._id),
    });

    // Increment the booked count for the slot
    await AppointmentSlot.findByIdAndUpdate(
      appointmentSlot._id,
      { $inc: { bookedCount: 1 } },
      { returnDocument: 'after' }
    );

    return NextResponse.json(
      {
        appointment: {
          _id: appointment._id,
          userId: appointment.userId,
          hubId: appointment.hubId,
          hubName: appointment.hubName,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          status: appointment.status,
          confirmationToken: appointment.confirmationToken,
          classInterest: appointment.classInterest,
          timePreference: appointment.timePreference,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Appointment booking error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to book appointment' },
      { status: 500 }
    );
  }
}
