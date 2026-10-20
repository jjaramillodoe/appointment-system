import SystemSettings from '@/models/SystemSettings';
import dbConnect from '@/lib/mongodb';

export const DEFAULT_SYSTEM_SETTINGS = {
  bookingWindowDays: 7,
  reminderHours: 24,
  maxActiveAppointments: 1,
  requireProfileBeforeConfirm: true,
  programQuotasEnabled: false,
  defaultCapacity: 20,
};

export async function getSystemSettings() {
  await dbConnect();
  const existing = await SystemSettings.findOne();
  if (existing) return existing;
  return SystemSettings.create(DEFAULT_SYSTEM_SETTINGS);
}

export async function updateSystemSettings(patch: Partial<typeof DEFAULT_SYSTEM_SETTINGS>) {
  const current = await getSystemSettings();
  Object.assign(current, patch);
  await current.save();
  return current;
}
