'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, CreditCard } from 'lucide-react';

interface Stats {
  subscriptions: { total: number };
  customers?: { total: number; active: number; inactive: number };
}

function StatCard({ title, value, sub, icon: Icon, color }: Readonly<{
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}>) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
          <Icon size={15} className={color} />{title}
        </CardTitle>
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
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 bg-neutral-200 rounded mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-neutral-200 rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Platform Overview</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Customers" value={stats?.customers?.total ?? '—'} sub="registered users" icon={Users} color="text-purple-500" />
        <StatCard title="Active Customers" value={stats?.customers?.active ?? '—'} sub="joined last 30 days" icon={UserCheck} color="text-emerald-500" />
        <StatCard title="Inactive Customers" value={stats?.customers?.inactive ?? '—'} sub="joined 30+ days ago" icon={UserX} color="text-orange-400" />
        <StatCard title="Subscription Plans" value={stats?.subscriptions.total ?? '—'} sub="available plans" icon={CreditCard} color="text-neutral-400" />
      </div>
    </div>
  );
}
