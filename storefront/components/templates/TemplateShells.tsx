'use client';

import Link from 'next/link';
import { useState, ReactNode } from 'react';
import { useCartStore } from '@/lib/cart-store';
import { useStorefrontStore } from '@/lib/storefront-store';
import { useRouter, usePathname } from 'next/navigation';

const CATALOG_URL = process.env.NEXT_PUBLIC_CATALOG_URL || 'http://localhost:3004';

export function imgUrl(src: string) {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  if (src.startsWith('/uploads/')) return `${CATALOG_URL}${src}`;
  return src;
}

function useStorePath() {
  const pathname = usePathname();
  const match = /^\/s\/([^/]+)/.exec(pathname);
  return match ? `/s/${match[1]}` : '';
}

interface NavLink { label: string; href: string; enabled: boolean }

function useNavLinks(customLinks?: NavLink[]) {
  const base = useStorePath();
  if (customLinks && customLinks.length > 0) {
    return customLinks.filter(l => l.enabled).map(l => {
      const suffix = l.href === '/' ? '' : l.href;
      const href = l.href.startsWith('http') ? l.href : `${base}${suffix}`;
      return { label: l.label, href };
    });
  }
  return [
    { href: `${base}/`, label: 'Home' },
    { href: `${base}/products`, label: 'Products' },
    { href: `${base}/about`, label: 'About' },
    { href: `${base}/orders`, label: 'Orders' },
  ];
}

function useNavBranding() {
  const { store } = useStorefrontStore();
  const b = (store?.branding || {}) as Record<string, unknown>;
  return {
    bgColor: (b.navBgColor as string) || '',
    textColor: (b.navTextColor as string) || '',
    accentColor: (b.navAccentColor as string) || '',
    showCart: b.navShowCart !== false,
    showLogin: b.navShowLogin !== false,
    navLinks: (b.navLinks as NavLink[] | undefined),
  };
}

