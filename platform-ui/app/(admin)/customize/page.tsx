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
  logoUrl?: string;
  thumbnailUrl?: string;
}

export default function CustomizePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState<HomeConfig>({ heroStyle: 'dark' });
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState('');
  const bgRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/store').then((r) => {
      const branding = r.data.store?.branding || {};
      setConfig({
        heroHeading: branding.heroHeading || '',
        heroSubtext: branding.heroSubtext || '',
        heroStyle: branding.heroStyle || 'dark',
        heroBgImage: branding.heroBgImage || '',
        logoUrl: branding.logoUrl || '',
        thumbnailUrl: branding.thumbnailUrl || '',
      });
      if (branding.heroBgImage) setBgPreview(`${STORE_SERVICE}${branding.heroBgImage}`);
      if (branding.logoUrl) setLogoPreview(`${STORE_SERVICE}${branding.logoUrl}`);
      if (branding.thumbnailUrl) setThumbPreview(`${STORE_SERVICE}${branding.thumbnailUrl}`);
    }).finally(() => setLoading(false));
  }, []);

  const pickFile = (file: File, setFile: (f: File) => void, setPreview: (s: string) => void) => {
    setFile(file);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${STORE_SERVICE}/upload`, {
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
      if (logoFile) updated.logoUrl = await uploadFile(logoFile);
      if (thumbFile) updated.thumbnailUrl = await uploadFile(thumbFile);

      // Merge into existing branding
      const storeRes = await api.get('/store');
      const existing = storeRes.data.store?.branding || {};
      await api.patch('/store', { branding: { ...existing, ...updated } });

      setConfig(updated);
      setBgFile(null); setLogoFile(null); setThumbFile(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-neutral-400">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Home Customizer</h1>
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
              <input ref={bgRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && pickFile(e.target.files[0], setBgFile, setBgPreview)} />
              <Button type="button" variant="outline" size="sm" onClick={() => bgRef.current?.click()}>
                {bgPreview ? 'Change Background' : 'Upload Background'}
              </Button>
              {bgFile && <p className="text-xs text-neutral-500">{bgFile.name}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Branding</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Store Logo</Label>
              {logoPreview && <img src={logoPreview} alt="Logo" className="h-16 w-auto object-contain rounded border p-1" />}
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && pickFile(e.target.files[0], setLogoFile, setLogoPreview)} />
              <Button type="button" variant="outline" size="sm" onClick={() => logoRef.current?.click()}>
                {logoPreview ? 'Change Logo' : 'Upload Logo'}
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Store Thumbnail <span className="text-xs text-neutral-400">(shown in link previews)</span></Label>
              {thumbPreview && <img src={thumbPreview} alt="Thumbnail" className="w-32 h-32 object-cover rounded border" />}
              <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && pickFile(e.target.files[0], setThumbFile, setThumbPreview)} />
              <Button type="button" variant="outline" size="sm" onClick={() => thumbRef.current?.click()}>
                {thumbPreview ? 'Change Thumbnail' : 'Upload Thumbnail'}
              </Button>
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
