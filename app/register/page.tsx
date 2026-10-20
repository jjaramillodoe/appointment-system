'use client';

import { useEffect, useRef, useState } from 'react';
import QuickRegistrationForm from '@/components/QuickRegistrationForm';
import AppointmentSelectionForm from '@/components/AppointmentSelectionForm';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { GraduationCap, ArrowLeft, CheckCircle2, Clock, CalendarPlus, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { calendarDateFromValue } from '@/lib/appointmentTime';
import { downloadAppointmentIcs } from '@/lib/appointmentIcs';

interface BookedAppointment {
  appointmentDate: string;
  appointmentTime: string;
  hubName?: string;
  status: string;
}

function formatBookedDate(value: string) {
  const day = calendarDateFromValue(value);
  // Stored as UTC midnight of the calendar day; noon UTC keeps the weekday stable
  return new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export default function RegisterPage() {
  const { user: authUser, token, loading: authLoading, isAuthenticated } = useAuth();
  const [step, setStep] = useState<'quick-form' | 'appointments' | 'success'>('quick-form');
  const [userId, setUserId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [booked, setBooked] = useState<BookedAppointment | null>(null);
  const resumeChecked = useRef(false);

  // Already signed up (e.g. the page reloaded before picking a time): resume instead of
  // showing the sign-up form again, which would fail with "email already registered".
  useEffect(() => {
    if (authLoading || resumeChecked.current) return;
    resumeChecked.current = true;
    if (!isAuthenticated || !authUser || !token || authUser.isAdmin) return;

    fetch('/api/appointments', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.appointment) {
          window.location.href = '/dashboard';
          return;
        }
        setUserId(authUser._id);
        setStep('appointments');
      })
      .catch(() => {
        setUserId(authUser._id);
        setStep('appointments');
      });
  }, [authLoading, isAuthenticated, authUser, token]);

  const handleQuickRegistrationSuccess = (userData: any) => {
    setUserId(userData._id);
    setErrorMessage('');
    setStep('appointments');
  };

  const handleQuickRegistrationError = (error: string) => {
    setErrorMessage(error);
  };

  const handleAppointmentSuccess = (appointment: BookedAppointment) => {
    setErrorMessage('');
    setBooked(appointment);
    setStep('success');
  };

  const needsProfile = booked?.status === 'pending_profile';

  const handleAppointmentError = (error: string) => {
    setErrorMessage(error);
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-d79-mesh">
      <div
        className="h-1.5 w-full bg-gradient-to-r from-primary-900 via-yellow-500 to-primary-900"
        aria-hidden
      />
      <Header />
      <main className="flex-1 py-10 sm:py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <Link
              href="/"
              className="group mb-6 inline-flex items-center text-sm font-semibold text-primary-800 transition-colors hover:text-primary-600"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transform transition-transform group-hover:-translate-x-1" />
              Back to Home
            </Link>

            <div className="rounded-3xl border border-primary-200/70 bg-white/80 px-6 py-8 shadow-d79-hero backdrop-blur-md sm:px-10">
              <p className="mb-4 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-primary-200/80 bg-primary-50/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-800">
                <span className="text-yellow-700">District 79</span>
                <span className="text-primary-400" aria-hidden>
                  ·
                </span>
                <span>Adult Education</span>
              </p>
              <div className="mb-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-400/25 to-yellow-400/30 blur-xl" />
                  <GraduationCap className="relative h-12 w-12 text-primary-700 transition-transform hover:scale-105" />
                </div>
                <h1 className="text-3xl font-bold text-primary-900 sm:text-4xl">
                  <span className="bg-gradient-to-r from-primary-800 via-primary-600 to-yellow-600 bg-clip-text text-transparent">
                    {step !== 'success' ? 'Quick Registration' : needsProfile ? 'Your Seat Is Reserved' : 'All Set!'}
                  </span>
                </h1>
              </div>
              <p className="text-lg text-primary-900/80">
                {step === 'quick-form' && 'Create your account in just 2 minutes'}
                {step === 'appointments' && 'Select your appointment time'}
                {step === 'success' && (needsProfile
                  ? 'One more step to confirm your appointment'
                  : 'Your appointment is confirmed!')}
              </p>

              {/* Age Requirement Alert */}
              {step !== 'success' && (
                <div className="mt-6 rounded-xl border border-primary-200/80 bg-gradient-to-br from-primary-50/90 to-yellow-50/70 p-4 text-left shadow-d79-card border-l-4 border-l-yellow-500">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-700">
                      !
                    </div>
                    <p className="text-sm font-medium text-primary-900">
                      <strong className="text-primary-900">Age requirement:</strong> You must be at least 21 years old to register.
                    </p>
                  </div>
                </div>
              )}

              {/* Form Content */}
              <div className="mt-8">
                {step === 'quick-form' && (
                  <>
                    <QuickRegistrationForm
                      onSuccess={handleQuickRegistrationSuccess}
                      onError={handleQuickRegistrationError}
                    />
                    <p className="mt-6 text-center text-sm text-primary-900/75">
                      Already have an account?{' '}
                      <Link
                        href="/login"
                        className="font-semibold text-primary-700 underline decoration-yellow-500/80 underline-offset-2 transition hover:text-primary-600 hover:decoration-yellow-500"
                      >
                        Sign in here
                      </Link>
                    </p>
                  </>
                )}

                {step === 'appointments' && userId && (
                  <AppointmentSelectionForm
                    userId={userId}
                    onSuccess={handleAppointmentSuccess}
                    onError={handleAppointmentError}
                  />
                )}

                {step === 'success' && booked && (
                  <div className="space-y-6 py-4 text-left">
                    <div className="flex justify-center">
                      <div className={`rounded-full p-5 ${needsProfile ? 'bg-amber-100' : 'bg-green-100'}`}>
                        {needsProfile ? (
                          <Clock className="h-12 w-12 text-amber-600" aria-hidden />
                        ) : (
                          <CheckCircle2 className="h-12 w-12 text-green-600" aria-hidden />
                        )}
                      </div>
                    </div>

                    <dl className="space-y-3 rounded-xl border border-primary-200/80 bg-white p-5">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-primary-700">Date</dt>
                        <dd className="text-lg font-semibold text-primary-900">{formatBookedDate(booked.appointmentDate)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-primary-700">Time</dt>
                        <dd className="text-lg font-semibold text-primary-900">{booked.appointmentTime}</dd>
                      </div>
                      {booked.hubName && (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-primary-700">Location</dt>
                          <dd className="flex items-center gap-1.5 text-lg font-semibold text-primary-900">
                            <MapPin className="h-4 w-4 text-primary-600" aria-hidden />
                            {booked.hubName}
                          </dd>
                        </div>
                      )}
                    </dl>

                    {needsProfile ? (
                      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="status">
                        <p className="font-semibold">Your seat is held, but not confirmed yet.</p>
                        <p className="mt-1">
                          Finish your profile (address, emergency contact, and education) to confirm it. It takes about 5 minutes.
                        </p>
                      </div>
                    ) : (
                      <p className="text-center text-sm text-primary-900/80">
                        Please arrive 5–10 minutes early. You can reschedule or cancel from your dashboard.
                      </p>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                      {/* Full page loads so AuthContext picks up the new account */}
                      <a
                        href={needsProfile ? '/dashboard?tab=profile' : '/dashboard'}
                        className="inline-flex items-center justify-center rounded-lg bg-primary-700 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
                      >
                        {needsProfile ? 'Complete my profile' : 'Go to my dashboard'}
                      </a>
                      <button
                        type="button"
                        onClick={() => downloadAppointmentIcs({
                          date: booked.appointmentDate,
                          time: booked.appointmentTime,
                          hubName: booked.hubName,
                        })}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary-300 bg-white px-5 py-3 text-sm font-semibold text-primary-800 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
                      >
                        <CalendarPlus className="h-4 w-4" aria-hidden />
                        Add to calendar
                      </button>
                    </div>
                    {needsProfile && (
                      <p className="text-center">
                        <a href="/dashboard" className="text-sm font-semibold text-primary-700 underline underline-offset-2">
                          I&apos;ll do it later
                        </a>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4" role="alert">
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 