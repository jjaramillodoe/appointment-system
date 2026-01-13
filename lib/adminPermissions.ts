import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AdminUser {
  userId: string;
  email: string;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  assignedHub?: string | null;
}

/**
 * Verify JWT token and extract admin information
 */
export function verifyAdminToken(token: string): AdminUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Check if user has admin access
 */
export function isAdmin(user: AdminUser | null): boolean {
  return user !== null && (user.isAdmin === true || user.isSuperAdmin === true);
}

/**
 * Check if user is a super admin
 */
export function isSuperAdmin(user: AdminUser | null): boolean {
  return user !== null && user.isSuperAdmin === true;
}

/**
 * Get hub filter for admin queries
 * Super admins see everything (no filter)
 * Regular admins only see their assigned hub
 */
export function getHubFilter(user: AdminUser | null): any {
  if (!user || !isAdmin(user)) {
    return null; // Not an admin, no access
  }

  // Super admins see everything
  if (isSuperAdmin(user)) {
    return {}; // Empty filter = all hubs
  }

  // Regular admins only see their assigned hub
  if (user.assignedHub) {
    return { hubId: new mongoose.Types.ObjectId(user.assignedHub) };
  }

  // Admin without assigned hub - no access (shouldn't happen, but safe)
  return null;
}

/**
 * Get hub filter for user queries (filter users by their closest hub)
 */
export function getUserHubFilter(user: AdminUser | null): any {
  if (!user || !isAdmin(user)) {
    return null;
  }

  if (isSuperAdmin(user)) {
    return {}; // Super admin sees all users
  }

  // Regular admins see users whose closestHub matches their assigned hub
  if (user.assignedHub) {
    // We need to get the hub name first, then filter by closestHub.name
    // This will be handled in the route by looking up the hub
    return { assignedHubId: user.assignedHub };
  }

  return null;
}

/**
 * Check if admin can access a specific hub
 */
export function canAccessHub(user: AdminUser | null, hubId: string): boolean {
  if (!user || !isAdmin(user)) {
    return false;
  }

  // Super admins can access all hubs
  if (isSuperAdmin(user)) {
    return true;
  }

  // Regular admins can only access their assigned hub
  return user.assignedHub === hubId;
}
