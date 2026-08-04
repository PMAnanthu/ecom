'use client';

import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import { useShopData } from '@/lib/use-shop-data';
import { useStorefrontStore } from '@/lib/storefront-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const CATALOG_URL = process.env.NEXT_PUBLIC_CATALOG_URL || 'http://localhost:3004';

function imgUrl(src: string) {
  if (!src) return '';
  return src.startsWith('http') ? src : `${CATALOG_URL}${src}`;
}

export function CardTemplate() {
  const { products, categories, allTags, search, setSearch, category, setCategory, activeTag, setActiveTag } = useShopData();
  const { store } = useStorefrontStore();
  const { addItem, items } = useCartStore();
  const itemCount = items.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)' }}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-tight">{store?.name || 'Shop'}</Link>
          <Input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm h-9" />
          <Link href="/cart">
            <Button variant="outline" size="sm">
              🛒 Cart {itemCount > 0 && <span className="ml-1 bg-black text-white text-xs rounded-full px-1.5">{itemCount}</span>}
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => { setCategory(''); setActiveTag(''); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${!category && !activeTag ? 'bg-black text-white border-black shadow-md' : 'bg-white border-neutral-200 text-neutral-600 hover:shadow'}`}>
            All
          </button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => { setCategory(c.id); setActiveTag(''); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${category === c.id ? 'bg-black text-white border-black shadow-md' : 'bg-white border-neutral-200 text-neutral-600 hover:shadow'}`}>
              {c.name}
            </button>
          ))}
          {allTags.map((t) => (
            <button key={t} onClick={() => { setActiveTag(activeTag === t ? '' : t); setCategory(''); }}
              className={`px-4 py-1.5 rounded-full text-sm border transition-all ${activeTag === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white border-neutral-200 text-neutral-500 hover:shadow'}`}>
              #{t}
            </button>
          ))}
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl shadow hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
              <Link href={`/products/${p.id}`} className="block aspect-[4/3] bg-neutral-100 overflow-hidden">
                {p.images?.[0]
                  ? <img src={imgUrl(p.images[0])} alt={p.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>
                }
              </Link>
              <div className="p-4 flex flex-col gap-2 flex-1">
                <Link href={`/products/${p.id}`}>
                  <h3 className="font-semibold text-base hover:underline">{p.name}</h3>
                </Link>
                {p.description && <p className="text-sm text-neutral-500 line-clamp-2">{p.description}</p>}
                {p.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.tags.map((t) => (
                      <span key={t} onClick={() => setActiveTag(t)}
                        className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full cursor-pointer hover:bg-indigo-100">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between mt-auto pt-2 border-t">
                  <span className="font-bold text-lg">${p.price.toFixed(2)}</span>
                  {p.stock === 0
                    ? <span className="text-xs text-neutral-400">Out of stock</span>
                    : <button onClick={() => addItem({ productId: p.id, name: p.name, price: p.price, qty: 1 })}
                        className="bg-black text-white text-sm px-4 py-1.5 rounded-full hover:bg-neutral-800 transition-colors">
                        Add
                      </button>
                  }
                </div>
              </div>
            </div>
          ))}
          {products.length === 0 && <p className="col-span-3 text-center text-neutral-400 py-12">No products found.</p>}
        </div>
      </div>
    </div>
  );
}
