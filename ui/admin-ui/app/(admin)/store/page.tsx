'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, ExternalLink } from 'lucide-react';

const TEMPLATES = ['default', 'minimal', 'bold', 'elegant'];
const STOREFRONT_BASE = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://ecom-storefront-m6jmogmpra-ue.a.run.app';

interface Store { id: string; name: string; subdomain: string; domain?: string; template: string; published: boolean }
interface SubStatus { expired: boolean; availableDays: number; subscribed: boolean }

export default function StoreSettingsPage() {
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [sub, setSub] = useState<SubStatus | null>(null);
  const [form, setForm] = useState({ name: '', subdomain: '' });
  const [domain, setDomain] = useState('');
  const [template, setTemplate] = useState('default');
  const [dnsHint, setDnsHint] = useState('');
  const [pubError, setPubError] = useState('');

  const load = useCallback(async () => {
    const [storeRes, subRes] = await Promise.all([
      api.get('/store').catch(() => null),
      api.get('/platform/subscription-status').catch(() => null),
    ]);
    if (storeRes) { setStore(storeRes.data.store); setTemplate(storeRes.data.store?.template || 'default'); }
    if (subRes) setSub(subRes.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-unpublish if subscription expired and store is published
  useEffect(() => {
    if (sub?.expired && store?.published) {
      api.patch('/store/publish', { published: false }).then(() => load()).catch(() => {});
    }
  }, [sub, store?.published, load]);

  const createStore = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    await api.post('/store', { ...form, template });
    await load();
  };

  const addDomain = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { data } = await api.patch('/store/domain', { domain });
    setDnsHint(data.dnsInstructions);
    await load();
  };

  const togglePublish = async () => {
    setPubError('');
    try {
      await api.patch('/store/publish', { published: !store?.published });
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      if (msg) setPubError(msg);
    }
  };

  if (!store) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Create Your Store</h1>
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <form onSubmit={createStore} className="space-y-4">
              <div className="space-y-1"><Label>Store Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="space-y-1"><Label>Subdomain</Label>
                <div className="flex items-center gap-1">
                  <Input value={form.subdomain} onChange={e => setForm({ ...form, subdomain: e.target.value.toLowerCase() })} required />
                  <span className="text-sm text-neutral-500 whitespace-nowrap">.ecom.app</span>
                </div>
              </div>
              <div className="space-y-1"><Label>Template</Label>
                <Select value={template} onValueChange={v => v && setTemplate(v as string)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TEMPLATES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Create Store</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subExpired = sub?.expired === true;

  return (
    <div className="space-y-6">
      {/* Subscription expired banner */}
      {subExpired && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm">
          <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-red-700 mb-1">Subscription required</p>
            <p className="text-red-600">Your store has been unpublished. Renew your subscription to publish again.</p>
          </div>
          <Button size="sm" onClick={() => router.push('/subscription')} className="shrink-0">
            Renew →
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Store Settings</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <a href={`${STOREFRONT_BASE}/s/${store.subdomain}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-indigo-600 hover:underline">
            View Store <ExternalLink size={14} />
          </a>
          <Badge variant={store.published ? 'default' : 'secondary'}>{store.published ? 'Live' : 'Draft'}</Badge>
          <Button onClick={togglePublish} variant={store.published ? 'outline' : 'default'} disabled={subExpired && !store.published}>
            {store.published ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      </div>
      {pubError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle size={14} />
          {pubError} — <button onClick={() => router.push('/subscription')} className="underline font-medium">Subscribe now</button>
        </div>
      )}

      <Card className="max-w-md">
        <CardHeader><CardTitle className="text-base">Custom Domain</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500 mb-3">Current: <span className="font-mono">{store.domain || `${store.subdomain}.ecom.app`}</span></p>
          <form onSubmit={addDomain} className="flex gap-2">
            <Input placeholder="myshop.com" value={domain} onChange={e => setDomain(e.target.value)} />
            <Button type="submit">Set</Button>
          </form>
          {dnsHint && <p className="text-xs text-neutral-500 mt-2 font-mono">{dnsHint}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
