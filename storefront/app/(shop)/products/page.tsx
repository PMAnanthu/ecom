'use client';

import { useTemplate } from '@/lib/template-context';
import { useShopData } from '@/lib/use-shop-data';
import { useCartStore } from '@/lib/cart-store';
import { usePathname } from 'next/navigation';
import { TemplateWrapper } from '@/components/templates/TemplateWrapper';
import { InfiniteProductGrid } from '@/components/product/InfiniteProductGrid';
import { Input } from '@/components/ui/input';
import { imgUrl } from '@/components/templates/TemplateShells';

function useStorePath() {
  const pathname = usePathname();
  const match = /^\/s\/([^/]+)/.exec(pathname);
  return match ? `/s/${match[1]}` : '';
}

function CategoryPills({ categories, category, setCategory, accent = 'black' }: Readonly<{
  categories: { id: string; name: string }[];
  category: string; setCategory: (v: string) => void;
  accent?: string;
}>) {
  const activeCls = accent === 'indigo' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-black text-white border-black';
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => setCategory('')}
        className={`px-3 py-1 rounded-full text-sm border transition-all ${!category ? activeCls : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-400'}`}>
        All
      </button>
      {categories.map((c) => (
        <button key={c.id} onClick={() => setCategory(c.id)}
          className={`px-3 py-1 rounded-full text-sm border transition-all ${category === c.id ? activeCls : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-400'}`}>
          {c.name}
        </button>
      ))}
    </div>
  );
}

function SidebarCategories({ categories, category, setCategory }: Readonly<{
  categories: { id: string; name: string }[];
  category: string; setCategory: (v: string) => void;
}>) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <p className="text-xs font-semibold text-neutral-400 uppercase mb-1">Categories</p>
      <button onClick={() => setCategory('')} className={`text-left py-1.5 px-2 rounded ${!category ? 'bg-black text-white' : 'hover:bg-neutral-100 text-neutral-700'}`}>All</button>
      {categories.map((c) => (
        <button key={c.id} onClick={() => setCategory(c.id)} className={`text-left py-1.5 px-2 rounded ${category === c.id ? 'bg-black text-white' : 'hover:bg-neutral-100 text-neutral-700'}`}>{c.name}</button>
      ))}
    </div>
  );
}

function CardProduct({ p, base }: Readonly<{ p: ReturnType<typeof useShopData>['products'][0]; base: string }>) {
  const { addItem } = useCartStore();
  return (
    <div className="bg-white rounded-2xl shadow hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
      <a href={`${base}/products/${p.id}`} className="block aspect-[4/3] bg-neutral-100 overflow-hidden">
        {p.images?.[0]
          ? <img src={imgUrl(p.images[0])} alt={p.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>}
      </a>
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        {p.category && <span className="text-xs text-indigo-600 font-medium">{p.category.name}</span>}
        <a href={`${base}/products/${p.id}`}><h3 className="font-semibold hover:underline line-clamp-1">{p.name}</h3></a>
        {p.description && <p className="text-sm text-neutral-500 line-clamp-2">{p.description}</p>}
        <div className="flex items-center justify-between mt-auto pt-2 border-t">
          <span className="font-bold text-lg">${p.price.toFixed(2)}</span>
          {p.stock > 0
            ? <button onClick={() => addItem({ productId: p.id, name: p.name, price: p.price, qty: 1 })} className="bg-black text-white text-sm px-4 py-1.5 rounded-full hover:bg-neutral-800">Add</button>
            : <span className="text-xs text-neutral-400">Out of stock</span>
          }
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const template = useTemplate();
  const base = useStorePath();
  const { products, categories, search, setSearch, category, setCategory, loadMore, hasMore, loadingMore, total } = useShopData();

  const count = <p className="text-sm text-neutral-500 mb-2">{total} products</p>;

  if (template === 'sidebar') {
    return (
      <TemplateWrapper sidebar={<SidebarCategories categories={categories} category={category} setCategory={setCategory} />}>
        <div className="flex items-center justify-between mb-4">
          <div><h1 className="text-xl font-bold">Products</h1>{count}</div>
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        </div>
        {products.length === 0
          ? <p className="text-neutral-400 py-12 text-center">No products found.</p>
          : <InfiniteProductGrid products={products} loadMore={loadMore} hasMore={hasMore} loadingMore={loadingMore} cols="grid-cols-2 lg:grid-cols-3" />
        }
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
          <div className="mb-4"><CategoryPills categories={categories} category={category} setCategory={setCategory} accent="indigo" /></div>
          {count}
          {products.length === 0
            ? <p className="text-neutral-400 py-12 text-center">No products found.</p>
            : <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((p) => <CardProduct key={p.id} p={p} base={base} />)}
                </div>
                {loadingMore && <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-neutral-300 border-t-indigo-600 rounded-full animate-spin" /></div>}
                {!hasMore && products.length > 0 && <p className="text-center text-xs text-neutral-400 py-4">All {products.length} products loaded</p>}
              </>
          }
        </div>
      </TemplateWrapper>
    );
  }

  return (
    <TemplateWrapper>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">All Products</h1>
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        </div>
        <div className="mb-4"><CategoryPills categories={categories} category={category} setCategory={setCategory} /></div>
        {count}
        {products.length === 0
          ? <p className="text-neutral-400 py-12 text-center">No products found.</p>
          : <InfiniteProductGrid products={products} loadMore={loadMore} hasMore={hasMore} loadingMore={loadingMore} />
        }
      </div>
    </TemplateWrapper>
  );
}
