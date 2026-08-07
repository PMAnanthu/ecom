'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export default function RootPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    router.replace('/dashboard');
  }, [user, router]);

  return null;
}
