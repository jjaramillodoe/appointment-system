'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHubFilter } from '@/contexts/HubFilterContext';
import { hubCalendarDaysAgo, hubCalendarToday } from '@/lib/slotDateTime';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportsPage() {
  const { token, isAdmin } = useAuth();
  const { selectedHub } = useHubFilter();
  const [summary, setSummary] = useState<any>(null);
  const [startDate, setStartDate] = useState(hubCalendarDaysAgo(30));
  const [endDate, setEndDate] = useState(hubCalendarToday());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const params = () => {
    const search = new URLSearchParams({ startDate, endDate });
    if (selectedHub && selectedHub !== 'all') search.set('hubName', selectedHub);
    return search.toString();
  };

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    const response = await fetch(`/api/admin/reports?${params()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setSummary(null);
      setError(data.error || 'Unable to load reports');
      setLoading(false);
      return;
    }
    setSummary(data.summary);
    setLoading(false);
  };

  useEffect(() => {
    if (token && isAdmin) void load();
  }, [token, isAdmin, selectedHub, startDate, endDate]);

  const downloadCsv = async () => {
    if (!token) return;
    setExporting(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/reports?${params()}&format=csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to export CSV');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'appointments-report.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Unable to export CSV');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Appointments, incomplete profiles, and no-show rate.</p>
        </div>
        <div className="flex gap-2">
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="rounded border px-3 py-2" />
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="rounded border px-3 py-2" />
          <Button onClick={downloadCsv} disabled={exporting}>{exporting ? 'Exporting…' : 'Export CSV'}</Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Loading report…</p>}

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle>Total</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{summary?.total || 0}</CardContent></Card>
        <Card><CardHeader><CardTitle>No-show rate</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{summary?.noShowRate || 0}%</CardContent></Card>
        <Card><CardHeader><CardTitle>Incomplete profiles</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{summary?.incompleteProfiles || 0}</CardContent></Card>
        <Card><CardHeader><CardTitle>Confirmed</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{summary?.byStatus?.confirmed || 0}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>By status</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(summary?.byStatus || {}).length === 0 && (
            <p className="text-sm text-muted-foreground">No status counts in this date range.</p>
          )}
          {Object.entries(summary?.byStatus || {}).map(([status, count]) => (
            <div key={status} className="flex justify-between text-sm"><span>{status.replace(/_/g, ' ')}</span><span>{String(count)}</span></div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>By hub</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(summary?.byHub || {}).length === 0 && (
              <p className="text-sm text-muted-foreground">No appointments in this date range.</p>
            )}
            {Object.entries(summary?.byHub || {}).map(([hub, count]) => (
              <div key={hub} className="flex justify-between text-sm"><span>{hub}</span><span>{String(count)}</span></div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>By program</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(summary?.byProgram || {}).length === 0 && (
              <p className="text-sm text-muted-foreground">No program data in this date range.</p>
            )}
            {Object.entries(summary?.byProgram || {}).map(([program, count]) => (
              <div key={program} className="flex justify-between text-sm"><span>{program}</span><span>{String(count)}</span></div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
