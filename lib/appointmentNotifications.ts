import { logger } from '@/lib/logger';
import mongoose from 'mongoose';
import Appointment from '@/models/Appointment';
import AppointmentOptimized from '@/models/AppointmentOptimized';
import {
  sendAppointmentConfirmationEmail,
  sendIntakeRequiredEmail,
} from '@/lib/emailService';
import { APPOINTMENT_STATUS } from '@/lib/appointmentStatus';
import { notifyStudent } from '@/lib/studentNotifications';
import { calendarDateFromValue } from '@/lib/appointmentTime';

type NoticeUser = {
  _id?: unknown;
  email?: string;
  firstName?: string;
  lastName?: string;
  preferredLanguage?: string;
};

type NoticeAppointment = {
  appointmentDate?: Date | string;
  appointmentTime?: string;
  date?: string;
  time?: string;
  hubName?: string;
};

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
}

function formatNoticeDate(value?: Date | string) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function noticePayload(user: NoticeUser, appointment: NoticeAppointment) {
  return {
    recipientEmail: user.email || '',
    recipientName: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'there',
    appointmentDate: formatNoticeDate(appointment.appointmentDate || appointment.date),
    appointmentTime: appointment.appointmentTime || appointment.time || '',
    hubName: appointment.hubName,
    profileUrl: `${appUrl()}/profile`,
    calendarDate: calendarDateFromValue(appointment.appointmentDate || appointment.date),
    preferredLanguage: user.preferredLanguage,
  };
}

export async function notifyAppointmentBooked(
  user: NoticeUser,
  appointment: NoticeAppointment,
  confirmed: boolean
) {
  if (!user.email) return;
  const data = noticePayload(user, appointment);
  try {
    if (confirmed) {
      await sendAppointmentConfirmationEmail(data);
    } else {
      await sendIntakeRequiredEmail(data);
    }
  } catch (error) {
    logger.error('Failed to send appointment booking notice:', error);
  }
}

export async function confirmPendingProfileAppointments(user: NoticeUser & { _id: unknown }) {
  const filter = {
    userId: new mongoose.Types.ObjectId(String(user._id)),
    status: APPOINTMENT_STATUS.PENDING_PROFILE,
  };
  const [appointments, optimized] = await Promise.all([
    Appointment.find(filter),
    AppointmentOptimized.find(filter),
  ]);

  if (appointments.length === 0 && optimized.length === 0) {
    return [];
  }

  await Promise.all([
    Appointment.updateMany(filter, { $set: { status: APPOINTMENT_STATUS.CONFIRMED } }),
    AppointmentOptimized.updateMany(filter, { $set: { status: APPOINTMENT_STATUS.CONFIRMED } }),
  ]);

  const confirmed = [...appointments, ...optimized];
  await Promise.all(confirmed.map((appointment) => notifyAppointmentBooked(user, appointment, true)));
  if (appointments[0]) {
    await notifyStudent({
      userId: String(user._id),
      title: 'Cita confirmada / Appointment confirmed',
      message: 'Su perfil está completo, así que su cita reservada ya está confirmada. / Your profile is complete, so your reserved appointment is now confirmed.',
      hubName: appointments[0].hubName,
      appointmentId: String(appointments[0]._id),
    });
  }
  return confirmed;
}
