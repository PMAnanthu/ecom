'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import {
  LayoutDashboard, Palette, Package, ClipboardList,
  Globe, Settings, Users, CreditCard, LayoutTemplate,
  LogOut, ShoppingBag, ExternalLink,
} from 'lucide-react';

const superAdminLinks = [
  { href: '/super/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/super/admins', label: 'Manage Admins', icon: Users },
  { href: '/super/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/super/subscriptions', label: 'Subscriptions', icon: CreditCard },
];

const adminLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customize', label: 'Customize Home', icon: Palette },
  { href: '/catalog', label: 'Catalog', icon: Package },
  { href: '/orders', label: 'Orders', icon: ClipboardList },
  { href: '/store', label: 'Domain & Publish', icon: Globe },
  { href: '/settings', label: 'Shop Settings', icon: Settings },
];

const STOREFRONT_BASE = process.env.NEXT_PUBLIC_STOREFRONT_URL
  || 'https://ecom-storefront-m6jmogmpra-ue.a.run.app';

interface SidebarProps { onClose?: () => void }

export function Sidebar({ onClose }: Readonly<SidebarProps>) {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const links = user?.role === 'SUPERADMIN' ? superAdminLinks : adminLinks;

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      api.get('/store').then((r) => setSubdomain(r.data.store?.subdomain)).catch(() => {});
    }
  }, [user]);

  const handleLogout = () => { clearAuth(); router.push('/login'); };

  const storefrontHref = subdomain ? `${STOREFRONT_BASE}/s/${subdomain}` : null;

  return (
    <aside className="w-56 h-full min-h-screen bg-neutral-900 text-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <ShoppingBag size={20} />
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
        <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">
          {user?.role === 'SUPERADMIN' ? 'Super Admin' : 'Admin'}
        </span>
      </div>

      <nav className="flex-1 px-2 pb-2 flex flex-col gap-0.5">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={onClose}
            className="flex items-center gap-3 text-sm text-neutral-300 hover:text-white py-2 px-3 rounded-lg hover:bg-neutral-800 transition-colors">
            <Icon size={16} className="shrink-0" />
            {label}
          </Link>
        ))}

        {storefrontHref && (
          <a href={storefrontHref} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm text-neutral-400 hover:text-white py-2 px-3 rounded-lg hover:bg-neutral-800 transition-colors mt-2 border-t border-neutral-800 pt-3">
            <ExternalLink size={16} className="shrink-0" />
            View Store ↗
          </a>
        )}
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
