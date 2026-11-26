import React, { useState } from 'react';
import { ArrowRight, Building2, CheckCircle2, LogOut, Plus, Users } from 'lucide-react';
import { useMess } from '../context/MessContext';

interface MessSelectScreenProps {
  onEnteredMess: () => void;
}

export const MessSelectScreen: React.FC<MessSelectScreenProps> = ({ onEnteredMess }) => {
  const {
    session,
    allMesses,
    currentUserId,
    createMess,
    joinMess,
    selectMess,
    signOut,
  } = useMess();

  const [mode, setMode] = useState<'CREATE' | 'JOIN'>('CREATE');
  const [messName, setMessName] = useState('');
  const [managerName, setManagerName] = useState(session?.displayName || '');
  const [joinCode, setJoinCode] = useState('');
  const [memberName, setMemberName] = useState(session?.displayName || '');
  const [room, setRoom] = useState('');
  const [formError, setFormError] = useState('');

  const myMesses = allMesses.filter((m) => m.memberUids.includes(currentUserId));
  const otherMesses = allMesses.filter((m) => !m.memberUids.includes(currentUserId));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messName.trim() || !managerName.trim()) {
      setFormError('Please provide both a mess name and your display name.');
      return;
    }
    setFormError('');
    createMess(messName.trim(), managerName.trim());
    onEnteredMess();
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !memberName.trim()) {
      setFormError('Please provide a Mess Code and your name.');
      return;
    }
    setFormError('');
    const matched = allMesses.find(
      (m) => m.id.toLowerCase() === joinCode.trim().toLowerCase(),
    );
    if (!matched) {
      setFormError(`No mess found with code "${joinCode.trim()}". Check the code or create a new mess.`);
      return;
    }
    joinMess(matched.id, memberName.trim(), room.trim() || 'Room');
    onEnteredMess();
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-on-background">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-outline-variant/80 bg-surface px-5 py-4 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Mess Workspace
            </p>
            <h1 className="text-xl font-extrabold text-on-surface">
              Welcome, {session?.displayName || 'Member'}
            </h1>
            <p className="text-xs text-on-surface-variant">{session?.email}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant px-3 py-2 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-low hover:text-error"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Existing Messes User Already Belongs To */}
        {myMesses.length > 0 && (
          <div className="rounded-3xl border border-secondary/30 bg-secondary-container/20 p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-on-surface">
              <CheckCircle2 className="h-4.5 w-4.5 text-secondary" />
              <span>Your Messes</span>
            </h2>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {myMesses.map((mess) => (
                <button
                  key={mess.id}
                  type="button"
                  onClick={() => {
                    selectMess(mess.id);
                    onEnteredMess();
                  }}
                  className="flex items-center justify-between rounded-2xl border border-outline-variant bg-surface p-3.5 text-left transition-colors hover:border-secondary hover:bg-surface-low"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-on-surface">{mess.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-on-surface-variant">
                      Code: {mess.id} · {mess.memberUids.length} members
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-secondary" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Create or Join Card */}
        <div className="rounded-3xl border border-outline-variant/80 bg-surface p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface-low p-1">
            <button
              type="button"
              onClick={() => {
                setMode('CREATE');
                setFormError('');
              }}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-colors ${
                mode === 'CREATE'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>Create New Mess</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('JOIN');
                setFormError('');
              }}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-colors ${
                mode === 'JOIN'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Join Existing Mess</span>
            </button>
          </div>

          {mode === 'CREATE' ? (
            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="create-mess-name" className="block text-xs font-semibold text-on-surface-variant">
                  Mess / Hostel Name
                </label>
                <input
                  id="create-mess-name"
                  type="text"
                  value={messName}
                  onChange={(e) => setMessName(e.target.value)}
                  placeholder="e.g., Green View Bachelor Mess"
                  className="w-full rounded-xl border border-outline-variant bg-surface-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="create-manager-name" className="block text-xs font-semibold text-on-surface-variant">
                  Manager Display Name
                </label>
                <input
                  id="create-manager-name"
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="Your name as Mess Manager"
                  className="w-full rounded-xl border border-outline-variant bg-surface-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
                />
              </div>

              {formError && (
                <p className="rounded-xl bg-error-container px-3 py-2 text-xs font-semibold text-on-error-container">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-on-primary shadow-sm transition-opacity hover:opacity-95"
              >
                <Building2 className="h-4.5 w-4.5" />
                <span>Create Mess &amp; Open Dashboard</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="join-mess-code" className="block text-xs font-semibold text-on-surface-variant">
                  6-Character Mess Invite Code
                </label>
                <input
                  id="join-mess-code"
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g., AB3K9P"
                  className="w-full rounded-xl border border-outline-variant bg-surface-low px-3.5 py-2.5 font-mono text-sm uppercase tracking-wider text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="join-member-name" className="block text-xs font-semibold text-on-surface-variant">
                    Your Name
                  </label>
                  <input
                    id="join-member-name"
                    type="text"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="Your display name"
                    className="w-full rounded-xl border border-outline-variant bg-surface-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="join-room" className="block text-xs font-semibold text-on-surface-variant">
                    Room / Seat (Optional)
                  </label>
                  <input
                    id="join-room"
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g., Room 302"
                    className="w-full rounded-xl border border-outline-variant bg-surface-low px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>

              {otherMesses.length > 0 && (
                <div className="rounded-2xl border border-outline-variant/60 bg-surface-low p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Available Local Messes (Click to fill code)
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {otherMesses.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setJoinCode(m.id)}
                        className="rounded-xl border border-outline-variant bg-surface px-2.5 py-1 text-xs font-semibold text-on-surface hover:border-primary"
                      >
                        {m.name} (<span className="font-mono">{m.id}</span>)
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {formError && (
                <p className="rounded-xl bg-error-container px-3 py-2 text-xs font-semibold text-on-error-container">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm font-bold text-on-secondary shadow-sm transition-opacity hover:opacity-95"
              >
                <Users className="h-4.5 w-4.5" />
                <span>Join Mess</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
