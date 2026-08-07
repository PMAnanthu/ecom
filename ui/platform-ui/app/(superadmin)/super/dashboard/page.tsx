'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Store, ShoppingBag, UserCheck, UserX, CreditCard, LayoutDashboard } from 'lucide-react';

interface Stats {
  admins?: { total: number; active: number };
  subscriptions: { total: number };
  stores?: { total: number; published: number };
  orders?: { total: number; revenue: number };
  customers?: { total: number; active: number; inactive: number };
}

function Stat({ title, value, sub, icon: Icon, color }: Readonly<{ title: string; value: string | number; sub?: string; icon: React.ElementType; color: string }>) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2"><Icon size={15} className={color} />{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
        {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/platform/analytics').then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="animate-pulse grid grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(7)].map((_, i) => <div key={i} className="h-24 bg-neutral-200 rounded-xl" />)}
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <LayoutDashboard size={22} className="text-neutral-400" />
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat title="Total Customers" value={stats?.customers?.total ?? '—'} sub="all registered users" icon={Users} color="text-purple-500" />
        <Stat title="Active Customers" value={stats?.customers?.active ?? '—'} sub="joined last 30 days" icon={UserCheck} color="text-emerald-500" />
        <Stat title="Inactive Customers" value={stats?.customers?.inactive ?? '—'} sub="joined 30+ days ago" icon={UserX} color="text-orange-400" />
        <Stat title="Admins" value={stats?.admins?.total ?? '—'} sub={`${stats?.admins?.active ?? 0} active`} icon={Users} color="text-blue-500" />
        <Stat title="Stores" value={stats?.stores?.total ?? '—'} sub={`${stats?.stores?.published ?? 0} published`} icon={Store} color="text-indigo-500" />
        <Stat title="Total Orders" value={stats?.orders?.total ?? '—'} sub={stats?.orders?.revenue ? `$${stats.orders.revenue.toFixed(2)} revenue` : undefined} icon={ShoppingBag} color="text-green-500" />
        <Stat title="Subscription Plans" value={stats?.subscriptions.total ?? '—'} sub="available plans" icon={CreditCard} color="text-neutral-400" />
      </div>
    </div>
  );
}
