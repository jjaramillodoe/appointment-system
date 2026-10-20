import mongoose from 'mongoose';

export interface IAppointment extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  appointmentDate: Date;
  appointmentTime?: string;
  hubName?: string;
  hubId?: mongoose.Types.ObjectId;
  slotId?: string;
  status: 'pending' | 'pending_profile' | 'confirmed' | 'cancelled' | 'completed' | 'expired' | 'no_show' | 'arrived';
  notes: string;
  adminNotes?: string;
  intakeType: 'adult-education';
  classInterest?: 'ESL' | 'BE/HSE';
  timePreference?: 'Morning' | 'Evening' | 'Saturday';
  confirmationToken?: string;
  preferredLanguage?: string;
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
    required: false,
    enum: [
      '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
      '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
      '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM',
    ],
  },
  hubName: {
    type: String,
    required: false,
  },
  hubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hub',
    required: false,
  },
  slotId: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['pending', 'pending_profile', 'confirmed', 'cancelled', 'completed', 'expired', 'no_show', 'arrived'],
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
  classInterest: {
    type: String,
    enum: ['ESL', 'BE/HSE'],
    required: false,
  },
  timePreference: {
    type: String,
    enum: ['Morning', 'Evening', 'Saturday'],
    required: false,
  },
  confirmationToken: {
    type: String,
    required: false,
  },
  preferredLanguage: {
    type: String,
    required: false,
  },
}, {
  timestamps: true,
});

// Index for userId (no longer unique - can have multiple appointments)
appointmentSchema.index({ userId: 1 });

if (mongoose.models.Appointment) {
  delete mongoose.models.Appointment;
}

export default mongoose.model<IAppointment>('Appointment', appointmentSchema); 