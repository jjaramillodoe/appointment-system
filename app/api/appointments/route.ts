import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/mongodb';
import AppointmentOptimized from '../../../models/AppointmentOptimized';
import Hub from '../../../models/Hub';
import { AvailabilityService } from '../../../lib/availabilityService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

// GET - Fetch user's appointments
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Find user's most recent appointment
    const appointment = await AppointmentOptimized.findOne({ 
      userId: decoded.userId 
    }).sort({ date: -1, time: -1 });

    if (!appointment) {
      return NextResponse.json({
        appointment: null,
        message: 'No appointments found'
      });
    }

    // Get hub name
    const hub = await Hub.findById(appointment.hubId);
    const appointmentWithHub = {
      ...appointment.toObject(),
      hubName: hub?.name || 'Unknown Hub'
    };

    return NextResponse.json({
      appointment: appointmentWithHub
    });

  } catch (error: any) {
    console.error('Student appointments API error:', error);
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel and completely remove user's appointment
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    console.log('🗑️ Student cancellation request for user:', decoded.userId);

    // Find user's active appointment
    const appointment = await AppointmentOptimized.findOne(
      { 
        userId: decoded.userId,
        status: { $ne: 'cancelled' }
      }
    );

    if (!appointment) {
      return NextResponse.json(
        { error: 'No active appointment found to cancel' },
        { status: 404 }
      );
    }

    console.log('📋 Found appointment to cancel:', {
      id: appointment._id,
      hubId: appointment.hubId,
      date: appointment.date,
      time: appointment.time
    });

    // Use the AvailabilityService to properly cancel the booking
    // This will update the availability slots and invalidate cache
    const cancellationResult = await AvailabilityService.cancelBooking(
      appointment.hubId.toString(),
      appointment.date,
      appointment.time,
      decoded.userId
    );

    if (!cancellationResult) {
      console.error('❌ Failed to cancel booking through AvailabilityService');
      return NextResponse.json(
        { error: 'Failed to cancel appointment - please try again' },
        { status: 500 }
      );
    }

    // Now completely delete the appointment from the database
    await AppointmentOptimized.findByIdAndDelete(appointment._id);

    console.log('✅ Appointment successfully cancelled and deleted');

    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled and removed successfully'
    });

  } catch (error: any) {
    console.error('Cancel appointment error:', error);
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 