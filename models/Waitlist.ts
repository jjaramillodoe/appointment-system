import mongoose from 'mongoose';

export interface IWaitlist extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  hubId: mongoose.Types.ObjectId;
  hubName: string;
  timePreference?: 'Morning' | 'Evening' | 'Saturday';
  classInterest?: 'ESL' | 'BE/HSE';
  status: 'waiting' | 'notified' | 'booked' | 'cancelled';
  notifiedAt?: Date;
  createdAt: Date;
}

const waitlistSchema = new mongoose.Schema<IWaitlist>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hub', required: true },
  hubName: { type: String, required: true },
  timePreference: { type: String, enum: ['Morning', 'Evening', 'Saturday'] },
  classInterest: { type: String, enum: ['ESL', 'BE/HSE'] },
  status: { type: String, enum: ['waiting', 'notified', 'booked', 'cancelled'], default: 'waiting' },
  // When the latest seat offer was sent; offers expire so the next person can be asked
  notifiedAt: { type: Date },
}, { timestamps: true });

waitlistSchema.index({ hubName: 1, status: 1, createdAt: 1 });
waitlistSchema.index({ hubId: 1, status: 1, createdAt: 1 });

export default mongoose.models.Waitlist || mongoose.model<IWaitlist>('Waitlist', waitlistSchema);
