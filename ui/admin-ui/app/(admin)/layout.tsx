'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Menu, ShoppingBag, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';

interface SubStatus {
  subscribed: boolean;
  availableDays: number;
  expired: boolean;
  subscription: { name: string; price: number; currency: string; billingPeriod: string } | null;
}

function SubscriptionExpiredPopup({ status, onClose }: Readonly<{ status: SubStatus; onClose: () => void }>) {
  const { clearAuth } = useAuthStore();
  const router = useRouter();

  const logout = () => { clearAuth(); router.push('/login'); };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">
          {status.subscribed ? 'Subscription Expired' : 'No Subscription'}
        </h2>
        <p className="text-neutral-500 text-sm mb-6">
          {status.subscribed
            ? 'Your subscription has expired. Please contact the platform admin to renew your plan.'
            : 'You do not have an active subscription. Please contact the platform admin to assign a plan.'}
        </p>
        {status.subscription && (
          <div className="bg-neutral-50 rounded-xl p-4 mb-6 text-left text-sm">
            <p className="text-neutral-500 text-xs mb-1">Last plan</p>
            <p className="font-semibold">{status.subscription.name}</p>
            <p className="text-neutral-400 text-xs mt-0.5">
              {status.subscription.price === 0 ? 'Free' : `${status.subscription.currency} ${status.subscription.price}`} · {status.subscription.billingPeriod}
            </p>
          </div>
        )}
        <div className="space-y-2">
          <button onClick={onClose}
            className="w-full py-2.5 bg-black text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors">
            Continue Anyway
          </button>
          <button onClick={logout}
            className="w-full py-2.5 text-neutral-500 text-sm hover:text-black transition-colors">
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subStatus, setSubStatus] = useState<SubStatus | null>(null);
  const [showExpired, setShowExpired] = useState(false);

  useEffect(() => { setHydrated(true); }, []);
  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.replace('/login'); return; }
    if (user.role !== 'ADMIN') { router.replace('/login'); }
  }, [hydrated, user, router]);

  const checkSubscription = useCallback(async () => {
    try {
      const { data } = await api.get('/platform/subscription-status');
      setSubStatus(data);
      if (data.expired) setShowExpired(true);
    } catch { /* non-blocking */ }
  }, []);

  useEffect(() => {
    if (hydrated && user?.role === 'ADMIN') {
      checkSubscription();
    }
  }, [hydrated, user, checkSubscription]);

  // Re-check on route change
  useEffect(() => {
    if (hydrated && user?.role === 'ADMIN') {
      checkSubscription();
    }
  }, [pathname, hydrated, user, checkSubscription]);

  if (!hydrated || !user || user.role !== 'ADMIN') return null;

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
        {/* Subscription warning banner */}
        {subStatus && !subStatus.expired && subStatus.availableDays <= 7 && subStatus.availableDays > 0 && (
          <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 flex items-center gap-2 text-sm text-orange-700">
            <AlertTriangle size={14} />
            <span>Your subscription expires in <strong>{subStatus.availableDays} day{subStatus.availableDays !== 1 ? 's' : ''}</strong>. Contact your platform admin to renew.</span>
          </div>
        )}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>

      {showExpired && subStatus && (
        <SubscriptionExpiredPopup status={subStatus} onClose={() => setShowExpired(false)} />
      )}
    </div>
  );
}
