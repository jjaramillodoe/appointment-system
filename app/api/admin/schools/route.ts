import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import School from '@/models/School';
import { isAdmin, isSuperAdmin, verifyAdminToken } from '@/lib/adminPermissions';
import { logAuditEvent, getClientIpAddress, getUserAgent } from '@/lib/auditLogger';
import { slugify, upsertSchoolSchema } from '@/lib/enrollmentSchema';

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const adminUser = await verifyAdminToken(token);
  if (!isAdmin(adminUser) || !adminUser) {
    return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) };
  }
  return { adminUser };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('error' in auth) return auth.error;

  try {
    await dbConnect();
    const schools = await School.find({}).sort({ name: 1 }).lean();
    return NextResponse.json({ schools });
  } catch (error) {
    logger.error('Failed to list schools:', error);
    return NextResponse.json({ error: 'Failed to list schools' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('error' in auth) return auth.error;
  if (!isSuperAdmin(auth.adminUser)) {
    return NextResponse.json({ error: 'Only super admins can create schools' }, { status: 403 });
  }

  try {
    const parsed = upsertSchoolSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid school payload' }, { status: 400 });
    }

    await dbConnect();
    const slug = parsed.data.slug || slugify(parsed.data.name);
    const code = (parsed.data.code || slug.replace(/-/g, '').slice(0, 8)).toUpperCase();
    const school = await School.create({
      ...parsed.data,
      slug,
      code,
      status: parsed.data.status || 'active',
    });

    await logAuditEvent({
      adminId: auth.adminUser.userId,
      adminEmail: auth.adminUser.email,
      adminName: auth.adminUser.email,
      action: 'create',
      resourceType: 'school',
      resourceId: String(school._id),
      resourceName: school.name,
      description: `Created school ${school.name}`,
      ipAddress: getClientIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ school }, { status: 201 });
  } catch (error: any) {
    logger.error('Failed to create school:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A school with that name, slug, or code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create school' }, { status: 500 });
  }
}
