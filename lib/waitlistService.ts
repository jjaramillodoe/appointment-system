import Waitlist from '@/models/Waitlist';
import User from '@/models/User';
import { sendWaitlistAvailableEmail } from '@/lib/emailService';
import { notifyStudent } from '@/lib/studentNotifications';

export async function notifyWaitlistEntry(entry: { userId: unknown; hubName?: string }, hubName: string) {
  const user = await User.findById(entry.userId);
  if (!user?.email) return;
  const site = hubName || entry.hubName || 'your learning center';
  await sendWaitlistAvailableEmail({
    recipientEmail: user.email,
    recipientName: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'there',
    appointmentDate: '',
    appointmentTime: '',
    hubName: site,
    profileUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
  });
  await notifyStudent({
    userId: String(user._id),
    title: 'Se abrió un cupo / A seat opened',
    message: `Se abrió un cupo en ${site}. Resérvelo desde su panel. / A seat opened at ${site}. Book it from your dashboard.`,
    hubName: site,
    type: 'appointment',
  });
}

export async function promoteWaitlist(hubId: string, hubName: string) {
  const next = await Waitlist.findOneAndUpdate(
    { hubId, status: 'waiting' },
    { $set: { status: 'notified' } },
    { sort: { createdAt: 1 }, returnDocument: 'after' }
  );
  if (!next) return null;
  await notifyWaitlistEntry(next, hubName);
  return next;
}
