import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminToken, isAdmin } from '@/lib/adminPermissions';
import { assertCanViewUser } from '@/lib/adminUserAccess';
import { getRoleFromFlags } from '@/lib/userRoles';

import '@/models/User';
import '@/models/Appointment';
import '@/models/Hub';

import mongoose from 'mongoose';
const User = mongoose.models.User;
const Appointment = mongoose.models.Appointment;

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Authorization token required' }, { status: 401 }) };
  }

  const adminUser = await verifyAdminToken(authHeader.substring(7));
  if (!isAdmin(adminUser) || !adminUser) {
    return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) };
  }

  return { adminUser };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;
    const { adminUser } = auth;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }

    const user = await User.findById(id)
      .select('-password')
      .populate('assignedHub', 'name location');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const viewError = await assertCanViewUser(adminUser, user);
    if (viewError) {
      return NextResponse.json({ error: viewError }, { status: 403 });
    }

    const appointments = await Appointment.find({ userId: id }).sort({ createdAt: -1 });
    const appointmentStats = await Appointment.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const plain = user.toObject();
    return NextResponse.json({
      user: {
        ...plain,
        role: getRoleFromFlags(plain),
      },
      appointments,
      appointmentStats,
    });
  } catch (error: any) {
    logger.error('User details API error:', error);
    return NextResponse.json(
      { error: 'Failed to get user details', details: error.message },
      { status: 500 }
    );
  }
}
