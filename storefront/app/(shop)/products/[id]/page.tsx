'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { api } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import { useTemplate } from '@/lib/template-context';
import { TemplateWrapper } from '@/components/templates/TemplateWrapper';
import { imgUrl } from '@/components/templates/TemplateShells';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Product { id: string; name: string; price: number; stock: number; images: string[]; tags: string[]; description?: string; category?: { name: string } }

export default function ProductDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCartStore();
  const template = useTemplate();

  useEffect(() => {
    api.get(`/catalog/products/${id}`).then((r) => setProduct(r.data.product)).catch(() => {});
  }, [id]);

  if (!product) return <TemplateWrapper><div className="p-12 text-neutral-400 text-center">Loading…</div></TemplateWrapper>;

  const handleAdd = () => {
    addItem({ productId: product.id, name: product.name, price: product.price, qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const tagCls = template === 'card' ? 'bg-indigo-50 text-indigo-600' : 'bg-neutral-100 text-neutral-600';
  const priceCls = template === 'card' ? 'text-indigo-700' : '';
  const btnCls = template === 'card' ? 'bg-indigo-600 hover:bg-indigo-700 rounded-full px-8' : 'rounded-full px-8';

  const detail = (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-3">
        <div className={`aspect-square rounded-2xl overflow-hidden ${template === 'card' ? 'shadow-lg' : 'border'} bg-neutral-100 flex items-center justify-center text-6xl`}>
          {product.images?.[0] ? <img src={imgUrl(product.images[0])} alt={product.name} className="w-full h-full object-cover" /> : '📦'}
        </div>
        {product.images?.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {product.images.map((img) => (
              <img key={img} src={imgUrl(img)} alt="" className="w-16 h-16 object-cover rounded-lg border flex-shrink-0 cursor-pointer hover:opacity-80" />
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4">
        {product.category && <Badge variant="secondary">{product.category.name}</Badge>}
        <h1 className="text-2xl font-bold">{product.name}</h1>
        {product.description && <p className="text-neutral-600">{product.description}</p>}
        {product.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.tags.map((t) => <span key={t} className={`text-xs px-2 py-0.5 rounded-full ${tagCls}`}>#{t}</span>)}
          </div>
        )}
        <p className={`text-3xl font-bold ${priceCls}`}>${product.price.toFixed(2)}</p>
        <p className="text-sm text-neutral-500">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
        {product.stock > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded-full overflow-hidden">
              <button className="px-4 py-2 text-lg hover:bg-neutral-100" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span className="px-4 font-medium">{qty}</span>
              <button className="px-4 py-2 text-lg hover:bg-neutral-100" onClick={() => setQty(Math.min(product.stock, qty + 1))}>+</button>
            </div>
            <Button onClick={handleAdd} className={btnCls}>{added ? '✓ Added!' : 'Add to Cart'}</Button>
          </div>
        )}
        {product.stock === 0 && <p className="text-red-500 font-medium">Out of stock</p>}
      </div>
    </div>
  );

  return (
    <TemplateWrapper>
      <div className={`mx-auto px-6 py-10 ${template === 'sidebar' ? 'max-w-3xl' : 'max-w-5xl'}`}>{detail}</div>
    </TemplateWrapper>
  );
}
