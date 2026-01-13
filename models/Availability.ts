import mongoose from 'mongoose';

export interface ISlot {
  time: string;
  capacity: number;
  booked: number;
}

export interface IAvailability extends mongoose.Document {
  hubId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD format
  slots: ISlot[];
  createdAt: Date;
  updatedAt: Date;
  getAvailableSlots(): ISlot[];
  bookSlot(time: string): Promise<IAvailability>;
  cancelBooking(time: string): Promise<IAvailability>;
}

const slotSchema = new mongoose.Schema({
  time: {
    type: String,
    required: [true, 'Time is required'],
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [0, 'Capacity cannot be negative'],
    default: 20,
  },
  booked: {
    type: Number,
    required: [true, 'Booked count is required'],
    min: [0, 'Booked count cannot be negative'],
    default: 0,
  },
}, { _id: false });

const availabilitySchema = new mongoose.Schema<IAvailability>({
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
    type: [slotSchema],
    required: [true, 'Slots are required'],
    default: [],
  },
}, {
  timestamps: true,
});

// Indexes
availabilitySchema.index({ hubId: 1, date: 1 }, { unique: true });
availabilitySchema.index({ hubId: 1 });
availabilitySchema.index({ date: 1 });

// Methods to check availability and book slots
availabilitySchema.methods.getAvailableSlots = function() {
  return this.slots.filter((slot: ISlot) => slot.capacity > slot.booked);
};

availabilitySchema.methods.bookSlot = function(time: string) {
  const slot = this.slots.find((s: ISlot) => s.time === time);
  if (!slot) {
    throw new Error('Slot not found');
  }
  if (slot.booked >= slot.capacity) {
    throw new Error('Slot is fully booked');
  }
  slot.booked += 1;
  return this.save();
};

availabilitySchema.methods.cancelBooking = function(time: string) {
  const slot = this.slots.find((s: ISlot) => s.time === time);
  if (!slot) {
    throw new Error('Slot not found');
  }
  if (slot.booked <= 0) {
    throw new Error('No bookings to cancel');
  }
  slot.booked -= 1;
  return this.save();
};

if (mongoose.models.Availability) {
  delete mongoose.models.Availability;
}

export default mongoose.model<IAvailability>('Availability', availabilitySchema); 