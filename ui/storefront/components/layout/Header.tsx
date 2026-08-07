'use client';

import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import { useStorefrontStore } from '@/lib/storefront-store';
import { Button } from '@/components/ui/button';

export function Header() {
  const { items } = useCartStore();
  const { store, user, clearAuth } = useStorefrontStore();
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">{store?.name || 'Shop'}</Link>
        <nav className="flex items-center gap-4">
          <Link href="/products" className="text-sm text-neutral-600 hover:text-black">Products</Link>
          {user
            ? <>
                <Link href="/orders" className="text-sm text-neutral-600 hover:text-black">Orders</Link>
                <Button variant="ghost" size="sm" onClick={clearAuth}>Logout</Button>
              </>
            : <Link href="/login" className="text-sm text-neutral-600 hover:text-black">Sign in</Link>
          }
          <Link href="/cart">
            <Button variant="outline" size="sm">
              Cart {itemCount > 0 && <span className="ml-1 bg-black text-white rounded-full px-1.5 text-xs">{itemCount}</span>}
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
