'use client';

import RegistrationStepper from '@/components/RegistrationStepper';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  const handleRegistration = async (formData: any) => {
    // Flatten closestHub if present
    let flatHub = formData.closestHub;
    if (flatHub && flatHub.hub) {
      flatHub = {
        name: flatHub.hub.name,
        address: flatHub.hub.address,
        latitude: flatHub.hub.latitude,
        longitude: flatHub.hub.longitude,
        distance: flatHub.distance,
        distanceText: flatHub.distanceText,
      };
    }
    // Prepare the payload for the API
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...formData,
        dateOfBirth: new Date(formData.dateOfBirth),
        closestHub: flatHub,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    // Store token in localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    // Redirect to dashboard
    router.push('/dashboard');
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-d79-mesh">
      <div
        className="h-1.5 w-full bg-gradient-to-r from-primary-900 via-yellow-500 to-primary-900"
        aria-hidden
      />
      <Header />
      <main className="flex-1 py-10 sm:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <Link
              href="/"
              className="group mb-6 inline-flex items-center text-sm font-semibold text-primary-800 transition-colors hover:text-primary-600"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transform transition-transform group-hover:-translate-x-1" />
              Back to Home
            </Link>

            <div className="mx-auto max-w-2xl rounded-3xl border border-primary-200/70 bg-white/80 px-6 py-8 shadow-d79-hero backdrop-blur-md sm:px-10">
              <p className="mb-4 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-primary-200/80 bg-primary-50/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-800">
                <span className="text-yellow-700">District 79</span>
                <span className="text-primary-400" aria-hidden>
                  ·
                </span>
                <span>Adult Education</span>
              </p>
              <div className="mb-4 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-400/25 to-yellow-400/30 blur-xl" />
                  <GraduationCap className="relative h-12 w-12 text-primary-700 transition-transform hover:scale-105" />
                </div>
                <h1 className="text-3xl font-bold text-primary-900 sm:text-4xl">
                  <span className="bg-gradient-to-r from-primary-800 via-primary-600 to-yellow-600 bg-clip-text text-transparent">
                    Student Registration
                  </span>
                </h1>
              </div>
              <p className="text-lg text-primary-900/80">
                Create your account to schedule your adult education intake appointment.
              </p>
              <div className="mt-6 rounded-xl border border-primary-200/80 bg-gradient-to-br from-primary-50/90 to-yellow-50/70 p-4 text-left shadow-d79-card border-l-4 border-l-yellow-500">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-700">
                    !
                  </div>
                  <p className="text-sm font-medium text-primary-900">
                    <strong className="text-primary-900">Age requirement:</strong> You must be at least 21 years old to
                    register for adult education services.
                  </p>
                </div>
              </div>
              <p className="mt-6 text-sm text-primary-900/75">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-primary-700 underline decoration-yellow-500/80 underline-offset-2 transition hover:text-primary-600 hover:decoration-yellow-500"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
          <RegistrationStepper onSubmit={handleRegistration} />
        </div>
      </main>
      <Footer />
    </div>
  );
} 