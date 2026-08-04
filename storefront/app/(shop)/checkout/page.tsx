'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import { useStorefrontStore } from '@/lib/storefront-store';
import { useTemplate } from '@/lib/template-context';
import { TemplateWrapper } from '@/components/templates/TemplateWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CheckoutPage() {
  const { items, total, clear } = useCartStore();
  const { store, user } = useStorefrontStore();
  const router = useRouter();
  const template = useTemplate();
  const isCard = template === 'card';
  const [form, setForm] = useState({ name: '', line1: '', city: '', country: '', zip: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
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

  const fields: [keyof typeof form, string, string][] = [
    ['name', 'Full Name', 'John Doe'],
    ['line1', 'Address', '123 Main St'],
    ['city', 'City', 'New York'],
    ['country', 'Country', 'US'],
    ['zip', 'ZIP Code', '10001'],
  ];

  const boxCls = isCard ? 'bg-white rounded-2xl shadow p-6' : 'border rounded-xl p-5';
  const btnCls = isCard ? 'bg-indigo-600 hover:bg-indigo-700 rounded-full w-full' : 'rounded-full w-full';

  if (items.length === 0) {
    return <TemplateWrapper><div className="max-w-2xl mx-auto px-6 py-16 text-center text-neutral-400">Your cart is empty.</div></TemplateWrapper>;
  }

  return (
    <TemplateWrapper>
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <h1 className={`text-2xl font-bold ${isCard ? 'text-indigo-900' : ''}`}>Checkout</h1>

        <div className={boxCls}>
          <h2 className="font-semibold mb-3">Order Summary</h2>
          {items.map((i) => (
            <div key={i.productId} className="flex justify-between text-sm py-1 text-neutral-600">
              <span>{i.name} × {i.qty}</span>
              <span>${(i.price * i.qty).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold mt-3 pt-3 border-t text-lg">
            <span>Total</span><span>${total().toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={`${boxCls} space-y-4`}>
          <h2 className="font-semibold">Shipping Address</h2>
          {fields.map(([key, label, placeholder]) => (
            <div key={key} className="space-y-1">
              <Label>{label}</Label>
              <Input placeholder={placeholder} value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })} required />
            </div>
          ))}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={loading} className={btnCls}>
            {loading ? 'Placing order…' : 'Place Order'}
          </Button>
        </form>
      </div>
    </TemplateWrapper>
  );
}
