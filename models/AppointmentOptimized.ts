import mongoose from 'mongoose';

export interface IAppointment extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  hubId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD format
  time: string; // 24h format like "09:00"
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
  hubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hub',
    required: [true, 'Hub ID is required'],
  },
  date: {
    type: String,
    required: [true, 'Appointment date is required'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
  },
  time: {
    type: String,
    required: [true, 'Appointment time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'],
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
    default: '',
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

// Optimized indexes for better performance
appointmentSchema.index({ userId: 1, date: 1 }); // User lookup with date
appointmentSchema.index({ hubId: 1, date: 1, time: 1 }); // Conflict checks and hub queries
appointmentSchema.index({ status: 1 }); // Status-based queries
appointmentSchema.index({ createdAt: 1 }); // Time-based queries
// appointmentSchema.index({ userId: 1 }, { unique: true }); // Removed: Users can have multiple appointments

if (mongoose.models.AppointmentOptimized) {
  delete mongoose.models.AppointmentOptimized;
}

export default mongoose.model<IAppointment>('AppointmentOptimized', appointmentSchema); 