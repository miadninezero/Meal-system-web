import React, { useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  Bell,
  Home,
  LogOut,
  Moon,
  Receipt,
  Scale,
  ShoppingCart,
  Sun,
  Utensils,
  Wallet,
} from 'lucide-react';
import { useMess } from '../context/MessContext';
import { Screen } from '../types/mess';
import { NotificationsDialog } from './NotificationsDialog';

interface AppShellProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  children: React.ReactNode;
}

const NAV_ITEMS: Array<{
  screen: Screen;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { screen: Screen.DASHBOARD, label: 'Home', icon: Home },
  { screen: Screen.DAILY_MEALS, label: 'Meals', icon: Utensils },
  { screen: Screen.BAZAAR_LOG, label: 'Bazaar', icon: ShoppingCart },
  { screen: Screen.SHARED_BILLS, label: 'Bills', icon: Receipt },
  { screen: Screen.DEPOSITS, label: 'Deposit', icon: Wallet },
  { screen: Screen.SETTLEMENT, label: 'Balance', icon: Scale },
];

export const AppShell: React.FC<AppShellProps> = ({
  currentScreen,
  onNavigate,
  children,
}) => {
  const {
    currentMess,
    session,
    isManager,
    uiMessage,
    clearUiMessage,
    unreadNotificationsCount,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    signOut,
  } = useMess();

  const [showNotifModal, setShowNotifModal] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('mess_meal_theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('mess_meal_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    if (!uiMessage) return;
    const timer = window.setTimeout(() => clearUiMessage(), 3500);
    return () => window.clearTimeout(timer);
  }, [uiMessage, clearUiMessage]);

  return (
    <div className="min-h-screen bg-background text-on-background">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col md:flex-row">
        {/* Desktop Navigation Rail */}
        <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-outline-variant/70 bg-surface p-4 md:flex md:sticky md:top-0 md:h-screen">
          <div className="space-y-6">
            {/* Brand Header */}
            <div className="flex items-center gap-3 px-2 pt-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-sm">
                <Utensils className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-extrabold tracking-tight text-on-surface">
                  Mess Meal
                </p>
                <p className="truncate text-xs text-on-surface-variant">
                  {currentMess?.name || 'Mess Manager'}
                </p>
              </div>
            </div>

            {/* Active Member Info */}
            <div className="rounded-2xl border border-outline-variant/60 bg-surface-low px-3.5 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-bold text-on-surface">
                  {session?.displayName || 'Member'}
                </p>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                    isManager
                      ? 'bg-primary-container text-on-primary-container'
                      : 'bg-tertiary-container text-on-tertiary-container'
                  }`}
                >
                  {isManager ? 'MANAGER' : 'MEMBER'}
                </span>
              </div>
              {currentMess && (
                <p className="mt-0.5 font-mono text-[11px] text-on-surface-variant">
                  Code: {currentMess.id}
                </p>
              )}
            </div>

            {/* Primary Nav */}
            <nav className="space-y-1" aria-label="Primary navigation">
              {NAV_ITEMS.map(({ screen, label, icon: Icon }) => {
                const active = currentScreen === screen;
                return (
                  <button
                    key={screen}
                    type="button"
                    onClick={() => onNavigate(screen)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-primary-container text-on-primary-container'
                        : 'text-on-surface-variant hover:bg-surface-low hover:text-on-surface'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    <span className="flex-1 text-left">{label}</span>
                    {screen === Screen.SHARED_BILLS && unreadNotificationsCount > 0 && (
                      <span className="rounded-full bg-error px-1.5 py-0.5 text-[10px] font-bold text-on-error">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer Utilities */}
          <div className="space-y-1.5 border-t border-outline-variant/60 pt-4">
            <button
              type="button"
              onClick={() => setShowNotifModal(true)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-low hover:text-on-surface"
            >
              <Bell className="h-4 w-4" />
              <span className="flex-1 text-left">Notifications</span>
              {unreadNotificationsCount > 0 && (
                <span className="rounded-full bg-error px-1.5 py-0.5 text-[10px] font-bold text-on-error">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-low hover:text-on-surface"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate(Screen.MESS_SELECT)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-low hover:text-on-surface"
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span>Switch Mess</span>
            </button>
            <button
              type="button"
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-error transition-colors hover:bg-error-container/40"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-outline-variant/70 bg-surface/95 px-4 py-2.5 backdrop-blur-sm md:hidden">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary">
              <Utensils className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-on-surface">
                {currentMess?.name || 'Mess Meal'}
              </p>
              <p className="truncate text-[11px] text-on-surface-variant">
                {session?.displayName} {isManager ? '· Manager' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowNotifModal(true)}
              aria-label="Notifications"
              className="relative rounded-xl p-2 text-on-surface-variant hover:bg-surface-low hover:text-on-surface"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              aria-label="Toggle theme"
              className="rounded-xl p-2 text-on-surface-variant hover:bg-surface-low hover:text-on-surface"
            >
              {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
            <button
              type="button"
              onClick={() => onNavigate(Screen.MESS_SELECT)}
              aria-label="Switch Mess"
              className="rounded-xl p-2 text-on-surface-variant hover:bg-surface-low hover:text-on-surface"
            >
              <ArrowLeftRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pb-24 md:pb-8">{children}</main>

        {/* Mobile Bottom Navigation */}
        <nav
          aria-label="Mobile bottom navigation"
          className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-outline-variant/80 bg-surface/95 px-1 py-1.5 backdrop-blur-sm md:hidden"
        >
          {NAV_ITEMS.map(({ screen, label, icon: Icon }) => {
            const active = currentScreen === screen;
            return (
              <button
                key={screen}
                type="button"
                onClick={() => onNavigate(screen)}
                className={`relative flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                  active ? 'text-primary' : 'text-on-surface-variant'
                }`}
              >
                <span
                  className={`rounded-xl px-3 py-1 transition-colors ${
                    active ? 'bg-primary-container text-on-primary-container' : ''
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Snackbar / Toast Banner */}
      {uiMessage && (
        <div className="fixed bottom-20 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 md:bottom-6">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-on-surface px-4 py-3 text-sm font-medium text-surface shadow-lg">
            <span>{uiMessage}</span>
            <button
              type="button"
              onClick={clearUiMessage}
              className="shrink-0 text-xs font-bold uppercase tracking-wider text-primary-container hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <NotificationsDialog
        open={showNotifModal}
        onClose={() => setShowNotifModal(false)}
        notifications={notifications}
        unreadCount={unreadNotificationsCount}
        onMarkAsRead={markNotificationAsRead}
        onMarkAllRead={markAllNotificationsAsRead}
      />
    </div>
  );
};
