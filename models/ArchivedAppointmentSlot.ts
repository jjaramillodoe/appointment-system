import mongoose from 'mongoose';

const archivedAppointmentSlotSchema = new mongoose.Schema({
  originalId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  archivedAt: { type: Date, required: true, default: Date.now },
  archivedBy: { type: String, required: true },
  olderThan: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
}, { collection: 'archived_appointment_slots', timestamps: false });

export default mongoose.models.ArchivedAppointmentSlot
  || mongoose.model('ArchivedAppointmentSlot', archivedAppointmentSlotSchema);
