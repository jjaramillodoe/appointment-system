'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, LogIn, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface ValidationState {
  email: { isValid: boolean; message: string };
  password: { isValid: boolean };
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isAdmin } = useAuth();
  const { t } = useI18n();
  const copy = t.login;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [validation, setValidation] = useState<ValidationState>({
    email: { isValid: false, message: '' },
    password: { isValid: false },
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

  // Validate email format
  const validateEmail = (email: string): { isValid: boolean; message: string } => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return { isValid: false, message: '' };
    }
    if (!emailRegex.test(email)) {
      return { isValid: false, message: copy.emailInvalid };
    }
    return { isValid: true, message: copy.emailOk };
  };

  // Signing in only needs a password; strength rules belong to sign-up
  const validatePassword = (password: string): { isValid: boolean } => ({ isValid: password.length > 0 });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: inputValue,
    }));

    // Validate in real-time
    if (name === 'email') {
      setValidation(prev => ({
        ...prev,
        email: validateEmail(value),
      }));
    } else if (name === 'password') {
      setValidation(prev => ({
        ...prev,
        password: validatePassword(value),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validate before submit
    if (!validation.email.isValid || !validation.password.isValid) {
      setError(copy.fixErrors);
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(formData.email, formData.password);

      if (success) {
        // Save email if remember me is checked
        if (formData.rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        // Redirect based on user role
        if (isAdmin) {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(copy.invalidCredentials);
      }
    } catch (err: any) {
      setError(err.message || copy.failed);
    } finally {
      setIsLoading(false);
    }
  };

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({
        ...prev,
        email: rememberedEmail,
        rememberMe: true,
      }));
      setValidation(prev => ({
        ...prev,
        email: validateEmail(rememberedEmail),
      }));
    }
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col bg-d79-mesh">
      <div
        className="h-1.5 w-full bg-gradient-to-r from-primary-900 via-yellow-500 to-primary-900"
        aria-hidden
      />
      <Header />
      <main className="flex flex-1 flex-col py-10 sm:py-12">
        <div className="mx-auto w-full max-w-xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <Link
              href="/"
              className="group mb-6 inline-flex items-center text-sm font-semibold text-primary-800 transition-colors hover:text-primary-600"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              {t.common.backToHome}
            </Link>

            <div className="mx-auto rounded-3xl border border-primary-200/70 bg-white/80 px-6 py-8 shadow-d79-hero backdrop-blur-md sm:px-10">
              <p className="mb-4 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-primary-200/80 bg-primary-50/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-800">
                <span className="text-yellow-700">{t.common.district79}</span>
                <span className="text-primary-400" aria-hidden>
                  ·
                </span>
                <span>{t.common.adultEducation}</span>
              </p>
              <div className="mb-4 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-400/25 to-yellow-400/30 blur-xl" />
                  <GraduationCap className="relative h-12 w-12 text-primary-700" />
                </div>
                <h1 className="text-3xl font-bold text-primary-900 sm:text-4xl">
                  <span className="bg-gradient-to-r from-primary-800 via-primary-600 to-yellow-600 bg-clip-text text-transparent">
                    {copy.title}
                  </span>
                </h1>
              </div>
              <p className="text-lg text-primary-900/80">{copy.subtitle}</p>
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

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-primary-900/90">
                  {copy.email}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className={`input-field pr-10 ${
                      formData.email && (validation.email.isValid ? 'border-green-500' : 'border-red-500')
                    }`}
                    placeholder={copy.emailPlaceholder}
                    autoComplete="email"
                  />
                  {formData.email && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {validation.email.isValid ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {formData.email && validation.email.message && (
                  <p
                    className={`mt-1 text-xs font-medium ${
                      validation.email.isValid ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {validation.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-primary-900/90">
                    {copy.password}
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="input-field pr-10"
                    placeholder={copy.passwordPlaceholder}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-600 hover:text-primary-700"
                    aria-label={showPassword ? t.common.hidePassword : t.common.showPassword}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <div className="mt-2 text-right">
                  <Link href="/forgot-password" className="text-sm font-semibold text-primary-700">
                    {copy.forgotPassword}
                  </Link>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm text-primary-700">
                  {copy.rememberMe}
                </label>
              </div>

              <div className="flex flex-col gap-4 border-t border-primary-100/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href="/register"
                  className="text-center text-sm font-semibold text-primary-700 underline decoration-yellow-500/80 underline-offset-2 transition hover:text-primary-600 sm:text-left"
                >
                  {copy.noAccount}
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-primary-700 to-primary-600 px-6 py-2.5 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto"
                >
                  {isLoading ? (
                    <>
                      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {copy.submitting}
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" aria-hidden />
                      {copy.submit}
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