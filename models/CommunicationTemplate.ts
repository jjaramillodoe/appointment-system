import mongoose from 'mongoose';

export interface ICommunicationTemplate extends mongoose.Document {
  name: string;
  subject: string;
  body: string;
  description?: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const communicationTemplateSchema = new mongoose.Schema<ICommunicationTemplate>({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    unique: true,
  },
  subject: {
    type: String,
    required: [true, 'Email subject is required'],
    trim: true,
  },
  body: {
    type: String,
    required: [true, 'Email body is required'],
  },
  description: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.CommunicationTemplate || mongoose.model<ICommunicationTemplate>('CommunicationTemplate', communicationTemplateSchema);
