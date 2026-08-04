'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const superAdminLinks = [
  { href: '/super/dashboard', label: 'Dashboard' },
  { href: '/super/admins', label: 'Manage Admins' },
  { href: '/super/subscriptions', label: 'Subscriptions' },
];

const adminLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/store', label: 'Store & Domain' },
  { href: '/settings', label: 'Shop Settings' },
  { href: '/catalog', label: 'Catalog' },
  { href: '/orders', label: 'Orders' },
];

export function Sidebar() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  const links = user?.role === 'SUPERADMIN' ? superAdminLinks : adminLinks;

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <aside className="w-56 min-h-screen bg-neutral-900 text-white flex flex-col p-4 gap-2">
      <div className="text-lg font-bold mb-4">ecom.app</div>
      <div className="text-xs text-neutral-400 uppercase mb-2">
        {user?.role === 'SUPERADMIN' ? 'Super Admin' : 'Admin'}
      </div>
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="text-sm hover:text-white text-neutral-300 py-1 px-2 rounded hover:bg-neutral-800 transition-colors">
          {l.label}
        </Link>
      ))}
      <div className="flex-1" />
      <Separator className="bg-neutral-700" />
      <div className="text-xs text-neutral-400 truncate">{user?.email}</div>
      <Button variant="outline" size="sm" onClick={handleLogout} className="text-neutral-300 border-neutral-700 hover:bg-neutral-800">
        Log out
      </Button>
    </aside>
  );
}
