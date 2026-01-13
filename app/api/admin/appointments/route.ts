import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

// Import models
import '@/models/User';
import '@/models/AppointmentOptimized';
import '@/models/AppointmentSlot';
import '@/models/Hub';

import mongoose from 'mongoose';
const User = mongoose.models.User;
const AppointmentOptimized = mongoose.models.AppointmentOptimized;
const AppointmentSlot = mongoose.models.AppointmentSlot;
const Hub = mongoose.models.Hub;

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; isAdmin: boolean };
  } catch (error) {
    return null;
  }
}

// GET - Get all appointments with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || decoded.isAdmin !== true) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const hubName = searchParams.get('hubName') || '';
    const status = searchParams.get('status') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const sortBy = searchParams.get('sortBy') || 'appointmentDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build search filter
    const searchFilter: any = {};
    
    if (search) {
      // Since we're using hubId reference, we need to find hub by name first
      let hubIds: string[] = [];
      if (search) {
        const hubs = await Hub.find({ name: { $regex: search, $options: 'i' } });
        hubIds = hubs.map(hub => hub._id.toString());
      }
      
      searchFilter.$or = [
        { notes: { $regex: search, $options: 'i' } },
        { hubId: { $in: hubIds } }
      ];
    }

    // Build hub filter - need to convert hubName to hubId
    if (hubName) {
      const hub = await Hub.findOne({ name: hubName });
      if (hub) {
        searchFilter.hubId = hub._id;
      }
    }

    // Build status filter
    if (status) {
      searchFilter.status = status;
    }

    // Build date filter - using 'date' field and comparing as strings
    if (startDate && endDate) {
      searchFilter.date = {
        $gte: startDate,
        $lte: endDate
      };
    } else if (startDate) {
      searchFilter.date = { $gte: startDate };
    } else if (endDate) {
      searchFilter.date = { $lte: endDate };
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build sort object - adjust field names
    const sort: any = {};
    if (sortBy === 'appointmentDate') {
      sort['date'] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    // Get appointments with pagination and user details
    const appointments = await AppointmentOptimized.find(searchFilter)
      .populate('userId', 'firstName lastName email phone')
      .populate('hubId', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalAppointments = await AppointmentOptimized.countDocuments(searchFilter);

    // Get appointment statistics
    const appointmentStats = await AppointmentOptimized.aggregate([
      { $match: searchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get appointments by hub - using $lookup to get hub name
    const appointmentsByHub = await AppointmentOptimized.aggregate([
      { $match: searchFilter },
      {
        $lookup: {
          from: 'hubs',
          localField: 'hubId',
          foreignField: '_id',
          as: 'hub'
        }
      },
      {
        $addFields: {
          hubName: { $arrayElemAt: ['$hub.name', 0] }
        }
      },
      {
        $group: {
          _id: '$hubName',
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      }
    ]);

    // Get appointments by date (last 30 days) - using string date field
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD

    const appointmentsByDate = await AppointmentOptimized.aggregate([
      { 
        $match: { 
          ...searchFilter,
          date: { $gte: thirtyDaysAgoStr }
        } 
      },
      {
        $group: {
          _id: '$date',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return NextResponse.json({
      appointments,
      pagination: {
        page,
        limit,
        total: totalAppointments,
        pages: Math.ceil(totalAppointments / limit)
      },
      stats: appointmentStats,
      appointmentsByHub,
      appointmentsByDate
    });

  } catch (error: any) {
    console.error('Appointments API error:', error);
    return NextResponse.json(
      { error: 'Failed to get appointments', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update appointment status (bulk or single)
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || decoded.isAdmin !== true) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { appointmentIds, status, notes, adminNotes } = body;

    if (!appointmentIds || !Array.isArray(appointmentIds)) {
      return NextResponse.json({ error: 'Appointment IDs array is required' }, { status: 400 });
    }

    if (!status && !notes && !adminNotes) {
      return NextResponse.json({ error: 'At least one field to update is required' }, { status: 400 });
    }

    // Build update object
    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    // Update appointments
    const result = await AppointmentOptimized.updateMany(
      { _id: { $in: appointmentIds } },
      { $set: updateData }
    );

    // Get updated appointments
    const updatedAppointments = await AppointmentOptimized.find({ _id: { $in: appointmentIds } })
      .populate('userId', 'firstName lastName email phone')
      .populate('hubId', 'name');

    return NextResponse.json({
      message: `Updated ${result.modifiedCount} appointment(s)`,
      updatedAppointments
    });

  } catch (error: any) {
    console.error('Update appointments error:', error);
    return NextResponse.json(
      { error: 'Failed to update appointments', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete appointments (bulk or single)
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || !decoded.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { appointmentIds } = body;

    if (!appointmentIds || !Array.isArray(appointmentIds)) {
      return NextResponse.json({ error: 'Appointment IDs array is required' }, { status: 400 });
    }

    // Get appointments before deletion to update slot capacities
    const appointments = await AppointmentOptimized.find({ _id: { $in: appointmentIds } })
      .populate('hubId', 'name');

    // Update appointment slot capacities
    for (const appointment of appointments) {
      const appointmentSlot = await AppointmentSlot.findOne({
        hubName: appointment.hubId?.name,
        date: appointment.date,
        time: appointment.time
      });

      if (appointmentSlot) {
        appointmentSlot.cancelBooking();
        await appointmentSlot.save();
      }
    }

    // Delete appointments
    const result = await AppointmentOptimized.deleteMany({ _id: { $in: appointmentIds } });

    return NextResponse.json({
      message: `Deleted ${result.deletedCount} appointment(s)`
    });

  } catch (error: any) {
    console.error('Delete appointments error:', error);
    return NextResponse.json(
      { error: 'Failed to delete appointments', details: error.message },
      { status: 500 }
    );
  }
} 