'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center animate-fade-in-up">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Email sent</h2>
        <p className="text-gray-500">
          If an account exists for <strong>{email}</strong>, you&apos;ll receive a password reset link shortly.
        </p>
        <Link href="/login" className="mt-6 inline-block text-indigo-600 hover:underline font-medium">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Reset password</h2>
      <p className="text-sm text-gray-500 mb-6">Enter your email and we&apos;ll send a reset link.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
          placeholder="you@example.com"
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <Link href="/login" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
        ← Back to sign in
      </Link>
    </div>
  );
}
