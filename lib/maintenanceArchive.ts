import mongoose from 'mongoose';
import Appointment from '@/models/Appointment';
import AppointmentOptimized from '@/models/AppointmentOptimized';
import AppointmentSlot from '@/models/AppointmentSlot';
import User from '@/models/User';
import Notification from '@/models/Notification';
import Waitlist from '@/models/Waitlist';
import PasswordResetToken from '@/models/PasswordResetToken';
import SentCommunication from '@/models/SentCommunication';
import SentReminder from '@/models/SentReminder';
import Availability from '@/models/Availability';
import ArchivedAppointment from '@/models/ArchivedAppointment';
import ArchivedUser from '@/models/ArchivedUser';
import ArchivedAppointmentSlot from '@/models/ArchivedAppointmentSlot';

export const ARCHIVE_THRESHOLDS = ['6_months', '1_year', '2_years', '3_years'] as const;
export type ArchiveThreshold = (typeof ARCHIVE_THRESHOLDS)[number];

export function parseArchiveThreshold(value: unknown): ArchiveThreshold | null {
  return ARCHIVE_THRESHOLDS.includes(value as ArchiveThreshold)
    ? value as ArchiveThreshold
    : null;
}

export function cutoffForThreshold(olderThan: ArchiveThreshold): Date {
  const months = {
    '6_months': 6,
    '1_year': 12,
    '2_years': 24,
    '3_years': 36,
  }[olderThan];

  const cutoff = new Date();
  cutoff.setUTCMonth(cutoff.getUTCMonth() - months);
  cutoff.setUTCHours(0, 0, 0, 0);
  return cutoff;
}

export function appointmentFilter(cutoff: Date) {
  return { appointmentDate: { $lt: cutoff } };
}

export function slotFilter(cutoff: Date) {
  return { date: { $lt: cutoff } };
}

export function studentFilter() {
  return {
    isSuperAdmin: { $ne: true },
    isAdmin: { $ne: true },
  };
}

export async function eligibleStudentIds(cutoff: Date) {
  const students = await User.find({
    ...studentFilter(),
    createdAt: { $lt: cutoff },
  }).select('_id').lean();

  const ids = students.map((user) => user._id);
  if (ids.length === 0) return [];

  const stillActive = await Appointment.distinct('userId', {
    userId: { $in: ids },
    appointmentDate: { $gte: cutoff },
  });
  const activeSet = new Set(stillActive.map((id) => String(id)));
  return ids.filter((id) => !activeSet.has(String(id)));
}

export async function previewArchive(olderThan: ArchiveThreshold) {
  const cutoff = cutoffForThreshold(olderThan);
  const userIds = await eligibleStudentIds(cutoff);
  const [appointments, slots, users] = await Promise.all([
    Appointment.countDocuments(appointmentFilter(cutoff)),
    AppointmentSlot.countDocuments(slotFilter(cutoff)),
    User.countDocuments({ _id: { $in: userIds } }),
  ]);

  return {
    olderThan,
    cutoffDate: cutoff.toISOString(),
    appointments,
    slots,
    users,
    purgeEligible: olderThan === '3_years',
  };
}

export async function loadArchiveExport(olderThan: ArchiveThreshold) {
  const cutoff = cutoffForThreshold(olderThan);
  const userIds = await eligibleStudentIds(cutoff);
  const [appointments, slots, users] = await Promise.all([
    Appointment.find(appointmentFilter(cutoff)).lean(),
    AppointmentSlot.find(slotFilter(cutoff)).lean(),
    User.find({ _id: { $in: userIds } }).select('-password').lean(),
  ]);

  return { cutoff, appointments, slots, users };
}

function archiveDocs(
  records: Array<Record<string, any>>,
  archivedBy: string,
  olderThan: ArchiveThreshold,
) {
  return records.map((record) => ({
    originalId: record._id,
    archivedAt: new Date(),
    archivedBy,
    olderThan,
    payload: record,
  }));
}

async function insertArchives(model: mongoose.Model<any>, docs: unknown[]) {
  if (docs.length === 0) return 0;
  try {
    const result = await model.insertMany(docs, { ordered: false });
    return result.length;
  } catch (error: any) {
    if (error?.code === 11000 || error?.writeErrors) {
      return docs.length - (error.writeErrors?.length || 0);
    }
    throw error;
  }
}

