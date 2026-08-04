'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/product/ProductCard';
import { Input } from '@/components/ui/input';

interface Product { id: string; name: string; price: number; stock: number; images: string[] }

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/catalog/products', { params: { search: search || undefined, limit: 8 } })
      .then((r) => setProducts(r.data.products))
      .catch(() => {});
  }, [search]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Welcome to our store</h1>
        <p className="text-neutral-500">Browse our collection</p>
      </div>
      <div className="max-w-sm mx-auto mb-8">
        <Input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
        {products.length === 0 && <p className="col-span-4 text-center text-neutral-400 py-12">No products found.</p>}
      </div>
    </div>
  );
}
