'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTemplate, useCurrency } from '@/lib/template-context';
import { useShopData } from '@/lib/use-shop-data';
import { useCartStore } from '@/lib/cart-store';
import { useStorefrontStore } from '@/lib/storefront-store';
import { TemplateWrapper } from '@/components/templates/TemplateWrapper';
import { ProductCard } from '@/components/product/ProductCard';
import { imgUrl } from '@/components/templates/TemplateShells';

function useStorePath() {
  const pathname = usePathname();
  const match = /^\/s\/([^/]+)/.exec(pathname);
  return match ? `/s/${match[1]}` : '';
}

function SidebarCategories() {
  const { categories, category, setCategory } = useShopData();
  return (
    <div className="flex flex-col gap-1 text-sm">
      <p className="text-xs font-semibold text-neutral-400 uppercase mb-1">Categories</p>
      <button onClick={() => setCategory('')} className={`text-left py-1 px-2 rounded ${!category ? 'bg-black text-white' : 'hover:bg-neutral-100 text-neutral-700'}`}>All</button>
      {categories.map((c) => (
        <button key={c.id} onClick={() => setCategory(c.id)} className={`text-left py-1 px-2 rounded ${category === c.id ? 'bg-black text-white' : 'hover:bg-neutral-100 text-neutral-700'}`}>{c.name}</button>
      ))}
    </div>
  );
}

const GRADIENT_CLASSES: Record<string, string> = {
  'indigo-purple': 'from-indigo-600 to-purple-700',
  'rose-orange':   'from-rose-500 to-orange-500',
  'teal-cyan':     'from-teal-500 to-cyan-400',
  'amber-red':     'from-amber-500 to-red-500',
  'green-blue':    'from-green-500 to-blue-600',
  'pink-violet':   'from-pink-500 to-violet-600',
  'slate-gray':    'from-slate-700 to-gray-900',
  'sky-indigo':    'from-sky-400 to-indigo-600',
};

function HeroSection({ storeName, branding, base }: Readonly<{ storeName: string; branding: Record<string, string>; base: string }>) {
  const heading = branding.heroHeading || storeName;
  const subtext = branding.heroSubtext || 'Discover our collection';
  const style = branding.heroStyle || 'dark';
  const bgImage = branding.heroBgImage || '';
  const gradientKey = branding.heroGradient || 'indigo-purple';
  const gradientClass = GRADIENT_CLASSES[gradientKey] || GRADIENT_CLASSES['indigo-purple'];

  // Theme colors
  const darkBg = branding.darkBg || '#0a0a0a';
  const darkText = branding.darkText || '#fafafa';
  const darkAccent = branding.darkAccent || '#6366f1';
  const lightBg = branding.lightBg || branding.themeBg || '#ffffff';
  const lightText = branding.lightText || branding.themeText || '#171717';
  const lightAccent = branding.lightAccent || branding.themeAccent || '#000000';

  if (style === 'image' && bgImage) {
    return (
      <div className="relative py-24 text-center" style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-white px-4">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">{heading}</h1>
          <p className="text-neutral-300 mb-8 text-lg">{subtext}</p>
          <Link href={`${base}/products`} className="bg-white text-black font-semibold px-8 py-3 rounded-full hover:bg-neutral-100">Shop Now</Link>
        </div>
      </div>
    );
  }
  if (style === 'gradient') {
    return (
      <div className={`bg-gradient-to-br ${gradientClass} text-white py-20 text-center px-4`}>
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">{heading}</h1>
        <p className="text-white/80 mb-8">{subtext}</p>
        <Link href={`${base}/products`} className="bg-white/20 hover:bg-white/30 text-white border border-white/40 font-semibold px-8 py-3 rounded-full backdrop-blur-sm">Shop Now</Link>
      </div>
    );
  }
  if (style === 'light') {
    return (
      <div className="py-16 text-center px-4 border-b" style={{ backgroundColor: lightBg, color: lightText }}>
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">{heading}</h1>
        <p className="mb-8 opacity-60">{subtext}</p>
        <Link href={`${base}/products`} className="font-semibold px-8 py-3 rounded-full border-2 hover:opacity-80" style={{ borderColor: lightAccent, color: lightAccent }}>Shop Now</Link>
      </div>
    );
  }
  // dark (default)
  return (
    <div className="py-20 text-center px-4" style={{ backgroundColor: darkBg, color: darkText }}>
      <h1 className="text-4xl sm:text-5xl font-bold mb-4">{heading}</h1>
      <p className="mb-8 opacity-60">{subtext}</p>
      <Link href={`${base}/products`} className="font-semibold px-8 py-3 rounded-full border-2 hover:opacity-80" style={{ borderColor: darkAccent, color: darkAccent }}>Shop Now</Link>
    </div>
  );
}

