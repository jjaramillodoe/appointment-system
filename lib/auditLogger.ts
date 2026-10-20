import { logger } from '@/lib/logger';
import AuditLog from '@/models/AuditLog';
import dbConnect from '@/lib/mongodb';

export interface AuditLogParams {
  adminId: string;
  adminEmail: string;
  adminName: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'send' | 'bulk_action';
  resourceType: 'user' | 'appointment' | 'hub' | 'template' | 'reminder' | 'blackout' | 'communication' | 'settings' | 'schedule' | 'school' | 'class' | 'other';
  resourceId?: string;
  resourceName?: string;
  description: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  status?: 'success' | 'failed';
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  try {
    await dbConnect();

    const {
      adminId,
      adminEmail,
      adminName,
      action,
      resourceType,
      resourceId,
      resourceName,
      description,
      changes,
      status = 'success',
      errorMessage,
      ipAddress,
      userAgent,
      metadata,
    } = params;

    await AuditLog.create({
      adminId,
      adminEmail,
      adminName,
      action,
      resourceType,
      resourceId,
      resourceName,
      description,
      changes,
      status,
      errorMessage,
      ipAddress,
      userAgent,
      metadata,
    });
  } catch (error) {
    logger.error('Error logging audit event:', error);
  }
}

export function getClientIpAddress(request: any): string | undefined {
  if (!request) return undefined;

  const forwarded = request.headers?.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return request.headers?.get('x-client-ip') ||
    request.headers?.get('cf-connecting-ip');
}

export function getUserAgent(request: any): string | undefined {
  return request?.headers?.get('user-agent');
}
