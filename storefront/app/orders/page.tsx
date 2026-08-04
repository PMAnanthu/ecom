'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useStorefrontStore } from '@/lib/storefront-store';
import { useTemplate } from '@/lib/template-context';
import { TemplateWrapper } from '@/components/templates/TemplateWrapper';
import { Badge } from '@/components/ui/badge';

interface OrderItem { productName: string; qty: number; priceAtOrder: number }
interface Order { id: string; status: string; total: number; createdAt: string; items: OrderItem[] }

const STATUS_COLOR: Record<string, 'default' | 'secondary' | 'outline'> = {
  PENDING: 'secondary', PROCESSING: 'default', SHIPPED: 'default', DELIVERED: 'default', CANCELLED: 'outline',
};

const STATUS_ICON: Record<string, string> = {
  PENDING: '🕐', PROCESSING: '⚙️', SHIPPED: '🚚', DELIVERED: '✅', CANCELLED: '❌',
};

export default function OrdersPage() {
  const { user } = useStorefrontStore();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const template = useTemplate();
  const isCard = template === 'card';

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    api.get('/orders/orders').then((r) => setOrders(r.data.orders)).catch(() => {});
  }, [user, router]);

  const boxCls = isCard ? 'bg-white rounded-2xl shadow p-5' : 'bg-white rounded-xl border p-4';

  return (
    <TemplateWrapper>
      <div className="mx-auto px-6 py-10 max-w-2xl">
        <h1 className={`text-2xl font-bold mb-6 ${isCard ? 'text-indigo-900' : ''}`}>My Orders</h1>

        {orders.length === 0 && (
          <div className={`${boxCls} text-center py-12 text-neutral-400`}>No orders yet.</div>
        )}

        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className={boxCls}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono text-xs text-neutral-400">#{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span>{STATUS_ICON[o.status] ?? '📦'}</span>
                  <Badge variant={STATUS_COLOR[o.status] ?? 'secondary'}>{o.status}</Badge>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-1 mb-4">
                {['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((s, i) => {
                  const statuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
                  const currentIdx = statuses.indexOf(o.status);
                  const active = i <= currentIdx && o.status !== 'CANCELLED';
                  const activeCls = isCard ? 'bg-indigo-500' : 'bg-black';
                  const barCls = active ? activeCls : 'bg-neutral-200';
                  const dotCls = active ? activeCls : 'bg-neutral-200';
                  return (
                    <div key={s} className="flex items-center flex-1">
                      <div className={`h-2 flex-1 rounded-full transition-colors ${barCls}`} />
                      {i < 3 && <div className={`w-2 h-2 rounded-full mx-0.5 ${dotCls}`} />}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-neutral-400 mb-3 -mt-2">
                <span>Ordered</span><span>Processing</span><span>Shipped</span><span>Delivered</span>
              </div>

              <div className="space-y-1 border-t pt-3">
                {o.items.map((item) => (
                  <div key={`${item.productName}-${item.priceAtOrder}`} className="flex justify-between text-sm text-neutral-600">
                    <span>{item.productName} × {item.qty}</span>
                    <span>${(item.priceAtOrder * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-sm mt-3 pt-3 border-t">
                <span>Total</span><span className={isCard ? 'text-indigo-700' : ''}>${o.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </TemplateWrapper>
  );
}
