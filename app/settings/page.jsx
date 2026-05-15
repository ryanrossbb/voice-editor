'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }
    if (currentPassword === newPassword) {
      setError('New password must be different from your current password.');
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    // First verify current password by attempting to sign in with it
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    });

    if (verifyError) {
      setError('Current password is incorrect.');
      setIsLoading(false);
      return;
    }

    // Then update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full">
      <header className="border-b px-8 py-6" style={{ borderColor: '#e0d8c4' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs uppercase hover:underline"
            style={{ color: '#8a7f6a', letterSpacing: '0.15em' }}
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-8 py-12">
        <h1
          className="display text-3xl tracking-tight mb-1"
          style={{
            color: '#1a1815',
            fontWeight: 500,
            fontVariationSettings: '"opsz" 144',
          }}
        >
          Settings
        </h1>
        <p
          className="text-xs uppercase mb-10"
          style={{ color: '#8a7f6a', letterSpacing: '0.22em' }}
        >
          {userEmail || 'Loading…'}
        </p>

        <section>
          <h2
            className="display text-sm uppercase mb-5"
            style={{ color: '#8a7f6a', letterSpacing: '0.22em' }}
          >
            Change Password
          </h2>

          <form onSubmit={handleSubmit} className="bg-white paper-shadow p-8 space-y-5">
            <div>
              <label
                className="block text-xs uppercase mb-2"
                style={{ color: '#8a7f6a', letterSpacing: '0.18em' }}
              >
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-transparent border-b focus:outline-none py-2"
                style={{ borderColor: '#d6cfbe', color: '#1a1815', fontSize: '15px' }}
              />
            </div>

            <div>
              <label
                className="block text-xs uppercase mb-2"
                style={{ color: '#8a7f6a', letterSpacing: '0.18em' }}
              >
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
                className="w-full bg-transparent border-b focus:outline-none py-2"
                style={{ borderColor: '#d6cfbe', color: '#1a1815', fontSize: '15px' }}
              />
              <p className="text-xs mt-1.5" style={{ color: '#a89d87' }}>
                At least 6 characters.
              </p>
            </div>

            <div>
              <label
                className="block text-xs uppercase mb-2"
                style={{ color: '#8a7f6a', letterSpacing: '0.18em' }}
              >
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
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

            {success && (
              <div
                className="text-xs p-3 flex items-start gap-2"
                style={{ background: '#e8f0e0', color: '#3d7a3d', border: '1px solid #b8d4a8' }}
              >
                <CheckCircle2 size={12} className="flex-shrink-0 mt-0.5" />
                <span>Password updated. Use the new password next time you sign in.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
              className="w-full py-4 text-xs uppercase flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-30"
              style={{ background: '#1a1815', color: '#f6f3eb', letterSpacing: '0.15em' }}
            >
              {isLoading ? (
                <><Loader2 size={14} className="animate-spin" /> Updating</>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
