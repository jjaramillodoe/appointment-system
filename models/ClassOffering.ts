import mongoose from 'mongoose';

export const CLASS_STATUSES = ['active', 'inactive'] as const;
export const CLASS_MODALITIES = ['in-person', 'hybrid', 'online'] as const;
export type ClassStatus = (typeof CLASS_STATUSES)[number];
export type ClassModality = (typeof CLASS_MODALITIES)[number];

export interface IClassOffering extends mongoose.Document {
  name: string;
  code?: string;
  description?: string;
  schoolId?: mongoose.Types.ObjectId;
  hubId?: mongoose.Types.ObjectId;
  modality: ClassModality;
  schedule?: string;
  status: ClassStatus;
  createdAt: Date;
  updatedAt: Date;
}

const classOfferingSchema = new mongoose.Schema<IClassOffering>({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
  },
  code: {
    type: String,
    trim: true,
    uppercase: true,
  },
  description: {
    type: String,
    trim: true,
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: false,
  },
  hubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hub',
    required: false,
  },
  modality: {
    type: String,
    enum: CLASS_MODALITIES,
    default: 'in-person',
  },
  schedule: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: CLASS_STATUSES,
    default: 'active',
  },
}, {
  timestamps: true,
  collection: 'classes',
});

classOfferingSchema.index({ status: 1, name: 1 });
classOfferingSchema.index({ schoolId: 1, status: 1 });
classOfferingSchema.index({ hubId: 1, status: 1 });
classOfferingSchema.index({ code: 1 }, { unique: true, sparse: true });

if (mongoose.models.ClassOffering) {
  delete mongoose.models.ClassOffering;
}

export default mongoose.model<IClassOffering>('ClassOffering', classOfferingSchema);
