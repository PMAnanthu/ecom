'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import { useStorefrontStore } from '@/lib/storefront-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CheckoutPage() {
  const { items, total, clear } = useCartStore();
  const { store, user } = useStorefrontStore();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', line1: '', city: '', country: '', zip: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    if (!store) { setError('Store not found'); return; }
    setLoading(true);
    try {
      await api.post('/orders/orders/checkout', { shippingAddress: form, storeId: store.id });
      clear();
      router.push('/orders');
    } catch {
      setError('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-neutral-400">Your cart is empty.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <div className="bg-white rounded border p-4 mb-6">
        <h2 className="font-semibold mb-3">Order Summary</h2>
        {items.map((i) => (
          <div key={i.productId} className="flex justify-between text-sm py-1">
            <span>{i.name} × {i.qty}</span>
            <span>${(i.price * i.qty).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold mt-3 pt-3 border-t">
          <span>Total</span><span>${total().toFixed(2)}</span>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="font-semibold">Shipping Address</h2>
        {[['name', 'Full Name'], ['line1', 'Address'], ['city', 'City'], ['country', 'Country'], ['zip', 'ZIP Code']] .map(([key, label]) => (
          <div key={key} className="space-y-1">
            <Label>{label}</Label>
            <Input value={form[key as keyof typeof form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required />
          </div>
        ))}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Placing order…' : 'Place Order'}</Button>
      </form>
    </div>
  );
}
