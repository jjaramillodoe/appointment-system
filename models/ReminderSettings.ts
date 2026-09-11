import mongoose from 'mongoose';

export interface IReminderSettings extends mongoose.Document {
  isEnabled: boolean;
  reminders: {
    enabled: boolean;
    hoursBeforeAppointment: number; // e.g., 24, 1
    channel: 'email' | 'sms' | 'both'; // future: add SMS
    message?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const reminderSettingsSchema = new mongoose.Schema<IReminderSettings>({
  isEnabled: {
    type: Boolean,
    default: true,
  },
  reminders: [
    {
      enabled: {
        type: Boolean,
        default: true,
      },
      hoursBeforeAppointment: {
        type: Number,
        required: true,
        enum: [1, 24, 48, 72], // 1 hour, 24 hours, 48 hours, 72 hours
      },
      channel: {
        type: String,
        enum: ['email', 'sms', 'both'],
        default: 'email',
      },
      message: {
        type: String,
        default: '',
      },
    },
  ],
}, {
  timestamps: true,
});

export default mongoose.models.ReminderSettings || mongoose.model<IReminderSettings>('ReminderSettings', reminderSettingsSchema);
