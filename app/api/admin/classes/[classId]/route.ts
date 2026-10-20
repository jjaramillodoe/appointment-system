import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import ClassOffering from '@/models/ClassOffering';
import StudentRegistration from '@/models/StudentRegistration';
import { isAdmin, isSuperAdmin, verifyAdminToken } from '@/lib/adminPermissions';
import { logAuditEvent, getClientIpAddress, getUserAgent } from '@/lib/auditLogger';
import { upsertClassSchema } from '@/lib/enrollmentSchema';

async function requireSuperAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const adminUser = await verifyAdminToken(token);
  if (!isAdmin(adminUser) || !isSuperAdmin(adminUser) || !adminUser) {
    return { error: NextResponse.json({ error: 'Super admin access required' }, { status: 403 }) };
  }
  return { adminUser };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  const auth = await requireSuperAdmin(request);
  if ('error' in auth) return auth.error;
  const { classId } = await params;

  try {
    const parsed = upsertClassSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid class payload' }, { status: 400 });
    }

    await dbConnect();
    const updated = await ClassOffering.findByIdAndUpdate(
      classId,
      {
        name: parsed.data.name,
        code: parsed.data.code || undefined,
        description: parsed.data.description || undefined,
        schoolId: parsed.data.schoolId || null,
        hubId: parsed.data.hubId || null,
        modality: parsed.data.modality || 'in-person',
        schedule: parsed.data.schedule || undefined,
        status: parsed.data.status || 'active',
      },
      { returnDocument: 'after', runValidators: true },
    );

    if (!updated) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    await logAuditEvent({
      adminId: auth.adminUser.userId,
      adminEmail: auth.adminUser.email,
      adminName: auth.adminUser.email,
      action: 'update',
      resourceType: 'class',
      resourceId: classId,
      resourceName: updated.name,
      description: `Updated class ${updated.name}`,
      ipAddress: getClientIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ class: updated });
  } catch (error: any) {
    logger.error('Failed to update class:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A class with that code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update class' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  const auth = await requireSuperAdmin(request);
  if ('error' in auth) return auth.error;
  const { classId } = await params;

  try {
    await dbConnect();
    const inUse = await StudentRegistration.countDocuments({ interestedClasses: classId });
    if (inUse > 0) {
      return NextResponse.json({
        error: 'This class is used on student registrations and cannot be deleted.',
      }, { status: 409 });
    }

    const removed = await ClassOffering.findByIdAndDelete(classId);
    if (!removed) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    await logAuditEvent({
      adminId: auth.adminUser.userId,
      adminEmail: auth.adminUser.email,
      adminName: auth.adminUser.email,
      action: 'delete',
      resourceType: 'class',
      resourceId: classId,
      resourceName: removed.name,
      description: `Deleted class ${removed.name}`,
      ipAddress: getClientIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete class:', error);
    return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 });
  }
}
