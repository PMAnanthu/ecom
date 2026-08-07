'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Pencil, Check, X } from 'lucide-react';

type BillingPeriod = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'UNLIMITED';
interface Sub { id: string; name: string; price: number; currency: string; billingPeriod: BillingPeriod }

const PERIOD_LABELS: Record<BillingPeriod, string> = { MONTHLY: 'Monthly', QUARTERLY: 'Quarterly', YEARLY: 'Yearly', UNLIMITED: 'Unlimited' };
const PERIOD_BADGE: Record<BillingPeriod, 'default' | 'secondary' | 'outline'> = { MONTHLY: 'outline', QUARTERLY: 'secondary', YEARLY: 'default', UNLIMITED: 'default' };

const emptyForm = { name: '', price: 0, currency: 'INR', billingPeriod: 'MONTHLY' as BillingPeriod };

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD'];

function CurrencySelect({ value, onChange, className }: Readonly<{ value: string; onChange: (v: string) => void; className?: string }>) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className={`rounded-md border border-neutral-200 px-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black ${className ?? 'h-9 w-full'}`}>
      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}

function BillingSelect({ value, onChange }: Readonly<{ value: BillingPeriod; onChange: (v: BillingPeriod) => void }>) {
  return (
    <select value={value} onChange={e => onChange(e.target.value as BillingPeriod)}
      className="h-8 rounded-md border border-neutral-200 px-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black">
      <option value="MONTHLY">Monthly</option>
      <option value="QUARTERLY">Quarterly</option>
      <option value="YEARLY">Yearly</option>
      <option value="UNLIMITED">Unlimited</option>
    </select>
  );
}

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    try { const r = await api.get('/platform/subscriptions'); setSubs(r.data.subscriptions || []); }
    catch { setError('Failed to load plans'); }
  };
  useEffect(() => { load(); }, []);
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const create = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true); setError('');
    try {
      await api.post('/platform/subscriptions', form);
      setForm(emptyForm); await load(); flash('Plan created');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed');
    } finally { setLoading(false); }
  };

  const del = async (sub: Sub) => {
    if (!confirm(`Delete plan "${sub.name}"?`)) return;
    try { await api.delete(`/platform/subscriptions/${sub.id}`); await load(); flash('Plan deleted'); }
    catch { setError('Failed to delete plan'); }
  };

  const startEdit = (sub: Sub) => {
    setEditingId(sub.id);
    setEditForm({ name: sub.name, price: sub.price, currency: sub.currency, billingPeriod: sub.billingPeriod });
  };

  const saveEdit = async (id: string) => {
    setSavingId(id); setError('');
    try {
      await api.patch(`/platform/subscriptions/${id}`, editForm);
      setEditingId(null); await load(); flash('Plan updated');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed');
    } finally { setSavingId(null); }
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">Subscription Plans</h1>

      {/* Create form */}
      <Card className="mb-6 max-w-2xl">
        <CardHeader><CardTitle className="text-base">New Plan</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={create} className="space-y-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              <div className="space-y-1 col-span-2 lg:col-span-1">
                <Label>Plan Name</Label>
                <Input placeholder="Pro" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>Price</Label>
                <Input type="number" min={0} step="0.01" value={form.price} onChange={e => setForm({ ...form, price: +e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Currency</Label>
                <CurrencySelect value={form.currency} onChange={v => setForm({ ...form, currency: v })} />
              </div>
              <div className="space-y-1">
                <Label>Billing Period</Label>
                <BillingSelect value={form.billingPeriod} onChange={v => setForm({ ...form, billingPeriod: v })} />
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {msg && <p className="text-sm text-green-600">{msg}</p>}
            <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create Plan'}</Button>
          </form>
        </CardContent>
      </Card>

      {/* Plans table */}
      <div className="overflow-x-auto rounded-xl border bg-white max-w-2xl">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Name</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Price</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Currency</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-500">Period</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {subs.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-400">No plans yet.</td></tr>}
            {subs.map(s => {
              const isEditing = editingId === s.id;
              const isSaving = savingId === s.id;
              return (
                <tr key={s.id} className={isEditing ? 'bg-neutral-50' : 'hover:bg-neutral-50/50'}>
                  <td className="px-4 py-2">
                    {isEditing
                      ? <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="h-8 text-sm" />
                      : <span className="font-medium">{s.name}</span>}
                  </td>
                  <td className="px-4 py-2">
                    {isEditing
                      ? <Input type="number" min={0} step="0.01" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: +e.target.value })} className="h-8 w-24 text-sm" />
                      : <span>{s.price === 0 ? 'Free' : s.price}</span>}
                  </td>
                  <td className="px-4 py-2">
                    {isEditing
                      ? <CurrencySelect value={editForm.currency} onChange={v => setEditForm({ ...editForm, currency: v })} className="h-8 w-24" />
                      : <span className="text-xs text-neutral-500">{s.currency}</span>}
                  </td>
                  <td className="px-4 py-2">
                    {isEditing
                      ? <BillingSelect value={editForm.billingPeriod} onChange={v => setEditForm({ ...editForm, billingPeriod: v })} />
                      : <Badge variant={PERIOD_BADGE[s.billingPeriod]}>{PERIOD_LABELS[s.billingPeriod]}</Badge>}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1 justify-end">
                      {isEditing ? (
                        <>
                          <Button size="sm" className="h-7 px-2" disabled={isSaving} onClick={() => saveEdit(s.id)}><Check size={12} /></Button>
                          <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setEditingId(null)}><X size={12} /></Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => startEdit(s)}><Pencil size={12} /></Button>
                          <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => del(s)}><Trash2 size={12} /></Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
