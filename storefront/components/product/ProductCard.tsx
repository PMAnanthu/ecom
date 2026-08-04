'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/cart-store';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  images: string[];
  description?: string;
  category?: { id: string; name: string };
}

const CATALOG_URL = process.env.NEXT_PUBLIC_CATALOG_URL || 'http://localhost:3004';

function productImageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // Local uploads are proxied through storefront via next.config rewrites
  // so /uploads/... works on any device on the network
  return path;
}

export function ProductCard({ product }: Readonly<{ product: Product }>) {
  const { addItem } = useCartStore();

  return (
    <div className="bg-white rounded-lg border overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      <Link href={`/products/${product.id}`}>
        <div className="aspect-square bg-neutral-100 flex items-center justify-center text-neutral-300 text-4xl overflow-hidden">
          {product.images?.[0]
            ? <img src={productImageUrl(product.images[0])} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            : '📦'
          }
        </div>
      </Link>
      <div className="p-3 flex flex-col gap-1 flex-1">
        {product.category && (
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide truncate">
            {product.category.name}
          </span>
        )}
        <Link href={`/products/${product.id}`}>
          <p className="font-medium text-sm hover:underline line-clamp-1">{product.name}</p>
        </Link>
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="font-bold text-sm">${product.price.toFixed(2)}</span>
          {product.stock === 0
            ? <Badge variant="secondary" className="text-xs">Out of stock</Badge>
            : <Button size="sm" className="h-7 text-xs px-3" onClick={() => addItem({ productId: product.id, name: product.name, price: product.price, qty: 1 })}>Add</Button>
          }
        </div>
      </div>
    </div>
  );
}
