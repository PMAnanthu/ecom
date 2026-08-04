'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

interface Order { id: string; status: string; total: number; createdAt: string; items: { productName: string; qty: number }[] }

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  const load = () => api.get('/orders/orders').then((r) => setOrders(r.data.orders)).catch(() => {});
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/orders/orders/${id}/status`, { status });
    await load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="p-4 bg-white rounded border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-neutral-400">{o.id}</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{o.status}</Badge>
                <Select value={o.status} onValueChange={(v) => v && updateStatus(o.id, v)}>
                  <SelectTrigger className="w-36 h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="text-sm text-neutral-600 mb-1">
              {o.items.map((i, idx) => <span key={idx}>{i.productName} ×{i.qty}{idx < o.items.length - 1 ? ', ' : ''}</span>)}
            </div>
            <p className="text-sm font-semibold">${o.total.toFixed(2)}</p>
          </div>
        ))}
        {orders.length === 0 && <p className="text-sm text-neutral-400">No orders yet.</p>}
      </div>
    </div>
  );
}
