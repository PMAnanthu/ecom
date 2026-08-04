'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TEMPLATES = ['default', 'minimal', 'bold', 'elegant'];

interface Store { id: string; name: string; subdomain: string; domain?: string; template: string; published: boolean }

export default function StoreSettingsPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [form, setForm] = useState({ name: '', subdomain: '' });
  const [domain, setDomain] = useState('');
  const [template, setTemplate] = useState('default');
  const [dnsHint, setDnsHint] = useState('');

  const load = () => api.get('/store').then((r) => {
    setStore(r.data.store);
    setTemplate(r.data.store.template);
  }).catch(() => {});

  useEffect(() => { load(); }, []);

  const createStore = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/store', { ...form, template });
    await load();
  };

  const saveTemplate = async () => {
    await api.patch('/store', { template });
    await load();
  };

  const addDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await api.patch('/store/domain', { domain });
    setDnsHint(data.dnsInstructions);
    await load();
  };

  const togglePublish = async () => {
    await api.patch('/store/publish', { published: !store?.published });
    await load();
  };

  if (!store) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Create Your Store</h1>
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <form onSubmit={createStore} className="space-y-4">
              <div className="space-y-1"><Label>Store Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="space-y-1"><Label>Subdomain</Label>
                <div className="flex items-center gap-1">
                  <Input value={form.subdomain} onChange={(e) => setForm({ ...form, subdomain: e.target.value.toLowerCase() })} required />
                  <span className="text-sm text-neutral-500 whitespace-nowrap">.ecom.app</span>
                </div>
              </div>
              <div className="space-y-1"><Label>Template</Label>
                <Select value={template} onValueChange={(v) => v && setTemplate(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TEMPLATES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Create Store</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Store Settings</h1>
        <div className="flex items-center gap-3">
          <Badge variant={store.published ? 'default' : 'secondary'}>{store.published ? 'Live' : 'Draft'}</Badge>
          <Button onClick={togglePublish} variant={store.published ? 'outline' : 'default'}>
            {store.published ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      </div>

      <Card className="max-w-md">
        <CardHeader><CardTitle className="text-base">Template</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Select value={template} onValueChange={(v) => v && setTemplate(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TEMPLATES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={saveTemplate} size="sm">Save Template</Button>
        </CardContent>
      </Card>

      <Card className="max-w-md">
        <CardHeader><CardTitle className="text-base">Custom Domain</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500 mb-3">Current: <span className="font-mono">{store.domain || `${store.subdomain}.ecom.app`}</span></p>
          <form onSubmit={addDomain} className="flex gap-2">
            <Input placeholder="myshop.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
            <Button type="submit">Set</Button>
          </form>
          {dnsHint && <p className="text-xs text-neutral-500 mt-2 font-mono">{dnsHint}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
