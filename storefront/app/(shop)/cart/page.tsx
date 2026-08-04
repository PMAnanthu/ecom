'use client';

import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import { Button } from '@/components/ui/button';

export default function CartPage() {
  const { items, updateQty, removeItem, total } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-neutral-400 mb-4">Your cart is empty.</p>
        <Link href="/products"><Button variant="outline">Browse products</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Cart</h1>
      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center justify-between bg-white rounded border p-3">
            <div>
              <p className="font-medium text-sm">{item.name}</p>
              <p className="text-xs text-neutral-400">${item.price.toFixed(2)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded">
                <button className="px-2 py-0.5" onClick={() => updateQty(item.productId, item.qty - 1)}>−</button>
                <span className="px-2 text-sm">{item.qty}</span>
                <button className="px-2 py-0.5" onClick={() => updateQty(item.productId, item.qty + 1)}>+</button>
              </div>
              <span className="text-sm font-medium w-16 text-right">${(item.price * item.qty).toFixed(2)}</span>
              <button className="text-neutral-300 hover:text-red-500 text-xs" onClick={() => removeItem(item.productId)}>✕</button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center border-t pt-4">
        <p className="font-bold text-lg">Total: ${total().toFixed(2)}</p>
        <Link href="/checkout"><Button>Checkout</Button></Link>
      </div>
    </div>
  );
}
