import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  maxWidthClass = 'max-w-lg',
  children,
  footer,
}) => {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`flex max-h-[90vh] w-full ${maxWidthClass} flex-col overflow-hidden rounded-3xl border border-outline-variant bg-surface text-on-surface shadow-xl`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-outline-variant/60 px-6 py-4">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-lg font-bold leading-snug text-on-surface">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-on-surface-variant">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-xl p-1.5 text-on-surface-variant transition-colors hover:bg-surface-low hover:text-on-surface"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-outline-variant/60 bg-surface-low/50 px-6 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
