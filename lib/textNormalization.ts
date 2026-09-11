// Normalize text by removing accents and special characters
// Keeps only alphanumeric, spaces, and basic punctuation
export function normalizeText(text: string): string {
  if (!text) return text;

  // Normalize unicode - decompose accented characters
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Remove diacritics
    .replace(/[^\w\s\-./]/g, ''); // Keep alphanumeric, spaces, hyphen, dot, slash
}

// Normalize all string fields in an object
export function normalizeProfileFields(data: any): any {
  const normalized = { ...data };

  const stringFields = [
    'firstName',
    'middleName',
    'lastName',
    'email',
    'phone',
    'employerName',
    'jobTitle',
    'schoolInterest',
  ];

  const addressFields = ['street', 'city', 'state', 'zipCode'];
  const emergencyContactFields = ['name', 'relationship', 'phone'];

  // Normalize simple string fields
  stringFields.forEach(field => {
    if (normalized[field] && typeof normalized[field] === 'string') {
      normalized[field] = normalizeText(normalized[field]);
    }
  });

  // Normalize address fields
  ['address', 'homeAddress'].forEach(addressType => {
    if (normalized[addressType]) {
      addressFields.forEach(field => {
        if (normalized[addressType][field]) {
          normalized[addressType][field] = normalizeText(normalized[addressType][field]);
        }
      });
    }
  });

  // Normalize emergency contact fields
  if (normalized.emergencyContact) {
    emergencyContactFields.forEach(field => {
      if (normalized.emergencyContact[field]) {
        normalized.emergencyContact[field] = normalizeText(normalized.emergencyContact[field]);
      }
    });
  }

  return normalized;
}
