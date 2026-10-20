'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Loader, Moon, Sun, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import {
  TIME_PREFERENCES,
  clocksForTimePreference,
  timePreferenceLabel,
  type TimePreference,
} from '@/lib/timePreference';

interface Hub {
  _id: string;
  name: string;
}

function countIntakeDays(startDate: string, endDate: string) {
  let weekdays = 0;
  let saturdays = 0;
  const cursor = new Date(`${startDate}T00:00:00.000Z`);
  const last = new Date(`${endDate}T00:00:00.000Z`);
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(last.getTime()) || cursor > last) {
    return { weekdays, saturdays };
  }

  while (cursor <= last) {
    const day = cursor.getUTCDay();
    if (day === 6) saturdays += 1;
    else if (day >= 1 && day <= 5) weekdays += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return { weekdays, saturdays };
}

export default function ScheduleGenerator() {
  const router = useRouter();
  const { token, isSuperAdmin } = useAuth();
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [successStats, setSuccessStats] = useState<any>(null);
  const [formData, setFormData] = useState({
    startDate: '2026-09-01',
    endDate: '2029-09-01',
    windows: [...TIME_PREFERENCES] as TimePreference[],
    capacity: 20,
    selectedHubs: [] as string[],
  });

  useEffect(() => {
    if (!isSuperAdmin) {
      router.push('/admin/dashboard');
      return;
    }
    if (token) loadHubs();
  }, [token, isSuperAdmin, router]);

  const loadHubs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/hubs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const hubList = Array.isArray(data) ? data : data.hubs || [];
        setHubs(hubList);
        setFormData((prev) => ({ ...prev, selectedHubs: hubList.map((hub: Hub) => hub._id) }));
      }
    } catch (err) {
      setError('Failed to load hubs');
      logger.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleWindow = (window: TimePreference) => {
    setFormData((prev) => ({
      ...prev,
      windows: prev.windows.includes(window)
        ? prev.windows.filter((item) => item !== window)
        : [...TIME_PREFERENCES.filter((item) => prev.windows.includes(item) || item === window)],
    }));
  };

  const handleHubToggle = (hubId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedHubs: prev.selectedHubs.includes(hubId)
        ? prev.selectedHubs.filter((id) => id !== hubId)
        : [...prev.selectedHubs, hubId],
    }));
  };

  const estimate = useMemo(() => {
    const { weekdays, saturdays } = countIntakeDays(formData.startDate, formData.endDate);
    const weekdayTimes = [
      ...(formData.windows.includes('Morning') ? clocksForTimePreference('Morning') : []),
      ...(formData.windows.includes('Evening') ? clocksForTimePreference('Evening') : []),
    ].length;
    const saturdayTimes = formData.windows.includes('Saturday')
      ? clocksForTimePreference('Saturday').length
      : 0;
    const hubsCount = formData.selectedHubs.length;
    return {
      weekdays,
      saturdays,
      weekdayTimes,
      saturdayTimes,
      total: (weekdays * weekdayTimes + saturdays * saturdayTimes) * hubsCount,
    };
  }, [formData]);

  const handleGenerateSchedule = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSuccessStats(null);

    if (formData.selectedHubs.length === 0) {
      setError('Please select at least one hub');
      return;
    }
    if (formData.windows.length === 0) {
      setError('Please select at least one intake window');
      return;
    }

    try {
      setGenerating(true);
      const response = await fetch('/api/admin/schedule/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startDate: formData.startDate,
          endDate: formData.endDate,
          windows: formData.windows,
          capacity: formData.capacity,
          hubIds: formData.selectedHubs,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to generate schedule');
        return;
      }
      setSuccess(data.message);
      setSuccessStats(data.stats);
    } catch (err) {
      setError('An error occurred. Please try again.');
      logger.error(err);
    } finally {
      setGenerating(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">The schedule generator is only available to super admins.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Zap className="h-8 w-8 text-blue-600" />
          Schedule Generator
        </h1>
        <p className="text-gray-600 mt-1">
          Create appointment slots from the same Morning, Evening, and Saturday windows students pick at registration.
        </p>
      </div>

      {success && successStats && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">{success}</h3>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-green-700 font-medium">Date range</p>
                  <p className="text-green-600">{successStats.dateRange.start} to {successStats.dateRange.end}</p>
                  <p className="text-green-600 text-xs mt-1">
                    {successStats.dateRange.weekdayDays} weekdays · {successStats.dateRange.saturdayDays} Saturdays
                  </p>
                </div>
                <div>
                  <p className="text-green-700 font-medium">Windows</p>
                  <p className="text-green-600">{(successStats.configuration.windows || []).join(', ')}</p>
                  <p className="text-green-600 text-xs mt-1">{successStats.configuration.hubs} hub(s)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <form onSubmit={handleGenerateSchedule} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm font-medium text-gray-900">
              Start Date
              <input
                type="date"
                value={formData.startDate}
                onChange={(event) => setFormData((prev) => ({ ...prev, startDate: event.target.value }))}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block text-sm font-medium text-gray-900">
              End Date
              <input
                type="date"
                value={formData.endDate}
                onChange={(event) => setFormData((prev) => ({ ...prev, endDate: event.target.value }))}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900 mb-3">Intake windows</p>
            <p className="text-sm text-gray-500 mb-3">
              Weekdays get Morning and Evening. Saturday uses its own window. Sundays stay closed.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {TIME_PREFERENCES.map((window) => {
                const times = clocksForTimePreference(window);
                const selected = formData.windows.includes(window);
                const Icon = window === 'Evening' ? Moon : Sun;
                return (
                  <label
                    key={window}
                    className={`cursor-pointer rounded-lg border p-4 ${
                      selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleWindow(window)}
                        className="mt-1 rounded"
                      />
                      <div>
                        <p className="font-medium text-gray-900 flex items-center gap-2">
                          <Icon className="h-4 w-4 text-blue-600" />
                          {timePreferenceLabel(window)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {window === 'Saturday' ? 'Saturdays only' : 'Monday–Friday'} · {times.length} half-hour slots
                        </p>
                        <p className="mt-2 text-xs font-mono text-gray-600">
                          {times[0]} – {times[times.length - 1]}
                        </p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Learning Centers</label>
            <div className="grid grid-cols-2 gap-3">
              {hubs.map((hub) => (
                <label key={hub._id} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.selectedHubs.includes(hub._id)}
                    onChange={() => handleHubToggle(hub._id)}
                    className="rounded w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">{hub.name}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="block text-sm font-medium text-gray-900">
            Capacity per slot
            <input
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(event) => setFormData((prev) => ({ ...prev, capacity: parseInt(event.target.value, 10) || 1 }))}
              className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-900">
            <p>
              <strong>This will create about {estimate.total.toLocaleString()} appointment slots</strong>
              {' '}across {formData.selectedHubs.length} hub(s): {estimate.weekdays} weekdays
              {formData.windows.includes('Morning') || formData.windows.includes('Evening')
                ? ` × ${estimate.weekdayTimes} weekday times`
                : ''}
              {formData.windows.includes('Saturday')
                ? ` and ${estimate.saturdays} Saturdays × ${estimate.saturdayTimes} Saturday times`
                : ''}
              .
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              disabled={generating}
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={generating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {generating ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Generate Schedule
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
