'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useStorefrontStore } from '@/lib/storefront-store';
import { Badge } from '@/components/ui/badge';

interface OrderItem { productName: string; qty: number; priceAtOrder: number }
interface Order { id: string; status: string; total: number; createdAt: string; items: OrderItem[] }

const statusColor: Record<string, 'default' | 'secondary' | 'outline'> = {
  PENDING: 'secondary', PROCESSING: 'default', SHIPPED: 'default', DELIVERED: 'default', CANCELLED: 'outline',
};

export default function OrdersPage() {
  const { user } = useStorefrontStore();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    api.get('/orders/orders').then((r) => setOrders(r.data.orders)).catch(() => {});
  }, [user, router]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      <div className="space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="bg-white rounded border p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono text-xs text-neutral-400">{o.id}</span>
              <Badge variant={statusColor[o.status] ?? 'secondary'}>{o.status}</Badge>
            </div>
            <div className="text-sm text-neutral-600 mb-2 space-y-0.5">
              {o.items.map((i, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{i.productName} × {i.qty}</span>
                  <span>${(i.priceAtOrder * i.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-2 border-t font-semibold text-sm">
              <span>Total</span><span>${o.total.toFixed(2)}</span>
            </div>
          </div>
        ))}
        {orders.length === 0 && <p className="text-neutral-400 text-center py-12">No orders yet.</p>}
      </div>
    </div>
  );
}
