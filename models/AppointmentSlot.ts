import mongoose from 'mongoose';

export interface IAppointmentSlot extends mongoose.Document {
  hubName: string;
  date: Date;
  time: string;
  capacity: number;
  bookedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSlotSchema = new mongoose.Schema<IAppointmentSlot>({
  hubName: {
    type: String,
    required: [true, 'Hub name is required'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  time: {
    type: String,
    required: [true, 'Time is required'],
    enum: [
      '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
      '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
      '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'
    ],
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    default: 1,
  },
  bookedCount: {
    type: Number,
    required: [true, 'Booked count is required'],
    min: [0, 'Booked count cannot be negative'],
    default: 0,
  },
  isActive: {
    type: Boolean,
    required: [true, 'Active status is required'],
    default: true,
  },
}, {
  timestamps: true,
});

// Ensure unique combination of hub, date, and time
appointmentSlotSchema.index({ hubName: 1, date: 1, time: 1 }, { unique: true });

// Virtual for available spots
appointmentSlotSchema.virtual('availableSpots').get(function() {
  return Math.max(0, this.capacity - this.bookedCount);
});

// Method to check if slot is available
appointmentSlotSchema.methods.isAvailable = function() {
  return this.isActive && this.bookedCount < this.capacity;
};

// Method to book a spot
appointmentSlotSchema.methods.bookSpot = function() {
  if (this.isAvailable()) {
    this.bookedCount += 1;
    return true;
  }
  return false;
};

// Method to cancel a booking
appointmentSlotSchema.methods.cancelBooking = function() {
  if (this.bookedCount > 0) {
    this.bookedCount -= 1;
    return true;
  }
  return false;
};

export default mongoose.models.AppointmentSlot || mongoose.model<IAppointmentSlot>('AppointmentSlot', appointmentSlotSchema); 