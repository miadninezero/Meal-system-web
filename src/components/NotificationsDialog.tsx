import React, { useMemo, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { InAppNotification } from '../types/mess';
import { Modal } from './Modal';

interface NotificationsDialogProps {
  open: boolean;
  onClose: () => void;
  notifications: InAppNotification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export const NotificationsDialog: React.FC<NotificationsDialogProps> = ({
  open,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllRead,
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNREAD'>('ALL');

  const displayed = useMemo(
    () => (filterMode === 'UNREAD' ? notifications.filter((n) => !n.isRead) : notifications),
    [filterMode, notifications],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Notifications"
      subtitle={unreadCount > 0 ? `${unreadCount} unread updates` : 'All caught up'}
      maxWidthClass="max-w-lg"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary-container/40"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-surface-variant px-4 py-2 text-sm font-semibold text-on-surface transition-opacity hover:opacity-90"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterMode('ALL')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              filterMode === 'ALL'
                ? 'bg-primary text-on-primary'
                : 'border border-outline-variant bg-surface-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('UNREAD')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              filterMode === 'UNREAD'
                ? 'bg-primary text-on-primary'
                : 'border border-outline-variant bg-surface-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-low/60 px-6 py-10 text-center">
            <Bell className="h-8 w-8 text-on-surface-variant/60" />
            <p className="mt-2.5 text-sm font-semibold text-on-surface">
              {filterMode === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              When managers publish shared bills or updates, alerts will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayed.map((notif) => (
              <button
                key={notif.id}
                type="button"
                onClick={() => {
                  if (!notif.isRead) onMarkAsRead(notif.id);
                }}
                className={`w-full rounded-2xl border p-3.5 text-left transition-colors ${
                  notif.isRead
                    ? 'border-outline-variant/70 bg-surface-low/60'
                    : 'border-primary/40 bg-primary-container/25 hover:bg-primary-container/35'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!notif.isRead && (
                      <span className="inline-block rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-on-primary">
                        NEW
                      </span>
                    )}
                    <span className="text-sm font-bold text-on-surface">{notif.title}</span>
                  </div>
                  <span className="shrink-0 text-[11px] text-on-surface-variant">
                    {notif.timestampFormatted}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-on-surface-variant">
                  {notif.message}
                </p>
                {!notif.isRead && (
                  <p className="mt-2 text-[11px] font-semibold text-primary">
                    Tap to mark as read
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
