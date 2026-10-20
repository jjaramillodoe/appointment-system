import { NextRequest, NextResponse } from 'next/server';
import Appointment from '@/models/Appointment';
import AppointmentSlot from '@/models/AppointmentSlot';
import Hub from '@/models/Hub';
import dbConnect from '@/lib/mongodb';
import { verifyStudentToken } from '@/lib/studentAuth';
import crypto from 'crypto';

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

    // Parse appointment date and time
    const appointmentDateTime = new Date(preferredSlot);

    // Convert to 12-hour format with AM/PM (e.g., "10:00 AM")
    let hours = appointmentDateTime.getHours();
    const minutes = appointmentDateTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const appointmentTime = `${hours}:${String(minutes).padStart(2, '0')} ${ampm}`;

    // Get hub name for slot lookup
    const hub = await Hub.findById(hubId);
    if (!hub) {
      return NextResponse.json(
        { error: 'Hub not found' },
        { status: 404 }
      );
    }

    // Check if appointment slot exists and has capacity
    // Query using hubName, date range, and time
    const appointmentSlot = await AppointmentSlot.findOne({
      hubName: hub.name,
      date: { $gte: new Date(appointmentDateTime.getFullYear(), appointmentDateTime.getMonth(), appointmentDateTime.getDate()), $lt: new Date(appointmentDateTime.getFullYear(), appointmentDateTime.getMonth(), appointmentDateTime.getDate() + 1) },
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
        { error: 'No available slots for the selected date and time' },
        { status: 409 }
      );
    }

    // Create appointment
    const confirmationToken = crypto.randomBytes(32).toString('hex');
    const appointment = new Appointment({
      userId,
      hubId,
      slotId,
      appointmentDate: appointmentDateTime,
      appointmentTime,
      status: 'confirmed',
      preferredLanguage: '',
      notes: `${classInterest} - ${timePreference}`,
      confirmationToken,
      classInterest,
      timePreference,
    });

    await appointment.save();

    // Increment the booked count for the slot
    await AppointmentSlot.findByIdAndUpdate(
      appointmentSlot._id,
      { $inc: { bookedCount: 1 } },
      { new: true }
    );

    return NextResponse.json(
      {
        appointment: {
          _id: appointment._id,
          userId: appointment.userId,
          hubId: appointment.hubId,
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
    console.error('Appointment booking error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to book appointment' },
      { status: 500 }
    );
  }
}
