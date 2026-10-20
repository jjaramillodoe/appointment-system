import * as bcrypt from 'bcryptjs';
import Hub from '@/models/Hub';
import User from '@/models/User';
import Appointment from '@/models/Appointment';
import AppointmentOptimized from '@/models/AppointmentOptimized';
import AppointmentSlot from '@/models/AppointmentSlot';
import { APPOINTMENT_STATUS } from '@/lib/appointmentStatus';
import { toTwentyFourHour } from '@/lib/appointmentTime';
import { utcDayBounds } from '@/lib/slotDateTime';

const FIRST_NAMES = ['Maria', 'James', 'Fatima', 'Wei', 'Rosa', 'Ahmed', 'Priya', 'Luis', 'Aisha', 'Daniel', 'Sofia', 'Omar', 'Mei', 'Carlos', 'Nadia'];
const LAST_NAMES = ['Garcia', 'Smith', 'Ahmed', 'Chen', 'Martinez', 'Hassan', 'Patel', 'Rivera', 'Khan', 'Brown', 'Lopez', 'Ali', 'Wang', 'Diaz', 'Nguyen'];
const LANGUAGES = ['English', 'Spanish', 'French', 'Arabic', 'Chinese', 'Other'] as const;
const BARRIERS = ['Childcare', 'Transportation', 'Technology', 'Literacy', 'Employment Schedule'];
const EDUCATION = ['no-hs', 'some-hs', 'ged', 'hs-diploma', 'some-college', 'college-degree'] as const;
const PROGRAMS = ['Adult Basic Education', 'HSE/GED', 'ESL', 'Career Training'];
const EMPLOYMENT = ['employed', 'unemployed', 'self-employed', 'retired', 'student'] as const;
const SEXES = ['Male', 'Female', 'Non-binary', 'Prefer not to say'] as const;
const TIMES = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '4:00 PM', '6:00 PM'] as const;
const CLASS_INTERESTS = ['ESL', 'BE/HSE'] as const;
const TIME_PREFERENCES = ['Morning', 'Evening', 'Saturday'] as const;
const PAST_STATUSES = [
  APPOINTMENT_STATUS.COMPLETED,
  APPOINTMENT_STATUS.COMPLETED,
  APPOINTMENT_STATUS.CANCELLED,
  APPOINTMENT_STATUS.NO_SHOW,
  APPOINTMENT_STATUS.EXPIRED,
  APPOINTMENT_STATUS.CONFIRMED,
] as const;
const FUTURE_STATUSES = [
  APPOINTMENT_STATUS.CONFIRMED,
  APPOINTMENT_STATUS.PENDING,
  APPOINTMENT_STATUS.PENDING_PROFILE,
] as const;

