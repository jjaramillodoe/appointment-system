import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminToken, isAdmin } from '@/lib/adminPermissions';
import { hubScopeFilter, resolveRequestedHub, slotHubFilter } from '@/lib/adminUserAccess';
import { fillDailyVolume, percent } from '@/lib/analyticsSeries';
import { DateTime } from 'luxon';
import { DEFAULT_HUB_TIMEZONE, hubCalendarToday, utcDayBounds } from '@/lib/slotDateTime';

// Import models
import '@/models/User';
import '@/models/Appointment';
import '@/models/AppointmentSlot';
import '@/models/HubConfig';
import '@/models/Hub';

import mongoose from 'mongoose';
const User = mongoose.models.User;
const Appointment = mongoose.models.Appointment;
const AppointmentSlot = mongoose.models.AppointmentSlot;
const HubConfig = mongoose.models.HubConfig;
const Hub = mongoose.models.Hub;

// GET - Get comprehensive analytics data
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const adminUser = await verifyAdminToken(token);

    if (!isAdmin(adminUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const hubName = searchParams.get('hubName');

    const hubScope = await resolveRequestedHub(adminUser, hubName);
    if (hubScope.error) {
      return NextResponse.json({ error: hubScope.error }, { status: 403 });
    }

    // Build date filter for Appointment (uses appointmentDate field)
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.appointmentDate = {
        $gte: utcDayBounds(startDate).start,
        $lt: utcDayBounds(endDate).end,
      };
    }

    const appointmentHubFilter: any = hubScope.appointmentFilter;

    // Get appointment statistics
    const appointmentStats = await Appointment.aggregate([
      { $match: { ...dateFilter, ...appointmentHubFilter } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total appointments
    const totalAppointments = await Appointment.countDocuments({ ...dateFilter, ...appointmentHubFilter });

    const appointmentsByHub = await Appointment.aggregate([
      { $match: { ...dateFilter, ...appointmentHubFilter } },
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
          resolvedHubName: {
            $ifNull: [{ $arrayElemAt: ['$hub.name', 0] }, '$hubName'],
          },
        },
      },
      {
        $group: {
          _id: '$resolvedHubName',
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $in: ['$status', ['pending', 'pending_profile']] }, 1, 0] } },
          pendingProfile: { $sum: { $cond: [{ $eq: ['$status', 'pending_profile'] }, 1, 0] } },
          confirmed: { $sum: { $cond: [{ $in: ['$status', ['confirmed', 'completed']] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      }
    ]);

    // Get appointments by time slot
    const appointmentsByTime = await Appointment.aggregate([
      { $match: { ...dateFilter, ...appointmentHubFilter } },
      {
        $group: {
          _id: '$appointmentTime',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get weekly trends (last 8 weeks)
    const weeklyTrends = await Appointment.aggregate([
      { $match: { ...dateFilter, ...appointmentHubFilter } },
      {
        $group: {
          _id: {
            year: { $year: '$appointmentDate' },
            week: { $week: '$appointmentDate' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
      { $limit: 8 }
    ]);

    const dailyVolumeRows = await Appointment.aggregate([
      { $match: { ...dateFilter, ...appointmentHubFilter } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$appointmentDate',
              timezone: DEFAULT_HUB_TIMEZONE,
            },
          },
          total: { $sum: 1 },
          confirmed: {
            $sum: { $cond: [{ $in: ['$status', ['confirmed', 'completed']] }, 1, 0] },
          },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          pendingProfile: {
            $sum: { $cond: [{ $eq: ['$status', 'pending_profile'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const rangeStart = startDate || DateTime.now().minus({ days: 30 }).toISODate() || '';
    const rangeEnd = endDate || DateTime.now().toISODate() || '';
    const dailyVolume = fillDailyVolume(rangeStart, rangeEnd, dailyVolumeRows);

    const byClassInterest = await Appointment.aggregate([
      { $match: { ...dateFilter, ...appointmentHubFilter } },
      { $group: { _id: { $ifNull: ['$classInterest', 'Unspecified'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const byTimePreference = await Appointment.aggregate([
      { $match: { ...dateFilter, ...appointmentHubFilter } },
      { $group: { _id: { $ifNull: ['$timePreference', 'Unspecified'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const byWeekday = await Appointment.aggregate([
      { $match: { ...dateFilter, ...appointmentHubFilter } },
      {
        $group: {
          _id: { $dayOfWeek: '$appointmentDate' },
          count: { $sum: 1 },
        },
      },
    ]);

    const weekdayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const appointmentsByWeekday = weekdayLabels.map((label, index) => ({
      _id: label,
      count: byWeekday.find((row: { _id: number }) => row._id === index + 1)?.count || 0,
    }));

    const nowNy = DateTime.now().setZone(DEFAULT_HUB_TIMEZONE).startOf('day');
    const upcomingStart = new Date(`${nowNy.toISODate()}T00:00:00.000Z`);
    const upcomingEnd = new Date(`${nowNy.plus({ days: 7 }).toISODate()}T00:00:00.000Z`);
    const upcomingSlotMatch = {
      ...(hubScope.hub ? slotHubFilter(hubScope.hub) : {}),
      isActive: true,
      date: { $gte: upcomingStart, $lt: upcomingEnd },
    };

    const upcomingCapacity = await AppointmentSlot.aggregate([
      { $match: upcomingSlotMatch },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: 'UTC' } },
            hubName: '$hubName',
          },
          capacity: { $sum: '$capacity' },
          booked: { $sum: '$bookedCount' },
        },
      },
      { $sort: { '_id.date': 1, '_id.hubName': 1 } },
    ]);

    const upcomingByHub = await AppointmentSlot.aggregate([
      { $match: upcomingSlotMatch },
      {
        $group: {
          _id: '$hubName',
          capacity: { $sum: '$capacity' },
          booked: { $sum: '$bookedCount' },
        },
      },
      { $sort: { booked: -1 } },
    ]);

    const upcomingTotals = upcomingByHub.reduce(
      (acc: { capacity: number; booked: number }, row: { capacity: number; booked: number }) => ({
        capacity: acc.capacity + row.capacity,
        booked: acc.booked + row.booked,
      }),
      { capacity: 0, booked: 0 }
    );

    let userFilter: any = {};
    if (hubScope.hub) {
      const appointmentUserIds = await Appointment.distinct('userId', { ...dateFilter, ...appointmentHubFilter });
      userFilter = {
        $or: [
          ...hubScopeFilter(hubScope.hub).$or,
          ...(appointmentUserIds.length > 0 ? [{ _id: { $in: appointmentUserIds } }] : []),
        ],
      };
    }
    const userDemographics = await User.aggregate([
      { $match: userFilter },
      {
        $group: {
          _id: '$educationLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    const programInterests = await User.aggregate([
      { $match: userFilter },
      { $unwind: '$programInterests' },
      {
        $group: {
          _id: '$programInterests',
          count: { $sum: 1 }
        }
      }
    ]);

    const barriersToLearning = await User.aggregate([
      { $match: userFilter },
      { $unwind: '$barriersToLearning' },
      {
        $group: {
          _id: '$barriersToLearning',
          count: { $sum: 1 }
        }
      }
    ]);

    const capacityMatch = hubScope.hub ? slotHubFilter(hubScope.hub) : {};

    const capacityUtilization = await AppointmentSlot.aggregate([
      { $match: capacityMatch },
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
    const recentAppointments = await Appointment.find({ ...dateFilter, ...appointmentHubFilter })
      .populate('userId', 'firstName lastName email')
      .populate('hubId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    const todayBounds = utcDayBounds(hubCalendarToday());
    const todaysAppointments = await Appointment.find({
      appointmentDate: {
        $gte: todayBounds.start,
        $lt: todayBounds.end,
      },
      ...appointmentHubFilter
    })
      .populate('userId', 'firstName lastName email')
      .populate('hubId', 'name');

    const stats = {
      total: totalAppointments,
      pending: 0,
      pending_profile: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
      expired: 0,
    };

    appointmentStats.forEach((stat: { _id: string; count: number }) => {
      if (stat._id in stats) {
        stats[stat._id as keyof typeof stats] = stat.count;
      }
    });

    const confirmedLike = stats.confirmed + stats.completed;
    const actionRequired = stats.pending_profile + stats.pending;

    return NextResponse.json({
      stats: {
        ...stats,
        confirmationRate: percent(confirmedLike, stats.total),
        cancelRate: percent(stats.cancelled, stats.total),
        actionRequiredRate: percent(actionRequired, stats.total),
        upcomingBooked: upcomingTotals.booked,
        upcomingCapacity: upcomingTotals.capacity,
        upcomingFillRate: percent(upcomingTotals.booked, upcomingTotals.capacity),
        todayCount: todaysAppointments.length,
      },
      appointmentsByHub,
      appointmentsByTime,
      appointmentsByWeekday,
      appointmentsByDate: dailyVolume.map((point) => ({ _id: point.date, count: point.total })),
      dailyVolume,
      byClassInterest,
      byTimePreference,
      weeklyTrends,
      upcomingCapacity,
      upcomingByHub,
      userDemographics,
      programInterests,
      barriersToLearning,
      capacityUtilization,
      recentAppointments,
      todaysAppointments,
    });

  } catch (error: any) {
    logger.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to get analytics', details: error.message },
      { status: 500 }
    );
  }
} 