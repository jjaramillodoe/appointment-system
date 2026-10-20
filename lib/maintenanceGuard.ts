import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, isSuperAdmin, verifyAdminToken, type AdminUser } from '@/lib/adminPermissions';

export const CLEAR_DATA_CONFIRMATION = 'CLEAR DATA';
export const RESEED_CONFIRMATION = 'CONFIRM_RESEED';
export const ARCHIVE_CONFIRMATION = 'ARCHIVE DATA';
export const PURGE_CONFIRMATION = 'PURGE DATA';

export function isProductionEnvironment() {
  return process.env.NODE_ENV === 'production';
}

export async function requireSuperAdmin(request: NextRequest): Promise<AdminUser | NextResponse> {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const adminUser = await verifyAdminToken(token);

  if (!isAdmin(adminUser) || !isSuperAdmin(adminUser) || !adminUser) {
    return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
  }

  return adminUser;
}

export function denyIfProductionLocked(confirmProduction?: boolean) {
  if (!isProductionEnvironment()) return null;
  if (confirmProduction === true) return null;

  return NextResponse.json({
    error: 'This action is blocked in production. Recheck the production override to continue.',
    production: true,
    requiresProductionConfirmation: true,
  }, { status: 409 });
}

export function confirmationMismatch(actual: unknown, expected: string | string[]) {
  const allowed = Array.isArray(expected) ? expected : [expected];
  const value = typeof actual === 'string' ? actual.trim() : '';
  if (allowed.includes(value)) return null;

  return NextResponse.json({
    error: `Type ${allowed.map((item) => `"${item}"`).join(' or ')} to confirm.`,
    production: isProductionEnvironment(),
  }, { status: 400 });
}

export function withProductionFlag<T extends Record<string, unknown>>(payload: T) {
  return { ...payload, production: isProductionEnvironment() };
}
