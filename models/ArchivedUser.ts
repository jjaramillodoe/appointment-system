import mongoose from 'mongoose';

const archivedUserSchema = new mongoose.Schema({
  originalId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  archivedAt: { type: Date, required: true, default: Date.now },
  archivedBy: { type: String, required: true },
  olderThan: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
}, { collection: 'archived_users', timestamps: false });

export default mongoose.models.ArchivedUser
  || mongoose.model('ArchivedUser', archivedUserSchema);
