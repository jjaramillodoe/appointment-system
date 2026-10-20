import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminToken, isAdmin, isSuperAdmin, canAccessHub } from '@/lib/adminPermissions';
import Hub from '@/models/Hub';
import { logAuditEvent, getClientIpAddress, getUserAgent } from '@/lib/auditLogger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hubId: string }> }
) {
  const { hubId } = await params;
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const adminUser = await verifyAdminToken(authHeader.substring(7));
    if (!isAdmin(adminUser) || !adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (!canAccessHub(adminUser, hubId)) {
      return NextResponse.json({ error: 'You can only view your assigned hub' }, { status: 403 });
    }

    const hub = await Hub.findById(hubId);

    if (!hub) {
      return NextResponse.json(
        { error: 'Hub not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ hub });
  } catch (error: any) {
    logger.error('Get hub error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ hubId: string }> }
) {
  const { hubId } = await params;
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
    const adminUser = await verifyAdminToken(token);

    if (!isAdmin(adminUser) || !adminUser) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    if (!canAccessHub(adminUser, hubId)) {
      return NextResponse.json({ error: 'You can only update your assigned hub' }, { status: 403 });
    }

    const body = await request.json();
    const { name, location, timezone, defaultSlots, publicTransitDirections, isActive, schoolId } = body;

    // Build update object with only provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (location !== undefined) updateData.location = location;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (defaultSlots !== undefined) updateData.defaultSlots = defaultSlots;
    if (publicTransitDirections !== undefined) updateData.publicTransitDirections = publicTransitDirections;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (schoolId !== undefined) updateData.schoolId = schoolId || null;

    const updatedHub = await Hub.findByIdAndUpdate(
      hubId,
      updateData,
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedHub) {
      return NextResponse.json(
        { error: 'Hub not found' },
        { status: 404 }
      );
    }

    await logAuditEvent({
      adminId: adminUser.userId,
      adminEmail: adminUser.email,
      adminName: adminUser.email,
      action: 'update',
      resourceType: 'hub',
      resourceId: hubId,
      resourceName: updatedHub.name,
      description: `Updated hub ${updatedHub.name}`,
      ipAddress: getClientIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({
      success: true,
      message: 'Hub updated successfully',
      hub: updatedHub
    });
  } catch (error: any) {
    logger.error('Update hub error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ hubId: string }> }
) {
  const { hubId } = await params;
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
    const adminUser = await verifyAdminToken(token);

    if (!isAdmin(adminUser) || !adminUser) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    if (!isSuperAdmin(adminUser)) {
      return NextResponse.json(
        { error: 'Only super admins can delete hubs' },
        { status: 403 }
      );
    }

    const hub = await Hub.findByIdAndDelete(hubId);

    if (!hub) {
      return NextResponse.json(
        { error: 'Hub not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Hub deleted successfully'
    });
  } catch (error: any) {
    logger.error('Delete hub error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
