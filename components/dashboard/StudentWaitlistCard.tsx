'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface WaitlistEntry {
  _id: string;
  hubName?: string;
  timePreference?: string;
  classInterest?: string;
  status: string;
}

export default function StudentWaitlistCard() {
  const { token } = useAuth();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [error, setError] = useState('');

  const load = async () => {
    if (!token) return;
    const response = await fetch('/api/waitlist', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Unable to load waitlist');
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
      setError(data.error || 'Unable to leave the waitlist');
      return;
    }
    await load();
  };

  if (!token || entries.length === 0) return null;

  return (
    <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Waitlist</h3>
      <p className="text-sm text-gray-600 mb-4">
        We will email you and send an inbox message if a seat opens at these sites.
      </p>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 p-3">
            <div>
              <p className="font-medium text-gray-900">{entry.hubName || 'Learning center'}</p>
              <p className="text-sm text-gray-600">
                {entry.classInterest || 'Program TBD'} · {entry.timePreference || 'Any time'} · {entry.status === 'notified' ? 'A seat opened' : 'Waiting'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => leave(entry._id)}
              className="text-sm font-semibold text-primary-700 hover:text-primary-800"
            >
              Leave waitlist
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
