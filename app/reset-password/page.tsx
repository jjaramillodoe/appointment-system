'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function ResetPasswordForm() {
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
      if (!response.ok) throw new Error(data.error || 'Unable to reset password');
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <p className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-800">
        Password updated. <Link href="/login" className="font-semibold underline">Sign in</Link>
      </p>
    );
  }

  if (!token) {
    return (
      <div className="mt-6 space-y-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
        <p>This reset link is missing or incomplete. Request a new one from the sign-in page.</p>
        <Link href="/forgot-password" className="font-semibold underline">
          Forgot password
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <input
        type="password"
        required
        minLength={8}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="input-field w-full"
        placeholder="New password (8+ characters)"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary-700 px-4 py-2.5 font-semibold text-white disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Update password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-bold text-primary-900">Choose a new password</h1>
        <Suspense fallback={<p className="mt-6 text-sm text-gray-600">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
