'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

interface Sub { id: string; name: string; maxProducts: number; price: number; features: Record<string, unknown> }

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [form, setForm] = useState({ name: '', maxProducts: 50, price: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const r = await api.get('/platform/subscriptions');
      setSubs(r.data.subscriptions || []);
    } catch { setError('Failed to load plans'); }
  };

  useEffect(() => { load(); }, []);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const create = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true); setError('');
    try {
      await api.post('/platform/subscriptions', form);
      setForm({ name: '', maxProducts: 50, price: 0 });
      await load();
      flash('Plan created');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create plan');
    } finally { setLoading(false); }
  };

  const del = async (sub: Sub) => {
    if (!confirm(`Delete plan "${sub.name}"?`)) return;
    try {
      await api.delete(`/platform/subscriptions/${sub.id}`);
      await load();
      flash('Plan deleted');
    } catch { setError('Failed to delete plan'); }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Subscription Plans</h1>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">New Plan</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={create} className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1 col-span-3 sm:col-span-1">
                <Label>Plan Name</Label>
                <Input placeholder="Pro" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>Max Products</Label>
                <Input type="number" min={1} value={form.maxProducts}
                  onChange={e => setForm({ ...form, maxProducts: +e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Price ($/mo)</Label>
                <Input type="number" min={0} step="0.01" value={form.price}
                  onChange={e => setForm({ ...form, price: +e.target.value })} />
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {msg && <p className="text-sm text-green-600">{msg}</p>}
            <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create Plan'}</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {subs.length === 0 && <p className="text-sm text-neutral-400">No plans yet. Create one above.</p>}
        {subs.map(s => (
          <div key={s.id} className="flex items-center justify-between p-4 bg-white rounded-xl border">
            <div>
              <p className="font-semibold">{s.name}</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                {s.maxProducts} products · {s.price === 0 ? 'Free' : `$${s.price}/mo`}
              </p>
            </div>
            <Button size="sm" variant="destructive" onClick={() => del(s)}>
              <Trash2 size={13} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
