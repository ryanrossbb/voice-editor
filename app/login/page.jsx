'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setError('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.');
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
    } else {
      router.push(nextPath);
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white paper-shadow p-10 space-y-5">
      <div>
        <label
          className="block text-xs uppercase mb-2"
          style={{ color: '#8a7f6a', letterSpacing: '0.18em' }}
        >
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          autoFocus
          className="w-full bg-transparent border-b focus:outline-none py-2"
          style={{ borderColor: '#d6cfbe', color: '#1a1815', fontSize: '15px' }}
        />
      </div>

      <div>
        <label
          className="block text-xs uppercase mb-2"
          style={{ color: '#8a7f6a', letterSpacing: '0.18em' }}
        >
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full bg-transparent border-b focus:outline-none py-2"
          style={{ borderColor: '#d6cfbe', color: '#1a1815', fontSize: '15px' }}
        />
      </div>

      {error && (
        <div
          className="text-xs p-3 flex items-start gap-2"
          style={{ background: '#fdf0ed', color: '#c0392b', border: '1px solid #f4c8c0' }}
        >
          <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !email || !password}
        className="w-full py-4 text-xs uppercase flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-30"
        style={{ background: '#1a1815', color: '#f6f3eb', letterSpacing: '0.15em' }}
      >
        {isLoading ? (
          <><Loader2 size={14} className="animate-spin" /> Signing in</>
        ) : (
          'Sign in'
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1
            className="display text-3xl tracking-tight"
            style={{
              color: '#1a1815',
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
              lineHeight: 1.15,
            }}
          >
            MedTech Financial
          </h1>
          <p
            className="text-xs uppercase mt-2"
            style={{ color: '#8a7f6a', letterSpacing: '0.22em' }}
          >
            Marketing Dashboard
          </p>
        </div>

        <Suspense fallback={<div className="bg-white paper-shadow p-10 text-center text-sm" style={{ color: '#8a7f6a' }}>Loading…</div>}>
          <LoginForm />
        </Suspense>

        <p className="text-xs text-center mt-8" style={{ color: '#a89d87', lineHeight: 1.6 }}>
          Accounts are created manually.<br />
          Contact the site owner for access.
        </p>
      </div>
    </div>
  );
}
