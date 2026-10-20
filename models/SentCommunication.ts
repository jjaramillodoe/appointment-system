import mongoose from 'mongoose';

export interface ISentCommunication extends mongoose.Document {
  templateId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  subject: string;
  body: string;
  status: 'sent' | 'failed';
  error?: string;
  sentAt: Date;
  recipientEmail: string;
  recipientName: string;
}

const sentCommunicationSchema = new mongoose.Schema<ISentCommunication>({
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunicationTemplate',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['sent', 'failed'],
    default: 'sent',
  },
  error: String,
  sentAt: {
    type: Date,
    default: Date.now,
  },
  recipientEmail: {
    type: String,
    required: true,
  },
  recipientName: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

// Index for tracking sent communications
sentCommunicationSchema.index({ userId: 1, templateId: 1, sentAt: -1 });

export default mongoose.models.SentCommunication || mongoose.model<ISentCommunication>('SentCommunication', sentCommunicationSchema);
