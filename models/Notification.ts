import mongoose from 'mongoose';

export interface INotification extends mongoose.Document {
  type: 'low_capacity' | 'no_show' | 'reminder' | 'system' | 'appointment';
  title: string;
  message: string;
  hubName?: string;
  appointmentId?: string;
  userId?: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new mongoose.Schema<INotification>({
  type: { 
    type: String, 
    required: true, 
    enum: ['low_capacity', 'no_show', 'reminder', 'system', 'appointment'] 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  hubName: { type: String },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  read: { type: Boolean, default: false },
  priority: { 
    type: String, 
    default: 'medium', 
    enum: ['low', 'medium', 'high'] 
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ read: 1, createdAt: -1 });
notificationSchema.index({ type: 1, hubName: 1 });

if (mongoose.models.Notification) {
  delete mongoose.models.Notification;
}

export default mongoose.model<INotification>('Notification', notificationSchema); 