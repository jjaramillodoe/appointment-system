import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

// Import models to ensure they are registered
import '@/models/User';
import '@/models/AppointmentSlot';
import '@/models/HubConfig';

// Get the models after registration
import mongoose from 'mongoose';
const User = mongoose.models.User;
const AppointmentSlot = mongoose.models.AppointmentSlot;
const HubConfig = mongoose.models.HubConfig;

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to verify JWT token
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch (error) {
    return null;
  }
}

// Helper function to convert time string to sortable number (for proper time ordering)
function convertToSortableTime(timeStr: string): number {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  
  // Convert to 24-hour format for sorting
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  
  // Return as sortable number (e.g., 9:30 AM = 930, 1:00 PM = 1300)
  return hour * 100 + minute;
}

// GET - Get available appointment slots for a specific hub and date
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

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const hubName = searchParams.get('hubName');
    const date = searchParams.get('date');

    console.log('available-slots API: Querying hubName:', hubName, 'date:', date);

    if (!hubName || !date) {
      return NextResponse.json(
        { error: 'hubName and date are required' },
        { status: 400 }
      );
    }

    // Get hub configuration to check if day is off
    const hubConfig = await HubConfig.findOne({ hubName });
    console.log('available-slots API: Found hubConfig:', hubConfig ? 'Yes' : 'No', hubConfig && hubConfig.hubName);
    if (!hubConfig) {
      return NextResponse.json(
        { error: 'Hub configuration not found' },
        { status: 404 }
      );
    }

    const dateStr = date;
    const isDayOff = (hubConfig.daysOff || []).includes(dateStr);
    
    if (isDayOff) {
      return NextResponse.json({ availableSlots: [] });
    }

    // Get available slots for this date
    const availableSlots = (hubConfig.customSlots && hubConfig.customSlots[dateStr])
      ? hubConfig.customSlots[dateStr]
      : (hubConfig.defaultSlots || []);

    // Get slot capacities
    const slots = await AppointmentSlot.find({
      hubName,
      date: new Date(date), // use Date object to match what's stored
      time: { $in: availableSlots },
      isActive: true
    });
    console.log('available-slots API: AppointmentSlot query found', slots.length, 'slots for', hubName, date);

    // Filter slots with available capacity
    const availableWithCapacity = slots
      .filter(slot => slot.bookedCount < slot.capacity)
      .map(slot => ({
        time: slot.time,
        availableSpots: slot.capacity - slot.bookedCount,
        totalCapacity: slot.capacity
      }));

    // Sort the available slots by time properly (not alphabetically)
    const sortedAvailableSlots = availableWithCapacity.sort((a, b) => {
      const timeA = convertToSortableTime(a.time);
      const timeB = convertToSortableTime(b.time);
      return timeA - timeB;
    });

    return NextResponse.json({ 
      availableSlots: sortedAvailableSlots,
      totalSlots: availableSlots.length,
      availableCount: sortedAvailableSlots.length
    });
  } catch (error: any) {
    console.error('Get available slots error:', error);
    return NextResponse.json(
      { error: 'Failed to get available slots', details: error.message },
      { status: 500 }
    );
  }
} 