// ─── MOBILE MENU ─────────────────────────────────────────────────────────────
function MobileMenu({ open, onClose, links, cartCount, user, onLogout, nav }: Readonly<{
  open: boolean; onClose: () => void;
  links: { href: string; label: string }[];
  cartCount: number; user: { email: string } | null;
  onLogout: () => void;
  nav: ReturnType<typeof useNavBranding>;
}>) {
  const base = useStorePath();
  if (!open) return null;
  const cartStyle = nav.accentColor ? { backgroundColor: nav.accentColor, color: '#fff' } : {};
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button className="absolute inset-0 bg-black/60 cursor-default" aria-label="Close menu" onClick={onClose} />
      <div className="relative w-64 bg-white shadow-xl flex flex-col"
        style={nav.bgColor ? { backgroundColor: nav.bgColor } : {}}>
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-bold" style={nav.textColor ? { color: nav.textColor } : {}}>Menu</span>
          <button onClick={onClose} className="text-2xl leading-none" aria-label="Close"
            style={nav.textColor ? { color: nav.textColor } : {}}>×</button>
        </div>
        <nav className="flex-1 flex flex-col p-4 gap-1">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={onClose}
              className="py-3 px-2 text-base border-b border-neutral-100 hover:opacity-75"
              style={nav.textColor ? { color: nav.textColor } : { color: '#404040' }}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t space-y-2">
          {nav.showCart && (
            <Link href={`${base}/cart`} onClick={onClose}
              className="flex items-center justify-between w-full py-2 px-3 rounded-lg"
              style={cartStyle.backgroundColor ? cartStyle : { backgroundColor: '#000', color: '#fff' }}>
              <span>🛒 Cart</span>
              {cartCount > 0 && <span className="bg-white text-black text-xs rounded-full px-2">{cartCount}</span>}
            </Link>
          )}
          {nav.showLogin && (user
            ? <button onClick={() => { onLogout(); onClose(); }} className="w-full py-2 text-sm text-neutral-500">Logout</button>
            : <Link href={`${base}/login`} onClick={onClose} className="block w-full py-2 text-center text-sm text-neutral-600">Sign in</Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR SHELL ───────────────────────────────────────────────────────────
interface SidebarShellProps { children: ReactNode; sidebarContent?: ReactNode }
export function SidebarShell({ children, sidebarContent }: Readonly<SidebarShellProps>) {
  const { store, user, clearAuth } = useStorefrontStore();
  const { items } = useCartStore();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const cartCount = items.reduce((s, i) => s + i.qty, 0);
  const handleLogout = () => { clearAuth(); router.push('/login'); };
  const nav = useNavBranding();
  const navLinks = useNavLinks(nav.navLinks);
  const base = useStorePath();
  const headerStyle = nav.bgColor ? { backgroundColor: nav.bgColor } : {};
  const textStyle = nav.textColor ? { color: nav.textColor } : {};
  const accentStyle = nav.accentColor
    ? { backgroundColor: nav.accentColor, color: '#fff' }
    : { backgroundColor: '#000', color: '#fff' };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="hidden lg:flex w-60 min-h-screen border-r flex-col shrink-0 bg-white"
        style={headerStyle}>
        <div className="p-5 border-b">
          <Link href={`${base}/`} className="text-lg font-bold block" style={textStyle}>
            {store?.name || 'Shop'}
          </Link>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-1 text-sm">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href}
              className="py-2 px-3 rounded hover:bg-neutral-100 font-medium"
              style={textStyle}>
              {l.label}
            </Link>
          ))}
          {sidebarContent && <div className="mt-4 border-t pt-4">{sidebarContent}</div>}
          {nav.showCart && (
            <Link href={`${base}/cart`} className="flex items-center justify-between py-2 px-3 rounded mt-2"
              style={accentStyle}>
              <span>🛒 Cart</span>
              {cartCount > 0 && <span className="bg-white text-black text-xs rounded-full px-1.5">{cartCount}</span>}
            </Link>
          )}
        </nav>
        {nav.showLogin && (
          <div className="p-4 border-t flex flex-col gap-2 text-sm">
            {user
              ? <button onClick={handleLogout} className="py-1 px-3 text-neutral-500 hover:text-black text-xs">Logout</button>
              : <Link href={`${base}/login`} className="py-1 px-3 text-center text-neutral-500 hover:text-black text-xs">Sign in</Link>}
          </div>
        )}
      </aside>
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden sticky top-0 z-40 border-b flex items-center justify-between px-4 h-14"
          style={headerStyle.backgroundColor ? headerStyle : { backgroundColor: '#fff' }}>
          <Link href={`${base}/`} className="font-bold text-base truncate max-w-[180px]" style={textStyle}>
            {store?.name || 'Shop'}
          </Link>
          <div className="flex items-center gap-3">
            {nav.showCart && (
              <Link href={`${base}/cart`} className="relative">
                <span className="text-xl">🛒</span>
                {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>}
              </Link>
            )}
            <button onClick={() => setMenuOpen(true)} className="text-2xl leading-none px-1" style={textStyle}>☰</button>
          </div>
        </header>
        <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} cartCount={cartCount} user={user} onLogout={handleLogout} nav={nav} />
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
  const nav = useNavBranding();
  const navLinks = useNavLinks(nav.navLinks);
  const base = useStorePath();
  const headerStyle = nav.bgColor ? { backgroundColor: nav.bgColor } : { backgroundColor: '#fff' };
  const textStyle = nav.textColor ? { color: nav.textColor } : {};
  const accentStyle = nav.accentColor
    ? { backgroundColor: nav.accentColor, color: '#fff' }
    : { backgroundColor: '#000', color: '#fff' };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b shadow-sm" style={headerStyle}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href={`${base}/`} className="font-bold text-lg shrink-0 truncate max-w-[150px] sm:max-w-none" style={textStyle}>
            {store?.name || 'Shop'}
          </Link>
          <nav className="hidden md:flex items-center gap-1 flex-1 text-sm">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className="px-3 py-1.5 rounded hover:opacity-75" style={textStyle}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-3 text-sm shrink-0">
            {nav.showLogin && (user
              ? <button onClick={handleLogout} className="text-xs hover:opacity-75" style={textStyle}>Logout</button>
              : <Link href={`${base}/login`} className="hover:opacity-75" style={textStyle}>Sign in</Link>
            )}
            {nav.showCart && (
              <Link href={`${base}/cart`} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm hover:opacity-90"
                style={accentStyle}>
                🛒 {cartCount > 0 && <span className="bg-white text-black text-xs rounded-full px-1.5 font-bold">{cartCount}</span>}
              </Link>
            )}
          </div>
          <div className="flex md:hidden items-center gap-3 ml-auto">
            {nav.showCart && (
              <Link href={`${base}/cart`} className="relative">
                <span className="text-xl">🛒</span>
                {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>}
              </Link>
            )}
            <button onClick={() => setMenuOpen(true)} className="text-2xl leading-none px-1" style={textStyle}>☰</button>
          </div>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} cartCount={cartCount} user={user} onLogout={handleLogout} nav={nav} />
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
  const nav = useNavBranding();
  const navLinks = useNavLinks(nav.navLinks);
  const base = useStorePath();
  const headerStyle = nav.bgColor
    ? { backgroundColor: nav.bgColor }
    : { backgroundColor: 'rgba(255,255,255,0.8)' };
  const textStyle = nav.textColor ? { color: nav.textColor } : {};
  const accentStyle = nav.accentColor
    ? { backgroundColor: nav.accentColor, color: '#fff' }
    : { backgroundColor: '#4f46e5', color: '#fff' };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg,#f5f7fa 0%,#e8ecf1 100%)' }}>
      <header className="backdrop-blur border-b sticky top-0 z-50" style={headerStyle}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href={`${base}/`} className="font-extrabold text-lg tracking-tight shrink-0 truncate max-w-[150px] sm:max-w-none" style={textStyle}>
            {store?.name || 'Shop'}
          </Link>
          <nav className="hidden md:flex items-center gap-1 flex-1 text-sm">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className="px-3 py-1.5 rounded-full hover:bg-neutral-100 hover:opacity-75" style={textStyle}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-3 text-sm shrink-0">
            {nav.showLogin && (user
              ? <button onClick={handleLogout} className="text-xs hover:opacity-75" style={textStyle}>Logout</button>
              : <Link href={`${base}/login`} className="hover:opacity-75" style={textStyle}>Sign in</Link>
            )}
            {nav.showCart && (
              <Link href={`${base}/cart`} className="flex items-center gap-1 px-4 py-1.5 rounded-full hover:opacity-90"
                style={accentStyle}>
                🛒 {cartCount > 0 && <span className="bg-white text-xs rounded-full px-1.5 font-bold" style={{ color: nav.accentColor || '#4f46e5' }}>{cartCount}</span>}
              </Link>
            )}
          </div>
          <div className="flex md:hidden items-center gap-3 ml-auto">
            {nav.showCart && (
              <Link href={`${base}/cart`} className="relative">
                <span className="text-xl">🛒</span>
                {cartCount > 0 && <span className="absolute -top-1 -right-1 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center"
                  style={accentStyle}>{cartCount}</span>}
              </Link>
            )}
            <button onClick={() => setMenuOpen(true)} className="text-2xl leading-none px-1" style={textStyle}>☰</button>
          </div>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} cartCount={cartCount} user={user} onLogout={handleLogout} nav={nav} />
      <main>{children}</main>
    </div>
  );
}
