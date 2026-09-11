import { NextRequest, NextResponse } from 'next/server';
import Appointment from '@/models/Appointment';
import dbConnect from '@/lib/mongodb';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      userId,
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

    // Create appointment
    const confirmationToken = crypto.randomBytes(32).toString('hex');
    const appointmentDateTime = new Date(preferredSlot);

    // Convert to 12-hour format with AM/PM (e.g., "10:00 AM")
    let hours = appointmentDateTime.getHours();
    const minutes = appointmentDateTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const appointmentTime = `${hours}:${String(minutes).padStart(2, '0')} ${ampm}`;

    const appointment = new Appointment({
      userId,
      hubId,
      slotId,
      appointmentDate: appointmentDateTime,
      appointmentTime,
      status: 'confirmed',
      preferredLanguage: '', // Will be filled from user profile
      notes: `${classInterest} - ${timePreference}`,
      confirmationToken,
      classInterest,
      timePreference,
    });

    await appointment.save();

    return NextResponse.json(
      {
        appointment: {
          _id: appointment._id,
          userId: appointment.userId,
          hubId: appointment.hubId,
          appointmentDate: appointment.appointmentDate,
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
