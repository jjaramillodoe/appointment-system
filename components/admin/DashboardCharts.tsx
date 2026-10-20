"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardChartsProps {
  data: any;
  isSuperAdmin: boolean;
  selectedHub: string;
}

function formatShortDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatCount(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function maxValue(values: number[]) {
  return Math.max(1, ...values);
}

function BarList({
  rows,
  color = 'bg-blue-600',
}: {
  rows: Array<{ label: string; value: number }>;
  color?: string;
}) {
  const max = maxValue(rows.map((row) => row.value));

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No data in this range.</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-foreground">{row.label}</span>
            <span className="shrink-0 text-muted-foreground">{formatCount(row.value)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${color}`}
              style={{ width: `${Math.min(100, (row.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusDonut({
  slices,
}: {
  slices: Array<{ label: string; value: number; color: string }>;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  if (total === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No appointments in this range.</p>;
  }

  let offset = 0;
  const segments = slices.map((slice) => {
    const portion = (slice.value / total) * 100;
    const segment = { ...slice, portion, offset };
    offset += portion;
    return segment;
  });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div
        className="h-40 w-40 shrink-0 rounded-full"
        style={{
          background: `conic-gradient(${segments
            .map((segment) => `${segment.color} ${segment.offset}% ${segment.offset + segment.portion}%`)
            .join(', ')})`,
        }}
        aria-hidden
      >
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-card">
            <span className="text-xl font-bold">{formatCount(total)}</span>
            <span className="text-xs text-muted-foreground">total</span>
          </div>
        </div>
      </div>
      <div className="w-full space-y-2">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
              {segment.label}
            </span>
            <span className="text-muted-foreground">
              {formatCount(segment.value)} · {Math.round(segment.portion)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardCharts({ data, isSuperAdmin, selectedHub }: DashboardChartsProps) {
  const dailyVolume = Array.isArray(data.dailyVolume) ? data.dailyVolume : [];
  const status = data.stats || {};
  const hubData = Array.isArray(data.appointmentsByHub) ? data.appointmentsByHub : [];
  const weekdayData = Array.isArray(data.appointmentsByWeekday) ? data.appointmentsByWeekday : [];
  const timePreference = Array.isArray(data.byTimePreference) ? data.byTimePreference : [];
  const classInterest = Array.isArray(data.byClassInterest) ? data.byClassInterest : [];
  const upcomingByHub = Array.isArray(data.upcomingByHub) ? data.upcomingByHub : [];
  const upcomingCapacity = Array.isArray(data.upcomingCapacity) ? data.upcomingCapacity : [];
  const showHubComparison = isSuperAdmin && selectedHub === 'all';

  const statusSlices = [
    { label: 'Confirmed', value: status.confirmed || 0, color: '#16a34a' },
    { label: 'Action required', value: (status.pending_profile || 0) + (status.pending || 0), color: '#d97706' },
    { label: 'Cancelled', value: status.cancelled || 0, color: '#dc2626' },
    { label: 'Completed', value: status.completed || 0, color: '#2563eb' },
    { label: 'Expired', value: status.expired || 0, color: '#6b7280' },
  ].filter((slice) => slice.value > 0);

  const upcomingByDay = upcomingCapacity.reduce((acc: Record<string, { booked: number; capacity: number }>, row: any) => {
    const date = row._id?.date;
    if (!date) return acc;
    if (!acc[date]) acc[date] = { booked: 0, capacity: 0 };
    acc[date].booked += row.booked || 0;
    acc[date].capacity += row.capacity || 0;
    return acc;
  }, {});
  const upcomingDays = Object.keys(upcomingByDay).sort();
  const maxDaily = maxValue(dailyVolume.map((point: any) => point.total || 0));
  const sampledDaily = dailyVolume.length > 21
    ? dailyVolume.filter((_: any, index: number) => index % Math.ceil(dailyVolume.length / 21) === 0)
    : dailyVolume;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Card className="xl:col-span-2 overflow-hidden">
        <CardHeader>
          <CardTitle>Daily appointment volume</CardTitle>
          <CardDescription>
            Confirmed, action-required, and cancelled appointments in the selected range
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sampledDaily.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No appointments in this range.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex h-48 items-end gap-1">
                {sampledDaily.map((point: any) => {
                  const confirmed = point.confirmed || 0;
                  const pending = point.pendingProfile || 0;
                  const cancelled = point.cancelled || 0;
                  const total = Math.max(point.total || 0, confirmed + pending + cancelled);
                  return (
                    <div key={point.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                      <div
                        className="flex w-full flex-col justify-end overflow-hidden rounded-t bg-muted"
                        style={{ height: `${Math.max(8, (total / maxDaily) * 100)}%` }}
                        title={`${formatShortDate(point.date)}: ${formatCount(total)}`}
                      >
                        {confirmed > 0 && (
                          <div className="w-full bg-green-600" style={{ height: `${(confirmed / total) * 100}%` }} />
                        )}
                        {pending > 0 && (
                          <div className="w-full bg-amber-500" style={{ height: `${(pending / total) * 100}%` }} />
                        )}
                        {cancelled > 0 && (
                          <div className="w-full bg-red-500" style={{ height: `${(cancelled / total) * 100}%` }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatShortDate(sampledDaily[0].date)}</span>
                <span>{formatShortDate(sampledDaily[sampledDaily.length - 1].date)}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-600" /> Confirmed</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Action required</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> Cancelled</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Status mix</CardTitle>
          <CardDescription>Where appointments stand in this range</CardDescription>
        </CardHeader>
        <CardContent>
          <StatusDonut slices={statusSlices} />
        </CardContent>
      </Card>

      {showHubComparison ? (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Appointments by site</CardTitle>
            <CardDescription>Volume across learning centers</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList
              color="bg-blue-600"
              rows={hubData.map((hub: any) => ({ label: hub._id || 'Unknown', value: hub.total || 0 }))}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Next 7 days fill</CardTitle>
            <CardDescription>Booked seats versus open capacity</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingDays.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No upcoming slots found.</p>
            ) : (
              <div className="space-y-3">
                {upcomingDays.map((date) => {
                  const day = upcomingByDay[date];
                  const fill = day.capacity ? Math.min(100, (day.booked / day.capacity) * 100) : 0;
                  return (
                    <div key={date}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{formatShortDate(date)}</span>
                        <span className="text-muted-foreground">
                          {formatCount(day.booked)} / {formatCount(day.capacity)}
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-orange-500" style={{ width: `${fill}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Time preference</CardTitle>
          <CardDescription>Morning, evening, and Saturday demand</CardDescription>
        </CardHeader>
        <CardContent>
          <BarList
            color="bg-teal-700"
            rows={timePreference.map((row: any) => ({ label: row._id, value: row.count || 0 }))}
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Class interest</CardTitle>
          <CardDescription>ESL versus Basic Education / HSE</CardDescription>
        </CardHeader>
        <CardContent>
          <BarList
            color="bg-sky-700"
            rows={classInterest.map((row: any) => ({ label: row._id, value: row.count || 0 }))}
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Busiest days</CardTitle>
          <CardDescription>Appointments by day of week</CardDescription>
        </CardHeader>
        <CardContent>
          <BarList
            color="bg-indigo-600"
            rows={weekdayData.map((row: any) => ({ label: row._id, value: row.count || 0 }))}
          />
        </CardContent>
      </Card>

      {showHubComparison && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Upcoming fill by site</CardTitle>
            <CardDescription>How full the next 7 days already are</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingByHub.map((hub: any) => {
                const fill = hub.capacity ? Math.min(100, (hub.booked / hub.capacity) * 100) : 0;
                return (
                  <div key={hub._id}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium">{hub._id}</span>
                      <span className="shrink-0 text-muted-foreground">{Math.round(fill)}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-orange-500" style={{ width: `${fill}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
