import { logger } from '@/lib/logger';
import { AvailabilityCache } from './redis';
import Hub from '../models/Hub';
import HubSchedule from '../models/HubSchedule';
import Availability, { IAvailability, ISlot } from '../models/Availability';
import AppointmentOptimized from '../models/AppointmentOptimized';
import Appointment from '../models/Appointment';
import User from '../models/User';
import dbConnect from './mongodb';
import { calculateProfileCompletion } from './profileCompletion';
import { APPOINTMENT_STATUS, bookingStatusForProfile } from './appointmentStatus';
import { notifyAppointmentBooked } from './appointmentNotifications';
import AppointmentSlot from '../models/AppointmentSlot';
import { normalizeDayOffReason } from './dayOffReason';
import { toAppointmentClock, toTwentyFourHour } from './appointmentTime';
import { getSystemSettings } from './systemSettings';
import { promoteWaitlist } from './waitlistService';
import { notifyStudent } from './studentNotifications';
import { assertProgramQuota, classInterestFromUser } from './programQuotas';

export interface AvailabilitySlot {
  time: string;
  capacity: number;
  booked: number;
  available: number;
}

export interface DayAvailability {
  hubId: string;
  hubName: string;
  date: string;
  slots: AvailabilitySlot[];
  isDayOff: boolean;
  dayOffReason?: string;
}

export class AvailabilityService {
  /**
   * Get availability for a specific hub and date with Redis caching
   */
  static async getAvailability(hubId: string, date: string): Promise<DayAvailability | null> {
    await dbConnect();

    // Try to get from cache first
    const cached = await AvailabilityCache.get(hubId, date);
    if (cached) {
      return cached;
    }

    // Get from database
    const [hub, hubSchedule, availability] = await Promise.all([
      Hub.findById(hubId),
      HubSchedule.findOne({ hubId, date }),
      Availability.findOne({ hubId, date })
    ]);

    if (!hub) {
      return null;
    }

    const { isDateClosed } = await import('./closures');
    const districtClosed = await isDateClosed(hubId, date);
    const isDayOff = hubSchedule?.isDayOff || districtClosed.closed;
    if (isDayOff) {
      const result: DayAvailability = {
        hubId,
        hubName: hub.name,
        date,
        slots: [],
        isDayOff: true,
        dayOffReason: districtClosed.reason || normalizeDayOffReason(hubSchedule?.dayOffReason),
      };
      
      // Cache the result
      await AvailabilityCache.set(hubId, date, result);
      return result;
    }

    // Determine slots for the day
    const daySlots = hubSchedule?.slots || hub.defaultSlots;
    
    // Build availability response
    const slots: AvailabilitySlot[] = daySlots.map(time => {
      const availabilitySlot = availability?.slots.find(s => s.time === time);
      const capacity = availabilitySlot?.capacity || 20; // Default capacity
      const booked = availabilitySlot?.booked || 0;
      
      return {
        time,
        capacity,
        booked,
        available: Math.max(0, capacity - booked)
      };
    });

    const result: DayAvailability = {
      hubId,
      hubName: hub.name,
      date,
      slots,
      isDayOff: false
    };

    // Cache the result
    await AvailabilityCache.set(hubId, date, result);
    
    return result;
  }

  /**
   * Get availability for multiple hubs for a specific date
   */
  static async getMultiHubAvailability(hubIds: string[], date: string): Promise<DayAvailability[]> {
    const results = await Promise.all(
      hubIds.map(hubId => this.getAvailability(hubId, date))
    );
    
    return results.filter(result => result !== null) as DayAvailability[];
  }

  /**
   * Book a slot and update cache
   */
  static async bookSlot(
    hubId: string,
    date: string,
    time: string,
    userId: string,
    classInterest?: string
  ): Promise<{ success: boolean; error?: string; status?: string; appointmentId?: string }> {
    await dbConnect();

    try {
      // Check if user already has an appointment (due to unique constraint)
      const settings = await getSystemSettings();
      const activeCount = await Appointment.countDocuments({
        userId,
        status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.PENDING_PROFILE, APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.ARRIVED] },
      });
      if (activeCount >= (settings.maxActiveAppointments || 1)) {
        return { success: false, error: 'User already has an active appointment' };
      }

      // Check if availability document exists, create if not
      let availability = await Availability.findOne({ hubId, date });
      
      if (!availability) {
        // Get hub and schedule to initialize availability
        const [hub, hubSchedule] = await Promise.all([
          Hub.findById(hubId),
          HubSchedule.findOne({ hubId, date })
        ]);

        if (!hub) {
          return { success: false, error: 'Hub not found' };
        }

        const daySlots = hubSchedule?.slots || hub.defaultSlots;
        const slots: ISlot[] = daySlots.map(slotTime => ({
          time: slotTime,
          capacity: 20, // Default capacity
          booked: 0
        }));

        availability = new Availability({
          hubId,
          date,
          slots
        });
      }

