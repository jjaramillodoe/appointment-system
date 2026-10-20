'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { BookOpen, Clock, MapPin, Calendar, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { formatClosedDateLabel } from '@/lib/dayOffReason';
import { isTimePreference, timePreferenceLabel } from '@/lib/timePreference';

interface Hub {
  _id: string;
  name: string;
  location?: string;
  address?: string;
  phone?: string;
  email?: string;
  capacity?: number;
  defaultSlots?: string[];
  timezone?: string;
  availableSlotCount?: number;
}

interface AppointmentSlot {
  _id: string;
  startTime: string;
  endTime: string;
  availableSpots: number;
  isFull: boolean;
  date?: string;
  time?: string;
}

interface ClosedDay {
  date: string;
  reason: string;
}

interface AppointmentSelectionFormProps {
  userId: string;
  onSuccess: (appointment: any) => void;
  onError: (error: string) => void;
}

const CLASS_OPTIONS = [
  { value: 'ESL', label: 'English As A Second Language (E.S.L.)' },
  { value: 'BE/HSE', label: 'Basic Education/High School Equivalency (G.E.D.)' },
];

const TIME_PREFERENCES = [
  { value: 'Morning', label: 'Morning (8:00 AM - 12:00 PM)' },
  { value: 'Evening', label: 'Evening (5:00 PM - 9:00 PM)' },
  { value: 'Saturday', label: 'Saturday (9:00 AM - 2:00 PM)' },
];

const DISPLAY_TIMEZONE = 'America/New_York';

function getSlotTimeZone(timezone?: string) {
  return timezone || DISPLAY_TIMEZONE;
}

function formatSlotTime(startTime: string, timezone?: string) {
  return new Date(startTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: getSlotTimeZone(timezone),
  });
}

function formatSlotDay(startTime: string, timezone?: string) {
  return new Date(startTime).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: getSlotTimeZone(timezone),
  });
}

function groupSlotsByDay(slots: AppointmentSlot[], timezone?: string) {
  const groups: { label: string; slots: AppointmentSlot[] }[] = [];

  for (const slot of slots) {
    const label = formatSlotDay(slot.startTime, timezone);
    const existing = groups.find((group) => group.label === label);
    if (existing) {
      existing.slots.push(slot);
    } else {
      groups.push({ label, slots: [slot] });
    }
  }

  return groups;
}

