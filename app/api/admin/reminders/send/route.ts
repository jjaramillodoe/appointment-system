import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminToken, isAdmin } from '@/lib/adminPermissions';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import ReminderSettings from '@/models/ReminderSettings';
import SentReminder from '@/models/SentReminder';
import { sendReminderEmail } from '@/lib/emailService';

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
    const adminUser = await verifyAdminToken(token);

    if (!isAdmin(adminUser)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get reminder settings
    const settings = await ReminderSettings.findOne();
    if (!settings || !settings.isEnabled) {
      return NextResponse.json({
        success: false,
        message: 'Reminders are disabled',
        remindersSent: 0,
      });
    }

    // Get enabled reminders
    const enabledReminders = settings.reminders.filter((r: any) => r.enabled);
    if (enabledReminders.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No reminders configured',
        remindersSent: 0,
      });
    }

    let remindersSent = 0;
    let remindersFailed = 0;

    // For each enabled reminder configuration
    for (const reminderConfig of enabledReminders) {
      // Calculate time range for this reminder
      const now = new Date();
      const windowStart = new Date(now.getTime() + (reminderConfig.hoursBeforeAppointment - 1) * 60 * 60 * 1000);
      const windowEnd = new Date(now.getTime() + reminderConfig.hoursBeforeAppointment * 60 * 60 * 1000);

      // Find appointments in this time window
      const appointmentsNeedingReminders = await Appointment.find({
        appointmentDate: {
          $gte: windowStart,
          $lte: windowEnd,
        },
        status: { $in: ['confirmed', 'pending'] },
      }).populate('userId');

      for (const appointment of appointmentsNeedingReminders) {
        try {
          // Check if reminder already sent
          const existingReminder = await SentReminder.findOne({
            appointmentId: appointment._id,
            hoursBeforeAppointment: reminderConfig.hoursBeforeAppointment,
            channel: 'email',
          });

          if (existingReminder) {
            continue; // Skip if already sent
          }

          // Get user details
          const user = appointment.userId as any;
          if (!user || !user.email) {
            continue;
          }

          // Send email
          const emailSent = await sendReminderEmail({
            recipientEmail: user.email,
            recipientName: user.firstName,
            appointmentTime: appointment.appointmentTime || 'TBD',
            appointmentDate: appointment.appointmentDate.toLocaleDateString(),
            hubName: appointment.hubName || 'Learning Center',
            hoursUntilAppointment: reminderConfig.hoursBeforeAppointment,
          });

          // Track sent reminder
          await SentReminder.create({
            appointmentId: appointment._id,
            userId: user._id,
            hoursBeforeAppointment: reminderConfig.hoursBeforeAppointment,
            channel: 'email',
            status: emailSent ? 'sent' : 'failed',
            error: emailSent ? undefined : 'Email service error',
          });

          if (emailSent) {
            remindersSent++;
          } else {
            remindersFailed++;
          }
        } catch (error: any) {
          console.error('Error processing reminder:', error);
          remindersFailed++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reminders processed: ${remindersSent} sent, ${remindersFailed} failed`,
      remindersSent,
      remindersFailed,
    });
  } catch (error: any) {
    console.error('Send reminders error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send reminders' },
      { status: 500 }
    );
  }
}
