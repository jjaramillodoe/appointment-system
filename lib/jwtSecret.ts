const DEV_FALLBACK_SECRET = 'your-secret-key';

/**
 * Resolve the JWT signing secret. Read lazily (not at module load) so builds
 * don't fail when JWT_SECRET is only present at runtime.
 * Production must set JWT_SECRET; a missing secret would let anyone forge tokens.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is not set. Refusing to sign or verify tokens in production.');
  }

  return DEV_FALLBACK_SECRET;
}
