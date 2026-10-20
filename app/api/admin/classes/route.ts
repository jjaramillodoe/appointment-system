import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import ClassOffering from '@/models/ClassOffering';
import '@/models/School';
import '@/models/Hub';
import { isAdmin, isSuperAdmin, verifyAdminToken } from '@/lib/adminPermissions';
import { logAuditEvent, getClientIpAddress, getUserAgent } from '@/lib/auditLogger';
import { upsertClassSchema } from '@/lib/enrollmentSchema';

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const adminUser = await verifyAdminToken(token);
  if (!isAdmin(adminUser) || !adminUser) {
    return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) };
  }
  return { adminUser };
}

function classPayload(data: ReturnType<typeof upsertClassSchema.parse>) {
  return {
    name: data.name,
    code: data.code || undefined,
    description: data.description || undefined,
    schoolId: data.schoolId || undefined,
    hubId: data.hubId || undefined,
    modality: data.modality || 'in-person',
    schedule: data.schedule || undefined,
    status: data.status || 'active',
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('error' in auth) return auth.error;

  try {
    await dbConnect();
    const classes = await ClassOffering.find({})
      .populate('schoolId', 'name slug')
      .populate('hubId', 'name location')
      .sort({ name: 1 })
      .lean();
    return NextResponse.json({ classes });
  } catch (error) {
    logger.error('Failed to list classes:', error);
    return NextResponse.json({ error: 'Failed to list classes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('error' in auth) return auth.error;
  if (!isSuperAdmin(auth.adminUser)) {
    return NextResponse.json({ error: 'Only super admins can create classes' }, { status: 403 });
  }

  try {
    const parsed = upsertClassSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid class payload' }, { status: 400 });
    }

    await dbConnect();
    const created = await ClassOffering.create(classPayload(parsed.data));

    await logAuditEvent({
      adminId: auth.adminUser.userId,
      adminEmail: auth.adminUser.email,
      adminName: auth.adminUser.email,
      action: 'create',
      resourceType: 'class',
      resourceId: String(created._id),
      resourceName: created.name,
      description: `Created class ${created.name}`,
      ipAddress: getClientIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ class: created }, { status: 201 });
  } catch (error: any) {
    logger.error('Failed to create class:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A class with that code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
  }
}
