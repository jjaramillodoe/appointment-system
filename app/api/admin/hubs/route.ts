import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Hub from '../../../../models/Hub';
import '@/models/School';
import { verifyAdminToken, isAdmin, isSuperAdmin } from '@/lib/adminPermissions';
import { getActorHub } from '@/lib/adminUserAccess';
import { logAuditEvent, getClientIpAddress, getUserAgent } from '@/lib/auditLogger';

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

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;
    const { adminUser } = auth;

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const query: Record<string, unknown> = activeOnly ? { isActive: true } : {};

    if (!isSuperAdmin(adminUser)) {
      const actorHub = await getActorHub(adminUser);
      if (!actorHub) {
        return NextResponse.json({ error: 'No hub assigned to this admin account' }, { status: 403 });
      }
      query._id = actorHub._id;
    }

    const hubs = await Hub.find(query)
      .select('_id name location defaultSlots timezone isActive publicTransitDirections schoolId')
      .populate('schoolId', 'name slug code')
      .sort({ name: 1 })
      .lean();

    return NextResponse.json(hubs);
  } catch (error) {
    logger.error('Admin hubs API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;
    const { adminUser } = auth;

    if (!isSuperAdmin(adminUser)) {
      return NextResponse.json(
        { error: 'Only super admins can create hubs' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, location, defaultSlots, timezone = 'America/New_York', schoolId } = body;

    if (!name || !location) {
      return NextResponse.json(
        { error: 'Name and location are required' },
        { status: 400 }
      );
    }

    const hub = new Hub({
      name,
      location,
      defaultSlots: defaultSlots || ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'],
      timezone,
      isActive: true,
      schoolId: schoolId || undefined,
    });

    const savedHub = await hub.save();

    await logAuditEvent({
      adminId: adminUser.userId,
      adminEmail: adminUser.email,
      adminName: adminUser.email,
      action: 'create',
      resourceType: 'hub',
      resourceId: String(savedHub._id),
      resourceName: savedHub.name,
      description: `Created hub ${savedHub.name}`,
      ipAddress: getClientIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({
      success: true,
      hub: savedHub,
    });
  } catch (error: any) {
    logger.error('Create hub error:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Hub with this name already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
