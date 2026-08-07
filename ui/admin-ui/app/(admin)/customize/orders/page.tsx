'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CustomizeOrdersPage() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState({
    ordersTitle: '',
    orderConfirmationMessage: '',
    orderPendingMessage: '',
    orderShippedMessage: '',
    orderDeliveredMessage: '',
  });

  useEffect(() => {
    api.get('/store').then((r) => {
      const b = r.data.store?.branding || {};
      setConfig({
        ordersTitle: b.ordersTitle || '',
        orderConfirmationMessage: b.orderConfirmationMessage || '',
        orderPendingMessage: b.orderPendingMessage || '',
        orderShippedMessage: b.orderShippedMessage || '',
        orderDeliveredMessage: b.orderDeliveredMessage || '',
      });
    }).catch(() => {});
  }, []);

  const save = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const storeRes = await api.get('/store');
      const existing = storeRes.data.store?.branding || {};
      await api.patch('/store', { branding: { ...existing, ...config } });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Customize Orders Page</h1>
      <form onSubmit={save} className="space-y-5">
        <Card>
          <CardHeader><CardTitle className="text-base">Page Header</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1"><Label>Page Title</Label>
              <Input value={config.ordersTitle} placeholder="My Orders"
                onChange={e => setConfig({ ...config, ordersTitle: e.target.value })} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Status Messages</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              ['orderConfirmationMessage', 'Order Confirmed message', 'Thank you! Your order has been placed.'],
              ['orderPendingMessage', 'Pending status message', 'We are preparing your order.'],
              ['orderShippedMessage', 'Shipped status message', 'Your order is on its way!'],
              ['orderDeliveredMessage', 'Delivered status message', 'Your order has been delivered. Enjoy!'],
            ].map(([key, label, placeholder]) => (
              <div key={key} className="space-y-1">
                <Label>{label}</Label>
                <Input value={config[key as keyof typeof config]} placeholder={placeholder}
                  onChange={e => setConfig({ ...config, [key]: e.target.value })} />
              </div>
            ))}
          </CardContent>
        </Card>
        {success && <p className="text-sm text-green-600">✓ Saved!</p>}
        <Button type="submit" disabled={saving} className="w-full">{saving ? 'Saving…' : 'Save Orders Page'}</Button>
      </form>
    </div>
  );
}
