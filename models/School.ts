import mongoose from 'mongoose';

export const SCHOOL_STATUSES = ['active', 'inactive'] as const;
export type SchoolStatus = (typeof SCHOOL_STATUSES)[number];

export interface ISchool extends mongoose.Document {
  name: string;
  slug: string;
  code: string;
  status: SchoolStatus;
  email?: string;
  phone?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
}

const schoolSchema = new mongoose.Schema<ISchool>({
  name: {
    type: String,
    required: [true, 'School name is required'],
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    required: [true, 'School slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'School code is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  status: {
    type: String,
    enum: SCHOOL_STATUSES,
    default: 'active',
  },
  email: { type: String, trim: true },
  phone: { type: String, trim: true },
  website: { type: String, trim: true },
}, {
  timestamps: true,
});

schoolSchema.index({ status: 1, name: 1 });

if (mongoose.models.School) {
  delete mongoose.models.School;
}

export default mongoose.model<ISchool>('School', schoolSchema);
