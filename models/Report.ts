import mongoose from 'mongoose';

export interface IReport extends mongoose.Document {
  name: string;
  type: 'appointments' | 'users' | 'hubs' | 'capacity' | 'daily_summary' | 'weekly_trends' | 'user_insights';
  status: 'processing' | 'ready' | 'failed';
  filePath?: string;
  fileSize?: number;
  generatedBy: string;
  parameters: {
    startDate?: string;
    endDate?: string;
    hubName?: string;
    filters?: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new mongoose.Schema<IReport>({
  name: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['appointments', 'users', 'hubs', 'capacity', 'daily_summary', 'weekly_trends', 'user_insights'] 
  },
  status: { 
    type: String, 
    default: 'processing', 
    enum: ['processing', 'ready', 'failed'] 
  },
  filePath: { type: String },
  fileSize: { type: Number },
  generatedBy: { type: String, required: true },
  parameters: {
    startDate: { type: String },
    endDate: { type: String },
    hubName: { type: String },
    filters: { type: Object }
  }
}, {
  timestamps: true
});

// Index for efficient queries
reportSchema.index({ type: 1, status: 1, createdAt: -1 });
reportSchema.index({ generatedBy: 1 });

if (mongoose.models.Report) {
  delete mongoose.models.Report;
}

export default mongoose.model<IReport>('Report', reportSchema); 