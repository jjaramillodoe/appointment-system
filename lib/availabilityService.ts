import { AvailabilityCache } from './redis';
import Hub from '../models/Hub';
import HubSchedule from '../models/HubSchedule';
import Availability, { IAvailability, ISlot } from '../models/Availability';
import AppointmentOptimized from '../models/AppointmentOptimized';
import dbConnect from './mongodb';

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

    // Check if it's a day off
    const isDayOff = hubSchedule?.isDayOff || false;
    if (isDayOff) {
      const result: DayAvailability = {
        hubId,
        hubName: hub.name,
        date,
        slots: [],
        isDayOff: true
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
  static async bookSlot(hubId: string, date: string, time: string, userId: string): Promise<{ success: boolean; error?: string }> {
    await dbConnect();

    try {
      // Check if user already has an appointment (due to unique constraint)
      const existingAppointment = await AppointmentOptimized.findOne({ userId });
      if (existingAppointment) {
        return { success: false, error: 'User already has an appointment booked' };
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

      // Check if the requested time slot exists
      const requestedSlot = availability.slots.find(s => s.time === time);
      if (!requestedSlot) {
        return { success: false, error: 'Requested time slot not available' };
      }

      // Check if slot has capacity
      if (requestedSlot.booked >= requestedSlot.capacity) {
        return { success: false, error: 'Time slot is fully booked' };
      }

      // Book the slot
      await availability.bookSlot(time);

      // Create the appointment
      const appointment = new AppointmentOptimized({
        userId,
        hubId,
        date,
        time,
        status: 'confirmed',
        intakeType: 'adult-education'
      });
      await appointment.save();

      // Invalidate cache
      await AvailabilityCache.invalidate(hubId, date);

      return { success: true };
    } catch (error: any) {
      console.error('Booking error:', error);
      
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
      // Find and update availability
      const availability = await Availability.findOne({ hubId, date });
      if (!availability) {
        throw new Error('Availability not found');
      }

      await availability.cancelBooking(time);

      // Update appointment status
      await AppointmentOptimized.findOneAndUpdate(
        { userId, hubId, date, time },
        { status: 'cancelled' }
      );

      // Invalidate cache
      await AvailabilityCache.invalidate(hubId, date);

      return true;
    } catch (error) {
      console.error('Cancellation error:', error);
      return false;
    }
  }

  /**
   * Mark a day as off and invalidate cache
   */
  static async markDayOff(hubId: string, date: string): Promise<boolean> {
    await dbConnect();

    try {
      await HubSchedule.findOneAndUpdate(
        { hubId, date },
        { 
          hubId,
          date,
          isDayOff: true,
          slots: []
        },
        { upsert: true }
      );

      // Invalidate cache
      await AvailabilityCache.invalidate(hubId, date);

      return true;
    } catch (error) {
      console.error('Mark day off error:', error);
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
        console.error('Hub not found for markDayOpen:', hubId);
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
          slots: defaultSlots
        },
        { upsert: true }
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
      console.error('Mark day open error:', error);
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
      console.error('Update day slots error:', error);
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