export default function HomePage() {
  const template = useTemplate();
  const { store } = useStorefrontStore();
  const { products, categories, category, setCategory } = useShopData();
  const { addItem } = useCartStore();
  const { symbol } = useCurrency();
  const base = useStorePath();
  const branding = (store?.branding || {}) as Record<string, string>;
  const storeName = store?.name || 'Welcome';

  const grid = (cols: string) => (
    <div className={`grid ${cols} gap-4`}>
      {products.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );

  if (template === 'sidebar') {
    return (
      <TemplateWrapper sidebar={<SidebarCategories />}>
        {/* Hero banner — distinct from products page which has no banner */}
        <div className="rounded-2xl bg-neutral-900 text-white p-8 mb-8 relative overflow-hidden">
          {branding.heroBgImage && (
            <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${branding.heroBgImage})` }} />
          )}
          <div className="relative z-10">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">Classical Ornaments</p>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{branding.heroHeading || storeName}</h1>
            <p className="text-neutral-400 text-sm mb-4">{branding.heroSubtext || 'Discover our curated collection'}</p>
            <Link href={`${base}/products`} className="inline-block bg-white text-black font-semibold text-sm px-5 py-2 rounded-full hover:bg-neutral-100">
              Shop All →
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Featured Products</h2>
          <Link href={`${base}/products`} className="text-xs text-neutral-400 hover:text-black underline">View all</Link>
        </div>
        {grid('grid-cols-2 lg:grid-cols-3')}
      </TemplateWrapper>
    );
  }

  if (template === 'card') {
    return (
      <TemplateWrapper>
        <HeroSection storeName={storeName} branding={{ ...branding, heroStyle: branding.heroStyle || 'gradient' }} base={base} />
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.slice(0, 6).map((p) => (
              <div key={p.id} className="bg-white rounded-2xl shadow hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
                <Link href={`${base}/products/${p.id}`} className="block aspect-[4/3] bg-neutral-100 overflow-hidden">
                  {p.images?.[0]
                    ? <img src={imgUrl(p.images[0])} alt={p.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>}
                </Link>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  {p.category && <span className="text-xs text-indigo-600 font-medium">{p.category.name}</span>}
                  <Link href={`${base}/products/${p.id}`}><h3 className="font-semibold hover:underline line-clamp-1">{p.name}</h3></Link>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t">
                    <span className="font-bold text-lg">{symbol}{p.price.toFixed(2)}</span>
                    {p.stock > 0 && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); addItem({ productId: p.id, name: p.name, price: p.price, qty: 1 }); }}
                        className="bg-black text-white text-sm px-4 py-1.5 rounded-full hover:bg-neutral-800">
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </TemplateWrapper>
    );
  }

  // topnav / default
  return (
    <TemplateWrapper>
      <HeroSection storeName={storeName} branding={branding} base={base} />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="text-xl font-bold">Featured Products</h2>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setCategory('')} className={`text-sm px-3 py-1 rounded-full ${!category ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}>All</button>
            {categories.map((c) => (
              <button key={c.id} onClick={() => setCategory(c.id)} className={`text-sm px-3 py-1 rounded-full ${category === c.id ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}>{c.name}</button>
            ))}
          </div>
        </div>
        {grid('grid-cols-2 sm:grid-cols-3 lg:grid-cols-4')}
        <div className="mt-8 text-center">
          <Link href={`${base}/products`} className="text-sm underline text-neutral-500 hover:text-black">View all products →</Link>
        </div>
      </div>
    </TemplateWrapper>
  );
}
