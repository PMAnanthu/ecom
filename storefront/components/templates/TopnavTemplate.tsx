'use client';

import Link from 'next/link';
import { ProductCard } from '@/components/product/ProductCard';
import { Input } from '@/components/ui/input';
import { useShopData } from '@/lib/use-shop-data';
import { useStorefrontStore } from '@/lib/storefront-store';
import { useCartStore } from '@/lib/cart-store';

export function TopnavTemplate() {
  const { products, categories, allTags, search, setSearch, category, setCategory, activeTag, setActiveTag } = useShopData();
  const { store } = useStorefrontStore();
  const { items } = useCartStore();
  const itemCount = items.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Top nav */}
      <nav className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg">{store?.name || 'Shop'}</Link>
          <div className="flex items-center gap-1 overflow-x-auto">
            <button onClick={() => setCategory('')}
              className={`text-sm px-3 py-1 rounded-full whitespace-nowrap transition-colors ${!category && !activeTag ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}>
              All
            </button>
            {categories.map((c) => (
              <button key={c.id} onClick={() => { setCategory(c.id); setActiveTag(''); }}
                className={`text-sm px-3 py-1 rounded-full whitespace-nowrap transition-colors ${category === c.id ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}>
                {c.name}
              </button>
            ))}
            {allTags.map((t) => (
              <button key={t} onClick={() => { setActiveTag(activeTag === t ? '' : t); setCategory(''); }}
                className={`text-sm px-3 py-1 rounded-full whitespace-nowrap transition-colors ${activeTag === t ? 'bg-black text-white' : 'text-neutral-500 hover:bg-neutral-100'}`}>
                #{t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 ml-4">
            <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-36 h-8 text-sm" />
            <Link href="/cart" className="relative text-sm font-medium">
              Cart {itemCount > 0 && <span className="ml-1 bg-black text-white text-xs rounded-full px-1.5">{itemCount}</span>}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-neutral-900 text-white py-16 text-center mb-10">
        <h1 className="text-4xl font-bold mb-2">{store?.name || 'Welcome'}</h1>
        <p className="text-neutral-400">Discover our collection</p>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
          {products.length === 0 && <p className="col-span-5 text-neutral-400 py-12 text-center">No products found.</p>}
        </div>
      </div>
    </div>
  );
}
