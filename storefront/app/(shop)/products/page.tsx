'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/product/ProductCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Product { id: string; name: string; price: number; stock: number; images: string[]; description?: string }
interface Category { id: string; name: string }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    api.get('/catalog/categories').then((r) => setCategories(r.data.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/catalog/products', { params: { search: search || undefined, category: category || undefined } })
      .then((r) => setProducts(r.data.products))
      .catch(() => {});
  }, [search, category]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">All Products</h1>
      <div className="flex gap-3 mb-6 flex-wrap">
        <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Button variant={!category ? 'default' : 'outline'} size="sm" onClick={() => setCategory('')}>All</Button>
        {categories.map((c) => (
          <Button key={c.id} variant={category === c.id ? 'default' : 'outline'} size="sm" onClick={() => setCategory(c.id)}>{c.name}</Button>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
        {products.length === 0 && <p className="col-span-4 text-center text-neutral-400 py-12">No products found.</p>}
      </div>
    </div>
  );
}
