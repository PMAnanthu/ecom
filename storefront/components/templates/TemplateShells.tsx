'use client';

import Link from 'next/link';
import { useState, ReactNode } from 'react';
import { useCartStore } from '@/lib/cart-store';
import { useStorefrontStore } from '@/lib/storefront-store';
import { useRouter } from 'next/navigation';

export function imgUrl(src: string) {
  if (!src) return '';
  return src;
}

// ─── MOBILE HEADER (shared) ─────────────────────────────────────────────────
function MobileMenu({ open, onClose, links, cartCount, user, onLogout }: Readonly<{
  open: boolean; onClose: () => void;
  links: { href: string; label: string }[];
  cartCount: number; user: { email: string } | null;
  onLogout: () => void;
}>) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button className="absolute inset-0 bg-black/60 cursor-default" aria-label="Close menu" onClick={onClose} />
      <div className="relative w-64 bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-bold">Menu</span>
          <button onClick={onClose} className="text-2xl leading-none" aria-label="Close">×</button>
        </div>
        <nav className="flex-1 flex flex-col p-4 gap-1">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={onClose}
              className="py-3 px-2 text-base border-b border-neutral-100 text-neutral-700 hover:text-black">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t space-y-2">
          <Link href="/cart" onClick={onClose}
            className="flex items-center justify-between w-full py-2 px-3 bg-black text-white rounded-lg">
            <span>🛒 Cart</span>
            {cartCount > 0 && <span className="bg-white text-black text-xs rounded-full px-2">{cartCount}</span>}
          </Link>
          {user
            ? <button onClick={() => { onLogout(); onClose(); }} className="w-full py-2 text-sm text-neutral-500">Logout</button>
            : <Link href="/login" onClick={onClose} className="block w-full py-2 text-center text-sm text-neutral-600">Sign in</Link>
          }
        </div>
      </div>
    </div>
  );
}

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/about', label: 'About' },
  { href: '/orders', label: 'Orders' },
];

// ─── SIDEBAR SHELL ───────────────────────────────────────────────────────────
interface SidebarShellProps { children: ReactNode; sidebarContent?: ReactNode }
export function SidebarShell({ children, sidebarContent }: Readonly<SidebarShellProps>) {
  const { store, user, clearAuth } = useStorefrontStore();
  const { items } = useCartStore();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const cartCount = items.reduce((s, i) => s + i.qty, 0);
  const handleLogout = () => { clearAuth(); router.push('/login'); };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 min-h-screen bg-white border-r flex-col shrink-0">
        <div className="p-5 border-b">
          <Link href="/" className="text-lg font-bold block">{store?.name || 'Shop'}</Link>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-1 text-sm">
          {NAV_LINKS.map(l => <Link key={l.href} href={l.href} className="py-2 px-3 rounded hover:bg-neutral-100 text-neutral-700 font-medium">{l.label}</Link>)}
          {sidebarContent && <div className="mt-4 border-t pt-4">{sidebarContent}</div>}
        </nav>
        <div className="p-4 border-t flex flex-col gap-2 text-sm">
          <Link href="/cart" className="flex items-center justify-between py-2 px-3 rounded bg-black text-white hover:bg-neutral-800">
            <span>🛒 Cart</span>
            {cartCount > 0 && <span className="bg-white text-black text-xs rounded-full px-1.5">{cartCount}</span>}
          </Link>
          {user ? <button onClick={handleLogout} className="py-1 px-3 text-neutral-500 hover:text-black text-xs">Logout</button>
            : <Link href="/login" className="py-1 px-3 text-center text-neutral-500 hover:text-black text-xs">Sign in</Link>}
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden sticky top-0 z-40 bg-white border-b flex items-center justify-between px-4 h-14">
          <Link href="/" className="font-bold text-base truncate max-w-[180px]">{store?.name || 'Shop'}</Link>
          <div className="flex items-center gap-3">
            <Link href="/cart" className="relative">
              <span className="text-xl">🛒</span>
              {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>}
            </Link>
            <button onClick={() => setMenuOpen(true)} className="text-2xl leading-none px-1">☰</button>
          </div>
        </header>
        <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} links={NAV_LINKS} cartCount={cartCount} user={user} onLogout={handleLogout} />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

