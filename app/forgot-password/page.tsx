'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useI18n } from '@/contexts/I18nContext';

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const copy = t.forgotPassword;
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const [emailSkipped, setEmailSkipped] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || copy.failed);
      setResetUrl(typeof data.resetUrl === 'string' ? data.resetUrl : '');
      setEmailSkipped(Boolean(data.emailSkipped));
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || copy.failed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-bold text-primary-900">{copy.title}</h1>
        <p className="mt-2 text-sm text-gray-600">{copy.intro}</p>
        {submitted ? (
          <div className="mt-6 space-y-3 rounded-lg bg-green-50 p-4 text-sm text-green-800" role="status">
            <p>
              {emailSkipped ? copy.emailSkipped : copy.sent}
            </p>
            {resetUrl && (
              <p>
                <Link href={resetUrl} className="font-semibold underline">
                  {copy.continueLink}
                </Link>
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label htmlFor="forgot-email" className="sr-only">{t.login.email}</label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input-field w-full"
              placeholder={copy.emailPlaceholder}
            />
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary-700 px-4 py-2.5 font-semibold text-white disabled:opacity-50"
            >
              {loading ? copy.submitting : copy.submit}
            </button>
          </form>
        )}
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-primary-700">
          {copy.backToSignIn}
        </Link>
      </main>
      <Footer />
    </div>
  );
}
