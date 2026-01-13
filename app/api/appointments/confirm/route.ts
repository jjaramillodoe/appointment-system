import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

// Import models to ensure they are registered
import '@/models/User';
import '@/models/Appointment';
import '@/models/Notification';

// Get the models after registration
import mongoose from 'mongoose';
const Appointment = mongoose.models.Appointment;
const NotificationModel = mongoose.models.Notification;

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to verify JWT token
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch (error) {
    return null;
  }
}

// POST - Confirm appointment
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const appointment = await Appointment.findOne({ userId: decoded.userId });
    if (!appointment) {
      return NextResponse.json(
        { error: 'No appointment found' },
        { status: 404 }
      );
    }

    // Check if appointment is in pending status
    if (appointment.status !== 'pending') {
      return NextResponse.json(
        { error: `Appointment cannot be confirmed. Current status: ${appointment.status}` },
        { status: 400 }
      );
    }

    // Check if appointment is within confirmation window (e.g., 24 hours before)
    const appointmentDate = new Date(appointment.appointmentDate);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilAppointment < 0) {
      return NextResponse.json(
        { error: 'Cannot confirm appointment that has already passed' },
        { status: 400 }
      );
    }

    // Update appointment status to confirmed
    appointment.status = 'confirmed';
    await appointment.save();

    // Generate notification for appointment confirmation
    await NotificationModel.create({
      type: 'appointment',
      title: 'Appointment Confirmed',
      message: `Appointment confirmed at ${appointment.hubName} for ${appointment.appointmentDate.toDateString()} at ${appointment.appointmentTime}`,
      hubName: appointment.hubName,
      appointmentId: appointment._id,
      userId: decoded.userId,
      priority: 'medium'
    });

    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate('userId', 'firstName lastName email');

    return NextResponse.json({
      message: 'Appointment confirmed successfully',
      appointment: updatedAppointment,
    });
  } catch (error: any) {
    console.error('Confirm appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm appointment', details: error.message },
      { status: 500 }
    );
  }
} 