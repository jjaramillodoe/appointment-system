import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

import { getJwtSecret } from '@/lib/jwtSecret';

export interface AdminUser {
  userId: string;
  email: string;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  assignedHub?: string | null;
}

/**
 * Verify JWT token, then load the user's current permissions from the database.
 * Role flags in the token are ignored so demotions and deletions take effect immediately.
 */
export async function verifyAdminToken(token: string): Promise<AdminUser | null> {
  let decoded: AdminUser;
  try {
    decoded = jwt.verify(token, getJwtSecret()) as AdminUser;
  } catch (error) {
    return null;
  }

  if (!decoded?.userId || !mongoose.isValidObjectId(decoded.userId)) return null;

  await dbConnect();
  const user = await User.findById(decoded.userId)
    .select('email isAdmin isSuperAdmin assignedHub')
    .lean();
  if (!user) return null;

  return {
    userId: String(user._id),
    email: user.email,
    isAdmin: user.isAdmin === true,
    isSuperAdmin: user.isSuperAdmin === true,
    assignedHub: user.assignedHub ? String(user.assignedHub) : null,
  };
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
