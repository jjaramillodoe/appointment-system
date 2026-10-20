import { NextRequest, NextResponse } from 'next/server';
import { blockOutsideDevelopment } from '@/lib/devOnlyRoute';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import AppointmentSlot from '@/models/AppointmentSlot';
import User from '@/models/User';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const blocked = blockOutsideDevelopment();
  if (blocked) return blocked;

  try {
    await dbConnect();

    // Get all users with their names and emails
    const users = await User.find({ isAdmin: false }).select('_id firstName lastName email');
    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No users found. Please create users first.' },
        { status: 400 }
      );
    }

    // Get all available slots with hub info
    const slots = await AppointmentSlot.find({}).select('_id hubName date time capacity bookedCount');
    if (slots.length === 0) {
      return NextResponse.json(
        { error: 'No appointment slots found. Please generate schedule first.' },
        { status: 400 }
      );
    }

    const classInterests = ['ESL', 'BE/HSE'];
    const timePreferences = ['Morning', 'Evening', 'Saturday'];
    const appointmentsToCreate = 200;

    let appointmentsCreated = 0;
    const failedBookings: string[] = [];

    for (let i = 0; i < appointmentsToCreate; i++) {
      try {
        // Select random user
        const randomUser = users[Math.floor(Math.random() * users.length)];

        // Find a random slot with available capacity
        const availableSlot = await AppointmentSlot.findOne({
          $expr: { $lt: ['$bookedCount', '$capacity'] }
        });

        if (!availableSlot) {
          failedBookings.push('No available slots');
          continue;
        }

        // Parse time from the slot time string (e.g., "9:00 AM" -> 9:00)
        const timeStr = availableSlot.time;
        const [timeOnly] = timeStr.split(' ');
        const [hours24, minutes24] = timeOnly.split(':').map(Number);

        // Create appointment date
        const apptDate = new Date(availableSlot.date);
        apptDate.setHours(hours24, minutes24, 0, 0);

        const classInterest = classInterests[Math.floor(Math.random() * classInterests.length)];
        const timePreference = timePreferences[Math.floor(Math.random() * timePreferences.length)];

        // Create appointment with user and hub info
        const appointment = new Appointment({
          userId: randomUser._id,
          userName: `${randomUser.firstName} ${randomUser.lastName}`,
          userEmail: randomUser.email,
          appointmentDate: apptDate,
          appointmentTime: timeStr,
          hubName: availableSlot.hubName,
          status: ['confirmed', 'pending', 'confirmed'][Math.floor(Math.random() * 3)],
          notes: `${classInterest} - ${timePreference}`,
          confirmationToken: crypto.randomBytes(32).toString('hex'),
          classInterest,
          timePreference,
          intakeType: 'adult-education',
        });

        await appointment.save();

        // Update slot capacity
        await AppointmentSlot.findByIdAndUpdate(
          availableSlot._id,
          { $inc: { bookedCount: 1 } }
        );

        appointmentsCreated++;
      } catch (err: any) {
        failedBookings.push(err.message);
      }
    }

    // Get final statistics
    const totalAppointments = await Appointment.countDocuments();
    const confirmedCount = await Appointment.countDocuments({ status: 'confirmed' });
    const pendingCount = await Appointment.countDocuments({ status: 'pending' });
    const cancelledCount = await Appointment.countDocuments({ status: 'cancelled' });

    return NextResponse.json({
      success: true,
      message: `Created ${appointmentsCreated} random appointments`,
      stats: {
        appointmentsCreated,
        totalAppointments,
        byStatus: {
          confirmed: confirmedCount,
          pending: pendingCount,
          cancelled: cancelledCount,
        },
        failedAttempts: failedBookings.length,
      },
    });
  } catch (error: any) {
    console.error('Seed appointments error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to seed appointments' },
      { status: 500 }
    );
  }
}
