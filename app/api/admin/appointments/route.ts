import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminToken, isAdmin } from '@/lib/adminPermissions';
import { resolveRequestedHub } from '@/lib/adminUserAccess';
import Appointment from '@/models/Appointment';
import AppointmentSlot from '@/models/AppointmentSlot';
import { logAuditEvent, getClientIpAddress, getUserAgent } from '@/lib/auditLogger';
import { APPOINTMENT_STATUS, SEAT_HOLDING_STATUSES, isAppointmentStatus } from '@/lib/appointmentStatus';
import { freeAppointmentSeat, retakeAppointmentSeat } from '@/lib/appointmentLifecycle';
import { notifyStudent } from '@/lib/studentNotifications';
import { utcDayBounds } from '@/lib/slotDateTime';

// GET - Get all appointments with filtering and pagination
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const hubName = searchParams.get('hubName') || '';
    const status = searchParams.get('status') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const sortBy = searchParams.get('sortBy') || 'appointmentDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const hubScope = await resolveRequestedHub(adminUser, hubName);
    if (hubScope.error) {
      return NextResponse.json({ error: hubScope.error }, { status: 403 });
    }

    const conditions: Record<string, unknown>[] = [];
    if (Object.keys(hubScope.appointmentFilter).length > 0) {
      conditions.push(hubScope.appointmentFilter);
    }

    if (search) {
      conditions.push({
        $or: [
          { userName: { $regex: search, $options: 'i' } },
          { userEmail: { $regex: search, $options: 'i' } },
          { hubName: { $regex: search, $options: 'i' } },
        ],
      });
    }

    if (status) {
      conditions.push({ status });
    }

    if (startDate || endDate) {
      const appointmentDate: Record<string, Date> = {};
      if (startDate) {
        appointmentDate.$gte = utcDayBounds(startDate).start;
      }
      if (endDate) {
        appointmentDate.$lt = utcDayBounds(endDate).end;
      }
      conditions.push({ appointmentDate });
    }

    const searchFilter = conditions.length ? { $and: conditions } : {};

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    if (sortBy === 'appointmentDate') {
      sort['appointmentDate'] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    const appointments = await Appointment.find(searchFilter)
      .populate('userId', 'firstName lastName email phone profileCompleted programInterests')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Format appointments to match component expectations
    const formattedAppointments = appointments.map((apt: any) => {
      // Format date as YYYY-MM-DD string for the component
      let dateStr = '';
      if (apt.appointmentDate) {
        const d = new Date(apt.appointmentDate);
        dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD format
      }

      return {
        _id: apt._id,
        userId: {
          _id: apt.userId?._id,
          firstName: apt.userId?.firstName || '',
          lastName: apt.userId?.lastName || '',
          email: apt.userId?.email || 'unknown@example.com',
        },
        date: dateStr, // Component expects 'date' as YYYY-MM-DD string
        time: apt.appointmentTime, // Component expects 'time' not 'appointmentTime'
        hubId: {
          name: apt.hubName || 'Unknown Hub',
        },
        status: apt.status,
        notes: apt.notes || '',
        adminNotes: apt.adminNotes || '',
        classInterest: apt.classInterest || '',
        timePreference: apt.timePreference || '',
        profileCompleted: Boolean(apt.userId?.profileCompleted),
        phone: apt.userId?.phone || '',
        createdAt: apt.createdAt,
      };
    });

    // Get total count for pagination
    const totalAppointments = await Appointment.countDocuments(searchFilter);

    // Get appointment statistics
    const appointmentStats = await Appointment.aggregate([
      { $match: searchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get appointments by hub
    const appointmentsByHub = await Appointment.aggregate([
      { $match: searchFilter },
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

    // Get appointments by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const appointmentsByDate = await Appointment.aggregate([
      {
        $match: {
          ...searchFilter,
          appointmentDate: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$appointmentDate' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return NextResponse.json({
      appointments: formattedAppointments,
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
    logger.error('Appointments API error:', error);
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
    const adminUser = await verifyAdminToken(token);
    if (!isAdmin(adminUser) || !adminUser) {
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

    // updateMany skips schema validation, so check the status explicitly
    if (status !== undefined && !isAppointmentStatus(status)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
    }

    const scope = await resolveRequestedHub(adminUser, null);
    if (scope.error) {
      return NextResponse.json({ error: scope.error }, { status: 403 });
    }

    const scopedFilter: Record<string, unknown> = { _id: { $in: appointmentIds } };
    if (Object.keys(scope.appointmentFilter).length) {
      scopedFilter.$and = [scope.appointmentFilter];
    }

    const current = await Appointment.find(scopedFilter);
    if (current.length === 0) {
      return NextResponse.json({ error: 'No matching appointments in your hub' }, { status: 403 });
    }

    const now = new Date();
    const holdsSeat = (value: string) => (SEAT_HOLDING_STATUSES as readonly string[]).includes(value);

    // Per-appointment updates so undo keeps the original check-in time
    const result = await Appointment.bulkWrite(current.map((apt) => {
      const set: Record<string, unknown> = {};
      const unset: Record<string, ''> = {};
      if (notes !== undefined) set.notes = notes;
      if (adminNotes !== undefined) set.adminNotes = adminNotes;
      if (status) {
        set.status = status;
        if (status === APPOINTMENT_STATUS.ARRIVED) {
          set.checkedInAt = apt.checkedInAt || now;
          unset.completedAt = '';
        } else if (status === APPOINTMENT_STATUS.COMPLETED) {
          set.checkedInAt = apt.checkedInAt || now;
          set.completedAt = apt.completedAt || now;
        } else {
          unset.checkedInAt = '';
          unset.completedAt = '';
        }
      }
      return {
        updateOne: {
          filter: { _id: apt._id },
          update: Object.keys(unset).length ? { $set: set, $unset: unset } : { $set: set },
        },
      };
    }));

    if (status) {
      for (const apt of current) {
        // Only move seats when crossing between seat-holding and released states
        if (holdsSeat(apt.status) && !holdsSeat(status)) {
          await freeAppointmentSeat(apt);
        } else if (!holdsSeat(apt.status) && holdsSeat(status)) {
          await retakeAppointmentSeat(apt);
        }
      }
    }

    if (status === APPOINTMENT_STATUS.NO_SHOW) {
      for (const apt of current) {
        if (apt.userId && apt.status !== APPOINTMENT_STATUS.NO_SHOW) {
          await notifyStudent({
            userId: String(apt.userId),
            title: 'No asistió / We missed you',
            message: `Lo marcaron como ausente en ${apt.hubName || 'su centro'}. Puede reservar otra cita desde su panel. / You were marked as a no-show for ${apt.hubName || 'your site'}. You can book a new appointment from your dashboard.`,
            hubName: apt.hubName,
            appointmentId: String(apt._id),
            type: 'no_show',
          });
        }
      }
    }

    await logAuditEvent({
      adminId: adminUser.userId,
      adminEmail: adminUser.email,
      adminName: adminUser.email,
      action: 'update',
      resourceType: 'appointment',
      description: `Updated ${result.modifiedCount} appointment(s) to ${status || 'notes'}`,
      ipAddress: getClientIpAddress(request),
      userAgent: getUserAgent(request),
    });

    const updatedAppointments = await Appointment.find({ _id: { $in: current.map((apt) => apt._id) } });

    return NextResponse.json({
      message: `Updated ${result.modifiedCount} appointment(s)`,
      updatedAppointments
    });

  } catch (error: any) {
    logger.error('Update appointments error:', error);
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
    const adminUser = await verifyAdminToken(token);
    if (!isAdmin(adminUser) || !adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { appointmentIds } = body;

    if (!appointmentIds || !Array.isArray(appointmentIds)) {
      return NextResponse.json({ error: 'Appointment IDs array is required' }, { status: 400 });
    }

    const scope = await resolveRequestedHub(adminUser, null);
    if (scope.error) {
      return NextResponse.json({ error: scope.error }, { status: 403 });
    }

    const scopedFilter: Record<string, unknown> = { _id: { $in: appointmentIds } };
    if (Object.keys(scope.appointmentFilter).length) {
      scopedFilter.$and = [scope.appointmentFilter];
    }

    const appointments = await Appointment.find(scopedFilter);

    // Update appointment slot capacities
    for (const appointment of appointments) {
      const appointmentSlot = await AppointmentSlot.findOne({
        hubName: appointment.hubName,
        date: {
          $gte: new Date(appointment.appointmentDate.toDateString()),
          $lt: new Date(new Date(appointment.appointmentDate).setDate(appointment.appointmentDate.getDate() + 1))
        },
        time: appointment.appointmentTime
      });

      if (appointmentSlot) {
        appointmentSlot.bookedCount = Math.max(0, appointmentSlot.bookedCount - 1);
        await appointmentSlot.save();
      }
    }

    const result = await Appointment.deleteMany({ _id: { $in: appointments.map((apt) => apt._id) } });

    await logAuditEvent({
      adminId: adminUser.userId,
      adminEmail: adminUser.email,
      adminName: adminUser.email,
      action: 'delete',
      resourceType: 'appointment',
      description: `Deleted ${result.deletedCount} appointment(s)`,
      ipAddress: getClientIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({
      message: `Deleted ${result.deletedCount} appointment(s)`
    });

  } catch (error: any) {
    logger.error('Delete appointments error:', error);
    return NextResponse.json(
      { error: 'Failed to delete appointments', details: error.message },
      { status: 500 }
    );
  }
} 