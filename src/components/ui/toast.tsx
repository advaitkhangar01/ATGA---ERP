import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, X, Info } from 'lucide-react';
import { useStore, AppNotification } from '../../store/useStore';

export function ToastContainer() {
  const { notifications, markNotificationRead } = useStore();
  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);

  useEffect(() => {
    // Show unread notifications
    const unread = notifications.filter(n => !n.read);
    setActiveToasts(unread.slice(0, 5)); // cap at 5
  }, [notifications]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {activeToasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => markNotificationRead(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: AppNotification; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'low-stock':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'alert':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'border-l-emerald-500 dark:border-l-emerald-400 shadow-emerald-500/5 neon-glow-emerald';
      case 'error':
        return 'border-l-rose-500 dark:border-l-rose-400 shadow-rose-500/5 neon-glow-rose';
      case 'low-stock':
        return 'border-l-amber-500 dark:border-l-amber-400 shadow-amber-500/5';
      case 'alert':
        return 'border-l-amber-500 dark:border-l-amber-400 shadow-amber-500/5';
      default:
        return 'border-l-indigo-500 dark:border-l-indigo-400 shadow-indigo-500/5 neon-glow-indigo';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, y: -15 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      className={`pointer-events-auto flex items-start gap-3.5 rounded-2xl glass-panel-glow border-l-4 p-4 shadow-xl text-zinc-950 dark:text-zinc-50 ${getToastStyles()}`}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-1 space-y-0.5">
        <h4 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">{toast.title}</h4>
        <p className="text-xs text-zinc-650 dark:text-zinc-300 leading-normal font-semibold">{toast.message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors duration-150 p-0.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

