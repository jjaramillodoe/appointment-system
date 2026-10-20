import mongoose from 'mongoose';

export interface IPasswordResetToken extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
}

const passwordResetTokenSchema = new mongoose.Schema<IPasswordResetToken>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.PasswordResetToken
  || mongoose.model<IPasswordResetToken>('PasswordResetToken', passwordResetTokenSchema);
