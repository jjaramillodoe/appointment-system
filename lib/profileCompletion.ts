export type ProfileUser = {
  dateOfBirth?: unknown;
  sex?: string | null;
  phone?: string | null;
  address?: AddressLike | null;
  homeAddress?: AddressLike | null;
  emergencyContact?: {
    name?: string | null;
    relationship?: string | null;
    phone?: string | null;
  } | null;
  educationLevel?: string | null;
  programInterests?: string[] | null;
  schoolInterest?: string | null;
};

type AddressLike = {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
};

export type ProfileCompletion = {
  isComplete: boolean;
  percentage: number;
  missingFields: string[];
};

function hasValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.some((item) => hasValue(item));
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  if (typeof value === 'string') return value.trim().length > 0;
  return value !== null && value !== undefined && value !== '';
}

function resolveAddress(user: ProfileUser): AddressLike {
  const address = user.address || {};
  const home = user.homeAddress || {};
  return {
    street: address.street || home.street,
    city: address.city || home.city,
    state: address.state || home.state,
    zipCode: address.zipCode || home.zipCode,
  };
}

const REQUIRED_FIELDS: Array<{ name: string; getValue: (user: ProfileUser) => unknown }> = [
  { name: 'dateOfBirth', getValue: (user) => user.dateOfBirth },
  { name: 'sex', getValue: (user) => user.sex },
  { name: 'phone', getValue: (user) => user.phone },
  { name: 'address.street', getValue: (user) => resolveAddress(user).street },
  { name: 'address.city', getValue: (user) => resolveAddress(user).city },
  { name: 'address.state', getValue: (user) => resolveAddress(user).state },
  { name: 'address.zipCode', getValue: (user) => resolveAddress(user).zipCode },
  { name: 'emergencyContact.name', getValue: (user) => user.emergencyContact?.name },
  { name: 'emergencyContact.relationship', getValue: (user) => user.emergencyContact?.relationship },
  { name: 'emergencyContact.phone', getValue: (user) => user.emergencyContact?.phone },
  { name: 'educationLevel', getValue: (user) => user.educationLevel },
  { name: 'programInterests', getValue: (user) => user.programInterests },
  { name: 'schoolInterest', getValue: (user) => user.schoolInterest },
];

export function calculateProfileCompletion(user: ProfileUser | null | undefined): ProfileCompletion {
  if (!user) {
    return {
      isComplete: false,
      percentage: 0,
      missingFields: REQUIRED_FIELDS.map((field) => field.name),
    };
  }

  const missingFields = REQUIRED_FIELDS
    .filter((field) => !hasValue(field.getValue(user)))
    .map((field) => field.name);

  const completedCount = REQUIRED_FIELDS.length - missingFields.length;
  const percentage = Math.round((completedCount / REQUIRED_FIELDS.length) * 100);

  return {
    isComplete: missingFields.length === 0,
    percentage,
    missingFields,
  };
}

export function isProfileComplete(user: ProfileUser | null | undefined): boolean {
  return calculateProfileCompletion(user).isComplete;
}
