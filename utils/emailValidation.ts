import emailValidator from 'email-validator';

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  suggestions?: string[];
}

export function validateEmail(email: string): EmailValidationResult {
  // Basic validation
  if (!email) {
    return {
      isValid: false,
      error: 'Email is required'
    };
  }

  // Trim whitespace
  const trimmedEmail = email.trim();
  
  // Check if email is valid using email-validator
  if (!emailValidator.validate(trimmedEmail)) {
    // Provide helpful suggestions
    const suggestions: string[] = [];
    
    if (!trimmedEmail.includes('@')) {
      suggestions.push('Email must contain @ symbol');
    }
    
    if (!trimmedEmail.includes('.')) {
      suggestions.push('Email must contain a domain (e.g., .com, .org)');
    }
    
    if (trimmedEmail.startsWith('@')) {
      suggestions.push('Email cannot start with @');
    }
    
    if (trimmedEmail.endsWith('@')) {
      suggestions.push('Email cannot end with @');
    }
    
    if (trimmedEmail.includes('..')) {
      suggestions.push('Email cannot contain consecutive dots');
    }
    
    if (trimmedEmail.includes('@@')) {
      suggestions.push('Email cannot contain consecutive @ symbols');
    }
    
    return {
      isValid: false,
      error: 'Please enter a valid email address',
      suggestions
    };
  }

  // Additional checks for common mistakes
  const [localPart, domain] = trimmedEmail.split('@');
  
  if (localPart.length === 0) {
    return {
      isValid: false,
      error: 'Email must have a username before @'
    };
  }
  
  if (domain.length === 0) {
    return {
      isValid: false,
      error: 'Email must have a domain after @'
    };
  }
  
  if (domain.length < 2) {
    return {
      isValid: false,
      error: 'Domain must be at least 2 characters'
    };
  }
  
  // Check for common disposable email domains (optional)
  const disposableDomains = [
    'tempmail.com',
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
    'yopmail.com'
  ];
  
  if (disposableDomains.some(domain => trimmedEmail.toLowerCase().includes(domain))) {
    return {
      isValid: true, // Still valid, but warn user
      error: 'Consider using a permanent email address for important communications'
    };
  }

  return {
    isValid: true
  };
}

export function getEmailSuggestions(email: string): string[] {
  const suggestions: string[] = [];
  
  if (email.includes('gmail.com') && email.includes('..')) {
    suggestions.push('Did you mean: ' + email.replace(/\.+/g, '.'));
  }
  
  if (email.includes('@gmail') && !email.includes('@gmail.com')) {
    suggestions.push('Did you mean: ' + email.replace('@gmail', '@gmail.com'));
  }
  
  if (email.includes('@yahoo') && !email.includes('@yahoo.com')) {
    suggestions.push('Did you mean: ' + email.replace('@yahoo', '@yahoo.com'));
  }
  
  if (email.includes('@hotmail') && !email.includes('@hotmail.com')) {
    suggestions.push('Did you mean: ' + email.replace('@hotmail', '@hotmail.com'));
  }
  
  return suggestions;
} 