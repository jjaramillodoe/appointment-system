import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import Appointment from '@/models/Appointment';
import AppointmentSlot from '@/models/AppointmentSlot';

// Generate low capacity notifications
export async function generateLowCapacityNotifications() {
  try {
    await dbConnect();
    
    // Get all active appointment slots for today and tomorrow
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const slots = await AppointmentSlot.find({
      date: { $in: [today.toISOString().split('T')[0], tomorrow.toISOString().split('T')[0]] },
      isActive: true
    });

    for (const slot of slots) {
      const utilizationRate = slot.bookedCount / slot.capacity;
      
      // Generate notification if utilization is above 80%
      if (utilizationRate >= 0.8) {
        const percentage = Math.round(utilizationRate * 100);
        
        // Check if notification already exists for this slot
        const existingNotification = await Notification.findOne({
          type: 'low_capacity',
          hubName: slot.hubName,
          message: { $regex: `${slot.time}.*${percentage}%` },
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        });

        if (!existingNotification) {
          await Notification.create({
            type: 'low_capacity',
            title: 'Low Capacity Alert',
            message: `${slot.hubName} ${slot.time} slot is ${percentage}% full`,
            hubName: slot.hubName,
            priority: percentage >= 90 ? 'high' : 'medium'
          });
        }
      }
    }
  } catch (error) {
    console.error('Error generating low capacity notifications:', error);
  }
}

// Generate no-show notifications
export async function generateNoShowNotifications() {
  try {
    await dbConnect();
    
    // Get appointments from yesterday that were not cancelled or completed
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const appointments = await Appointment.find({
      appointmentDate: yesterdayStr,
      status: { $nin: ['cancelled', 'completed'] }
    });

    // Group by hub
    const hubNoShows: { [hubName: string]: number } = {};
    
    for (const appointment of appointments) {
      if (!hubNoShows[appointment.hubName]) {
        hubNoShows[appointment.hubName] = 0;
      }
      hubNoShows[appointment.hubName]++;
    }

    // Generate notifications for hubs with no-shows
    for (const [hubName, count] of Object.entries(hubNoShows)) {
      if (count > 0) {
        // Check if notification already exists for this hub today
        const existingNotification = await Notification.findOne({
          type: 'no_show',
          hubName,
          message: { $regex: `${count}.*no-show` },
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (!existingNotification) {
          await Notification.create({
            type: 'no_show',
            title: 'No-Show Report',
            message: `${count} no-show${count > 1 ? 's' : ''} reported for ${hubName}`,
            hubName,
            priority: count >= 3 ? 'high' : 'medium'
          });
        }
      }
    }
  } catch (error) {
    console.error('Error generating no-show notifications:', error);
  }
}

// Generate reminder notifications
export async function generateReminderNotifications() {
  try {
    await dbConnect();
    
    // Get appointments for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const appointments = await Appointment.find({
      appointmentDate: tomorrowStr,
      status: { $nin: ['cancelled'] }
    });

    if (appointments.length > 0) {
      // Check if reminder notification already exists for today
      const existingNotification = await Notification.findOne({
        type: 'reminder',
        message: { $regex: 'Reminders sent.*tomorrow' },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      if (!existingNotification) {
        await Notification.create({
          type: 'reminder',
          title: 'Reminder System',
          message: `Reminders sent for ${appointments.length} appointment${appointments.length > 1 ? 's' : ''} tomorrow`,
          priority: 'low'
        });
      }
    }
  } catch (error) {
    console.error('Error generating reminder notifications:', error);
  }
}

// Generate system notifications
export async function generateSystemNotification(title: string, message: string, priority: 'low' | 'medium' | 'high' = 'medium') {
  try {
    await dbConnect();
    
    await Notification.create({
      type: 'system',
      title,
      message,
      priority
    });
  } catch (error) {
    console.error('Error generating system notification:', error);
  }
}

// Generate appointment notifications
export async function generateAppointmentNotification(
  type: 'created' | 'cancelled' | 'updated',
  appointmentId: string,
  hubName: string,
  userId?: string
) {
  try {
    await dbConnect();
    
    const messages = {
      created: 'New appointment scheduled',
      cancelled: 'Appointment cancelled',
      updated: 'Appointment updated'
    };

    await Notification.create({
      type: 'appointment',
      title: 'Appointment Update',
      message: `${messages[type]} at ${hubName}`,
      hubName,
      appointmentId,
      userId,
      priority: type === 'cancelled' ? 'high' : 'medium'
    });
  } catch (error) {
    console.error('Error generating appointment notification:', error);
  }
} 