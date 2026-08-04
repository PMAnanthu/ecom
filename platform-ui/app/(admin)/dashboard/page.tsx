'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<{ id: string; status: string; total: number; createdAt: string }[]>([]);
  const [store, setStore] = useState<{ name: string; published: boolean } | null>(null);

  useEffect(() => {
    api.get('/store').then((r) => setStore(r.data.store)).catch(() => {});
    api.get('/orders/orders').then((r) => setOrders(r.data.orders.slice(0, 5))).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader><CardTitle className="text-sm text-neutral-500">Store</CardTitle></CardHeader>
          <CardContent>
            <p className="font-semibold">{store?.name ?? 'Not created'}</p>
            {store && <Badge className="mt-1" variant={store.published ? 'default' : 'secondary'}>{store.published ? 'Live' : 'Draft'}</Badge>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-neutral-500">Recent Orders</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{orders.length}</p></CardContent>
        </Card>
      </div>
      <h2 className="text-lg font-semibold mb-3">Recent Orders</h2>
      <div className="space-y-2">
        {orders.map((o) => (
          <div key={o.id} className="flex justify-between items-center p-3 bg-white rounded border text-sm">
            <span className="font-mono text-xs text-neutral-400">{o.id.slice(0, 8)}…</span>
            <Badge variant="secondary">{o.status}</Badge>
            <span className="font-medium">${o.total.toFixed(2)}</span>
          </div>
        ))}
        {orders.length === 0 && <p className="text-sm text-neutral-400">No orders yet.</p>}
      </div>
    </div>
  );
}
