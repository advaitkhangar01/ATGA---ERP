import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ isOpen, onClose, title, children, className = '' }: DialogProps) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60"
      />

      {/* Dialog Content */}
      <div
        className={`relative w-full max-w-lg rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-6 z-10 text-zinc-950 dark:text-zinc-50 ${className}`}
      >
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-base md:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h2>}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            aria-label="Close dialog"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

