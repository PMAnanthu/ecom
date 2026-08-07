'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Menu, ShoppingBag } from 'lucide-react';
import { api } from '@/lib/api';

interface SubStatus {
  subscribed: boolean;
  availableDays: number;
  expired: boolean;
  subscription: { name: string; price: number; currency: string; billingPeriod: string } | null;
}

// Expose subscription status for child pages via a simple module-level cache
let _subStatusCache: SubStatus | null = null;
export function getSubStatusCache() { return _subStatusCache; }

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setHydrated(true); }, []);
  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.replace('/login'); return; }
    if (user.role !== 'ADMIN') { router.replace('/login'); }
  }, [hydrated, user, router]);

  const fetchSub = useCallback(async () => {
    try {
      const { data } = await api.get('/platform/subscription-status');
      _subStatusCache = data;
    } catch { /* non-blocking */ }
  }, []);

  useEffect(() => {
    if (hydrated && user?.role === 'ADMIN') fetchSub();
  }, [hydrated, user, fetchSub]);

  // Refresh on route change so store/subscription pages get fresh data
  useEffect(() => {
    if (hydrated && user?.role === 'ADMIN') fetchSub();
  }, [pathname, hydrated, user, fetchSub]);

  if (!hydrated || user?.role !== 'ADMIN') return null;

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {sidebarOpen && (
        <button className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />
      )}
      <div className={`fixed inset-y-0 left-0 z-40 w-56 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b flex items-center justify-between px-4 h-14 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-neutral-100" aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} />
            <span className="font-semibold text-sm">ecom Admin</span>
          </div>
          <div className="w-8" />
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
