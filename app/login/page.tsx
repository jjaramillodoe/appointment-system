'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, LogIn, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
  });

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isAdmin, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(formData.email, formData.password);
      
      if (success) {
        // Redirect based on user role
        if (isAdmin) {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-d79-mesh">
      <div
        className="h-1.5 w-full bg-gradient-to-r from-primary-900 via-yellow-500 to-primary-900"
        aria-hidden
      />
      <Header />
      <main className="flex flex-1 flex-col py-10 sm:py-12">
        <div className="mx-auto w-full max-w-md px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <Link
              href="/"
              className="group mb-6 inline-flex items-center text-sm font-semibold text-primary-800 transition-colors hover:text-primary-600"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Home
            </Link>

            <div className="mx-auto rounded-3xl border border-primary-200/70 bg-white/80 px-6 py-8 shadow-d79-hero backdrop-blur-md sm:px-10">
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
                  <GraduationCap className="relative h-12 w-12 text-primary-700" />
                </div>
                <h1 className="text-3xl font-bold text-primary-900 sm:text-4xl">
                  <span className="bg-gradient-to-r from-primary-800 via-primary-600 to-yellow-600 bg-clip-text text-transparent">
                    Sign in
                  </span>
                </h1>
              </div>
              <p className="text-lg text-primary-900/80">Welcome back — access your account and appointments.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-primary-200/70 bg-white/90 p-6 shadow-d79-card backdrop-blur-sm sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div
                  className="rounded-xl border border-red-200 bg-red-50/95 px-4 py-3 text-sm text-red-800"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-primary-900/90">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-primary-900/90">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </div>

              <div className="flex flex-col gap-4 border-t border-primary-100/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href="/register"
                  className="text-center text-sm font-semibold text-primary-700 underline decoration-yellow-500/80 underline-offset-2 transition hover:text-primary-600 sm:text-left"
                >
                  Don&apos;t have an account? Register
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-primary-700 to-primary-600 px-6 py-2.5 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto"
                >
                  {isLoading ? (
                    <>
                      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign in
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 