import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, isSuperAdmin, verifyAdminToken } from '@/lib/adminPermissions';
import { getSystemSettings, updateSystemSettings, DEFAULT_SYSTEM_SETTINGS } from '@/lib/systemSettings';
import { logAuditEvent, getClientIpAddress, getUserAgent } from '@/lib/auditLogger';

function toClientSettings(stored: typeof DEFAULT_SYSTEM_SETTINGS) {
  return {
    general: {
      systemName: 'Adult Education Appointment System',
      timeZone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
    },
    appointments: {
      defaultCapacity: stored.defaultCapacity,
      reminderHours: stored.reminderHours,
      autoConfirm: !stored.requireProfileBeforeConfirm,
      maxAppointmentsPerUser: stored.maxActiveAppointments,
      bookingWindowDays: stored.bookingWindowDays,
      requireProfileBeforeConfirm: stored.requireProfileBeforeConfirm,
      programQuotasEnabled: stored.programQuotasEnabled,
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      lowCapacityAlerts: true,
    },
    users: {
      allowRegistration: true,
      requireEmailVerification: false,
      sessionTimeout: 30,
    },
    security: {
      passwordMinLength: 8,
      requireStrongPasswords: true,
      twoFactorAuth: false,
    },
    system: {
      database: 'MongoDB',
      framework: 'Next.js',
      environment: process.env.NODE_ENV || 'development',
      lastBackup: new Date().toISOString(),
    },
  };
}

export async function GET(request: NextRequest) {
  const adminUser = await verifyAdminToken((request.headers.get('authorization') || '').replace('Bearer ', ''));
  if (!isAdmin(adminUser)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const stored = await getSystemSettings();
  return NextResponse.json(toClientSettings(stored));
}

export async function POST(request: NextRequest) {
  const adminUser = await verifyAdminToken((request.headers.get('authorization') || '').replace('Bearer ', ''));
  if (!isSuperAdmin(adminUser) || !adminUser) {
    return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const incoming = body.settings || body;
  const appointments = incoming.appointments || {};

  const updated = await updateSystemSettings({
    bookingWindowDays: Number(appointments.bookingWindowDays ?? DEFAULT_SYSTEM_SETTINGS.bookingWindowDays),
    reminderHours: Number(appointments.reminderHours ?? DEFAULT_SYSTEM_SETTINGS.reminderHours),
    maxActiveAppointments: Number(appointments.maxAppointmentsPerUser ?? appointments.maxActiveAppointments ?? DEFAULT_SYSTEM_SETTINGS.maxActiveAppointments),
    requireProfileBeforeConfirm: appointments.requireProfileBeforeConfirm !== undefined
      ? Boolean(appointments.requireProfileBeforeConfirm)
      : appointments.autoConfirm !== undefined
        ? !appointments.autoConfirm
        : DEFAULT_SYSTEM_SETTINGS.requireProfileBeforeConfirm,
    programQuotasEnabled: Boolean(appointments.programQuotasEnabled),
    defaultCapacity: Number(appointments.defaultCapacity ?? DEFAULT_SYSTEM_SETTINGS.defaultCapacity),
  });

  await logAuditEvent({
    adminId: adminUser.userId,
    adminEmail: adminUser.email,
    adminName: adminUser.email,
    action: 'update',
    resourceType: 'settings',
    description: 'Updated persisted system settings',
    ipAddress: getClientIpAddress(request),
    userAgent: getUserAgent(request),
    metadata: {
      bookingWindowDays: updated.bookingWindowDays,
      reminderHours: updated.reminderHours,
      maxActiveAppointments: updated.maxActiveAppointments,
    },
  });

  return NextResponse.json({
    message: 'Settings updated successfully',
    settings: toClientSettings(updated),
  });
}
