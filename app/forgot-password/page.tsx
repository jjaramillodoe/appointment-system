'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ForgotPasswordPage() {
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
      if (!response.ok) throw new Error(data.error || 'Unable to send reset email');
      setResetUrl(typeof data.resetUrl === 'string' ? data.resetUrl : '');
      setEmailSkipped(Boolean(data.emailSkipped));
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Unable to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-bold text-primary-900">Forgot password</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter the email on your account. If we find a match, we will send a reset link.
        </p>
        {submitted ? (
          <div className="mt-6 space-y-3 rounded-lg bg-green-50 p-4 text-sm text-green-800">
            <p>
              {emailSkipped
                ? 'Email is not configured on this computer, so no inbox message was sent.'
                : 'If an account exists for that email, a reset link is on its way.'}
            </p>
            {resetUrl && (
              <p>
                <Link href={resetUrl} className="font-semibold underline">
                  Continue to choose a new password
                </Link>
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input-field w-full"
              placeholder="you@example.com"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary-700 px-4 py-2.5 font-semibold text-white disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-primary-700">
          Back to sign in
        </Link>
      </main>
      <Footer />
    </div>
  );
}
