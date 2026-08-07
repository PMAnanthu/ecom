'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STORE_SERVICE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace('/api', '');

const HEADING_STYLES = [
  { value: 'dark', label: 'Dark Hero (black bg, white text)' },
  { value: 'light', label: 'Light Hero (white bg, dark text)' },
  { value: 'gradient', label: 'Gradient (indigo to purple)' },
  { value: 'image', label: 'Full Background Image' },
];

interface HomeConfig {
  heroHeading?: string;
  heroSubtext?: string;
  heroStyle?: string;
  heroBgImage?: string;
}

export default function CustomizePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState<HomeConfig>({ heroStyle: 'dark' });
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState('');
  const bgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/store').then((r) => {
      const b = r.data.store?.branding || {};
      setConfig({
        heroHeading: b.heroHeading || '',
        heroSubtext: b.heroSubtext || '',
        heroStyle: b.heroStyle || 'dark',
        heroBgImage: b.heroBgImage || '',
      });
      if (b.heroBgImage) setBgPreview(b.heroBgImage.startsWith('http') ? b.heroBgImage : `${STORE_SERVICE}${b.heroBgImage}`);
    }).finally(() => setLoading(false));
  }, []);

  const uploadFile = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${STORE_SERVICE}/api/store/upload`, {
      method: 'POST', headers: { Authorization: `Bearer ${token ?? ''}` }, body: fd,
    });
    return (await res.json()).url as string;
  };

  const save = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = { ...config };
      if (bgFile) updated.heroBgImage = await uploadFile(bgFile);
      const storeRes = await api.get('/store');
      const existing = storeRes.data.store?.branding || {};
      await api.patch('/store', { branding: { ...existing, ...updated } });
      setConfig(updated);
      setBgFile(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally { setSaving(false); }
  };

  if (loading) return <p className="text-neutral-400">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Customize Home</h1>
      <form onSubmit={save} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Hero Section</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Heading</Label>
              <Input placeholder="Welcome to our store" value={config.heroHeading || ''}
                onChange={e => setConfig({ ...config, heroHeading: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Subtext</Label>
              <Textarea placeholder="Discover our curated collection" rows={2}
                value={config.heroSubtext || ''}
                onChange={e => setConfig({ ...config, heroSubtext: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Hero Style</Label>
              <Select value={config.heroStyle} onValueChange={v => v && setConfig({ ...config, heroStyle: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{HEADING_STYLES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Background Image {config.heroStyle === 'image' ? '(required)' : '(optional overlay)'}</Label>
              {bgPreview && <img src={bgPreview} alt="Background" className="w-full h-32 object-cover rounded-lg border" />}
              <input ref={bgRef} type="file" accept="image/*" className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setBgFile(f);
                  const reader = new FileReader();
                  reader.onload = ev => setBgPreview(ev.target?.result as string);
                  reader.readAsDataURL(f);
                }} />
              <Button type="button" variant="outline" size="sm" onClick={() => bgRef.current?.click()}>
                {bgPreview ? 'Change Background' : 'Upload Background'}
              </Button>
              {bgFile && <p className="text-xs text-neutral-500">{bgFile.name}</p>}
            </div>
          </CardContent>
        </Card>
        {success && <p className="text-sm text-green-600">✓ Saved!</p>}
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Saving…' : 'Save Customization'}
        </Button>
      </form>
    </div>
  );
}
