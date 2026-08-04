'use client';

import { useTemplate } from '@/lib/template-context';
import { useShopData } from '@/lib/use-shop-data';
import { useCartStore } from '@/lib/cart-store';
import { TemplateWrapper } from '@/components/templates/TemplateWrapper';
import { ProductCard } from '@/components/product/ProductCard';
import { Input } from '@/components/ui/input';
import { imgUrl } from '@/components/templates/TemplateShells';

function FilterPills({ categories, allTags, category, setCategory, activeTag, setActiveTag, accent = 'black' }: Readonly<{
  categories: { id: string; name: string }[];
  allTags: string[];
  category: string; setCategory: (v: string) => void;
  activeTag: string; setActiveTag: (v: string) => void;
  accent?: string;
}>) {
  const allActiveCls = accent === 'indigo' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-black text-white border-black';
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => { setCategory(''); setActiveTag(''); }}
        className={`px-3 py-1 rounded-full text-sm border transition-all ${!category && !activeTag ? allActiveCls : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-400'}`}>
        All
      </button>
      {categories.map((c) => (
        <button key={c.id} onClick={() => { setCategory(c.id); setActiveTag(''); }}
          className={`px-3 py-1 rounded-full text-sm border transition-all ${category === c.id ? 'bg-black text-white' : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-400'}`}>
          {c.name}
        </button>
      ))}
      {allTags.map((t) => (
        <button key={t} onClick={() => { setActiveTag(activeTag === t ? '' : t); setCategory(''); }}
          className={`px-3 py-1 rounded-full text-sm border transition-all ${activeTag === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-400'}`}>
          #{t}
        </button>
      ))}
    </div>
  );
}

function SidebarFilters({ categories, allTags, category, setCategory, activeTag, setActiveTag }: Readonly<{
  categories: { id: string; name: string }[]; allTags: string[];
  category: string; setCategory: (v: string) => void;
  activeTag: string; setActiveTag: (v: string) => void;
}>) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <p className="text-xs font-semibold text-neutral-400 uppercase mb-1">Categories</p>
      <button onClick={() => setCategory('')} className={`text-left py-1.5 px-2 rounded ${!category ? 'bg-black text-white' : 'hover:bg-neutral-100 text-neutral-700'}`}>All</button>
      {categories.map((c) => (
        <button key={c.id} onClick={() => setCategory(c.id)} className={`text-left py-1.5 px-2 rounded ${category === c.id ? 'bg-black text-white' : 'hover:bg-neutral-100 text-neutral-700'}`}>{c.name}</button>
      ))}
      {allTags.length > 0 && <>
        <p className="text-xs font-semibold text-neutral-400 uppercase mt-4 mb-1">Tags</p>
        {allTags.map((t) => (
          <button key={t} onClick={() => setActiveTag(activeTag === t ? '' : t)} className={`text-left py-1.5 px-2 rounded ${activeTag === t ? 'bg-black text-white' : 'hover:bg-neutral-100 text-neutral-700'}`}>#{t}</button>
        ))}
      </>}
    </div>
  );
}

export default function ProductsPage() {
  const template = useTemplate();
  const { products, categories, allTags, search, setSearch, category, setCategory, activeTag, setActiveTag } = useShopData();
  const { addItem } = useCartStore();

  const count = <p className="text-sm text-neutral-500">{products.length} product{products.length !== 1 ? 's' : ''}</p>;

  if (template === 'sidebar') {
    return (
      <TemplateWrapper sidebar={<SidebarFilters categories={categories} allTags={allTags} category={category} setCategory={setCategory} activeTag={activeTag} setActiveTag={setActiveTag} />}>
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-xl font-bold">Products</h1>{count}</div>
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
          {products.length === 0 && <p className="col-span-3 text-neutral-400 py-12 text-center">No products found.</p>}
        </div>
      </TemplateWrapper>
    );
  }

  if (template === 'card') {
    return (
      <TemplateWrapper>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-extrabold">All Products</h1>
            <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs h-9" />
          </div>
          <div className="mb-6"><FilterPills categories={categories} allTags={allTags} category={category} setCategory={setCategory} activeTag={activeTag} setActiveTag={setActiveTag} accent="indigo" /></div>
          {count}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {products.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl shadow hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
                <a href={`/products/${p.id}`} className="block aspect-[4/3] bg-neutral-100 overflow-hidden">
                  {p.images?.[0] ? <img src={imgUrl(p.images[0])} alt={p.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>}
                </a>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <a href={`/products/${p.id}`}><h3 className="font-semibold hover:underline">{p.name}</h3></a>
                  {p.description && <p className="text-sm text-neutral-500 line-clamp-2">{p.description}</p>}
                  {p.tags?.length > 0 && <div className="flex flex-wrap gap-1">{p.tags.map((t) => <span key={t} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">#{t}</span>)}</div>}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t">
                    <span className="font-bold text-lg">${p.price.toFixed(2)}</span>
                    {p.stock > 0 && <button onClick={() => addItem({ productId: p.id, name: p.name, price: p.price, qty: 1 })} className="bg-black text-white text-sm px-4 py-1.5 rounded-full hover:bg-neutral-800">Add</button>}
                  </div>
                </div>
              </div>
            ))}
            {products.length === 0 && <p className="col-span-3 text-neutral-400 py-12 text-center">No products found.</p>}
          </div>
        </div>
      </TemplateWrapper>
    );
  }

  // topnav / default
  return (
    <TemplateWrapper>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">All Products</h1>
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        </div>
        <div className="mb-6"><FilterPills categories={categories} allTags={allTags} category={category} setCategory={setCategory} activeTag={activeTag} setActiveTag={setActiveTag} /></div>
        {count}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
          {products.length === 0 && <p className="col-span-4 text-neutral-400 py-12 text-center">No products found.</p>}
        </div>
      </div>
    </TemplateWrapper>
  );
}
