'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function WaitlistPanel({ token, hubName }: { token: string; hubName?: string }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    if (!token) return;
    const params = new URLSearchParams();
    if (hubName) params.set('hubName', hubName);
    const response = await fetch(`/api/admin/waitlist?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Unable to load waitlist');
      setEntries([]);
      return;
    }
    setEntries(data.entries || []);
  };

  useEffect(() => {
    void load();
  }, [token, hubName]);

  const updateEntry = async (entryId: string, action: 'notify' | 'remove') => {
    setBusyId(entryId);
    setError('');
    const response = await fetch('/api/admin/waitlist', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ entryId, action }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error || 'Unable to update waitlist');
    } else {
      await load();
    }
    setBusyId('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Waitlist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">No students are waiting for a seat at this hub.</p>
        )}
        {entries.map((entry) => (
          <div key={entry._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
            <div>
              <p className="font-medium">
                {entry.userId?.firstName} {entry.userId?.lastName} · {entry.hubName}
              </p>
              <p className="text-muted-foreground">
                {entry.classInterest || 'Program TBD'} · {entry.timePreference || 'Any time'} · {entry.status === 'notified' ? 'Notified' : 'Waiting'}
              </p>
            </div>
            <div className="flex gap-2">
              {entry.status === 'waiting' && (
                <Button size="sm" disabled={busyId === entry._id} onClick={() => updateEntry(entry._id, 'notify')}>
                  Notify
                </Button>
              )}
              <Button size="sm" variant="outline" disabled={busyId === entry._id} onClick={() => updateEntry(entry._id, 'remove')}>
                Remove
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
