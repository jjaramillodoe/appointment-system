import mongoose from 'mongoose';

export interface IHubSchedule extends mongoose.Document {
  hubId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD format
  slots: string[];
  isDayOff: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const hubScheduleSchema = new mongoose.Schema<IHubSchedule>({
  hubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hub',
    required: [true, 'Hub ID is required'],
  },
  date: {
    type: String,
    required: [true, 'Date is required'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
  },
  slots: {
    type: [String],
    required: [true, 'Slots are required'],
    default: [],
  },
  isDayOff: {
    type: Boolean,
    required: [true, 'Day off status is required'],
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes
hubScheduleSchema.index({ hubId: 1, date: 1 }, { unique: true });
hubScheduleSchema.index({ hubId: 1 });
hubScheduleSchema.index({ date: 1 });

if (mongoose.models.HubSchedule) {
  delete mongoose.models.HubSchedule;
}

export default mongoose.model<IHubSchedule>('HubSchedule', hubScheduleSchema); 