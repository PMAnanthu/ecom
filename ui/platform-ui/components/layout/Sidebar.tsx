'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard, Globe, Settings, Users, CreditCard,
  LayoutTemplate, LogOut, ShoppingBag, ShieldCheck,
} from 'lucide-react';

const superAdminLinks = [
  { href: '/super/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/super/admins', label: 'Admin', icon: Users },
  { href: '/super/stores', label: 'Store', icon: Globe },
  { href: '/super/customers', label: 'Customer', icon: ShoppingBag },
  { href: '/super/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/super/subscriptions', label: 'Subscription', icon: CreditCard },
  { href: '/super/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps { onClose?: () => void }

export function Sidebar({ onClose }: Readonly<SidebarProps>) {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => { clearAuth(); router.push('/login'); };
  const isActive = (href: string) => pathname === href;

  return (
    <aside className="w-56 h-full min-h-screen bg-neutral-900 text-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} />
          <span className="font-bold text-base">ecom.app</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-neutral-400 hover:text-white p-1" aria-label="Close">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      <div className="px-4 py-2">
        <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">Super Admin</span>
      </div>

      <nav className="flex-1 px-2 pb-2 flex flex-col gap-0.5 overflow-y-auto">
        {superAdminLinks.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={onClose}
            className={`flex items-center gap-3 text-sm py-2 px-3 rounded-lg transition-colors ${isActive(href) ? 'bg-neutral-700 text-white' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'}`}>
            <Icon size={16} className="shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-2 pb-3">
        <Separator className="bg-neutral-800 mb-3" />
        <p className="text-[11px] text-neutral-500 truncate px-3 mb-2">{user?.email}</p>
        <button onClick={handleLogout}
          className="flex items-center gap-2 w-full text-sm text-neutral-400 hover:text-white py-2 px-3 rounded-lg hover:bg-neutral-800 transition-colors">
          <LogOut size={15} />
          Log out
        </button>
      </div>
    </aside>
  );
}