      const requestedClock = toAppointmentClock(time);
      const requestedSlot = availability.slots.find((slot) => (
        slot.time === time || toAppointmentClock(slot.time) === requestedClock
      ));
      if (!requestedSlot) {
        return { success: false, error: 'Requested time slot not available' };
      }

      // Check if slot has capacity
      if (requestedSlot.booked >= requestedSlot.capacity) {
        return { success: false, error: 'Time slot is fully booked' };
      }

      const user = await User.findById(userId);
      const program = (classInterest === 'ESL' || classInterest === 'BE/HSE')
        ? classInterest
        : classInterestFromUser(user);
      const quota = await assertProgramQuota({
        hubName: (await Hub.findById(hubId).select('name'))?.name,
        date,
        time,
        classInterest: program,
        capacity: requestedSlot.capacity,
      });
      if (!quota.ok) {
        return { success: false, error: quota.error };
      }

      // Book the slot using the stored slot clock so 9:00 AM matches 09:00
      await availability.bookSlot(requestedSlot.time);

      const completion = calculateProfileCompletion(user);
      if (user && completion.isComplete && !user.profileCompleted) {
        user.profileCompleted = true;
        await user.save();
      }
      const status = bookingStatusForProfile(completion.isComplete);

      const hub = await Hub.findById(hubId).select('name');
      const displayTime = toAppointmentClock(time);
      const [appointment] = await Promise.all([
        Appointment.create({
          userId,
          hubId,
          hubName: hub?.name,
          appointmentDate: new Date(`${date}T00:00:00.000Z`),
          appointmentTime: displayTime,
          status,
          intakeType: 'adult-education',
          classInterest: program,
        }),
        AppointmentOptimized.create({
          userId,
          hubId,
          date,
          time: toTwentyFourHour(time),
          status,
          intakeType: 'adult-education',
        }),
      ]);

      if (user) {
        void notifyAppointmentBooked(
          user,
          { date, time: displayTime, hubName: hub?.name },
          completion.isComplete
        );
        void notifyStudent({
          userId: String(user._id),
          title: completion.isComplete ? 'Cita confirmada / Appointment confirmed' : 'Complete su perfil / Complete your profile',
          message: completion.isComplete
            ? `Su cita en ${hub?.name || 'su centro'} está confirmada para ${date} a las ${displayTime}. / Your appointment at ${hub?.name || 'your site'} is confirmed for ${date} at ${displayTime}.`
            : `Su cupo está reservado para ${date} a las ${displayTime}. Complete su perfil para confirmarlo. / Your slot is reserved for ${date} at ${displayTime}. Complete your profile to confirm it.`,
          hubName: hub?.name,
          appointmentId: String(appointment._id),
        });
      }

      // Invalidate cache
      await AvailabilityCache.invalidate(hubId, date);

