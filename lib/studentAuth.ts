import jwt from 'jsonwebtoken';

import { getJwtSecret } from '@/lib/jwtSecret';

export interface StudentToken {
  userId: string;
  email: string;
}

export function verifyStudentToken(authHeader: string | null): StudentToken | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.substring(7), getJwtSecret()) as StudentToken;
  } catch {
    return null;
  }
}
