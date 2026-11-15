'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';

export default function RootPage() {
  const router = useRouter();
  const { user } = useStore();

  useEffect(() => {
    if (user) {
      if (user.role === 'staff') {
        router.replace('/quick-scan');
      } else {
        router.replace('/dashboard');
      }
    } else {
      router.replace('/login');
    }
  }, [user, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-100 text-slate-600 font-mono text-xs">
      Loading Atul Glass Agency ERP...
    </div>
  );
}
