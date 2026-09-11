'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Clock, MapPin, Calendar, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

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
}

interface AppointmentSlot {
  _id: string;
  startTime: string;
  endTime: string;
  availableSpots: number;
  isFull: boolean;
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Fetch hubs when class/time are selected
  useEffect(() => {
    if (classInterest && timePreference) {
      fetchHubs();
    }
  }, [classInterest, timePreference]);

  // Fetch appointment slots when hub is selected
  useEffect(() => {
    if (selectedHub) {
      fetchSlots();
    }
  }, [selectedHub]);

  const fetchHubs = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Fetching hubs with:', { classInterest, timePreference });
      const url = `/api/hubs?classInterest=${classInterest}&timePreference=${timePreference}`;
      console.log('📡 API URL:', url);

      const response = await fetch(url);
      console.log('📊 Response status:', response.status);

      const data = await response.json();
      console.log('📦 Response data:', data);

      if (!response.ok) throw new Error(data.error);
      setHubs(data.hubs || []);
      console.log('✅ Hubs loaded:', data.hubs?.length || 0);
      setError('');
    } catch (err: any) {
      console.error('❌ Error fetching hubs:', err);
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
      console.log('🔍 Fetching slots for hub:', selectedHub._id);
      const url = `/api/appointments/available-slots?hubId=${selectedHub._id}`;
      const response = await fetch(url);
      console.log('📊 Slots response status:', response.status);

      const data = await response.json();
      console.log('📦 Slots data:', data);

      if (!response.ok) throw new Error(data.error);
      setSlots(data.slots || []);
      console.log('✅ Slots loaded:', data.slots?.length || 0);
      setSelectedSlot(null);
      setError('');
    } catch (err: any) {
      console.error('❌ Error fetching slots:', err);
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
      const response = await fetch('/api/appointments/book-quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          classInterest,
          timePreference,
          hubId: selectedHub._id,
          slotId: selectedSlot._id,
          preferredSlot: selectedSlot.startTime,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      onSuccess(data.appointment);
    } catch (err: any) {
      setError(err.message || 'Failed to book appointment');
      onError(err.message);
      setIsLoading(false);
    }
  };

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

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            </div>
          ) : hubs.length === 0 ? (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50/50 p-4">
              <p className="text-sm text-yellow-800">No sites available for your selections. Please go back and try different options.</p>
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
            <p className="text-xs text-primary-600 mt-1">{selectedHub.address}</p>
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
            ) : slots.length === 0 ? (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50/50 p-4">
                <p className="text-sm text-yellow-800">No appointments available. Please select a different site.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {slots.map((slot) => (
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
                        {new Date(slot.startTime).toLocaleString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
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
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 rounded-lg border-2 border-primary-300 px-4 py-3 font-semibold text-primary-700 transition-all hover:bg-primary-50"
            >
              Back
            </button>
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