// ─── TOPNAV SHELL ─────────────────────────────────────────────────────────────
export function TopnavShell({ children }: Readonly<{ children: ReactNode }>) {
  const { store, user, clearAuth } = useStorefrontStore();
  const { items } = useCartStore();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const cartCount = items.reduce((s, i) => s + i.qty, 0);
  const handleLogout = () => { clearAuth(); router.push('/login'); };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/" className="font-bold text-lg shrink-0 truncate max-w-[150px] sm:max-w-none">{store?.name || 'Shop'}</Link>
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 text-sm">
            {NAV_LINKS.map(l => <Link key={l.href} href={l.href} className="px-3 py-1.5 rounded hover:bg-neutral-100 text-neutral-700">{l.label}</Link>)}
          </nav>
          <div className="hidden md:flex items-center gap-3 text-sm shrink-0">
            {user ? <button onClick={handleLogout} className="text-neutral-500 hover:text-black text-xs">Logout</button>
              : <Link href="/login" className="text-neutral-600 hover:text-black">Sign in</Link>}
            <Link href="/cart" className="flex items-center gap-1 bg-black text-white px-3 py-1.5 rounded-full text-sm hover:bg-neutral-800">
              🛒 {cartCount > 0 && <span className="bg-white text-black text-xs rounded-full px-1.5 font-bold">{cartCount}</span>}
            </Link>
          </div>
          {/* Mobile */}
          <div className="flex md:hidden items-center gap-3 ml-auto">
            <Link href="/cart" className="relative">
              <span className="text-xl">🛒</span>
              {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>}
            </Link>
            <button onClick={() => setMenuOpen(true)} className="text-2xl leading-none px-1">☰</button>
          </div>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} links={NAV_LINKS} cartCount={cartCount} user={user} onLogout={handleLogout} />
      <main>{children}</main>
    </div>
  );
}

// ─── CARD SHELL ──────────────────────────────────────────────────────────────
export function CardShell({ children }: Readonly<{ children: ReactNode }>) {
  const { store, user, clearAuth } = useStorefrontStore();
  const { items } = useCartStore();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const cartCount = items.reduce((s, i) => s + i.qty, 0);
  const handleLogout = () => { clearAuth(); router.push('/login'); };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg,#f5f7fa 0%,#e8ecf1 100%)' }}>
      <header className="bg-white/80 backdrop-blur border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/" className="font-extrabold text-lg tracking-tight shrink-0 truncate max-w-[150px] sm:max-w-none">{store?.name || 'Shop'}</Link>
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 text-sm">
            {NAV_LINKS.map(l => <Link key={l.href} href={l.href} className="px-3 py-1.5 rounded-full hover:bg-neutral-100 text-neutral-700">{l.label}</Link>)}
          </nav>
          <div className="hidden md:flex items-center gap-3 text-sm shrink-0">
            {user ? <button onClick={handleLogout} className="text-neutral-500 hover:text-black text-xs">Logout</button>
              : <Link href="/login" className="text-neutral-600 hover:text-black">Sign in</Link>}
            <Link href="/cart" className="flex items-center gap-1 bg-indigo-600 text-white px-4 py-1.5 rounded-full hover:bg-indigo-700">
              🛒 {cartCount > 0 && <span className="bg-white text-indigo-600 text-xs rounded-full px-1.5 font-bold">{cartCount}</span>}
            </Link>
          </div>
          {/* Mobile */}
          <div className="flex md:hidden items-center gap-3 ml-auto">
            <Link href="/cart" className="relative">
              <span className="text-xl">🛒</span>
              {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>}
            </Link>
            <button onClick={() => setMenuOpen(true)} className="text-2xl leading-none px-1">☰</button>
          </div>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} links={NAV_LINKS} cartCount={cartCount} user={user} onLogout={handleLogout} />
      <main>{children}</main>
    </div>
  );
}
