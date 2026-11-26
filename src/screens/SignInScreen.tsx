import React, { useState } from 'react';
import { LogIn, UserPlus, Users, Utensils } from 'lucide-react';
import { useMess } from '../context/MessContext';

export const SignInScreen: React.FC = () => {
  const { knownUsers, signIn } = useMess();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    if (!cleanName) {
      setError('Please enter your display name.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    signIn(cleanName, cleanEmail);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10 text-on-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-on-primary shadow-md">
            <Utensils className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-on-surface">
            Mess Meal
          </h1>
          <p className="mt-1.5 text-sm text-on-surface-variant">
            Hostel &amp; bachelor mess meal management, automated rates, and balance reconciliation.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-outline-variant/80 bg-surface p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 text-base font-bold text-on-surface">
            <LogIn className="h-5 w-5 text-primary" />
            <span>Sign In to Continue</span>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signin-name" className="block text-xs font-semibold text-on-surface-variant">
              Full Name
            </label>
            <input
              id="signin-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Rahim Ahmed"
              className="w-full rounded-xl border border-outline-variant bg-surface-low px-3.5 py-2.5 text-sm text-on-surface outline-none transition-colors focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signin-email" className="block text-xs font-semibold text-on-surface-variant">
              Email Address
            </label>
            <input
              id="signin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., rahim@example.com"
              className="w-full rounded-xl border border-outline-variant bg-surface-low px-3.5 py-2.5 text-sm text-on-surface outline-none transition-colors focus:border-primary"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-error-container px-3 py-2 text-xs font-semibold text-on-error-container">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-on-primary shadow-sm transition-opacity hover:opacity-95"
          >
            <UserPlus className="h-4.5 w-4.5" />
            <span>Continue to Mess Meal</span>
          </button>

          <p className="text-center text-[11px] leading-relaxed text-on-surface-variant">
            Saved locally in this browser. Sign in with the same email anytime to switch back to a member profile.
          </p>
        </form>

        {knownUsers.length > 0 && (
          <div className="rounded-3xl border border-outline-variant/70 bg-surface-low/80 p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              <Users className="h-4 w-4 text-secondary" />
              <span>Saved Local Profiles ({knownUsers.length})</span>
            </div>
            <div className="mt-3 space-y-2">
              {knownUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => signIn(u.displayName, u.email)}
                  className="flex w-full items-center justify-between rounded-2xl border border-outline-variant/60 bg-surface px-3.5 py-2.5 text-left transition-colors hover:border-primary/60 hover:bg-primary-container/20"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-on-surface">{u.displayName}</p>
                    <p className="truncate text-xs text-on-surface-variant">{u.email}</p>
                  </div>
                  <span className="shrink-0 rounded-xl bg-primary-container px-2.5 py-1 text-xs font-bold text-on-primary-container">
                    Switch
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
