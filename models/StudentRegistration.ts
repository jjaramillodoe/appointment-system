import mongoose from 'mongoose';

export const STUDENT_REGISTRATION_STATUSES = ['pending', 'approved', 'enrolled'] as const;
export type StudentRegistrationStatus = (typeof STUDENT_REGISTRATION_STATUSES)[number];

export interface IStudentInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredLanguage?: string;
}

export interface IStudentRegistration extends mongoose.Document {
  studentInfo: IStudentInfo;
  userId?: mongoose.Types.ObjectId;
  selectedSchool: mongoose.Types.ObjectId;
  selectedHub: mongoose.Types.ObjectId;
  interestedClasses: mongoose.Types.ObjectId[];
  status: StudentRegistrationStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const studentRegistrationSchema = new mongoose.Schema<IStudentRegistration>({
  studentInfo: {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    preferredLanguage: { type: String, trim: true },
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  selectedSchool: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  selectedHub: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hub',
    required: true,
  },
  interestedClasses: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ClassOffering' }],
    required: true,
    validate: [(value: unknown[]) => Array.isArray(value) && value.length > 0, 'Select at least one class'],
  },
  status: {
    type: String,
    enum: STUDENT_REGISTRATION_STATUSES,
    default: 'pending',
  },
  notes: { type: String, trim: true },
}, {
  timestamps: true,
  collection: 'student_registrations',
});

studentRegistrationSchema.index({ selectedSchool: 1, selectedHub: 1 });
studentRegistrationSchema.index({ 'studentInfo.email': 1, createdAt: -1 });
studentRegistrationSchema.index({ status: 1, createdAt: -1 });
studentRegistrationSchema.index({ userId: 1 });

if (mongoose.models.StudentRegistration) {
  delete mongoose.models.StudentRegistration;
}

export default mongoose.model<IStudentRegistration>('StudentRegistration', studentRegistrationSchema);
