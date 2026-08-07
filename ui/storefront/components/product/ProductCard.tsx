'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/cart-store';
import { useCurrency } from '@/lib/template-context';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  images: string[];
  description?: string;
  category?: { id: string; name: string };
}

function useStorePath() {
  const pathname = usePathname();
  const match = /^\/s\/([^/]+)/.exec(pathname);
  return match ? `/s/${match[1]}` : '';
}

export function ProductCard({ product }: Readonly<{ product: Product }>) {
  const { addItem } = useCartStore();
  const { symbol } = useCurrency();
  const [imgIdx, setImgIdx] = useState(0);
  const base = useStorePath();
  const images = product.images || [];

  return (
    <div className="bg-white rounded-lg border overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      <Link href={`${base}/products/${product.id}`}>
        <div className="relative aspect-square bg-neutral-100 overflow-hidden">
          {images[imgIdx]
            ? <img src={images[imgIdx]} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            : <div className="w-full h-full flex items-center justify-center text-neutral-300 text-4xl">📦</div>
          }
          {images.length > 1 && (
            <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1">
              {images.map((img) => (
                <button key={img} type="button"
                  onMouseEnter={() => setImgIdx(images.indexOf(img))}
                  onClick={(e) => { e.preventDefault(); setImgIdx(images.indexOf(img)); }}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${images.indexOf(img) === imgIdx ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>
      </Link>
      <div className="p-3 flex flex-col gap-1 flex-1">
        {product.category && (
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide truncate">
            {product.category.name}
          </span>
        )}
        <Link href={`${base}/products/${product.id}`}>
          <p className="font-medium text-sm hover:underline line-clamp-1">{product.name}</p>
        </Link>
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="font-bold text-sm">{symbol}{product.price.toFixed(2)}</span>
          {product.stock === 0
            ? <Badge variant="secondary" className="text-xs">Out of stock</Badge>
            : <Button size="sm" className="h-7 text-xs px-3"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); addItem({ productId: product.id, name: product.name, price: product.price, qty: 1 }); }}>
                Add
              </Button>
          }
        </div>
      </div>
    </div>
  );
}
