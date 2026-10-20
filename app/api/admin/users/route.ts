import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminToken, isAdmin, isSuperAdmin, type AdminUser } from '@/lib/adminPermissions';
import {
  assertCanAssignRole,
  assertCanMutateUser,
  getActorHub,
  hubScopeFilter,
  resolveCreateRole,
} from '@/lib/adminUserAccess';
import {
  flagsFromRole,
  getRoleFromFlags,
  isValidRole,
  pickUserUpdateFields,
} from '@/lib/userRoles';
import { logAuditEvent, getClientIpAddress, getUserAgent } from '@/lib/auditLogger';

import '@/models/User';
import '@/models/Appointment';
import '@/models/Hub';

import mongoose from 'mongoose';
const User = mongoose.models.User;
const Appointment = mongoose.models.Appointment;
const Hub = mongoose.models.Hub;

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

function serializeUser(user: any) {
  const plain = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete plain.password;
  return {
    ...plain,
    role: getRoleFromFlags(plain),
  };
}

async function buildUserListFilter(
  adminUser: AdminUser,
  options: {
    search?: string;
    hubName?: string;
    educationLevel?: string;
    programInterest?: string;
    role?: string;
  }
) {
  const conditions: Record<string, unknown>[] = [];

  if (options.search) {
    conditions.push({
      $or: [
        { firstName: { $regex: options.search, $options: 'i' } },
        { lastName: { $regex: options.search, $options: 'i' } },
        { email: { $regex: options.search, $options: 'i' } },
        { phone: { $regex: options.search, $options: 'i' } },
      ],
    });
  }

  if (!isSuperAdmin(adminUser)) {
    const actorHub = await getActorHub(adminUser);
    if (!actorHub) {
      return { error: NextResponse.json({ error: 'Invalid hub assignment' }, { status: 403 }) };
    }
    conditions.push(hubScopeFilter(actorHub));
  } else if (options.hubName) {
    conditions.push({ 'closestHub.name': options.hubName });
  }

  if (options.educationLevel) {
    conditions.push({ educationLevel: options.educationLevel });
  }

  if (options.programInterest) {
    conditions.push({ programInterests: options.programInterest });
  }

  if (isValidRole(options.role)) {
    if (options.role === 'super-admin') {
      conditions.push({ isSuperAdmin: true });
    } else if (options.role === 'hub-admin') {
      conditions.push({ isAdmin: true, isSuperAdmin: { $ne: true } });
    } else {
      conditions.push({ isAdmin: { $ne: true }, isSuperAdmin: { $ne: true } });
    }
  }

  return { searchFilter: conditions.length ? { $and: conditions } : {} };
}

