import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

// Import models to ensure they are registered
import '@/models/User';
import '@/models/AppointmentSlot';

// Get the models after registration
import mongoose from 'mongoose';
const User = mongoose.models.User;
const AppointmentSlot = mongoose.models.AppointmentSlot;

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to verify JWT token
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch (error) {
    return null;
  }
}

// GET - Get appointment slots for a specific hub and date range
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

    // Check if user is admin
    const user = await User.findById(decoded.userId);
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const hubName = searchParams.get('hubName');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!hubName || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'hubName, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    const slots = await AppointmentSlot.find({
      hubName,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ date: 1, time: 1 });

    return NextResponse.json({ slots });
  } catch (error: any) {
    console.error('Get appointment slots error:', error);
    return NextResponse.json(
      { error: 'Failed to get appointment slots', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create or update appointment slots
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

    // Check if user is admin
    const user = await User.findById(decoded.userId);
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { hubName, date, time, capacity, isActive } = body;

    if (!hubName || !date || !time) {
      return NextResponse.json(
        { error: 'hubName, date, and time are required' },
        { status: 400 }
      );
    }

    // Find existing slot or create new one
    let slot = await AppointmentSlot.findOne({ hubName, date: new Date(date), time });
    
    if (slot) {
      // Update existing slot
      if (capacity !== undefined) slot.capacity = capacity;
      if (isActive !== undefined) slot.isActive = isActive;
    } else {
      // Create new slot
      slot = new AppointmentSlot({
        hubName,
        date: new Date(date),
        time,
        capacity: capacity || 1,
        isActive: isActive !== undefined ? isActive : true,
      });
    }

    await slot.save();

    return NextResponse.json({
      message: 'Appointment slot updated successfully',
      slot
    });
  } catch (error: any) {
    console.error('Update appointment slot error:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment slot', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Bulk update appointment slots
export async function PUT(request: NextRequest) {
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

    // Check if user is admin
    const user = await User.findById(decoded.userId);
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { hubName, date, slots } = body;

    if (!hubName || !date || !slots || !Array.isArray(slots)) {
      return NextResponse.json(
        { error: 'hubName, date, and slots array are required' },
        { status: 400 }
      );
    }

    const results = [];

    for (const slotData of slots) {
      const { time, capacity, isActive } = slotData;
      
      if (!time) continue;

      let slot = await AppointmentSlot.findOne({ 
        hubName, 
        date: new Date(date), 
        time 
      });
      
      if (slot) {
        // Update existing slot
        if (capacity !== undefined) slot.capacity = capacity;
        if (isActive !== undefined) slot.isActive = isActive;
      } else {
        // Create new slot
        slot = new AppointmentSlot({
          hubName,
          date: new Date(date),
          time,
          capacity: capacity || 1,
          isActive: isActive !== undefined ? isActive : true,
        });
      }

      await slot.save();
      results.push(slot);
    }

    return NextResponse.json({
      message: 'Appointment slots updated successfully',
      slots: results
    });
  } catch (error: any) {
    console.error('Bulk update appointment slots error:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment slots', details: error.message },
      { status: 500 }
    );
  }
} 