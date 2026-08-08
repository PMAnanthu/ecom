'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import { useStorefrontStore } from '@/lib/storefront-store';
import { useTemplate, useCurrency } from '@/lib/template-context';
import { TemplateWrapper } from '@/components/templates/TemplateWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Address { id: string; name: string; line1: string; city: string; country: string; zip: string; isDefault: boolean }

function getStoreIdFromLocalStorage(): string | null {
  try {
    const raw = localStorage.getItem('sf-auth');
    return raw ? JSON.parse(raw)?.state?.store?.id ?? null : null;
  } catch { return null; }
}

type AddrForm = { name: string; line1: string; city: string; country: string; zip: string };

const ADDR_FIELDS: [keyof AddrForm, string, string][] = [
  ['name', 'Full Name', 'John Doe'],
  ['line1', 'Address', '123 Main St'],
  ['city', 'City', 'Kerala'],
  ['country', 'Country', 'IN'],
  ['zip', 'PIN Code', '682001'],
];

// Load Razorpay checkout script on demand
function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (document.getElementById('razorpay-script')) { resolve(true); return; }
    const s = document.createElement('script');
    s.id = 'razorpay-script';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function CheckoutPage() {
  const { items, total, clear } = useCartStore();
  const { store, user } = useStorefrontStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const template = useTemplate();
  const { symbol } = useCurrency();
  const isCard = template === 'card';

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [saveAddr, setSaveAddr] = useState(true);
  const [form, setForm] = useState<AddrForm>({ name: '', line1: '', city: '', country: 'IN', zip: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadAddresses = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/addresses');
      setSavedAddresses(data.addresses || []);
      const def = data.addresses?.find((a: Address) => a.isDefault);
      if (def) setSelectedId(def.id);
      else if (data.addresses?.length > 0) setSelectedId(data.addresses[0].id);
      else setShowNew(true);
    } catch { setShowNew(true); }
  }, []);

  useEffect(() => {
    if (!user) {
      const next = encodeURIComponent('/checkout' + (searchParams.toString() ? '?' + searchParams.toString() : ''));
      router.push(`/login?next=${next}`);
      return;
    }
    loadAddresses();
  }, [user, router, loadAddresses, searchParams]);

  const selectedAddress = savedAddresses.find(a => a.id === selectedId);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const storeId = store?.id || getStoreIdFromLocalStorage();
    if (!storeId) { setError('Store not found — please go back.'); return; }

    setLoading(true); setError('');

    try {
      let shippingAddress = selectedAddress
        ? { name: selectedAddress.name, line1: selectedAddress.line1, city: selectedAddress.city, country: selectedAddress.country, zip: selectedAddress.zip }
        : form;

      if (showNew && !selectedAddress && saveAddr) {
        const { data } = await api.post('/auth/addresses', { ...form, isDefault: savedAddresses.length === 0 });
        shippingAddress = { name: data.address.name, line1: data.address.line1, city: data.address.city, country: data.address.country, zip: data.address.zip };
      }

      // Try Razorpay payment first; fall back to direct checkout if not configured
      let paymentEnabled = false;
      try {
        const cartPayload = items.map(i => ({ productId: i.productId, name: i.name, price: i.price, qty: i.qty }));
        // Create order in order-service first to get orderId
        const { data: orderData } = await api.post('/orders/orders/checkout', { shippingAddress, storeId, items: cartPayload });
        const orderId = orderData.order?.id;

        // Create Razorpay payment order
        const amountPaise = Math.round(total() * 100);
        const { data: rzData } = await api.post('/payment/orders/create', {
          amount: amountPaise,
          currency: 'INR',
          referenceId: orderId,
        });

        paymentEnabled = true;
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) throw new Error('Razorpay script failed to load');

        await new Promise<void>((resolve, reject) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rzp = new (window as any).Razorpay({
            key: rzData.keyId,
            amount: rzData.amount,
            currency: rzData.currency,
            order_id: rzData.orderId,
            name: store?.name || 'Store',
            description: 'Order Payment',
            prefill: { email: user?.email },
            handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
              try {
                await api.post('/payment/orders/verify', {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });
                clear();
                router.push('/orders');
                resolve();
              } catch { reject(new Error('Payment verification failed')); }
            },
            modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
          });
          rzp.open();
        });
        return;
      } catch (rzErr: unknown) {
        // If payment wasn't enabled/configured, order was already placed — redirect
        if (paymentEnabled) {
          const msg = rzErr instanceof Error ? rzErr.message : 'Payment failed';
          if (msg === 'Payment cancelled') { setError('Payment cancelled. Your order was not completed.'); return; }
          throw rzErr;
        }
        // Razorpay not configured — order already placed above, just redirect
        clear();
        router.push('/orders');
        return;
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const boxCls = isCard ? 'bg-white rounded-2xl shadow p-5' : 'border rounded-xl p-5';
  const btnCls = isCard ? 'bg-indigo-600 hover:bg-indigo-700 rounded-full w-full' : 'rounded-full w-full';

  if (!user) return null;
  if (items.length === 0) return <TemplateWrapper><div className="max-w-2xl mx-auto px-4 py-16 text-center text-neutral-400">Your cart is empty.</div></TemplateWrapper>;

  return (
    <TemplateWrapper>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <h1 className={`text-2xl font-bold ${isCard ? 'text-indigo-900' : ''}`}>Checkout</h1>

        {/* Order summary */}
        <div className={boxCls}>
          <h2 className="font-semibold mb-3">Order Summary</h2>
          {items.map((i) => (
            <div key={i.productId} className="flex justify-between text-sm py-1 text-neutral-600">
              <span>{i.name} × {i.qty}</span>
              <span>{symbol}{(i.price * i.qty).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold mt-3 pt-3 border-t text-lg">
            <span>Total</span><span>{symbol}{total().toFixed(2)}</span>
          </div>
        </div>

        {/* Saved addresses */}
        {savedAddresses.length > 0 && (
          <div className={boxCls}>
            <h2 className="font-semibold mb-3">Delivery Address</h2>
            <div className="space-y-2">
              {savedAddresses.map((a) => {
                const activeCls = isCard ? 'border-indigo-500 bg-indigo-50' : 'border-black bg-neutral-50';
                const addrCls = `flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${selectedId === a.id ? activeCls : 'border-neutral-200 hover:border-neutral-400'}`;
                return (
                  <label key={a.id} className={addrCls} aria-label={`Select address: ${a.name}, ${a.line1}, ${a.city}`}>
                    <input type="radio" name="address" checked={selectedId === a.id}
                      onChange={() => { setSelectedId(a.id); setShowNew(false); }}
                      className="mt-1 accent-black" />
                    <div className="text-sm">
                      <p className="font-medium">{a.name} {a.isDefault && <span className="text-xs text-neutral-400 ml-1">(Default)</span>}</p>
                      <p className="text-neutral-500">{a.line1}, {a.city}, {a.country} — {a.zip}</p>
                    </div>
                  </label>
                );
              })}
              {(() => {
                const newActiveCls = isCard ? 'border-indigo-500 bg-indigo-50' : 'border-black bg-neutral-50';
                const newCls = `flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${showNew ? newActiveCls : 'border-neutral-200 hover:border-neutral-400'}`;
                return (
                  <label className={newCls} aria-label="Add new address">
                    <input type="radio" name="address" checked={showNew}
                      onChange={() => { setShowNew(true); setSelectedId(null); }} className="accent-black" />
                    <span className="text-sm font-medium">+ Add new address</span>
                  </label>
                );
              })()}
            </div>
          </div>
        )}

        {/* New address form */}
        {(showNew || savedAddresses.length === 0) && (
          <form onSubmit={handleSubmit} className={`${boxCls} space-y-4`}>
            <h2 className="font-semibold">New Address</h2>
            {ADDR_FIELDS.map(([k, lbl, ph]) => (
              <div key={k} className="space-y-1">
                <Label>{lbl}</Label>
                <Input placeholder={ph} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} required />
              </div>
            ))}
            <label className="flex items-center gap-2 text-sm cursor-pointer" htmlFor="save-addr">
              <input id="save-addr" type="checkbox" checked={saveAddr} onChange={e => setSaveAddr(e.target.checked)} className="accent-black" />
              <span>Save this address for future orders</span>
            </label>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" disabled={loading} className={btnCls}>
              {loading ? 'Processing…' : 'Pay & Place Order'}
            </Button>
          </form>
        )}

        {/* Checkout button for saved address */}
        {!showNew && selectedAddress && (
          <form onSubmit={handleSubmit}>
            {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
            <Button type="submit" disabled={loading} className={btnCls}>
              {loading ? 'Processing…' : `Pay & Deliver to ${selectedAddress.city}`}
            </Button>
          </form>
        )}
      </div>
    </TemplateWrapper>
  );
}