function pick<T>(items: readonly T[] | T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function pickSome<T>(items: readonly T[], min = 1, max = 3): T[] {
  const count = Math.min(items.length, min + Math.floor(Math.random() * (max - min + 1)));
  return [...items].sort(() => Math.random() - 0.5).slice(0, count);
}

function dateOffset(daysFromToday: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

export function clampReseedOptions(body: { userCount?: unknown; appointmentCount?: unknown; monthsBack?: unknown }) {
  const userCount = Math.min(200, Math.max(5, Number(body.userCount) || 50));
  const appointmentCount = Math.min(500, Math.max(10, Number(body.appointmentCount) || 100));
  const monthsBack = Math.min(12, Math.max(1, Number(body.monthsBack) || 4));
  return { userCount, appointmentCount, monthsBack };
}

export async function reseedAnalyticsData(options: {
  userCount: number;
  appointmentCount: number;
  monthsBack: number;
}) {
  const hubs = await Hub.find({ isActive: true }).lean();
  if (hubs.length === 0) {
    throw new Error('No active hubs found. Create hubs before reseeding.');
  }

  const password = await bcrypt.hash('SeedUser123!', 12);
  const stamp = Date.now();
  const users = [];

  for (let i = 0; i < options.userCount; i += 1) {
    const hub = hubs[i % hubs.length];
    const profileCompleted = i % 4 !== 0;
    const preferredLanguage = pick(LANGUAGES);
    const additionalLanguages = pickSome(LANGUAGES.filter((lang) => lang !== preferredLanguage), 0, 2);
    const createdOffset = -Math.floor(Math.random() * options.monthsBack * 30);

    users.push({
      email: `seed.student.${i + 1}.${stamp}@example.test`,
      password,
      firstName: pick(FIRST_NAMES),
      lastName: pick(LAST_NAMES),
      phone: `212-555-${String(1000 + i).padStart(4, '0')}`,
      dateOfBirth: new Date(1975 + (i % 30), i % 12, (i % 27) + 1),
      sex: pick(SEXES),
      preferredLanguage,
      additionalLanguages,
      heardFrom: pick(['Google', 'Facebook', 'Friend/Family', 'Community Center', 'School', 'Advertisement', 'Other'] as const),
      barriersToLearning: pickSome(BARRIERS, 1, 3),
      educationLevel: pick(EDUCATION),
      employmentStatus: pick(EMPLOYMENT),
      schoolInterest: hub.name,
      programInterests: pickSome(PROGRAMS, 1, 3),
      homeAddress: {
        street: `${100 + i} Atlantic Ave`,
        city: 'Brooklyn',
        state: 'NY',
        zipCode: '11201',
      },
      closestHub: {
        name: hub.name,
        address: hub.location,
        latitude: 40.65,
        longitude: -73.95,
        distance: 1 + (i % 8),
        distanceText: `${1 + (i % 8)} mi`,
      },
      isAdmin: false,
      isSuperAdmin: false,
      profileCompleted,
      registrationSource: profileCompleted ? 'full' : 'quick',
      createdAt: utcDayBounds(dateOffset(createdOffset)).start,
      updatedAt: new Date(),
    });
  }

  const createdUsers = await User.insertMany(users, { ordered: false });
  const appointments = [];
  const optimized = [];
  const slotKeys = new Map<string, { hubName: string; date: Date; time: string; bookedCount: number }>();
  const lookbackDays = options.monthsBack * 30;

  for (let i = 0; i < options.appointmentCount; i += 1) {
    const user = createdUsers[i % createdUsers.length];
    const hub = hubs[i % hubs.length];
    const isPast = i % 5 !== 0;
    const dayOffset = isPast
      ? -Math.floor(Math.random() * lookbackDays)
      : Math.floor(Math.random() * 30) + 1;
    const dateStr = dateOffset(dayOffset);
    const appointmentDate = utcDayBounds(dateStr).start;
    const appointmentTime = pick(TIMES);
    let status = isPast ? pick(PAST_STATUSES) : pick(FUTURE_STATUSES);
    if (!user.profileCompleted) status = APPOINTMENT_STATUS.PENDING_PROFILE;

    appointments.push({
      userId: user._id,
      appointmentDate,
      appointmentTime,
      hubName: hub.name,
      hubId: hub._id,
      status,
      notes: isPast ? 'Seeded historical intake' : 'Seeded upcoming intake',
      intakeType: 'adult-education',
      classInterest: pick(CLASS_INTERESTS),
      timePreference: pick(TIME_PREFERENCES),
      preferredLanguage: user.preferredLanguage,
    });

    optimized.push({
      userId: user._id,
      hubId: hub._id,
      date: dateStr,
      time: toTwentyFourHour(appointmentTime),
      status,
      notes: 'Seeded analytics appointment',
      intakeType: 'adult-education',
    });

    const key = `${hub.name}|${dateStr}|${appointmentTime}`;
    const existing = slotKeys.get(key);
    if (existing) {
      existing.bookedCount += 1;
    } else {
      slotKeys.set(key, {
        hubName: hub.name,
        date: appointmentDate,
        time: appointmentTime,
        bookedCount: 1,
      });
    }
  }

  const createdAppointments = await Appointment.insertMany(appointments, { ordered: false });
  await AppointmentOptimized.insertMany(optimized, { ordered: false });

  const slotOps = [...slotKeys.values()].map((slot) => ({
    updateOne: {
      filter: { hubName: slot.hubName, date: slot.date, time: slot.time },
      update: {
        $setOnInsert: {
          hubName: slot.hubName,
          date: slot.date,
          time: slot.time,
          capacity: 8,
          isActive: true,
        },
        $inc: { bookedCount: slot.bookedCount },
      },
      upsert: true,
    },
  }));

  if (slotOps.length > 0) {
    await AppointmentSlot.bulkWrite(slotOps);
  }

  return {
    users: createdUsers.length,
    appointments: createdAppointments.length,
    slots: slotKeys.size,
    monthsBack: options.monthsBack,
    passwordHint: 'SeedUser123!',
  };
}
