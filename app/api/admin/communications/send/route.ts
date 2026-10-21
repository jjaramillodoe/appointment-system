import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminToken, isAdmin, isSuperAdmin as checkSuperAdmin } from '@/lib/adminPermissions';
import { getActorHub } from '@/lib/adminUserAccess';
import User from '@/models/User';
import Appointment from '@/models/Appointment';
import CommunicationTemplate from '@/models/CommunicationTemplate';
import SentCommunication from '@/models/SentCommunication';
import { sendBulkCommunicationEmail } from '@/lib/emailService';
import { logAuditEvent, getClientIpAddress, getUserAgent } from '@/lib/auditLogger';
import { AdminUser } from '@/lib/adminPermissions';

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

    if (!isAdmin(adminUser) || !adminUser) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const assignedHub = !checkSuperAdmin(adminUser) ? await getActorHub(adminUser) : null;
    if (!checkSuperAdmin(adminUser) && !assignedHub) {
      return NextResponse.json({ error: 'No hub assigned to this admin account' }, { status: 403 });
    }

    const body = await request.json();
    const { templateId, subject, body: messageBody, criteria: rawCriteria } = body;
    const criteria = {
      ...(rawCriteria || {}),
      ...(assignedHub ? { hubName: assignedHub.name } : {}),
    };

    if (!templateId || !subject || !messageBody) {
      return NextResponse.json(
        { error: 'Template ID, subject, and body are required' },
        { status: 400 }
      );
    }

    // Get template
    const template = await CommunicationTemplate.findById(templateId);
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Build query based on criteria
    const userQuery: any = { isAdmin: false };

    if (criteria) {
      if (criteria.hubName) {
        // Find users with appointments at this hub
        const appointmentsAtHub = await Appointment.find({ hubName: criteria.hubName }).distinct('userId');
        userQuery._id = { $in: appointmentsAtHub };
      }

      if (criteria.appointmentStatus) {
        const appointmentsWithStatus = await Appointment.find({ status: criteria.appointmentStatus }).distinct('userId');
        userQuery._id = { $in: appointmentsWithStatus };
      }

      if (criteria.preferredLanguage) {
        userQuery.preferredLanguage = criteria.preferredLanguage;
      }

      if (criteria.registrationSource) {
        userQuery.registrationSource = criteria.registrationSource;
      }

      if (criteria.profileCompleted !== undefined) {
        userQuery.profileCompleted = criteria.profileCompleted;
      }
    }

    // Get users matching criteria
    const users = await User.find(userQuery).select('_id email firstName');

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No users match the specified criteria',
        emailsSent: 0,
        emailsFailed: 0,
      });
    }

    let emailsSent = 0;
    let emailsFailed = 0;
    const sentRecords = [];

    // Send emails to all matching users
    for (const user of users) {
      try {
        const emailSent = await sendBulkCommunicationEmail({
          recipientEmail: user.email,
          recipientName: user.firstName,
          subject,
          body: messageBody,
        });

        if (emailSent) {
          emailsSent++;
          sentRecords.push({
            templateId,
            userId: user._id,
            subject,
            body: messageBody,
            status: 'sent',
            recipientEmail: user.email,
            recipientName: user.firstName,
          });
        } else {
          emailsFailed++;
          sentRecords.push({
            templateId,
            userId: user._id,
            subject,
            body: messageBody,
            status: 'failed',
            error: 'Email service error',
            recipientEmail: user.email,
            recipientName: user.firstName,
          });
        }
      } catch (error: any) {
        emailsFailed++;
        sentRecords.push({
          templateId,
          userId: user._id,
          subject,
          body: messageBody,
          status: 'failed',
          error: error.message,
          recipientEmail: user.email,
          recipientName: user.firstName,
        });
      }
    }

    // Save sent records
    if (sentRecords.length > 0) {
      await SentCommunication.insertMany(sentRecords);
    }

    // Log audit event
    const admin = await User.findById(adminUser.userId).select('firstName lastName email');
    await logAuditEvent({
      adminId: adminUser.userId,
      adminEmail: admin?.email || '',
      adminName: admin ? `${admin.firstName} ${admin.lastName}` : '',
      action: 'send',
      resourceType: 'communication',
      resourceName: subject,
      description: `Sent bulk communication to ${users.length} users`,
      status: emailsSent > 0 ? 'success' : 'failed',
      metadata: {
        emailsSent,
        emailsFailed,
        totalRecipients: users.length,
        criteria,
      },
      ipAddress: getClientIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({
      success: true,
      message: `Bulk communication sent: ${emailsSent} successful, ${emailsFailed} failed`,
      emailsSent,
      emailsFailed,
      totalRecipients: users.length,
    });
  } catch (error: any) {
    logger.error('Send bulk communication error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send communications' },
      { status: 500 }
    );
  }
}
