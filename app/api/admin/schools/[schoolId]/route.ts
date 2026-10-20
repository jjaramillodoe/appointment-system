import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import School from '@/models/School';
import Hub from '@/models/Hub';
import ClassOffering from '@/models/ClassOffering';
import StudentRegistration from '@/models/StudentRegistration';
import { isAdmin, isSuperAdmin, verifyAdminToken } from '@/lib/adminPermissions';
import { logAuditEvent, getClientIpAddress, getUserAgent } from '@/lib/auditLogger';
import { slugify, upsertSchoolSchema } from '@/lib/enrollmentSchema';

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
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const auth = await requireSuperAdmin(request);
  if ('error' in auth) return auth.error;
  const { schoolId } = await params;

  try {
    const parsed = upsertSchoolSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid school payload' }, { status: 400 });
    }

    await dbConnect();
    const school = await School.findByIdAndUpdate(
      schoolId,
      {
        ...parsed.data,
        slug: parsed.data.slug || slugify(parsed.data.name),
        code: parsed.data.code ? parsed.data.code.toUpperCase() : undefined,
      },
      { returnDocument: 'after', runValidators: true },
    );

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    await logAuditEvent({
      adminId: auth.adminUser.userId,
      adminEmail: auth.adminUser.email,
      adminName: auth.adminUser.email,
      action: 'update',
      resourceType: 'school',
      resourceId: schoolId,
      resourceName: school.name,
      description: `Updated school ${school.name}`,
      ipAddress: getClientIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ school });
  } catch (error: any) {
    logger.error('Failed to update school:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A school with that name, slug, or code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update school' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const auth = await requireSuperAdmin(request);
  if ('error' in auth) return auth.error;
  const { schoolId } = await params;

  try {
    await dbConnect();
    const [hubs, registrations] = await Promise.all([
      Hub.countDocuments({ schoolId }),
      StudentRegistration.countDocuments({ selectedSchool: schoolId }),
    ]);
    if (hubs > 0 || registrations > 0) {
      return NextResponse.json({
        error: 'Reassign or remove linked hubs and registrations before deleting this school.',
      }, { status: 409 });
    }

    const school = await School.findByIdAndDelete(schoolId);
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    await ClassOffering.updateMany({ schoolId }, { $unset: { schoolId: 1 } });
    await logAuditEvent({
      adminId: auth.adminUser.userId,
      adminEmail: auth.adminUser.email,
      adminName: auth.adminUser.email,
      action: 'delete',
      resourceType: 'school',
      resourceId: schoolId,
      resourceName: school.name,
      description: `Deleted school ${school.name}`,
      ipAddress: getClientIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete school:', error);
    return NextResponse.json({ error: 'Failed to delete school' }, { status: 500 });
  }
}
