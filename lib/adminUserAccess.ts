import mongoose from 'mongoose';
import Hub from '@/models/Hub';
import {
  type AdminUser,
  isAdmin,
  isSuperAdmin,
} from '@/lib/adminPermissions';
import {
  type AppRole,
  flagsFromRole,
  getAssignedHubId,
  getRoleFromFlags,
  isValidRole,
} from '@/lib/userRoles';

export interface ActorHub {
  _id: mongoose.Types.ObjectId;
  name: string;
  location?: string;
}

export async function getActorHub(actor: AdminUser | null): Promise<ActorHub | null> {
  if (!actor?.assignedHub) return null;
  const hub = await Hub.findById(actor.assignedHub).select('_id name location').lean();
  if (!hub) return null;
  return {
    _id: hub._id as mongoose.Types.ObjectId,
    name: hub.name,
    location: hub.location,
  };
}

export function isUserInHub(target: any, hub: ActorHub): boolean {
  const assignedId = getAssignedHubId(target);
  if (assignedId && assignedId === hub._id.toString()) return true;
  if (target?.closestHub?.name && target.closestHub.name === hub.name) return true;
  return false;
}

export async function assertCanViewUser(
  actor: AdminUser | null,
  target: any
): Promise<string | null> {
  if (!isAdmin(actor)) return 'Admin access required';
  if (isSuperAdmin(actor)) return null;

  const hub = await getActorHub(actor);
  if (!hub) return 'Invalid hub assignment';
  if (!isUserInHub(target, hub)) {
    return 'You can only manage users in your assigned hub';
  }
  return null;
}

export async function assertCanMutateUser(
  actor: AdminUser | null,
  target: any,
  action: 'update' | 'delete' | 'reset-password'
): Promise<string | null> {
  const viewError = await assertCanViewUser(actor, target);
  if (viewError) return viewError;
  if (isSuperAdmin(actor)) return null;

  const targetRole = getRoleFromFlags(target);
  if (targetRole === 'super-admin') {
    return 'Hub admins cannot modify super-admins';
  }
  if ((action === 'delete' || action === 'reset-password') && targetRole === 'hub-admin') {
    return 'Only a super-admin can delete or reset passwords for hub admins';
  }
  return null;
}

export function assertCanAssignRole(
  actor: AdminUser | null,
  role: AppRole
): string | null {
  if (!isAdmin(actor)) return 'Admin access required';
  if (!isValidRole(role)) return 'Invalid role';
  if (isSuperAdmin(actor)) return null;
  if (role === 'super-admin') {
    return 'Hub admins cannot assign the super-admin role';
  }
  return null;
}

export function resolveCreateRole(
  actor: AdminUser | null,
  requestedRole?: unknown
): { role: AppRole; error?: string; flags: ReturnType<typeof flagsFromRole> } {
  const role: AppRole = isValidRole(requestedRole) ? requestedRole : 'user';
  const error = assertCanAssignRole(actor, role);
  return { role, error: error || undefined, flags: flagsFromRole(role) };
}

export function hubScopeFilter(hub: ActorHub) {
  return {
    $or: [
      { 'closestHub.name': hub.name },
      { assignedHub: hub._id },
    ],
  };
}

/**
 * Appointments are stored with hubName, hubId, or both.
 * Hub-admin queries must match either field for the assigned hub.
 */
export function appointmentHubFilter(hub: { _id: mongoose.Types.ObjectId | string; name: string }) {
  const hubId = typeof hub._id === 'string' ? new mongoose.Types.ObjectId(hub._id) : hub._id;
  return {
    $or: [{ hubId }, { hubName: hub.name }],
  };
}

export function slotHubFilter(hub: { name: string }) {
  return { hubName: hub.name };
}

export async function resolveAdminHubScope(actor: AdminUser | null): Promise<
  | { error: string }
  | { isSuperAdmin: true; hub: null }
  | { isSuperAdmin: false; hub: ActorHub }
> {
  if (!isAdmin(actor)) {
    return { error: 'Admin access required' };
  }
  if (isSuperAdmin(actor)) {
    return { isSuperAdmin: true, hub: null };
  }
  const hub = await getActorHub(actor);
  if (!hub) {
    return { error: 'No hub assigned to this admin account' };
  }
  return { isSuperAdmin: false, hub };
}

export async function resolveRequestedHub(
  actor: AdminUser | null,
  hubName?: string | null
): Promise<{ hub: ActorHub | null; error?: string; appointmentFilter: Record<string, unknown> }> {
  const scope = await resolveAdminHubScope(actor);
  if ('error' in scope) {
    return { hub: null, error: scope.error, appointmentFilter: {} };
  }

  if (!scope.isSuperAdmin) {
    return {
      hub: scope.hub,
      appointmentFilter: appointmentHubFilter(scope.hub),
    };
  }

  if (hubName && hubName !== 'all') {
    const hub = await Hub.findOne({ name: hubName }).select('_id name location').lean();
    if (!hub) {
      return { hub: null, error: 'Hub not found', appointmentFilter: {} };
    }
    const actorHub: ActorHub = {
      _id: hub._id as mongoose.Types.ObjectId,
      name: hub.name,
      location: hub.location,
    };
    return {
      hub: actorHub,
      appointmentFilter: appointmentHubFilter(actorHub),
    };
  }

  return { hub: null, appointmentFilter: {} };
}
