'use client';

import Link from 'next/link';
import { ProductCard } from '@/components/product/ProductCard';
import { Input } from '@/components/ui/input';
import { useShopData } from '@/lib/use-shop-data';
import { useStorefrontStore } from '@/lib/storefront-store';

export function SidebarTemplate() {
  const { products, categories, allTags, search, setSearch, category, setCategory, activeTag, setActiveTag } = useShopData();
  const { store } = useStorefrontStore();

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Sidebar */}
      <aside className="w-56 min-h-screen bg-white border-r flex flex-col p-5 gap-1 shrink-0">
        <Link href="/" className="text-lg font-bold mb-6 block">{store?.name || 'Shop'}</Link>

        <p className="text-xs font-semibold text-neutral-400 uppercase mb-1">Categories</p>
        <button onClick={() => setCategory('')}
          className={`text-sm text-left py-1 px-2 rounded transition-colors ${!category ? 'bg-black text-white' : 'hover:bg-neutral-100 text-neutral-700'}`}>
          All
        </button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => setCategory(c.id)}
            className={`text-sm text-left py-1 px-2 rounded transition-colors ${category === c.id ? 'bg-black text-white' : 'hover:bg-neutral-100 text-neutral-700'}`}>
            {c.name}
          </button>
        ))}

        {allTags.length > 0 && (
          <>
            <p className="text-xs font-semibold text-neutral-400 uppercase mt-4 mb-1">Tags</p>
            {allTags.map((t) => (
              <button key={t} onClick={() => setActiveTag(activeTag === t ? '' : t)}
                className={`text-sm text-left py-1 px-2 rounded transition-colors ${activeTag === t ? 'bg-black text-white' : 'hover:bg-neutral-100 text-neutral-700'}`}>
                #{t}
              </button>
            ))}
          </>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">
            {activeTag ? `#${activeTag}` : category ? categories.find((c) => c.id === category)?.name : 'All Products'}
          </h1>
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
          {products.length === 0 && <p className="col-span-4 text-neutral-400 py-12 text-center">No products found.</p>}
        </div>
      </div>
    </div>
  );
}