      return { success: true, status, appointmentId: appointment._id.toString() };
    } catch (error: any) {
      logger.error('Booking error:', error);
      
      // Handle specific MongoDB errors
      if (error.code === 11000) {
        return { success: false, error: 'User already has an appointment' };
      }
      
      return { success: false, error: error.message || 'Booking failed due to unexpected error' };
    }
  }

  /**
   * Cancel a booking and update cache
   */
  static async cancelBooking(hubId: string, date: string, time: string, userId: string): Promise<boolean> {
    await dbConnect();

    try {
      const displayTime = toAppointmentClock(time);
      const twentyFour = toTwentyFourHour(time);
      const availability = await Availability.findOne({ hubId, date });
      if (availability) {
        await availability.cancelBooking(twentyFour).catch(async () => {
          await availability.cancelBooking(displayTime);
        });
      }

      const appointmentDate = new Date(`${date}T00:00:00.000Z`);
      await Promise.all([
        Appointment.findOneAndUpdate(
          {
            userId,
            status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.PENDING_PROFILE, APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.ARRIVED] },
          },
          { status: APPOINTMENT_STATUS.CANCELLED }
        ),
        AppointmentOptimized.findOneAndUpdate(
          { userId, hubId, date, time: twentyFour },
          { status: 'cancelled' }
        ),
        AppointmentSlot.updateOne(
          { hubId, date: appointmentDate, time: displayTime },
          { $inc: { bookedCount: -1 } }
        ),
      ]);

      const hub = await Hub.findById(hubId).select('name');
      await AvailabilityCache.invalidate(hubId, date);
      await promoteWaitlist(hubId, hub?.name || '');

      return true;
    } catch (error) {
      logger.error('Cancellation error:', error);
      return false;
    }
  }

  /**
   * Mark a day as off and invalidate cache
   */
  static async markDayOff(hubId: string, date: string, reason?: string): Promise<boolean> {
    await dbConnect();

    try {
      const dayOffReason = normalizeDayOffReason(reason);
      const hub = await Hub.findById(hubId);

      await HubSchedule.findOneAndUpdate(
        { hubId, date },
        {
          hubId,
          date,
          isDayOff: true,
          slots: [],
          dayOffReason,
        },
        { upsert: true }
      );

      if (hub) {
        await AppointmentSlot.updateMany(
          { hubName: hub.name, date: new Date(`${date}T00:00:00.000Z`) },
          { $set: { isActive: false } }
        );
      }

      // Invalidate cache
      await AvailabilityCache.invalidate(hubId, date);

      return true;
    } catch (error) {
      logger.error('Mark day off error:', error);
      return false;
    }
  }

  /**
   * Mark a day as open (restore default appointments)
   */
  static async markDayOpen(hubId: string, date: string): Promise<boolean> {
    await dbConnect();

    try {
      // Get hub's default slots
      const hub = await Hub.findById(hubId);
      if (!hub) {
        logger.error('Hub not found for markDayOpen:', hubId);
        return false;
      }

      const defaultSlots = hub.defaultSlots || [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
        '15:00', '15:30', '16:00', '16:30'
      ];

      // Update hub schedule to mark as open
      await HubSchedule.findOneAndUpdate(
        { hubId, date },
        {
          hubId,
          date,
          isDayOff: false,
          slots: defaultSlots,
          dayOffReason: '',
        },
        { upsert: true }
      );

      await AppointmentSlot.updateMany(
        { hubName: hub.name, date: new Date(`${date}T00:00:00.000Z`) },
        { $set: { isActive: true } }
      );

      // Update or create availability document with default slots
      let availability = await Availability.findOne({ hubId, date });
      if (!availability) {
        availability = new Availability({
          hubId,
          date,
          slots: defaultSlots.map(time => ({ time, capacity: 20, booked: 0 }))
        });
      } else {
        // Update slots while preserving existing booking counts
        const existingSlots = new Map(availability.slots.map(s => [s.time, s]));
        availability.slots = defaultSlots.map(time => ({
          time,
          capacity: existingSlots.get(time)?.capacity || 20,
          booked: existingSlots.get(time)?.booked || 0
        }));
      }

      await availability.save();

      // Invalidate cache
      await AvailabilityCache.invalidate(hubId, date);

      return true;
    } catch (error) {
      logger.error('Mark day open error:', error);
      return false;
    }
  }

  /**
   * Update custom slots for a specific day
   */
  static async updateDaySlots(hubId: string, date: string, slots: string[]): Promise<boolean> {
    await dbConnect();

    try {
      await HubSchedule.findOneAndUpdate(
        { hubId, date },
        { 
          hubId,
          date,
          slots,
          isDayOff: false
        },
        { upsert: true }
      );

      // Update or create availability document with new slots
      let availability = await Availability.findOne({ hubId, date });
      if (!availability) {
        availability = new Availability({
          hubId,
          date,
          slots: slots.map(time => ({ time, capacity: 20, booked: 0 }))
        });
      } else {
        // Update slots while preserving existing booking counts
        const existingSlots = new Map(availability.slots.map(s => [s.time, s]));
        availability.slots = slots.map(time => ({
          time,
          capacity: existingSlots.get(time)?.capacity || 20,
          booked: existingSlots.get(time)?.booked || 0
        }));
      }
      await availability.save();

      // Invalidate cache
      await AvailabilityCache.invalidate(hubId, date);

      return true;
    } catch (error) {
      logger.error('Update day slots error:', error);
      return false;
    }
  }

  /**
   * Pre-generate availability for a date range (e.g., semester)
   */
  static async preGenerateAvailability(hubId: string, startDate: string, endDate: string): Promise<void> {
    await dbConnect();
    
    const hub = await Hub.findById(hubId);
    if (!hub) {
      throw new Error('Hub not found');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      
      // Check if availability already exists
      const existingAvailability = await Availability.findOne({ hubId, date: dateStr });
      if (!existingAvailability) {
        // Get schedule for this date or use defaults
        const hubSchedule = await HubSchedule.findOne({ hubId, date: dateStr });
        
        if (!hubSchedule?.isDayOff) {
          const daySlots = hubSchedule?.slots || hub.defaultSlots;
          const slots: ISlot[] = daySlots.map(time => ({
            time,
            capacity: 20,
            booked: 0
          }));

          const availability = new Availability({
            hubId,
            date: dateStr,
            slots
          });
          await availability.save();
        }
      }
      
      current.setDate(current.getDate() + 1);
    }
  }
} 