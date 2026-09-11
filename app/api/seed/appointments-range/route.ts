import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import AppointmentSlot from '@/models/AppointmentSlot';
import User from '@/models/User';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get all users
    const users = await User.find({ isAdmin: false }).select('_id firstName lastName email');
    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No users found. Please create users first.' },
        { status: 400 }
      );
    }

    // Get all unique dates from slots
    const distinctDates = await AppointmentSlot.distinct('date');

    if (distinctDates.length === 0) {
      return NextResponse.json(
        { error: 'No appointment slots found' },
        { status: 400 }
      );
    }

    // Take first 15 dates that have slots
    const datesToSeed = distinctDates.slice(0, 15);

    const classInterests = ['ESL', 'BE/HSE'];
    const timePreferences = ['Morning', 'Evening', 'Saturday'];

    let appointmentsCreated = 0;
    const statuses = ['confirmed', 'pending', 'confirmed'];

    for (const date of datesToSeed) {
      // Get all slots for this date
      const slotsForDate = await AppointmentSlot.find({ date })
        .select('hubName time')
        .lean();

      for (const slot of slotsForDate) {
        // Create 2-3 appointments per slot
        const appointmentsPerSlot = Math.random() > 0.5 ? 2 : 3;

        for (let i = 0; i < appointmentsPerSlot; i++) {
          const randomUser = users[Math.floor(Math.random() * users.length)];
          const classInterest = classInterests[Math.floor(Math.random() * classInterests.length)];
          const timePreference = timePreferences[Math.floor(Math.random() * timePreferences.length)];
          const status = statuses[Math.floor(Math.random() * statuses.length)];

          const appointment = new Appointment({
            userId: randomUser._id,
            userName: `${randomUser.firstName} ${randomUser.lastName}`,
            userEmail: randomUser.email,
            appointmentDate: date,
            appointmentTime: slot.time,
            hubName: slot.hubName,
            status,
            notes: `${classInterest} - ${timePreference}`,
            confirmationToken: crypto.randomBytes(32).toString('hex'),
            classInterest,
            timePreference,
            intakeType: 'adult-education',
          });

          await appointment.save();
          appointmentsCreated++;
        }
      }
    }

    // Get final statistics
    const totalAppointments = await Appointment.countDocuments();
    const confirmedCount = await Appointment.countDocuments({ status: 'confirmed' });
    const pendingCount = await Appointment.countDocuments({ status: 'pending' });

    // Get date range
    const minDate = new Date(datesToSeed[0]).toISOString().split('T')[0];
    const maxDate = new Date(datesToSeed[datesToSeed.length - 1]).toISOString().split('T')[0];

    return NextResponse.json({
      success: true,
      message: `Created ${appointmentsCreated} appointments for ${minDate} to ${maxDate}`,
      stats: {
        appointmentsCreated,
        totalAppointments,
        dateRange: `${minDate} to ${maxDate}`,
        byStatus: {
          confirmed: confirmedCount,
          pending: pendingCount,
        },
      },
    });
  } catch (error: any) {
    console.error('Seed range appointments error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to seed appointments' },
      { status: 500 }
    );
  }
}
