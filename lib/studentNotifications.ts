import Notification from '@/models/Notification';

export async function notifyStudent(params: {
  userId: string;
  title: string;
  message: string;
  hubName?: string;
  appointmentId?: string;
  type?: 'appointment' | 'reminder' | 'system' | 'no_show';
}) {
  await Notification.create({
    type: params.type || 'appointment',
    title: params.title,
    message: params.message,
    userId: params.userId,
    hubName: params.hubName,
    appointmentId: params.appointmentId,
    priority: 'medium',
  });
}
