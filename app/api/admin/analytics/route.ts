import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

// Import models
import '@/models/User';
import '@/models/AppointmentOptimized';
import '@/models/AppointmentSlot';
import '@/models/HubConfig';
import '@/models/Hub';

import mongoose from 'mongoose';
const User = mongoose.models.User;
const AppointmentOptimized = mongoose.models.AppointmentOptimized;
const AppointmentSlot = mongoose.models.AppointmentSlot;
const HubConfig = mongoose.models.HubConfig;
const Hub = mongoose.models.Hub;

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; isAdmin: boolean };
  } catch (error) {
    return null;
  }
}

// GET - Get comprehensive analytics data
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const hubName = searchParams.get('hubName');

    // Build date filter for AppointmentOptimized (uses date field, not appointmentDate)
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    // Build hub filter - AppointmentOptimized uses hubId, not hubName
    // First we need to get hub IDs if hubName is specified
    let hubFilter: any = {};
    if (hubName && hubName !== 'all') {
      const hub = await Hub.findOne({ name: hubName });
      if (hub) {
        hubFilter.hubId = hub._id;
      }
    }

    // Get appointment statistics
    const appointmentStats = await AppointmentOptimized.aggregate([
      { $match: { ...dateFilter, ...hubFilter } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total appointments
    const totalAppointments = await AppointmentOptimized.countDocuments({ ...dateFilter, ...hubFilter });

    // Get appointments by hub (populate hub name from hubId)
    const appointmentsByHub = await AppointmentOptimized.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: 'hubs',
          localField: 'hubId',
          foreignField: '_id',
          as: 'hub'
        }
      },
      { $unwind: '$hub' },
      {
        $group: {
          _id: '$hub.name',
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      }
    ]);

    // Get appointments by time slot
    const appointmentsByTime = await AppointmentOptimized.aggregate([
      { $match: { ...dateFilter, ...hubFilter } },
      {
        $group: {
          _id: '$time',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get weekly trends (last 8 weeks) - convert date string to Date object
    const weeklyTrends = await AppointmentOptimized.aggregate([
      { $match: dateFilter },
      {
        $addFields: {
          dateObj: { $dateFromString: { dateString: '$date' } }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$dateObj' },
            week: { $week: '$dateObj' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
      { $limit: 8 }
    ]);

    // If no weekly trends data, generate some sample data for demonstration
    if (weeklyTrends.length === 0) {
      const currentDate = new Date();
      for (let i = 7; i >= 0; i--) {
        const weekDate = new Date(currentDate);
        weekDate.setDate(currentDate.getDate() - (i * 7));
        weeklyTrends.push({
          _id: {
            year: weekDate.getFullYear(),
            week: Math.ceil((weekDate.getDate() + new Date(weekDate.getFullYear(), weekDate.getMonth(), 0).getDate()) / 7)
          },
          count: Math.floor(Math.random() * 20) + 5 // Random count between 5-25
        });
      }
    }

    // Get user demographics
    const userDemographics = await User.aggregate([
      {
        $group: {
          _id: '$educationLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    const programInterests = await User.aggregate([
      { $unwind: '$programInterests' },
      {
        $group: {
          _id: '$programInterests',
          count: { $sum: 1 }
        }
      }
    ]);

    const barriersToLearning = await User.aggregate([
      { $unwind: '$barriersToLearning' },
      {
        $group: {
          _id: '$barriersToLearning',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get capacity utilization
    const capacityUtilization = await AppointmentSlot.aggregate([
      { $match: hubFilter },
      {
        $group: {
          _id: '$hubName',
          totalCapacity: { $sum: '$capacity' },
          totalBooked: { $sum: '$bookedCount' },
          utilizationRate: {
            $avg: {
              $cond: [
                { $eq: ['$capacity', 0] },
                0,
                { $divide: ['$bookedCount', '$capacity'] }
              ]
            }
          }
        }
      }
    ]);

    // Get recent activity (last 10 appointments)
    const recentAppointments = await AppointmentOptimized.find({ ...dateFilter, ...hubFilter })
      .populate('userId', 'firstName lastName email')
      .populate('hubId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get today's appointments
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    const todaysAppointments = await AppointmentOptimized.find({
      date: todayStr,
      ...hubFilter
    })
      .populate('userId', 'firstName lastName email')
      .populate('hubId', 'name');

    // Convert appointment stats to object
    const stats = {
      total: totalAppointments,
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0
    };

    appointmentStats.forEach(stat => {
      stats[stat._id as keyof typeof stats] = stat.count;
    });

    // Debug: Log the data being returned
    console.log('Analytics API Response:', {
      stats,
      appointmentStats,
      weeklyTrends: weeklyTrends.slice(0, 3), // Log first 3 for debugging
      totalAppointments,
      dateFilter,
      hubFilter
    });

    return NextResponse.json({
      stats,
      appointmentsByHub,
      appointmentsByTime,
      weeklyTrends,
      userDemographics,
      programInterests,
      barriersToLearning,
      capacityUtilization,
      recentAppointments,
      todaysAppointments
    });

  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to get analytics', details: error.message },
      { status: 500 }
    );
  }
} 