'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CustomizeProductsPage() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState({
    productsTitle: '',
    productsSubtitle: '',
    productsPerRow: '4',
    showDescription: true,
  });

  useEffect(() => {
    api.get('/store').then((r) => {
      const b = r.data.store?.branding || {};
      setConfig({
        productsTitle: b.productsTitle || '',
        productsSubtitle: b.productsSubtitle || '',
        productsPerRow: b.productsPerRow || '4',
        showDescription: b.showDescription !== false,
      });
    }).catch(() => {});
  }, []);

  const save = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const storeRes = await api.get('/store');
      const existing = storeRes.data.store?.branding || {};
      await api.patch('/store', { branding: { ...existing, ...config } });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Customize Products Page</h1>
      <form onSubmit={save} className="space-y-5">
        <Card>
          <CardHeader><CardTitle className="text-base">Page Header</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1"><Label>Page Title</Label>
              <Input value={config.productsTitle} placeholder="Our Collection"
                onChange={e => setConfig({ ...config, productsTitle: e.target.value })} /></div>
            <div className="space-y-1"><Label>Subtitle</Label>
              <Input value={config.productsSubtitle} placeholder="Browse all products"
                onChange={e => setConfig({ ...config, productsSubtitle: e.target.value })} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Layout</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1"><Label>Products Per Row (desktop)</Label>
              <div className="flex gap-2">
                {['2', '3', '4', '5'].map(n => (
                  <button key={n} type="button"
                    onClick={() => setConfig({ ...config, productsPerRow: n })}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${config.productsPerRow === n ? 'bg-black text-white border-black' : 'border-neutral-300 text-neutral-600 hover:border-black'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer" htmlFor="show-desc">
              <input id="show-desc" type="checkbox" checked={config.showDescription}
                onChange={e => setConfig({ ...config, showDescription: e.target.checked })}
                className="accent-black" />
              <span>Show product description on listing</span>
            </label>
          </CardContent>
        </Card>
        {success && <p className="text-sm text-green-600">✓ Saved!</p>}
        <Button type="submit" disabled={saving} className="w-full">{saving ? 'Saving…' : 'Save'}</Button>
      </form>
    </div>
  );
}
