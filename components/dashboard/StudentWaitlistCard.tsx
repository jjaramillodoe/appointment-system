'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import type { Dictionary } from '@/lib/i18n/dictionaries/en';

interface WaitlistEntry {
  _id: string;
  hubName?: string;
  timePreference?: string;
  classInterest?: string;
  status: string;
}

function timeWindowLabel(t: Dictionary, value?: string) {
  if (!value) return '';
  const windows: Record<string, string> = t.slots.timePreferences;
  return windows[value]?.split(' (')[0] ?? value;
}

export default function StudentWaitlistCard() {
  const { token } = useAuth();
  const { t } = useI18n();
  const copy = t.dashboard.waitlist;
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [error, setError] = useState('');

  const load = async () => {
    if (!token) return;
    const response = await fetch('/api/waitlist', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || copy.loadFailed);
      return;
    }
    setEntries(data.entries || []);
  };

  useEffect(() => {
    void load();
  }, [token]);

  const leave = async (entryId: string) => {
    if (!token) return;
    setError('');
    const response = await fetch('/api/waitlist', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ entryId }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || copy.leaveFailed);
      return;
    }
    await load();
  };

  if (!token || entries.length === 0) return null;

  return (
    <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{copy.title}</h3>
      <p className="text-sm text-gray-600 mb-4">{copy.intro}</p>
      {error && <p className="mb-3 text-sm text-red-600" role="alert">{error}</p>}
      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 p-3">
            <div>
              <p className="font-medium text-gray-900">{entry.hubName || t.dashboard.common.learningCenter}</p>
              <p className="text-sm text-gray-600">
                {entry.classInterest || copy.programTbd} · {timeWindowLabel(t, entry.timePreference) || copy.anyTime} · {entry.status === 'notified' ? copy.seatOpened : copy.waiting}
              </p>
            </div>
            <button
              type="button"
              onClick={() => leave(entry._id)}
              className="text-sm font-semibold text-primary-700 hover:text-primary-800"
            >
              {copy.leave}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
