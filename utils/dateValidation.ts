export interface DateValidationResult {
  isValid: boolean;
  error?: string;
  age?: number;
}

export function validateDateOfBirth(dateOfBirth: string): DateValidationResult {
  if (!dateOfBirth) {
    return {
      isValid: false,
      error: 'Date of birth is required'
    };
  }

  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  
  // Check if the date is valid
  if (isNaN(birthDate.getTime())) {
    return {
      isValid: false,
      error: 'Please enter a valid date'
    };
  }

  // Check if birth date is in the future
  if (birthDate > today) {
    return {
      isValid: false,
      error: 'Date of birth cannot be in the future'
    };
  }

  // Calculate age
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // Check if user is at least 21 years old
  if (age < 21) {
    return {
      isValid: false,
      error: `You must be at least 21 years old to register. You are currently ${age} years old.`
    };
  }

  return {
    isValid: true,
    age
  };
}

export function formatAge(age: number): string {
  if (age === 1) return '1 year old';
  return `${age} years old`;
}

export function getMinimumBirthDate(): string {
  const today = new Date();
  const minimumAge = 21;
  const minimumDate = new Date(today.getFullYear() - minimumAge, today.getMonth(), today.getDate());
  return minimumDate.toISOString().split('T')[0];
} 