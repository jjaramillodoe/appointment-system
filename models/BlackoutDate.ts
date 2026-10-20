import mongoose from 'mongoose';

export interface IBlackoutDate extends mongoose.Document {
  date: Date;
  title: string;
  description?: string;
  type: 'holiday' | 'maintenance' | 'training' | 'emergency' | 'other';
  affectedHubs?: mongoose.Types.ObjectId[]; // If empty, affects all hubs
  isAllDay: boolean;
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const blackoutDateSchema = new mongoose.Schema<IBlackoutDate>({
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['holiday', 'maintenance', 'training', 'emergency', 'other'],
    default: 'other',
  },
  affectedHubs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hub',
    },
  ],
  isAllDay: {
    type: Boolean,
    default: true,
  },
  startTime: {
    type: String,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:MM format
  },
  endTime: {
    type: String,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:MM format
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Index for efficient date range queries
blackoutDateSchema.index({ date: 1, affectedHubs: 1 });

export default mongoose.models.BlackoutDate || mongoose.model<IBlackoutDate>('BlackoutDate', blackoutDateSchema);
