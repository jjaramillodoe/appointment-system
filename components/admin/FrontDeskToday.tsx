'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Printer, RefreshCw, Search } from 'lucide-react';
import { appointmentStatusLabel } from '@/lib/appointmentStatus';
import { DEFAULT_HUB_TIMEZONE, hubCalendarToday } from '@/lib/slotDateTime';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RosterRow {
  _id: string;
  time: string;
  startsAt: string | null;
  status: string;
  hubName?: string;
  classInterest?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileCompleted: boolean;
  checkedInAt: string | null;
  completedAt: string | null;
}

interface FrontDeskTodayProps {
  token: string;
  hubName?: string;
}

const REFRESH_MS = 60_000;
const LATE_AFTER_MINUTES = 10;
const WAITING_STATUSES = new Set(['pending', 'pending_profile', 'confirmed']);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clockTime(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: DEFAULT_HUB_TIMEZONE,
  });
}

function fullName(row: RosterRow) {
  return `${row.firstName} ${row.lastName}`.trim() || row.email || 'Student';
}

export default function FrontDeskToday({ token, hubName }: FrontDeskTodayProps) {
  const today = hubCalendarToday();
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [rosterHub, setRosterHub] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [noShowRow, setNoShowRow] = useState<RosterRow | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const busyRef = useRef(false);

  const load = useCallback(async (showSpinner = false) => {
    if (busyRef.current) return; // don't clobber an in-flight action
    if (showSpinner) setLoading(true);
    const params = new URLSearchParams({ date: today });
    if (hubName) params.set('hubName', hubName);
    try {
      const response = await fetch(`/api/admin/appointments/roster?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load today’s appointments');
      setRows(data.appointments || []);
      setRosterHub(data.hubName || '');
      setError('');
      setUpdatedAt(Date.now());
    } catch (err: any) {
      setError(err.message || 'Unable to load today’s appointments');
    } finally {
      setLoading(false);
    }
  }, [token, hubName, today]);

  // Keep several desks in sync: poll, and refresh when the tab regains focus
  useEffect(() => {
    void load(true);
    const poll = setInterval(() => void load(), REFRESH_MS);
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    const onFocus = () => void load();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
      window.removeEventListener('focus', onFocus);
    };
  }, [load]);

  const updateStatus = async (row: RosterRow, status: string) => {
    busyRef.current = true;
    setBusyId(row._id);
    setError('');
    try {
      const response = await fetch('/api/admin/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ appointmentIds: [row._id], status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update appointment');
    } catch (err: any) {
      setError(err.message || 'Unable to update appointment');
    } finally {
      busyRef.current = false;
      setBusyId(null);
      await load();
    }
  };

  const isLate = (row: RosterRow) =>
    WAITING_STATUSES.has(row.status) &&
    Boolean(row.startsAt) &&
    now > new Date(row.startsAt as string).getTime() + LATE_AFTER_MINUTES * 60_000;

  const counts = useMemo(() => ({
    total: rows.length,
    waiting: rows.filter((row) => WAITING_STATUSES.has(row.status)).length,
    late: rows.filter(isLate).length,
    arrived: rows.filter((row) => row.status === 'arrived').length,
    completed: rows.filter((row) => row.status === 'completed').length,
    noShow: rows.filter((row) => row.status === 'no_show').length,
  }), [rows, now]);

  const visibleRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rows;
    const digits = term.replace(/\D/g, '');
    return rows.filter((row) =>
      fullName(row).toLowerCase().includes(term) ||
      row.email.toLowerCase().includes(term) ||
      (digits.length >= 3 && row.phone.replace(/\D/g, '').includes(digits)));
  }, [rows, query]);

  const printRoster = () => {
    const popup = window.open('', '_print');
    if (!popup) return;
    const title = `${rosterHub || 'Intake'} — ${today}`;
    // Student-entered text is escaped: this HTML runs with the admin's session
    popup.document.write(`
      <html><head><title>Intake roster ${escapeHtml(today)}</title>
      <style>body{font-family:sans-serif;padding:24px} table{width:100%;border-collapse:collapse} td,th{border:1px solid #ccc;padding:6px;text-align:left}</style>
      </head><body>
      <h1>${escapeHtml(title)}</h1>
      <table><thead><tr><th>Time</th><th>Student</th><th>Phone</th><th>Program</th><th>Status</th><th>Checked in</th></tr></thead>
      <tbody>
      ${rows.map((row) => `<tr><td>${escapeHtml(row.time || '')}</td><td>${escapeHtml(fullName(row))}</td><td>${escapeHtml(row.phone || '')}</td><td>${escapeHtml(row.classInterest || '')}</td><td>${escapeHtml(appointmentStatusLabel(row.status))}</td><td>${escapeHtml(clockTime(row.checkedInAt))}</td></tr>`).join('')}
      </tbody></table>
      </body></html>
    `);
    popup.document.close();
    popup.print();
  };

  const summary: { label: string; value: number; tone: string }[] = [
    { label: 'Expected', value: counts.total, tone: 'text-gray-900' },
    { label: 'Waiting', value: counts.waiting, tone: 'text-amber-700' },
    { label: 'Late', value: counts.late, tone: 'text-red-700' },
    { label: 'Checked in', value: counts.arrived, tone: 'text-blue-700' },
    { label: 'Done', value: counts.completed, tone: 'text-green-700' },
    { label: 'No-show', value: counts.noShow, tone: 'text-gray-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Today at the front desk</h1>
          <p className="text-sm text-muted-foreground">
            {rosterHub || 'All hubs'} · {today}
            {updatedAt && ` · updated ${new Date(updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void load(true)} aria-label="Refresh">
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden /> Refresh
          </Button>
          <Button variant="outline" onClick={printRoster} disabled={rows.length === 0}>
            <Printer className="mr-2 h-4 w-4" aria-hidden /> Print roster
          </Button>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {summary.map((item) => (
          <div key={item.label} className="rounded-lg border bg-white p-3 text-center">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</dt>
            <dd className={`text-2xl font-bold ${item.tone}`}>{item.value}</dd>
          </div>
        ))}
      </dl>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Appointments</CardTitle>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <label htmlFor="front-desk-search" className="sr-only">Find a student by name, phone, or email</label>
            <Input
              id="front-desk-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find by name, phone, or email"
              className="pl-9"
              autoComplete="off"
            />
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-3 text-sm text-red-600" role="alert">{error}</p>}
          {loading ? (
            <p className="text-sm text-muted-foreground" role="status">Loading today’s appointments…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments scheduled for today.</p>
          ) : visibleRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No one matches “{query}”.</p>
          ) : (
            <ul className="divide-y">
              {visibleRows.map((row) => {
                const name = fullName(row);
                const busy = busyId === row._id;
                const late = isLate(row);
                const notCheckedInStatus = row.profileCompleted ? 'confirmed' : 'pending_profile';
                return (
                  <li key={row._id} className={`flex flex-wrap items-center justify-between gap-3 py-3 ${row.status === 'no_show' ? 'opacity-60' : ''}`}>
                    <div className="flex min-w-0 items-start gap-4">
                      <span className="w-20 shrink-0 font-mono text-sm font-semibold text-gray-900">{row.time}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{name}</p>
                        <p className="text-sm text-muted-foreground">
                          {[row.phone, row.classInterest || 'Program TBD', !hubName && row.hubName].filter(Boolean).join(' · ')}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <Badge variant="outline">{appointmentStatusLabel(row.status)}</Badge>
                          {late && <Badge variant="destructive">Late</Badge>}
                          {row.status === 'pending_profile' && <Badge variant="secondary">Needs intake packet</Badge>}
                          {row.checkedInAt && (
                            <span className="text-xs text-muted-foreground">Checked in {clockTime(row.checkedInAt)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {WAITING_STATUSES.has(row.status) && (
                        <>
                          <Button size="sm" disabled={busy} onClick={() => updateStatus(row, 'arrived')} aria-label={`Check in ${name}`}>
                            Check in
                          </Button>
                          <Button size="sm" variant="outline" disabled={busy} onClick={() => setNoShowRow(row)} aria-label={`Mark ${name} as no-show`}>
                            No-show
                          </Button>
                        </>
                      )}
                      {row.status === 'arrived' && (
                        <>
                          <Button size="sm" disabled={busy} onClick={() => updateStatus(row, 'completed')} aria-label={`Mark ${name} done`}>
                            Done
                          </Button>
                          <Button size="sm" variant="ghost" disabled={busy} onClick={() => updateStatus(row, notCheckedInStatus)} aria-label={`Undo check-in for ${name}`}>
                            Undo check-in
                          </Button>
                        </>
                      )}
                      {row.status === 'completed' && (
                        <Button size="sm" variant="ghost" disabled={busy} onClick={() => updateStatus(row, 'arrived')} aria-label={`Undo done for ${name}`}>
                          Undo
                        </Button>
                      )}
                      {row.status === 'no_show' && (
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => updateStatus(row, 'arrived')} aria-label={`${name} arrived after all`}>
                          Arrived after all
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(noShowRow)} onOpenChange={(open) => !open && setNoShowRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark {noShowRow ? fullName(noShowRow) : ''} as a no-show?</AlertDialogTitle>
            <AlertDialogDescription>
              Their seat at {noShowRow?.time} is released (the next person on the waitlist may be offered it) and the
              student is notified that they missed the appointment. You can undo this if they arrive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep waiting</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (noShowRow) void updateStatus(noShowRow, 'no_show');
                setNoShowRow(null);
              }}
            >
              Mark no-show
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