// GET - List users with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;
    const { adminUser } = auth;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const hubName = searchParams.get('hubName') || '';
    const educationLevel = searchParams.get('educationLevel') || '';
    const programInterest = searchParams.get('programInterest') || '';
    const role = searchParams.get('role') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const scoped = await buildUserListFilter(adminUser, {
      search,
      hubName,
      educationLevel,
      programInterest,
      role,
    });
    if ('error' in scoped) return scoped.error;
    const { searchFilter } = scoped;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [users, totalUsers, userStats, educationDistribution, programDistribution, hubDistribution] = await Promise.all([
      User.find(searchFilter)
        .select('-password')
        .populate('assignedHub', 'name location')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      User.countDocuments(searchFilter),
      User.aggregate([
        { $match: searchFilter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            avgAge: {
              $avg: {
                $divide: [
                  { $subtract: [new Date(), '$dateOfBirth'] },
                  365 * 24 * 60 * 60 * 1000,
                ],
              },
            },
          },
        },
      ]),
      User.aggregate([
        { $match: searchFilter },
        { $group: { _id: '$educationLevel', count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: searchFilter },
        { $unwind: '$programInterests' },
        { $group: { _id: '$programInterests', count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: searchFilter },
        { $group: { _id: '$closestHub.name', count: { $sum: 1 } } },
      ]),
    ]);

    return NextResponse.json({
      users: users.map(serializeUser),
      pagination: {
        page,
        limit,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit),
      },
      stats: userStats[0] || { total: 0, avgAge: 0 },
      educationDistribution,
      programDistribution,
      hubDistribution,
      viewer: {
        role: getRoleFromFlags(adminUser),
        isSuperAdmin: isSuperAdmin(adminUser),
        assignedHub: adminUser.assignedHub || null,
      },
    });
  } catch (error: any) {
    logger.error('Users API error:', error);
    return NextResponse.json(
      { error: 'Failed to get users', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a user
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;
    const { adminUser } = auth;

    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      preferredLanguage = 'English',
      role: requestedRole,
      assignedHub,
      closestHub,
      closestHubId,
    } = body;

    if (!email || !password || !firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: 'Email, password, first name, last name, and phone are required' },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const { role, error: roleError, flags } = resolveCreateRole(adminUser, requestedRole);
    if (roleError) {
      return NextResponse.json({ error: roleError }, { status: 403 });
    }

    const actorHub = await getActorHub(adminUser);
    let nextAssignedHub: mongoose.Types.ObjectId | undefined;
    let nextClosestHub = closestHub;

    if (closestHubId && !nextClosestHub) {
      const selectedHub = await Hub.findById(closestHubId).select('name location');
      if (!selectedHub) {
        return NextResponse.json({ error: 'Selected hub not found' }, { status: 400 });
      }
      nextClosestHub = {
        name: selectedHub.name,
        address: selectedHub.location,
      };
    }

    if (isSuperAdmin(adminUser)) {
      if (role === 'hub-admin') {
        if (!assignedHub) {
          return NextResponse.json(
            { error: 'Hub admins must be assigned to a hub' },
            { status: 400 }
          );
        }
        const hub = await Hub.findById(assignedHub);
        if (!hub) {
          return NextResponse.json({ error: 'Assigned hub not found' }, { status: 400 });
        }
        nextAssignedHub = hub._id;
        if (!nextClosestHub) {
          nextClosestHub = { name: hub.name, address: hub.location };
        }
      } else if (role === 'user') {
        if (!nextClosestHub) {
          return NextResponse.json(
            { error: 'Select a hub for this user' },
            { status: 400 }
          );
        }
      } else if (assignedHub) {
        const hub = await Hub.findById(assignedHub);
        if (hub) {
          nextAssignedHub = role === 'super-admin' ? undefined : hub._id;
          if (!nextClosestHub) {
            nextClosestHub = { name: hub.name, address: hub.location };
          }
        }
      }
    } else {
      if (!actorHub) {
        return NextResponse.json({ error: 'Invalid hub assignment' }, { status: 403 });
      }
      nextAssignedHub = role === 'hub-admin' ? actorHub._id : undefined;
      nextClosestHub = {
        name: actorHub.name,
        address: actorHub.location,
      };
    }

    const user = new User({
      email: String(email).toLowerCase().trim(),
      password,
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      phone: String(phone).trim(),
      preferredLanguage,
      closestHub: nextClosestHub,
      assignedHub: nextAssignedHub,
      isAdmin: flags.isAdmin,
      isSuperAdmin: flags.isSuperAdmin,
      profileCompleted: false,
      registrationSource: 'quick',
    });

    await user.save();

    await logAuditEvent({
      adminId: adminUser.userId,
      adminEmail: adminUser.email,
      adminName: adminUser.email,
      action: 'create',
      resourceType: 'user',
      resourceId: String(user._id),
      resourceName: `${user.firstName} ${user.lastName}`,
      description: `Created ${role} ${user.email}`,
      ipAddress: getClientIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        user: serializeUser(user),
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Create user API error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create user', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;
    const { adminUser } = auth;

    const body = await request.json();
    const { userId, role: requestedRole, assignedHub, closestHubId, ...rest } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const existing = await User.findById(userId);
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const mutateError = await assertCanMutateUser(adminUser, existing, 'update');
    if (mutateError) {
      return NextResponse.json({ error: mutateError }, { status: 403 });
    }

    const updateData = pickUserUpdateFields(rest);

    if (requestedRole !== undefined) {
      if (!isValidRole(requestedRole)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      const roleError = assertCanAssignRole(adminUser, requestedRole);
      if (roleError) {
        return NextResponse.json({ error: roleError }, { status: 403 });
      }
      Object.assign(updateData, flagsFromRole(requestedRole));

      if (requestedRole === 'hub-admin') {
        if (isSuperAdmin(adminUser)) {
          const hubId = assignedHub || existing.assignedHub;
          if (!hubId) {
            return NextResponse.json(
              { error: 'Hub admins must be assigned to a hub' },
              { status: 400 }
            );
          }
          const hub = await Hub.findById(hubId);
          if (!hub) {
            return NextResponse.json({ error: 'Assigned hub not found' }, { status: 400 });
          }
          updateData.assignedHub = hub._id;
        } else {
          const actorHub = await getActorHub(adminUser);
          if (!actorHub) {
            return NextResponse.json({ error: 'Invalid hub assignment' }, { status: 403 });
          }
          updateData.assignedHub = actorHub._id;
        }
      } else if (requestedRole === 'user' || requestedRole === 'super-admin') {
        updateData.assignedHub = null;
      }
    } else if (assignedHub !== undefined) {
      if (!isSuperAdmin(adminUser)) {
        return NextResponse.json(
          { error: 'Hub admins cannot reassign users to another hub' },
          { status: 403 }
        );
      }
      updateData.assignedHub = assignedHub || null;
    }

    if (closestHubId) {
      const hub = await Hub.findById(closestHubId);
      if (!hub) {
        return NextResponse.json({ error: 'Selected hub not found' }, { status: 400 });
      }
      if (!isSuperAdmin(adminUser)) {
        const actorHub = await getActorHub(adminUser);
        if (!actorHub || actorHub._id.toString() !== hub._id.toString()) {
          return NextResponse.json(
            { error: 'Hub admins cannot move users to another hub' },
            { status: 403 }
          );
        }
      }
      updateData.closestHub = { name: hub.name, address: hub.location };
      if ((requestedRole || getRoleFromFlags(existing)) === 'hub-admin' && isSuperAdmin(adminUser)) {
        updateData.assignedHub = hub._id;
      }
    }

    if (!isSuperAdmin(adminUser)) {
      const actorHub = await getActorHub(adminUser);
      if (updateData.closestHub && actorHub) {
        const nextName = (updateData.closestHub as { name?: string })?.name;
        if (nextName && nextName !== actorHub.name) {
          return NextResponse.json(
            { error: 'Hub admins cannot move users to another hub' },
            { status: 403 }
          );
        }
      }
      delete updateData.closestHub;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    )
      .select('-password')
      .populate('assignedHub', 'name location');

    await logAuditEvent({
      adminId: adminUser.userId,
      adminEmail: adminUser.email,
      adminName: adminUser.email,
      action: 'update',
      resourceType: 'user',
      resourceId: userId,
      resourceName: `${updatedUser.firstName} ${updatedUser.lastName}`,
      description: `Updated user ${updatedUser.email}`,
      ipAddress: getClientIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: serializeUser(updatedUser),
    });
  } catch (error: any) {
    logger.error('Update user API error:', error);

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to update user', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;
    const { adminUser } = auth;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (userId === adminUser.userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    const existing = await User.findById(userId);
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const mutateError = await assertCanMutateUser(adminUser, existing, 'delete');
    if (mutateError) {
      return NextResponse.json({ error: mutateError }, { status: 403 });
    }

    const appointmentCount = await Appointment.countDocuments({ userId });
    await Appointment.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    await logAuditEvent({
      adminId: adminUser.userId,
      adminEmail: adminUser.email,
      adminName: adminUser.email,
      action: 'delete',
      resourceType: 'user',
      resourceId: userId,
      resourceName: `${existing.firstName} ${existing.lastName}`,
      description: `Deleted user ${existing.email}`,
      ipAddress: getClientIpAddress(request),
      userAgent: getUserAgent(request),
      metadata: { deletedAppointments: appointmentCount },
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      deletedAppointments: appointmentCount,
    });
  } catch (error: any) {
    logger.error('Delete user API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user', details: error.message },
      { status: 500 }
    );
  }
}
