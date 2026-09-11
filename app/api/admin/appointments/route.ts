import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminToken, isAdmin, getHubFilter } from '@/lib/adminPermissions';
import Appointment from '@/models/Appointment';
import AppointmentSlot from '@/models/AppointmentSlot';
import Hub from '@/models/Hub';

// GET - Get all appointments with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const adminUser = verifyAdminToken(token);
    if (!isAdmin(adminUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Apply hub filter for regular admins (super admins see everything)
    const hubFilter = getHubFilter(adminUser);
    if (hubFilter === null) {
      return NextResponse.json({ error: 'No hub access' }, { status: 403 });
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

    // Build search filter - start with hub filter
    const searchFilter: any = { ...hubFilter };

    if (search) {
      searchFilter.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { hubName: { $regex: search, $options: 'i' } }
      ];
    }

    // Build hub filter
    if (hubName) {
      searchFilter.hubName = hubName;
    }

    // Build status filter
    if (status) {
      searchFilter.status = status;
    }

    // Build date filter - using appointmentDate
    if (startDate || endDate) {
      searchFilter.appointmentDate = {};
      if (startDate) {
        searchFilter.appointmentDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        searchFilter.appointmentDate.$lte = end;
      }
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    if (sortBy === 'appointmentDate') {
      sort['appointmentDate'] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    // Get appointments with pagination
    const appointments = await Appointment.find(searchFilter)
      .select('_id userId userName userEmail appointmentDate appointmentTime hubName status createdAt')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

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
    const adminUser = verifyAdminToken(token);
    if (!isAdmin(adminUser)) {
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
    const result = await Appointment.updateMany(
      { _id: { $in: appointmentIds } },
      { $set: updateData }
    );

    // Get updated appointments
    const updatedAppointments = await Appointment.find({ _id: { $in: appointmentIds } });

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
    const adminUser = verifyAdminToken(token);
    if (!isAdmin(adminUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { appointmentIds } = body;

    if (!appointmentIds || !Array.isArray(appointmentIds)) {
      return NextResponse.json({ error: 'Appointment IDs array is required' }, { status: 400 });
    }

    // Get appointments before deletion
    const appointments = await Appointment.find({ _id: { $in: appointmentIds } });

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

    // Delete appointments
    const result = await Appointment.deleteMany({ _id: { $in: appointmentIds } });

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