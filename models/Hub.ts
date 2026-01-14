import mongoose from 'mongoose';

export interface IHub extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  defaultSlots: string[];
  timezone: string;
  location: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const hubSchema = new mongoose.Schema<IHub>({
  name: {
    type: String,
    required: [true, 'Hub name is required'],
    unique: true,
    trim: true,
  },
  defaultSlots: {
    type: [String],
    required: [true, 'Default slots are required'],
    default: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'],
  },
  timezone: {
    type: String,
    required: [true, 'Timezone is required'],
    default: 'America/New_York',
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
  },
  isActive: {
    type: Boolean,
    required: [true, 'Active status is required'],
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes
// Note: name field already has unique: true which creates an index automatically
// Only add index for isActive
hubSchema.index({ isActive: 1 });

if (mongoose.models.Hub) {
  delete mongoose.models.Hub;
}

export default mongoose.model<IHub>('Hub', hubSchema); 