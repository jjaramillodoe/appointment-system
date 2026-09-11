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

    // Extract time in HH:MM format
    const hours = String(appointmentDateTime.getHours()).padStart(2, '0');
    const minutes = String(appointmentDateTime.getMinutes()).padStart(2, '0');
    const appointmentTime = `${hours}:${minutes}`;

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
