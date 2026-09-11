'use client';

import { useState } from 'react';
import QuickRegistrationForm from '@/components/QuickRegistrationForm';
import AppointmentSelectionForm from '@/components/AppointmentSelectionForm';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'quick-form' | 'appointments' | 'success'>('quick-form');
  const [userId, setUserId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleQuickRegistrationSuccess = (userData: any) => {
    setUserId(userData._id);
    setErrorMessage('');
    setStep('appointments');
  };

  const handleQuickRegistrationError = (error: string) => {
    setErrorMessage(error);
  };

  const handleAppointmentSuccess = (appointment: any) => {
    setStep('success');
    setTimeout(() => {
      router.push('/dashboard');
    }, 2500);
  };

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
                    {step === 'success' ? 'All Set!' : 'Quick Registration'}
                  </span>
                </h1>
              </div>
              <p className="text-lg text-primary-900/80">
                {step === 'quick-form' && 'Create your account in just 2 minutes'}
                {step === 'appointments' && 'Select your appointment time'}
                {step === 'success' && 'Your appointment is confirmed!'}
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

                {step === 'success' && (
                  <div className="space-y-6 py-12">
                    <div className="flex justify-center">
                      <div className="rounded-full bg-green-100 p-6">
                        <CheckCircle2 className="h-16 w-16 text-green-600" />
                      </div>
                    </div>
                    <div className="text-center space-y-3">
                      <h2 className="text-2xl font-bold text-green-700">Appointment Confirmed!</h2>
                      <p className="text-primary-600">
                        Check your email for confirmation details and next steps.
                      </p>
                      <p className="text-sm text-primary-500">
                        Redirecting to your dashboard...
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4">
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