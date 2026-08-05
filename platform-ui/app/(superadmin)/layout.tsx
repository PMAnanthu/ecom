'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';

export default function SuperAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (user.role !== 'SUPERADMIN') router.replace('/dashboard');
  }, [user, router]);

  if (!user || user.role !== 'SUPERADMIN') return null;

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
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M3 6h18M3 12h18M3 18h18"/>
            </svg>
          </button>
          <span className="font-semibold text-sm">ecom Super Admin</span>
          <div className="w-8" />
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
