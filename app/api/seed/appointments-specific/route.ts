import { logger } from '@/lib/logger';
import { blockOutsideDevelopment } from '@/lib/devOnlyRoute';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const blocked = blockOutsideDevelopment();
  if (blocked) return blocked;

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

    const classInterests = ['ESL', 'BE/HSE'];
    const timePreferences = ['Morning', 'Evening', 'Saturday'];
    const hubs = [
      'Adult Education at Coney Island Avenue',
      'Bronx Adult Learning Center',
      'I.S. 259 Abraham Lincoln',
      'P.S. 13 Roberto Clemente',
      'P.S. 6 Norma Adams Clemons Academy',
    ];

    const timeSlots = [
      '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
      '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
      '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'
    ];

    // Create appointments for 09/14/2026 and 09/15/2026
    const dates = [
      new Date('2026-09-14'),
      new Date('2026-09-15'),
    ];

    let appointmentsCreated = 0;
    const statuses = ['confirmed', 'pending', 'confirmed'];

    for (const date of dates) {
      for (const hub of hubs) {
        for (const time of timeSlots) {
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
              appointmentTime: time,
              hubName: hub,
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
    }

    // Get final statistics
    const totalAppointments = await Appointment.countDocuments();
    const confirmedCount = await Appointment.countDocuments({ status: 'confirmed' });
    const pendingCount = await Appointment.countDocuments({ status: 'pending' });

    return NextResponse.json({
      success: true,
      message: `Created ${appointmentsCreated} appointments for 09/14/2026 and 09/15/2026`,
      stats: {
        appointmentsCreated,
        totalAppointments,
        byStatus: {
          confirmed: confirmedCount,
          pending: pendingCount,
        },
      },
    });
  } catch (error: any) {
    logger.error('Seed specific appointments error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to seed appointments' },
      { status: 500 }
    );
  }
}
