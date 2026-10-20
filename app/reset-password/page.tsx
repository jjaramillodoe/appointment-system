'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useI18n } from '@/contexts/I18nContext';

function ResetPasswordForm() {
  const { t } = useI18n();
  const copy = t.resetPassword;
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || copy.failed);
      setDone(true);
    } catch (err: any) {
      setError(err.message || copy.failed);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <p className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-800" role="status">
        {copy.done} <Link href="/login" className="font-semibold underline">{copy.signIn}</Link>
      </p>
    );
  }

  if (!token) {
    return (
      <div className="mt-6 space-y-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
        <p>{copy.missingToken}</p>
        <Link href="/forgot-password" className="font-semibold underline">
          {copy.forgotPassword}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <label htmlFor="new-password" className="sr-only">{copy.placeholder}</label>
      <input
        id="new-password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="input-field w-full"
        placeholder={copy.placeholder}
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
  );
}

export default function ResetPasswordPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-bold text-primary-900">{t.resetPassword.title}</h1>
        <Suspense fallback={<p className="mt-6 text-sm text-gray-600">{t.resetPassword.loading}</p>}>
          <ResetPasswordForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
