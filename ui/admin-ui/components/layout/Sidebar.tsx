'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import {
  LayoutDashboard, Palette, Package, ClipboardList,
  Globe, Settings, LogOut, ShoppingBag, ExternalLink,
  ChevronDown, ChevronRight, Home, Info, Navigation, CreditCard, Paintbrush, Wallet,
} from 'lucide-react';

const customizeSubLinks = [
  { href: '/customize', label: 'Home', icon: Home },
  { href: '/customize/theme', label: 'Theme & Template', icon: Paintbrush },
  { href: '/customize/about', label: 'About', icon: Info },
  { href: '/customize/navbar', label: 'Navbar', icon: Navigation },
];

const adminLinks = [
  { href: '/catalog', label: 'Catalog', icon: Package },
  { href: '/orders', label: 'Orders', icon: ClipboardList },
  { href: '/store', label: 'Domain & Publish', icon: Globe },
  { href: '/subscription', label: 'Subscription', icon: CreditCard },
  { href: '/settings/payment', label: 'Payment', icon: Wallet },
  { href: '/settings', label: 'Shop Settings', icon: Settings },
];

const STOREFRONT_BASE = process.env.NEXT_PUBLIC_STOREFRONT_URL
  || 'https://ecom-storefront-m6jmogmpra-ue.a.run.app';

interface SidebarProps { onClose?: () => void }

export function Sidebar({ onClose }: Readonly<SidebarProps>) {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(pathname.startsWith('/customize'));

  useEffect(() => {
    api.get('/store').then((r) => setSubdomain(r.data.store?.subdomain)).catch(() => {});
  }, []);

  useEffect(() => {
    if (pathname.startsWith('/customize')) setCustomizeOpen(true);
  }, [pathname]);

  const handleLogout = () => { clearAuth(); router.push('/login'); };
  const storefrontHref = subdomain ? `${STOREFRONT_BASE}/s/${subdomain}` : null;
  const isActive = (href: string) => pathname === href;

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
        <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">Admin</span>
      </div>

      <nav className="flex-1 px-2 pb-2 flex flex-col gap-0.5 overflow-y-auto">
        <Link href="/dashboard" onClick={onClose}
          className={`flex items-center gap-3 text-sm py-2 px-3 rounded-lg transition-colors ${isActive('/dashboard') ? 'bg-neutral-700 text-white' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'}`}>
          <LayoutDashboard size={16} className="shrink-0" />
          Dashboard
        </Link>

        <div>
          <button
            onClick={() => setCustomizeOpen(!customizeOpen)}
            className={`flex items-center gap-3 w-full text-sm py-2 px-3 rounded-lg transition-colors ${pathname.startsWith('/customize') ? 'bg-neutral-700 text-white' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'}`}>
            <Palette size={16} className="shrink-0" />
            <span className="flex-1 text-left">Customize</span>
            {customizeOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {customizeOpen && (
            <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-neutral-700 pl-3">
              {customizeSubLinks.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={onClose}
                  className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg transition-colors ${isActive(href) ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}>
                  <Icon size={13} className="shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {adminLinks.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={onClose}
            className={`flex items-center gap-3 text-sm py-2 px-3 rounded-lg transition-colors ${isActive(href) ? 'bg-neutral-700 text-white' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'}`}>
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