export default function AppointmentSelectionForm({
  userId,
  onSuccess,
  onError,
}: AppointmentSelectionFormProps) {
  const [step, setStep] = useState(1);
  const [classInterest, setClassInterest] = useState('');
  const [timePreference, setTimePreference] = useState('');
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [closedDays, setClosedDays] = useState<ClosedDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [waitlistMessage, setWaitlistMessage] = useState('');

  useEffect(() => {
    setSelectedHub(null);
    setSelectedSlot(null);
    setSlots([]);
    setClosedDays([]);
  }, [timePreference]);

  useEffect(() => {
    if (classInterest && timePreference) {
      fetchHubs();
    }
  }, [classInterest, timePreference]);

  useEffect(() => {
    if (selectedHub && timePreference) {
      fetchSlots();
    }
  }, [selectedHub, timePreference]);

  const fetchHubs = async () => {
    try {
      setIsLoading(true);
      const url = `/api/hubs?classInterest=${classInterest}&timePreference=${timePreference}`;

      const response = await fetch(url);

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);
      setHubs(data.hubs || []);
      setError('');
    } catch (err: any) {
      logger.error('❌ Error fetching hubs:', err);
      setError(err.message || 'Failed to load hubs');
      onError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSlots = async () => {
    if (!selectedHub) return;
    try {
      setIsLoading(true);
      const url = `/api/appointments/available-slots?hubId=${selectedHub._id}&timePreference=${encodeURIComponent(timePreference)}&classInterest=${encodeURIComponent(classInterest)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      const now = Date.now();
      const upcomingSlots = (data.slots || []).filter((slot: AppointmentSlot) => {
        const start = new Date(slot.startTime).getTime();
        return !Number.isNaN(start) && start > now;
      });

      setSlots(upcomingSlots);
      setClosedDays(data.closedDays || []);
      setSelectedSlot(null);
      setError('');
    } catch (err: any) {
      logger.error('❌ Error fetching slots:', err);
      setClosedDays([]);
      setError(err.message || 'Failed to load appointment slots');
      onError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot || !selectedHub) {
      setError('Please select an appointment time');
      return;
    }

    try {
      setIsLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch('/api/appointments/book-quick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          classInterest,
          timePreference,
          hubId: selectedHub._id,
          slotId: selectedSlot._id,
          preferredSlot: selectedSlot.startTime,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.waitlist) {
          setError(data.error || 'That window is full.');
          setIsLoading(false);
          return;
        }
        throw new Error(data.error);
      }

      onSuccess(data.appointment);
    } catch (err: any) {
      setError(err.message || 'Failed to book appointment');
      onError(err.message);
      setIsLoading(false);
    }
  };

  const joinWaitlist = async () => {
    if (!selectedHub) return;
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId,
          hubId: selectedHub._id,
          timePreference,
          classInterest,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setWaitlistMessage(data.message || 'You are on the waitlist. We will email you if a seat opens.');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Unable to join the waitlist');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedWindow = isTimePreference(timePreference)
    ? timePreferenceLabel(timePreference)
    : timePreference;

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all ${
          step === 1 ? 'bg-primary-700 text-white' : 'bg-green-100 text-green-700'
        }`}>
          {step > 1 ? <CheckCircle2 className="h-6 w-6" /> : '1'}
        </div>
        <div className={`h-1 flex-1 mx-2 ${step > 1 ? 'bg-green-200' : 'bg-primary-200'}`} />
        <div className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all ${
          step === 2 ? 'bg-primary-700 text-white' : 'bg-primary-200 text-primary-600'
        }`}>
          2
        </div>
        <div className={`h-1 flex-1 mx-2 ${step > 2 ? 'bg-green-200' : 'bg-primary-200'}`} />
        <div className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all ${
          step === 3 ? 'bg-primary-700 text-white' : step > 3 ? 'bg-green-100 text-green-700' : 'bg-primary-200 text-primary-600'
        }`}>
          {step > 3 ? <CheckCircle2 className="h-6 w-6" /> : '3'}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
          {waitlistMessage && <p className="text-sm text-green-700 mt-2">{waitlistMessage}</p>}
        </div>
      )}

      {/* Step 1: Class & Time Selection */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-primary-900 mb-3 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              What class are you interested in?
            </h3>
            <div className="space-y-2">
              {CLASS_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center rounded-lg border-2 p-3 cursor-pointer transition-all ${
                    classInterest === option.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-primary-200 bg-white hover:border-primary-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="classInterest"
                    value={option.value}
                    checked={classInterest === option.value}
                    onChange={(e) => setClassInterest(e.target.value)}
                    className="mr-3 h-5 w-5"
                  />
                  <span className="text-sm font-medium text-primary-900">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-primary-100 pt-4">
            <h3 className="text-lg font-semibold text-primary-900 mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              What time preference do you have?
            </h3>
            <div className="space-y-2">
              {TIME_PREFERENCES.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center rounded-lg border-2 p-3 cursor-pointer transition-all ${
                    timePreference === option.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-primary-200 bg-white hover:border-primary-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="timePreference"
                    value={option.value}
                    checked={timePreference === option.value}
                    onChange={(e) => setTimePreference(e.target.value)}
                    className="mr-3 h-5 w-5"
                  />
                  <span className="text-sm font-medium text-primary-900">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!classInterest || !timePreference}
            className="w-full mt-6 rounded-lg bg-primary-700 px-4 py-3 font-semibold text-white transition-all hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Continue to Sites
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Step 2: Site Selection */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select your registration site
          </h3>
          <p className="text-sm text-primary-700">
            Showing sites with {selectedWindow} appointments.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            </div>
          ) : hubs.length === 0 ? (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50/50 p-4">
              <p className="text-sm text-yellow-800">
                No sites have {selectedWindow} openings in the next 7 days. Go back and try a different time.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {hubs.map((hub) => (
                <button
                  key={hub._id}
                  onClick={() => {
                    setSelectedHub(hub);
                    setStep(3);
                  }}
                  className={`w-full text-left rounded-lg border-2 p-4 transition-all ${
                    selectedHub?._id === hub._id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-primary-200 bg-white hover:border-primary-300'
                  }`}
                >
                  <h4 className="font-semibold text-primary-900">{hub.name}</h4>
                  <p className="text-sm text-primary-600 mt-1 flex items-center gap-1">
                    📍 {hub.location || hub.address}
                  </p>
                  {hub.phone && <p className="text-sm text-primary-600 mt-1">📞 {hub.phone}</p>}
                  {typeof hub.availableSlotCount === 'number' && (
                    <p className="text-sm text-primary-700 mt-2 font-medium">
                      {hub.availableSlotCount} {timePreference.toLowerCase()} time{hub.availableSlotCount === 1 ? '' : 's'} available
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 rounded-lg border-2 border-primary-300 px-4 py-3 font-semibold text-primary-700 transition-all hover:bg-primary-50"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Appointment Time Selection */}
      {step === 3 && selectedHub && (
        <div className="space-y-4">
          <div className="rounded-lg bg-primary-50 border border-primary-200 p-4">
            <h3 className="font-semibold text-primary-900 text-sm">{selectedHub.name}</h3>
            <p className="text-xs text-primary-600 mt-1">{selectedHub.location || selectedHub.address}</p>
            <p className="text-xs text-primary-700 mt-2 font-medium">{selectedWindow}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-primary-900 flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5" />
              Select your appointment time
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              </div>
            ) : (
              <>
                {closedDays.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 mb-4">
                    <p className="text-sm font-medium text-amber-900">
                      This site is closed on some days this week
                    </p>
                    <ul className="mt-2 space-y-1">
                      {closedDays.map((day) => (
                        <li key={day.date} className="text-sm text-amber-800">
                          <span className="font-medium">{formatClosedDateLabel(day.date)}</span>
                          {' — '}
                          {day.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            {slots.length === 0 ? (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50/50 p-4">
                <p className="text-sm font-medium text-yellow-900">
                  No {selectedWindow} appointments in the next 7 days
                </p>
                <p className="text-sm text-yellow-800 mt-1">
                  {closedDays.length > 0
                    ? 'Some matching days are closed. Please choose a different site or time preference, or join the waitlist.'
                    : 'Try another site, choose a different time preference, or join the waitlist.'}
                </p>
                <button
                  type="button"
                  onClick={joinWaitlist}
                  disabled={isLoading}
                  className="mt-3 rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Join waitlist
                </button>
                {waitlistMessage && <p className="mt-2 text-sm text-green-700">{waitlistMessage}</p>}
              </div>
            ) : (
              <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-1">
                {groupSlotsByDay(slots, selectedHub.timezone).map((group) => (
                  <div key={group.label}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 mb-2">
                      {group.label}
                    </p>
                    <div className="space-y-2">
                      {group.slots.map((slot) => (
                        <button
                          key={slot._id}
                          onClick={() => setSelectedSlot(slot)}
                          disabled={slot.isFull}
                          className={`w-full text-left rounded-lg border-2 p-3 transition-all ${
                            selectedSlot?._id === slot._id
                              ? 'border-primary-500 bg-primary-50'
                              : slot.isFull
                              ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                              : 'border-primary-200 bg-white hover:border-primary-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-primary-900">
                              {formatSlotTime(slot.startTime, selectedHub.timezone)}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${
                              slot.isFull
                                ? 'bg-gray-200 text-gray-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {slot.isFull ? 'Full' : `${slot.availableSpots} spots`}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 rounded-lg border-2 border-primary-300 px-4 py-3 font-semibold text-primary-700 transition-all hover:bg-primary-50"
            >
              Back
            </button>
            {error && selectedHub && (
              <button
                type="button"
                onClick={joinWaitlist}
                disabled={isLoading}
                className="flex-1 rounded-lg border-2 border-primary-300 px-4 py-3 font-semibold text-primary-700"
              >
                Join waitlist
              </button>
            )}
            <button
              onClick={handleBookAppointment}
              disabled={!selectedSlot || isLoading}
              className="flex-1 rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition-all hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Confirm Appointment
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
