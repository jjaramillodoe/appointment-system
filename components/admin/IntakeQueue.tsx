'use client';

import { useEffect, useState } from 'react';
import { appointmentStatusLabel } from '@/lib/appointmentStatus';
import { hubCalendarToday } from '@/lib/slotDateTime';
import { parseClockToMinutes } from '@/lib/timePreference';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface IntakeQueueProps {
  token: string;
  hubName?: string;
  onRefreshParent?: () => void;
}

const TERMINAL_STATUSES = new Set(['completed', 'cancelled', 'no_show', 'expired']);

export default function IntakeQueue({ token, hubName, onRefreshParent }: IntakeQueueProps) {
  const today = hubCalendarToday();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({
      startDate: today,
      endDate: today,
      limit: '100',
      sortBy: 'appointmentTime',
      sortOrder: 'asc',
    });
    if (hubName) params.set('hubName', hubName);
    const response = await fetch(`/api/admin/appointments?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Unable to load today’s queue');
      setRows([]);
      setLoading(false);
      return;
    }
    const appointments = (data.appointments || []).slice().sort((a: any, b: any) => {
      return (parseClockToMinutes(a.time) ?? 0) - (parseClockToMinutes(b.time) ?? 0);
    });
    setRows(appointments);
    setLoading(false);
  };

  useEffect(() => {
    if (token) void load();
  }, [token, hubName]);

  const updateStatus = async (id: string, status: string) => {
    setError('');
    const response = await fetch('/api/admin/appointments', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ appointmentIds: [id], status }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Unable to update appointment');
      return;
    }
    await load();
    onRefreshParent?.();
  };

  const printRoster = async () => {
    const params = new URLSearchParams({ date: today });
    if (hubName) params.set('hubName', hubName);
    const response = await fetch(`/api/admin/appointments/roster?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Unable to print roster');
      return;
    }
    const popup = window.open('', '_print');
    if (!popup) return;
    popup.document.write(`
      <html><head><title>Intake roster ${today}</title>
      <style>body{font-family:sans-serif;padding:24px} table{width:100%;border-collapse:collapse} td,th{border:1px solid #ccc;padding:6px;text-align:left}</style>
      </head><body>
      <h1>${data.hubName || 'Intake'} — ${today}</h1>
      <table><thead><tr><th>Time</th><th>Student</th><th>Phone</th><th>Program</th><th>Status</th></tr></thead>
      <tbody>
      ${(data.appointments || []).map((row: any) => `<tr><td>${row.time || ''}</td><td>${row.firstName} ${row.lastName}</td><td>${row.phone || ''}</td><td>${row.classInterest || ''}</td><td>${row.status}</td></tr>`).join('')}
      </tbody></table>
      </body></html>
    `);
    popup.document.close();
    popup.print();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Today’s intake queue</CardTitle>
        <Button variant="outline" onClick={printRoster}>Print roster</Button>
      </CardHeader>
      <CardContent>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading today’s appointments…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No appointments scheduled for today at this hub.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="font-medium">{row.userId?.firstName} {row.userId?.lastName}</p>
                  <p className="text-sm text-muted-foreground">
                    {row.time} · {row.classInterest || 'Program TBD'} · {appointmentStatusLabel(row.status)}
                    {row.status === 'pending_profile' ? ' · needs intake packet' : ''}
                  </p>
                </div>
                {!TERMINAL_STATUSES.has(row.status) && (
                  <div className="flex flex-wrap gap-2">
                    {row.status !== 'arrived' && (
                      <Button size="sm" onClick={() => updateStatus(row._id, 'arrived')}>Arrived</Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => updateStatus(row._id, 'completed')}>Completed</Button>
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(row._id, 'no_show')}>No-show</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
