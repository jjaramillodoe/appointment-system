export type AppRole = 'super-admin' | 'hub-admin' | 'user';

export const APP_ROLES: AppRole[] = ['super-admin', 'hub-admin', 'user'];

export const ROLE_LABELS: Record<AppRole, string> = {
  'super-admin': 'Super Admin',
  'hub-admin': 'Hub Admin',
  user: 'User',
};

export function getRoleFromFlags(user: {
  isSuperAdmin?: boolean | null;
  isAdmin?: boolean | null;
}): AppRole {
  if (user?.isSuperAdmin) return 'super-admin';
  if (user?.isAdmin) return 'hub-admin';
  return 'user';
}

export function flagsFromRole(role: AppRole): {
  isAdmin: boolean;
  isSuperAdmin: boolean;
} {
  switch (role) {
    case 'super-admin':
      return { isAdmin: true, isSuperAdmin: true };
    case 'hub-admin':
      return { isAdmin: true, isSuperAdmin: false };
    default:
      return { isAdmin: false, isSuperAdmin: false };
  }
}

export function isValidRole(value: unknown): value is AppRole {
  return value === 'super-admin' || value === 'hub-admin' || value === 'user';
}

export function getAssignedHubId(user: { assignedHub?: unknown }): string | null {
  const assignedHub = user?.assignedHub;
  if (!assignedHub) return null;
  if (typeof assignedHub === 'string') return assignedHub;
  if (typeof assignedHub === 'object' && assignedHub !== null) {
    const maybeId = assignedHub as { _id?: unknown; toString?: () => string };
    if (maybeId._id) return String(maybeId._id);
    if (typeof maybeId.toString === 'function') {
      const value = maybeId.toString();
      if (value && value !== '[object Object]') return value;
    }
  }
  return null;
}

export const USER_UPDATE_FIELDS = [
  'firstName',
  'middleName',
  'lastName',
  'email',
  'phone',
  'preferredLanguage',
  'additionalLanguages',
  'dateOfBirth',
  'sex',
  'educationLevel',
  'employmentStatus',
  'employerName',
  'jobTitle',
  'schoolInterest',
  'programInterests',
  'heardFrom',
  'barriersToLearning',
  'homeAddress',
  'address',
  'emergencyContact',
  'closestHub',
  'profileCompleted',
] as const;

export type UserUpdateField = (typeof USER_UPDATE_FIELDS)[number];

export function pickUserUpdateFields(input: Record<string, unknown>) {
  const update: Record<string, unknown> = {};
  for (const field of USER_UPDATE_FIELDS) {
    if (input[field] !== undefined) {
      update[field] = input[field];
    }
  }
  return update;
}
