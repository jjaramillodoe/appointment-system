import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Appointment from '@/models/Appointment';
import Hub from '@/models/Hub';
import * as bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get existing hubs
    const hubs = await Hub.find({ isActive: true }).limit(5);

    if (hubs.length === 0) {
      return NextResponse.json(
        { error: 'No hubs found. Please seed hubs first.' },
        { status: 400 }
      );
    }

    // Create demo users
    const demoUsers: Array<{
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone: string;
      preferredLanguage: string;
      profileCompleted: boolean;
      registrationSource: 'quick' | 'full';
      isAdmin: boolean;
    }> = [
      {
        email: 'demo1@example.com',
        password: 'Demo@12345',
        firstName: 'Maria',
        lastName: 'Garcia',
        phone: '212-555-0101',
        preferredLanguage: 'Spanish',
        profileCompleted: true,
        registrationSource: 'quick',
        isAdmin: false,
      },
      {
        email: 'demo2@example.com',
        password: 'Demo@12345',
        firstName: 'John',
        lastName: 'Smith',
        phone: '212-555-0102',
        preferredLanguage: 'English',
        profileCompleted: true,
        registrationSource: 'quick',
        isAdmin: false,
      },
      {
        email: 'demo3@example.com',
        password: 'Demo@12345',
        firstName: 'Fatima',
        lastName: 'Ahmed',
        phone: '212-555-0103',
        preferredLanguage: 'Arabic',
        profileCompleted: false,
        registrationSource: 'quick',
        isAdmin: false,
      },
      {
        email: 'demo4@example.com',
        password: 'Demo@12345',
        firstName: 'Chen',
        lastName: 'Wang',
        phone: '212-555-0104',
        preferredLanguage: 'Chinese',
        profileCompleted: true,
        registrationSource: 'quick',
        isAdmin: false,
      },
      {
        email: 'demo5@example.com',
        password: 'Demo@12345',
        firstName: 'Rosa',
        lastName: 'Martinez',
        phone: '212-555-0105',
        preferredLanguage: 'Spanish',
        profileCompleted: true,
        registrationSource: 'quick',
        isAdmin: false,
      },
      {
        email: 'demo6@example.com',
        password: 'Demo@12345',
        firstName: 'Ahmed',
        lastName: 'Hassan',
        phone: '212-555-0106',
        preferredLanguage: 'Arabic',
        profileCompleted: false,
        registrationSource: 'quick',
        isAdmin: false,
      },
    ];

    const createdUsers = [];
    for (const userData of demoUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = await User.create({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          preferredLanguage: userData.preferredLanguage,
          profileCompleted: userData.profileCompleted,
          registrationSource: userData.registrationSource as 'quick' | 'full',
          isAdmin: userData.isAdmin,
          password: hashedPassword,
        });
        createdUsers.push(user);
      } else {
        createdUsers.push(existingUser);
      }
    }

    // Create demo appointments
    const appointmentTimes = [
      '9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'
    ];
    const classInterests = ['ESL', 'BE/HSE'];
    const timePreferences = ['Morning', 'Evening', 'Saturday'];
    const statuses = ['confirmed', 'pending', 'cancelled', 'completed'];

    let appointmentIndex = 0;
    for (let i = 0; i < 15; i++) {
      const user = createdUsers[i % createdUsers.length];
      const hub = hubs[i % hubs.length];
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + (i % 30) - 15); // Spread over 30 days

      const existingAppointment = await Appointment.findOne({
        userId: user._id,
        appointmentDate: {
          $gte: new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate()),
          $lt: new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate() + 1),
        },
      });

      if (!existingAppointment) {
        await Appointment.create({
          userId: user._id,
          hubId: hub._id,
          hubName: hub.name,
          appointmentDate,
          appointmentTime: appointmentTimes[appointmentIndex % appointmentTimes.length],
          status: statuses[appointmentIndex % statuses.length],
          classInterest: classInterests[appointmentIndex % classInterests.length],
          timePreference: timePreferences[appointmentIndex % timePreferences.length],
          preferredLanguage: user.preferredLanguage,
          intakeType: 'adult-education',
          notes: `Demo appointment for ${user.firstName}`,
          adminNotes: 'Created for demo purposes',
        });
        appointmentIndex++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully',
      stats: {
        usersCreated: createdUsers.length,
        appointmentsCreated: 15,
      },
    });
  } catch (error: any) {
    console.error('Seed demo error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to seed demo data' },
      { status: 500 }
    );
  }
}
