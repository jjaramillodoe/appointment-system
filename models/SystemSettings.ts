import mongoose from 'mongoose';

export interface ISystemSettings extends mongoose.Document {
  bookingWindowDays: number;
  reminderHours: number;
  maxActiveAppointments: number;
  requireProfileBeforeConfirm: boolean;
  programQuotasEnabled: boolean;
  defaultCapacity: number;
  updatedAt: Date;
}

const systemSettingsSchema = new mongoose.Schema<ISystemSettings>({
  bookingWindowDays: { type: Number, default: 7 },
  reminderHours: { type: Number, default: 24 },
  maxActiveAppointments: { type: Number, default: 1 },
  requireProfileBeforeConfirm: { type: Boolean, default: true },
  programQuotasEnabled: { type: Boolean, default: false },
  defaultCapacity: { type: Number, default: 20 },
}, { timestamps: true });

export default mongoose.models.SystemSettings || mongoose.model<ISystemSettings>('SystemSettings', systemSettingsSchema);
