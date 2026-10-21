'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';

interface StudentNotification {
  _id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsInbox() {
  const { token } = useAuth();
  const { t } = useI18n();
  const copy = t.dashboard.inbox;
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<StudentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = async () => {
    if (!token) return;
    const response = await fetch('/api/notifications', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return;
    const data = await response.json();
    setItems(data.notifications || []);
    setUnreadCount(data.unreadCount || 0);
  };

  useEffect(() => {
    void load();
  }, [token]);

  const markAll = async () => {
    if (!token) return;
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ markAll: true }),
    });
    await load();
  };

  const markOne = async (notificationId: string) => {
    if (!token) return;
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ notificationId }),
    });
    await load();
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((value) => !value);
          if (!open) void load();
        }}
        className="flex items-center space-x-2 text-primary-100 hover:text-white transition-colors px-2 py-2 md:px-3 rounded-lg hover:bg-white/10"
        aria-label={copy.label}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        <span className="hidden md:inline text-sm font-medium" aria-hidden>{copy.label}</span>
        {unreadCount > 0 && (
          <span className="rounded-full bg-yellow-400 px-1.5 text-xs font-bold text-primary-900">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-lg bg-white p-3 text-gray-800 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">{copy.title}</p>
            <button onClick={markAll} className="text-xs text-primary-700">{copy.markAll}</button>
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {items.length === 0 && <p className="text-sm text-gray-500">{copy.empty}</p>}
            {items.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => {
                  if (!item.read) void markOne(item._id);
                }}
                className={`w-full rounded-md p-2 text-left text-sm ${item.read ? 'bg-gray-50' : 'bg-blue-50'}`}
              >
                <p className="font-medium">{item.title}</p>
                <p className="text-gray-600">{item.message}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
