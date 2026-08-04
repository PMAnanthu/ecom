'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Sub { id: string; name: string; maxProducts: number; price: number }

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [form, setForm] = useState({ name: '', maxProducts: 50, price: 0 });

  const load = () => api.get('/platform/subscriptions').then((r) => setSubs(r.data.subscriptions));
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/platform/subscriptions', form);
    setForm({ name: '', maxProducts: 50, price: 0 });
    await load();
  };

  const del = async (id: string) => { await api.delete(`/platform/subscriptions/${id}`); await load(); };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Subscription Plans</h1>
      <Card className="mb-6 max-w-md">
        <CardHeader><CardTitle className="text-base">New Plan</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={create} className="space-y-3">
            <div className="space-y-1"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-1"><Label>Max Products</Label><Input type="number" value={form.maxProducts} onChange={(e) => setForm({ ...form, maxProducts: +e.target.value })} /></div>
            <div className="space-y-1"><Label>Price ($/mo)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} /></div>
            <Button type="submit">Create Plan</Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {subs.map((s) => (
          <div key={s.id} className="flex items-center justify-between p-3 bg-white rounded border">
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-xs text-neutral-500">{s.maxProducts} products · ${s.price}/mo</p>
            </div>
            <Button size="sm" variant="destructive" onClick={() => del(s.id)}>Delete</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
