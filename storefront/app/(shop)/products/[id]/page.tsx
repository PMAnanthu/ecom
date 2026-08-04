'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { api } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Product { id: string; name: string; price: number; stock: number; images: string[]; description?: string; category?: { name: string } }

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const { addItem } = useCartStore();

  useEffect(() => {
    api.get(`/catalog/products/${id}`).then((r) => setProduct(r.data.product)).catch(() => {});
  }, [id]);

  if (!product) return <div className="max-w-4xl mx-auto px-4 py-12 text-neutral-400">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden flex items-center justify-center text-6xl">
          {product.images?.[0]
            ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            : '📦'
          }
        </div>
        <div className="space-y-4">
          {product.category && <Badge variant="secondary">{product.category.name}</Badge>}
          <h1 className="text-2xl font-bold">{product.name}</h1>
          {product.description && <p className="text-neutral-600 text-sm">{product.description}</p>}
          <p className="text-3xl font-bold">${product.price.toFixed(2)}</p>
          <p className="text-sm text-neutral-500">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
          {product.stock > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center border rounded">
                <button className="px-3 py-1 text-lg" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                <span className="px-3">{qty}</span>
                <button className="px-3 py-1 text-lg" onClick={() => setQty(Math.min(product.stock, qty + 1))}>+</button>
              </div>
              <Button onClick={() => addItem({ productId: product.id, name: product.name, price: product.price, qty })}>
                Add to Cart
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
