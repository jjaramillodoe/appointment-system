import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminToken, isAdmin, isSuperAdmin as checkSuperAdmin } from '@/lib/adminPermissions';
import CommunicationTemplate from '@/models/CommunicationTemplate';
import User from '@/models/User';
import { logAuditEvent, getClientIpAddress, getUserAgent } from '@/lib/auditLogger';
import { AdminUser } from '@/lib/adminPermissions';

export async function GET(request: NextRequest) {
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
    const adminUser = await verifyAdminToken(token) as AdminUser;

    if (!isAdmin(adminUser)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    let templates = await CommunicationTemplate.find({ isActive: true })
      .select('_id name subject description isActive createdAt body')
      .sort({ createdAt: -1 });

    if (templates.length === 0) {
      await CommunicationTemplate.insertMany([
        {
          name: 'Incomplete profile',
          subject: 'Please complete your Adult Education profile',
          body: 'Hi {{firstName}}, your intake appointment is reserved. Complete your profile in the student dashboard so we can confirm it.',
          description: 'Hub reminder for students still in pending_profile',
          isActive: true,
          createdBy: adminUser.userId,
        },
        {
          name: 'Tomorrow reminder',
          subject: 'Your appointment is tomorrow',
          body: 'Hi {{firstName}}, this is a reminder about your appointment tomorrow. Arrive 5-10 minutes early and bring a photo ID.',
          description: 'Day-before reminder for a hub',
          isActive: true,
          createdBy: adminUser.userId,
        },
      ]);
      templates = await CommunicationTemplate.find({ isActive: true })
        .select('_id name subject description isActive createdAt body')
        .sort({ createdAt: -1 });
    }

    return NextResponse.json({ templates });
  } catch (error: any) {
    logger.error('Get templates error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const adminUser = await verifyAdminToken(token) as AdminUser;

    if (!checkSuperAdmin(adminUser)) {
      return NextResponse.json(
        { error: 'Super admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, subject, body: templateBody, description } = body;

    if (!name || !subject || !templateBody) {
      return NextResponse.json(
        { error: 'Name, subject, and body are required' },
        { status: 400 }
      );
    }

    const template = await CommunicationTemplate.create({
      name,
      subject,
      body: templateBody,
      description,
      isActive: true,
      createdBy: adminUser.userId,
    });

    // Log audit event
    const admin = await User.findById(adminUser.userId).select('firstName lastName email');
    await logAuditEvent({
      adminId: adminUser.userId,
      adminEmail: admin?.email || '',
      adminName: admin ? `${admin.firstName} ${admin.lastName}` : '',
      action: 'create',
      resourceType: 'template',
      resourceId: template._id.toString(),
      resourceName: name,
      description: `Created communication template: ${name}`,
      ipAddress: getClientIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({
      success: true,
      template,
      message: 'Template created successfully',
    });
  } catch (error: any) {
    logger.error('Create template error:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Template name already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: 500 }
    );
  }
}
