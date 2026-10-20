import mongoose from 'mongoose';

export interface IAuditLog extends mongoose.Document {
  adminId: mongoose.Types.ObjectId;
  adminEmail: string;
  adminName: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'send' | 'bulk_action';
  resourceType: 'user' | 'appointment' | 'hub' | 'template' | 'reminder' | 'blackout' | 'communication' | 'settings' | 'schedule' | 'other';
  resourceId?: string;
  resourceName?: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  description: string;
  status: 'success' | 'failed';
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const auditLogSchema = new mongoose.Schema<IAuditLog>({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  adminEmail: {
    type: String,
    required: true,
  },
  adminName: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'login', 'logout', 'export', 'send', 'bulk_action'],
    required: true,
  },
  resourceType: {
    type: String,
    enum: ['user', 'appointment', 'hub', 'template', 'reminder', 'blackout', 'communication', 'settings', 'schedule', 'other'],
    required: true,
  },
  resourceId: String,
  resourceName: String,
  changes: [
    {
      field: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
    },
  ],
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success',
  },
  errorMessage: String,
  ipAddress: String,
  userAgent: String,
  metadata: mongoose.Schema.Types.Mixed,
}, {
  timestamps: true,
});

// Indexes for efficient querying
auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, createdAt: -1 });
auditLogSchema.index({ resourceId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ adminEmail: 1 });

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
