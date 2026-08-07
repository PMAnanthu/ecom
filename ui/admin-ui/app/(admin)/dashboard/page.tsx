'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Order { id: string; status: string; total: number; createdAt: string }
interface SubStatus { subscribed: boolean; availableDays: number; expired: boolean; subscription: { name: string } | null }

function subBorderClass(sub: SubStatus | null): string {
  if (!sub) return '';
  if (sub.expired) return 'border-red-200 bg-red-50';
  if (sub.availableDays <= 7) return 'border-orange-200 bg-orange-50';
  return 'border-green-200 bg-green-50';
}

function daysColorClass(sub: SubStatus | null): string {
  if (!sub) return '';
  if (sub.expired) return 'text-red-600';
  if (sub.availableDays <= 7) return 'text-orange-500';
  return 'text-green-600';
}

function daysLabel(sub: SubStatus): string {
  return sub.expired ? 'Expired' : `${sub.availableDays} days`;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [store, setStore] = useState<{ name: string; published: boolean } | null>(null);
  const [sub, setSub] = useState<SubStatus | null>(null);

  useEffect(() => {
    api.get('/store').then(r => setStore(r.data.store)).catch(() => {});
    api.get('/orders/orders').then(r => setOrders(r.data.orders || [])).catch(() => {});
    api.get('/platform/subscription-status').then(r => setSub(r.data)).catch(() => {});
  }, []);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length;

  const subBorder = subBorderClass(sub);
  const daysColor = daysColorClass(sub);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader><CardTitle className="text-sm text-neutral-500">Store</CardTitle></CardHeader>
          <CardContent>
            <p className="font-semibold truncate">{store?.name ?? 'Not created'}</p>
            {store && <Badge className="mt-1" variant={store.published ? 'default' : 'secondary'}>{store.published ? 'Live' : 'Draft'}</Badge>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-neutral-500">Total Orders</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalOrders}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-neutral-500">Pending Orders</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${pendingOrders > 0 ? 'text-orange-500' : ''}`}>{pendingOrders}</p>
          </CardContent>
        </Card>
        <Card className={`border ${subBorder}`}>
          <CardHeader><CardTitle className="text-sm text-neutral-500">Subscription</CardTitle></CardHeader>
          <CardContent>
            {sub ? (
              <>
                <p className={`text-2xl font-bold ${daysColor}`}>{daysLabel(sub)}</p>
                <p className="text-xs text-neutral-500 mt-0.5 truncate">{sub.subscription?.name ?? 'No plan'}</p>
                <Link href="/subscription" className="text-xs underline text-neutral-400 hover:text-black mt-1 inline-block">
                  {sub.expired ? 'Subscribe now →' : 'Manage →'}
                </Link>
              </>
            ) : <p className="text-sm text-neutral-400">Loading…</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
