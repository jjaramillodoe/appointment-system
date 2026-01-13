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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-yellow-50 to-primary-100 flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 transition-colors duration-300 mb-4 group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 transform group-hover:-translate-x-1 transition-transform duration-300" />
              Back to Home
            </Link>
            <div className="flex justify-center items-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary-200 rounded-full blur-lg opacity-50"></div>
                <GraduationCap className="relative h-10 w-10 text-primary-600 transform hover:scale-110 transition-transform duration-300" />
              </div>
              <h1 className="ml-3 text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary-700 via-primary-600 to-yellow-600 bg-clip-text text-transparent">
                Student Registration
              </h1>
            </div>
            <p className="text-gray-600 mb-4 text-lg">
              Create your account to schedule your adult education intake appointment
            </p>
            <div className="bg-gradient-to-r from-primary-50 via-yellow-50 to-primary-50 border-2 border-primary-200 rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-bold text-sm">!</span>
                  </div>
                </div>
                <p className="ml-3 text-primary-800 text-sm font-medium">
                  <strong className="text-primary-900">Age Requirement:</strong> You must be at least 21 years old to register for adult education services.
                </p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors duration-300 underline decoration-yellow-400 hover:decoration-yellow-500">
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