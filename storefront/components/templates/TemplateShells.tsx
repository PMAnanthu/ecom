'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { useCartStore } from '@/lib/cart-store';
import { useStorefrontStore } from '@/lib/storefront-store';
import { useRouter } from 'next/navigation';

const CATALOG_URL = process.env.NEXT_PUBLIC_CATALOG_URL || 'http://localhost:3004';

export function imgUrl(src: string) {
  if (!src) return '';
  return src.startsWith('http') ? src : `${CATALOG_URL}${src}`;
}

// ─── SIDEBAR SHELL ───────────────────────────────────────────────────────────
interface SidebarShellProps {
  children: ReactNode;
  sidebarContent?: ReactNode;
}

export function SidebarShell({ children, sidebarContent }: Readonly<SidebarShellProps>) {
  const { store, user, clearAuth } = useStorefrontStore();
  const { items } = useCartStore();
  const router = useRouter();
  const cartCount = items.reduce((s, i) => s + i.qty, 0);

  const handleLogout = () => { clearAuth(); router.push('/login'); };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="w-60 min-h-screen bg-white border-r flex flex-col shrink-0">
        <div className="p-5 border-b">
          <Link href="/" className="text-lg font-bold block">{store?.name || 'Shop'}</Link>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-1 text-sm">
          <Link href="/" className="py-2 px-3 rounded hover:bg-neutral-100 text-neutral-700 font-medium">🏠 Home</Link>
          <Link href="/products" className="py-2 px-3 rounded hover:bg-neutral-100 text-neutral-700">🛍 Products</Link>
          <Link href="/about" className="py-2 px-3 rounded hover:bg-neutral-100 text-neutral-700">ℹ️ About</Link>
          <Link href="/orders" className="py-2 px-3 rounded hover:bg-neutral-100 text-neutral-700">📦 My Orders</Link>
          {sidebarContent && <div className="mt-4 border-t pt-4">{sidebarContent}</div>}
        </nav>
        <div className="p-4 border-t flex flex-col gap-2 text-sm">
          <Link href="/cart" className="flex items-center justify-between py-2 px-3 rounded bg-black text-white hover:bg-neutral-800">
            <span>🛒 Cart</span>
            {cartCount > 0 && <span className="bg-white text-black text-xs rounded-full px-1.5">{cartCount}</span>}
          </Link>
          {user
            ? <button onClick={handleLogout} className="py-1 px-3 text-neutral-500 hover:text-black text-xs">Logout ({user.email})</button>
            : <Link href="/login" className="py-1 px-3 text-center text-neutral-500 hover:text-black text-xs">Sign in</Link>
          }
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}

// ─── TOPNAV SHELL ─────────────────────────────────────────────────────────────
export function TopnavShell({ children }: Readonly<{ children: ReactNode }>) {
  const { store, user, clearAuth } = useStorefrontStore();
  const { items } = useCartStore();
  const router = useRouter();
  const cartCount = items.reduce((s, i) => s + i.qty, 0);

  const handleLogout = () => { clearAuth(); router.push('/login'); };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-6">
          <Link href="/" className="font-bold text-lg shrink-0">{store?.name || 'Shop'}</Link>
          <nav className="flex items-center gap-1 flex-1 text-sm">
            <Link href="/" className="px-3 py-1.5 rounded hover:bg-neutral-100 text-neutral-700">Home</Link>
            <Link href="/products" className="px-3 py-1.5 rounded hover:bg-neutral-100 text-neutral-700">Products</Link>
            <Link href="/about" className="px-3 py-1.5 rounded hover:bg-neutral-100 text-neutral-700">About</Link>
            <Link href="/orders" className="px-3 py-1.5 rounded hover:bg-neutral-100 text-neutral-700">Orders</Link>
          </nav>
          <div className="flex items-center gap-3 text-sm shrink-0">
            {user
              ? <button onClick={handleLogout} className="text-neutral-500 hover:text-black text-xs">Logout</button>
              : <Link href="/login" className="text-neutral-600 hover:text-black">Sign in</Link>
            }
            <Link href="/cart" className="flex items-center gap-1 bg-black text-white px-3 py-1.5 rounded-full text-sm hover:bg-neutral-800">
              🛒 {cartCount > 0 && <span className="bg-white text-black text-xs rounded-full px-1.5">{cartCount}</span>}
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

// ─── CARD SHELL ──────────────────────────────────────────────────────────────
export function CardShell({ children }: Readonly<{ children: ReactNode }>) {
  const { store, user, clearAuth } = useStorefrontStore();
  const { items } = useCartStore();
  const router = useRouter();
  const cartCount = items.reduce((s, i) => s + i.qty, 0);

  const handleLogout = () => { clearAuth(); router.push('/login'); };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg,#f5f7fa 0%,#e8ecf1 100%)' }}>
      <header className="bg-white/80 backdrop-blur border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="font-extrabold text-lg tracking-tight shrink-0">{store?.name || 'Shop'}</Link>
          <nav className="flex items-center gap-1 flex-1 text-sm">
            <Link href="/" className="px-3 py-1.5 rounded-full hover:bg-neutral-100 text-neutral-700">Home</Link>
            <Link href="/products" className="px-3 py-1.5 rounded-full hover:bg-neutral-100 text-neutral-700">Products</Link>
            <Link href="/about" className="px-3 py-1.5 rounded-full hover:bg-neutral-100 text-neutral-700">About</Link>
            <Link href="/orders" className="px-3 py-1.5 rounded-full hover:bg-neutral-100 text-neutral-700">Orders</Link>
          </nav>
          <div className="flex items-center gap-3 text-sm shrink-0">
            {user
              ? <button onClick={handleLogout} className="text-neutral-500 hover:text-black text-xs">Logout</button>
              : <Link href="/login" className="text-neutral-600 hover:text-black">Sign in</Link>
            }
            <Link href="/cart" className="flex items-center gap-1 bg-indigo-600 text-white px-4 py-1.5 rounded-full hover:bg-indigo-700">
              🛒 Cart {cartCount > 0 && <span className="bg-white text-indigo-600 text-xs rounded-full px-1.5 font-bold">{cartCount}</span>}
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