export async function executeArchive(options: {
  olderThan: ArchiveThreshold;
  purge: boolean;
  archivedBy: string;
}) {
  const { olderThan, purge, archivedBy } = options;
  if (purge && olderThan !== '3_years') {
    throw new Error('Permanent purge is only allowed for records older than 3 years.');
  }

  const cutoff = cutoffForThreshold(olderThan);
  const userIds = await eligibleStudentIds(cutoff);
  const [appointments, slots, users] = await Promise.all([
    Appointment.find(appointmentFilter(cutoff)).lean(),
    AppointmentSlot.find(slotFilter(cutoff)).lean(),
    User.find({ _id: { $in: userIds } }).select('-password').lean(),
  ]);

  let archivedAppointments = 0;
  let archivedSlots = 0;
  let archivedUsers = 0;

  if (!purge) {
    archivedAppointments = await insertArchives(
      ArchivedAppointment,
      archiveDocs(appointments, archivedBy, olderThan),
    );
    archivedSlots = await insertArchives(
      ArchivedAppointmentSlot,
      archiveDocs(slots, archivedBy, olderThan),
    );
    archivedUsers = await insertArchives(
      ArchivedUser,
      archiveDocs(users, archivedBy, olderThan),
    );
  }

  const appointmentIds = appointments.map((item) => item._id);
  const slotIds = slots.map((item) => item._id);

  const [
    deletedAppointments,
    deletedOptimized,
    deletedSlots,
    deletedUsers,
    deletedNotifications,
    deletedWaitlist,
    deletedTokens,
  ] = await Promise.all([
    appointmentIds.length ? Appointment.deleteMany({ _id: { $in: appointmentIds } }) : { deletedCount: 0 },
    AppointmentOptimized.deleteMany({
      date: { $lt: cutoff.toISOString().slice(0, 10) },
    }),
    slotIds.length ? AppointmentSlot.deleteMany({ _id: { $in: slotIds } }) : { deletedCount: 0 },
    userIds.length ? User.deleteMany({ _id: { $in: userIds } }) : { deletedCount: 0 },
    userIds.length
      ? Notification.deleteMany({
          $or: [
            { userId: { $in: userIds } },
            { appointmentId: { $in: appointmentIds } },
          ],
        } as any)
      : { deletedCount: 0 },
    userIds.length ? Waitlist.deleteMany({ userId: { $in: userIds } }) : { deletedCount: 0 },
    userIds.length ? PasswordResetToken.deleteMany({ userId: { $in: userIds } }) : { deletedCount: 0 },
  ]);

  return {
    olderThan,
    cutoffDate: cutoff.toISOString(),
    purged: purge,
    archived: {
      appointments: archivedAppointments,
      slots: archivedSlots,
      users: archivedUsers,
    },
    deleted: {
      appointments: deletedAppointments.deletedCount || 0,
      appointmentOptimized: deletedOptimized.deletedCount || 0,
      slots: deletedSlots.deletedCount || 0,
      users: deletedUsers.deletedCount || 0,
      notifications: deletedNotifications.deletedCount || 0,
      waitlist: deletedWaitlist.deletedCount || 0,
      passwordResetTokens: deletedTokens.deletedCount || 0,
    },
  };
}

export async function clearOperationalData() {
  const userFilter = { isSuperAdmin: { $ne: true } };
  const removableUsers = await User.find(userFilter).select('_id').lean();
  const userIds = removableUsers.map((user) => user._id);

  const results = await Promise.all([
    Appointment.deleteMany({}),
    AppointmentOptimized.deleteMany({}),
    AppointmentSlot.deleteMany({}),
    User.deleteMany(userFilter),
    Notification.deleteMany({}),
    Waitlist.deleteMany({}),
    PasswordResetToken.deleteMany({}),
    SentCommunication.deleteMany({}),
    SentReminder.deleteMany({}),
    Availability.deleteMany({}),
  ]);

  return {
    appointments: results[0].deletedCount || 0,
    appointmentOptimized: results[1].deletedCount || 0,
    appointmentSlots: results[2].deletedCount || 0,
    users: results[3].deletedCount || 0,
    notifications: results[4].deletedCount || 0,
    waitlist: results[5].deletedCount || 0,
    passwordResetTokens: results[6].deletedCount || 0,
    sentCommunications: results[7].deletedCount || 0,
    sentReminders: results[8].deletedCount || 0,
    availability: results[9].deletedCount || 0,
    preservedSuperAdmins: await User.countDocuments({ isSuperAdmin: true }),
    removedUserIds: userIds.length,
  };
}

export function toCsv(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return '';
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const escape = (value: unknown) => {
    const text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(',')),
  ].join('\n');
}
