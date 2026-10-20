import mongoose from 'mongoose';

export interface ISentReminder extends mongoose.Document {
  appointmentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  hoursBeforeAppointment: number;
  channel: 'email' | 'sms';
  status: 'sent' | 'failed';
  error?: string;
  sentAt: Date;
}

const sentReminderSchema = new mongoose.Schema<ISentReminder>({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  hoursBeforeAppointment: {
    type: Number,
    required: true,
  },
  channel: {
    type: String,
    enum: ['email', 'sms'],
    required: true,
  },
  status: {
    type: String,
    enum: ['sent', 'failed'],
    default: 'sent',
  },
  error: {
    type: String,
    default: '',
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index to prevent duplicate reminders
sentReminderSchema.index({ appointmentId: 1, hoursBeforeAppointment: 1, channel: 1 }, { unique: true });

export default mongoose.models.SentReminder || mongoose.model<ISentReminder>('SentReminder', sentReminderSchema);
