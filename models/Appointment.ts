import mongoose from 'mongoose';

export interface IAppointment extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  appointmentDate: Date;
  appointmentTime: string;
  hubName: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
  adminNotes?: string;
  intakeType: 'adult-education';
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new mongoose.Schema<IAppointment>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required'],
  },
  appointmentTime: {
    type: String,
    required: [true, 'Appointment time is required'],
    enum: [
      '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
      '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
      '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'
    ],
  },
  hubName: {
    type: String,
    required: [true, 'Hub name is required'],
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
  },
  notes: {
    type: String,
    trim: true,
  },
  adminNotes: {
    type: String,
    trim: true,
  },
  intakeType: {
    type: String,
    required: [true, 'Intake type is required'],
    enum: ['adult-education'],
    default: 'adult-education',
  },
}, {
  timestamps: true,
});

// Ensure only one appointment per user
appointmentSchema.index({ userId: 1 }, { unique: true });

export default mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', appointmentSchema); 