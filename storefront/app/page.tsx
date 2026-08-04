'use client';

import Link from 'next/link';
import { useTemplate } from '@/lib/template-context';
import { useShopData } from '@/lib/use-shop-data';
import { useCartStore } from '@/lib/cart-store';
import { useStorefrontStore } from '@/lib/storefront-store';
import { TemplateWrapper } from '@/components/templates/TemplateWrapper';
import { ProductCard } from '@/components/product/ProductCard';
import { Input } from '@/components/ui/input';
import { imgUrl } from '@/components/templates/TemplateShells';

function SidebarFilters() {
  const { categories, allTags, category, setCategory, activeTag, setActiveTag } = useShopData();
  return (
    <div className="flex flex-col gap-1 text-sm">
      <p className="text-xs font-semibold text-neutral-400 uppercase mb-1">Categories</p>
      <button onClick={() => setCategory('')} className={`text-left py-1 px-2 rounded ${!category ? 'bg-black text-white' : 'hover:bg-neutral-100 text-neutral-700'}`}>All</button>
      {categories.map((c) => (
        <button key={c.id} onClick={() => setCategory(c.id)} className={`text-left py-1 px-2 rounded ${category === c.id ? 'bg-black text-white' : 'hover:bg-neutral-100 text-neutral-700'}`}>{c.name}</button>
      ))}
      {allTags.length > 0 && <>
        <p className="text-xs font-semibold text-neutral-400 uppercase mt-3 mb-1">Tags</p>
        {allTags.map((t) => (
          <button key={t} onClick={() => setActiveTag(activeTag === t ? '' : t)} className={`text-left py-1 px-2 rounded ${activeTag === t ? 'bg-black text-white' : 'hover:bg-neutral-100 text-neutral-700'}`}>#{t}</button>
        ))}
      </>}
    </div>
  );
}

export default function HomePage() {
  const template = useTemplate();
  const { store } = useStorefrontStore();
  const { products, categories, allTags, search, setSearch, category, setCategory, activeTag, setActiveTag } = useShopData();
  const { addItem } = useCartStore();

  const grid = (cols: string) => (
    <div className={`grid ${cols} gap-4`}>
      {products.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );

  if (template === 'sidebar') {
    return (
      <TemplateWrapper sidebar={<SidebarFilters />}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Featured Products</h2>
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        </div>
        {grid('grid-cols-2 lg:grid-cols-3')}
        <div className="mt-6 text-center">
          <Link href="/products" className="text-sm underline text-neutral-500 hover:text-black">View all products →</Link>
        </div>
      </TemplateWrapper>
    );
  }

  if (template === 'card') {
    return (
      <TemplateWrapper>
        <div className="max-w-6xl mx-auto px-6 py-10">
          {/* Hero */}
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-10 mb-10 text-center">
            <h1 className="text-4xl font-extrabold mb-3">{store?.name || 'Welcome'}</h1>
            <p className="text-indigo-200 mb-6">Discover our curated collection</p>
            <Link href="/products" className="bg-white text-indigo-700 font-bold px-6 py-2 rounded-full hover:bg-indigo-50 transition-colors">Shop Now</Link>
          </div>
          {/* Tag pills */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button onClick={() => setActiveTag('')} className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${!activeTag ? 'bg-black text-white' : 'bg-white border-neutral-200 text-neutral-600 hover:shadow'}`}>All</button>
              {allTags.map((t) => <button key={t} onClick={() => setActiveTag(activeTag === t ? '' : t)} className={`px-4 py-1.5 rounded-full text-sm border transition-all ${activeTag === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-neutral-200 text-neutral-500 hover:shadow'}`}>#{t}</button>)}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.slice(0, 6).map((p) => (
              <div key={p.id} className="bg-white rounded-2xl shadow hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
                <Link href={`/products/${p.id}`} className="block aspect-[4/3] bg-neutral-100 overflow-hidden">
                  {p.images?.[0] ? <img src={imgUrl(p.images[0])} alt={p.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>}
                </Link>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <Link href={`/products/${p.id}`}><h3 className="font-semibold hover:underline">{p.name}</h3></Link>
                  {p.tags?.length > 0 && <div className="flex flex-wrap gap-1">{p.tags.map((t) => <span key={t} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">#{t}</span>)}</div>}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t">
                    <span className="font-bold text-lg">${p.price.toFixed(2)}</span>
                    {p.stock > 0 && <button onClick={() => addItem({ productId: p.id, name: p.name, price: p.price, qty: 1 })} className="bg-black text-white text-sm px-4 py-1.5 rounded-full hover:bg-neutral-800">Add</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </TemplateWrapper>
    );
  }

  // default / topnav
  return (
    <TemplateWrapper>
      <div className="bg-neutral-900 text-white py-20 text-center">
        <h1 className="text-5xl font-bold mb-4">{store?.name || 'Welcome'}</h1>
        <p className="text-neutral-400 mb-8">Discover our collection</p>
        <Link href="/products" className="bg-white text-black font-semibold px-8 py-3 rounded-full hover:bg-neutral-100 transition-colors">Shop Now</Link>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Featured Products</h2>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setCategory('')} className={`text-sm px-3 py-1 rounded-full ${!category ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}>All</button>
            {categories.map((c) => <button key={c.id} onClick={() => setCategory(c.id)} className={`text-sm px-3 py-1 rounded-full ${category === c.id ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}>{c.name}</button>)}
          </div>
        </div>
        {grid('grid-cols-2 sm:grid-cols-3 lg:grid-cols-5')}
      </div>
    </TemplateWrapper>
  );
}
