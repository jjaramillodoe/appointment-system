"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Zap, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface Hub {
  _id: string;
  name: string;
}

const DAYS_OF_WEEK = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

const DEFAULT_TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00',
];

export default function ScheduleGenerator() {
  const { token } = useAuth();
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [successStats, setSuccessStats] = useState<any>(null);

  const [formData, setFormData] = useState({
    startDate: '2026-09-01',
    endDate: '2029-09-01',
    openDays: [1, 2, 3, 4, 5], // Mon-Fri by default
    timeSlots: DEFAULT_TIME_SLOTS.join('\n'),
    capacity: 20,
    selectedHubs: [] as string[],
  });

  useEffect(() => {
    loadHubs();
  }, [token]);

  const loadHubs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/hubs/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHubs(data.hubs);
        // Select all hubs by default
        setFormData(prev => ({
          ...prev,
          selectedHubs: data.hubs.map((h: Hub) => h._id)
        }));
      }
    } catch (err) {
      setError('Failed to load hubs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (dayValue: number) => {
    setFormData(prev => ({
      ...prev,
      openDays: prev.openDays.includes(dayValue)
        ? prev.openDays.filter(d => d !== dayValue)
        : [...prev.openDays, dayValue].sort()
    }));
  };

  const handleHubToggle = (hubId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedHubs: prev.selectedHubs.includes(hubId)
        ? prev.selectedHubs.filter(h => h !== hubId)
        : [...prev.selectedHubs, hubId]
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) : value
    }));
  };

  const handleGenerateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.selectedHubs.length === 0) {
      setError('Please select at least one hub');
      return;
    }

    if (formData.openDays.length === 0) {
      setError('Please select at least one day of the week');
      return;
    }

    try {
      setGenerating(true);

      const timeSlots = formData.timeSlots
        .split('\n')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      if (timeSlots.length === 0) {
        setError('Please add at least one time slot');
        return;
      }

      const response = await fetch('/api/admin/schedule/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          startDate: formData.startDate,
          endDate: formData.endDate,
          openDays: formData.openDays,
          timeSlots,
          capacity: formData.capacity,
          hubIds: formData.selectedHubs,
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        setSuccessStats(data.stats);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to generate schedule');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Zap className="h-8 w-8 text-blue-600" />
          Schedule Generator
        </h1>
        <p className="text-gray-600 mt-1">Bulk create appointment slots for multiple hubs and date ranges</p>
      </div>

      {/* Success Message */}
      {success && successStats && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">{success}</h3>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-green-700 font-medium">Date Range</p>
                  <p className="text-green-600">{successStats.dateRange.start} to {successStats.dateRange.end}</p>
                  <p className="text-green-600 text-xs mt-1">{successStats.dateRange.openDays} open days</p>
                </div>
                <div>
                  <p className="text-green-700 font-medium">Configuration</p>
                  <p className="text-green-600">{successStats.configuration.hubs} hub(s)</p>
                  <p className="text-green-600">{successStats.configuration.timeSlotsPerDay} time slots/day</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <form onSubmit={handleGenerateSchedule} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">End Date</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Days of Week */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Operating Days</label>
            <div className="grid grid-cols-4 gap-2">
              {DAYS_OF_WEEK.map(day => (
                <label key={day.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.openDays.includes(day.value)}
                    onChange={() => handleDayToggle(day.value)}
                    className="rounded w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">{day.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Hubs Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Learning Centers</label>
            <div className="grid grid-cols-2 gap-3">
              {hubs.map(hub => (
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

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Capacity per Slot</label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleInputChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Time Slots */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Time Slots (one per line)</label>
            <textarea
              name="timeSlots"
              value={formData.timeSlots}
              onChange={handleInputChange}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
              placeholder="09:00&#10;09:30&#10;10:00..."
            />
            <p className="text-xs text-gray-500 mt-1">Format: HH:MM (24-hour format)</p>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>This will create:</strong> {' '}
              {(() => {
                const start = new Date(formData.startDate);
                const end = new Date(formData.endDate);
                const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                const openDaysEstimate = Math.ceil(days * (formData.openDays.length / 7));
                const timeSlots = formData.timeSlots.split('\n').filter(t => t.trim()).length;
                const total = openDaysEstimate * timeSlots * formData.selectedHubs.length;
                return `~${total.toLocaleString()} appointment slots`;
              })()}
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={generating}
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={generating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
