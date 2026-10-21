import User from '@/models/User';
import { resolveRequestedHub } from '@/lib/adminUserAccess';
import type { AdminUser } from '@/lib/adminPermissions';
import { isAppointmentStatus } from '@/lib/appointmentStatus';
import { utcDayBounds } from '@/lib/slotDateTime';

const SORTABLE_FIELDS = new Set(['appointmentDate', 'appointmentTime', 'status', 'hubName', 'createdAt']);

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Filter shared by the admin appointment list and its CSV export, so an export
 * always contains exactly what the table shows.
 */
export async function buildAdminAppointmentQuery(adminUser: AdminUser | null, searchParams: URLSearchParams) {
  const search = (searchParams.get('search') || '').trim();
  const hubName = searchParams.get('hubName') || '';
  const status = searchParams.get('status') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const sortBy = searchParams.get('sortBy') || 'appointmentDate';
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

  const hubScope = await resolveRequestedHub(adminUser, hubName);
  if (hubScope.error) return { error: hubScope.error };

  const conditions: Record<string, unknown>[] = [];
  if (Object.keys(hubScope.appointmentFilter).length > 0) {
    conditions.push(hubScope.appointmentFilter);
  }

  if (search) {
    // Student details live on the User, not the appointment
    const pattern = new RegExp(escapeRegex(search), 'i');
    const digits = search.replace(/\D/g, '');
    const userMatch: Record<string, unknown>[] = [
      { firstName: pattern },
      { lastName: pattern },
      { email: pattern },
    ];
    if (digits.length >= 3) userMatch.push({ phone: new RegExp(escapeRegex(digits)) });
    const [first, ...rest] = search.split(/\s+/);
    if (rest.length) {
      userMatch.push({
        firstName: new RegExp(escapeRegex(first), 'i'),
        lastName: new RegExp(escapeRegex(rest.join(' ')), 'i'),
      });
    }
    const users = await User.find({ $or: userMatch }).select('_id').limit(500).lean();
    conditions.push({
      $or: [
        { userId: { $in: users.map((user) => user._id) } },
        { hubName: pattern },
      ],
    });
  }

  if (status && isAppointmentStatus(status)) {
    conditions.push({ status });
  }

  if (startDate || endDate) {
    const appointmentDate: Record<string, Date> = {};
    if (startDate) appointmentDate.$gte = utcDayBounds(startDate).start;
    if (endDate) appointmentDate.$lt = utcDayBounds(endDate).end;
    conditions.push({ appointmentDate });
  }

  const sortField = SORTABLE_FIELDS.has(sortBy) ? sortBy : 'appointmentDate';
  return {
    filter: conditions.length ? { $and: conditions } : {},
    sort: { [sortField]: sortOrder, _id: sortOrder } as Record<string, 1 | -1>,
  };
}
