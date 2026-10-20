import Appointment from '@/models/Appointment';
import { ACTIVE_APPOINTMENT_STATUSES } from '@/lib/appointmentStatus';
import { getSystemSettings } from '@/lib/systemSettings';
import { calendarDateFromValue } from '@/lib/appointmentTime';
import { toAppointmentClock } from '@/lib/appointmentTime';

export function classInterestFromUser(user?: {
  classInterest?: string | null;
  programInterests?: string[] | null;
} | null): 'ESL' | 'BE/HSE' | undefined {
  if (user?.classInterest === 'ESL' || user?.classInterest === 'BE/HSE') {
    return user.classInterest;
  }
  const interests = user?.programInterests || [];
  if (interests.some((item) => /esl|english as a second/i.test(item))) return 'ESL';
  if (interests.some((item) => /basic|abe|hse|ged|be\/hse|equivalency/i.test(item))) return 'BE/HSE';
  return undefined;
}

export async function assertProgramQuota(options: {
  hubName?: string;
  date: Date | string;
  time: string;
  classInterest?: string;
  capacity: number;
}): Promise<{ ok: boolean; error?: string }> {
  const settings = await getSystemSettings();
  if (!settings.programQuotasEnabled || !options.classInterest) {
    return { ok: true };
  }

  const date = calendarDateFromValue(options.date);
  const time = toAppointmentClock(options.time);
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
  const quota = Math.max(1, Math.ceil((options.capacity || 20) / 2));

  const taken = await Appointment.countDocuments({
    hubName: options.hubName,
    appointmentTime: time,
    classInterest: options.classInterest,
    status: { $in: [...ACTIVE_APPOINTMENT_STATUSES] },
    appointmentDate: { $gte: dayStart, $lt: dayEnd },
  });

  if (taken >= quota) {
    return {
      ok: false,
      error: `This ${options.classInterest} window is full. Join the waitlist or pick another time.`,
    };
  }

  return { ok: true };
}
