export const APPOINTMENT_STATUS = {
  PENDING_PROFILE: 'pending_profile',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  PENDING: 'pending',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show',
  ARRIVED: 'arrived',
} as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[keyof typeof APPOINTMENT_STATUS];

export const APPOINTMENT_STATUS_VALUES = Object.values(APPOINTMENT_STATUS);

export const ACTIVE_APPOINTMENT_STATUSES = [
  APPOINTMENT_STATUS.PENDING,
  APPOINTMENT_STATUS.PENDING_PROFILE,
  APPOINTMENT_STATUS.CONFIRMED,
  APPOINTMENT_STATUS.ARRIVED,
] as const;

export const HISTORY_APPOINTMENT_STATUSES = [
  APPOINTMENT_STATUS.CANCELLED,
  APPOINTMENT_STATUS.COMPLETED,
  APPOINTMENT_STATUS.EXPIRED,
  APPOINTMENT_STATUS.NO_SHOW,
] as const;

export function isPendingProfile(status?: string | null): boolean {
  return status === APPOINTMENT_STATUS.PENDING_PROFILE || status === 'PENDING_PROFILE';
}

export function appointmentStatusLabel(status?: string | null): string {
  switch (status) {
    case APPOINTMENT_STATUS.PENDING_PROFILE:
    case 'PENDING_PROFILE':
      return 'Action Required';
    case APPOINTMENT_STATUS.CONFIRMED:
    case 'CONFIRMED':
      return 'Confirmed';
    case APPOINTMENT_STATUS.CANCELLED:
    case 'CANCELLED':
      return 'Cancelled';
    case APPOINTMENT_STATUS.EXPIRED:
    case 'EXPIRED':
      return 'Expired';
    case APPOINTMENT_STATUS.PENDING:
      return 'Pending';
    case APPOINTMENT_STATUS.COMPLETED:
      return 'Completed';
    case APPOINTMENT_STATUS.NO_SHOW:
      return 'No-show';
    case APPOINTMENT_STATUS.ARRIVED:
      return 'Arrived';
    default:
      return status ? status.replace(/_/g, ' ') : 'Unknown';
  }
}

export function bookingStatusForProfile(profileCompleted: boolean): AppointmentStatus {
  return profileCompleted ? APPOINTMENT_STATUS.CONFIRMED : APPOINTMENT_STATUS.PENDING_PROFILE;
}
