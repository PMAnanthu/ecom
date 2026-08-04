'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Stats {
  admins: { total: number; active: number };
  subscriptions: { total: number };
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get('/platform/analytics').then((r) => setStats(r.data)).catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Platform Overview</h1>
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm text-neutral-500">Total Admins</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats?.admins.total ?? '—'}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-neutral-500">Active Admins</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats?.admins.active ?? '—'}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-neutral-500">Subscription Plans</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats?.subscriptions.total ?? '—'}</p></CardContent>
        </Card>
      </div>
    </div>
  );
}
