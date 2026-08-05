'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const STORE_SERVICE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace('/api', '');

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'SGD', 'AED'];

interface Branding { logoUrl?: string; address?: string; city?: string; country?: string; phone?: string; currency?: string }
interface StoreTemplate { id: string; key: string; name: string; description?: string; enabled: boolean }

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [storeName, setStoreName] = useState('');
  const [template, setTemplate] = useState('default');
  const [branding, setBranding] = useState<Branding>({ currency: 'USD' });
  const [logoPreview, setLogoPreview] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<StoreTemplate[]>([]);

  useEffect(() => {
    api.get('/store').then((r) => {
      const s = r.data.store;
      setStoreName(s.name || '');
      setTemplate(s.template || 'default');
      const b: Branding = typeof s.branding === 'object' ? s.branding : {};
      setBranding({ currency: 'USD', ...b });
      if (b.logoUrl) setLogoPreview(`${STORE_SERVICE}${b.logoUrl}`);
    }).catch(() => setError('Failed to load store settings.'))
      .finally(() => setLoading(false));

    // Templates are optional — load separately, don't block page
    api.get('/platform/templates')
      .then((r) => setAvailableTemplates((r.data.templates as StoreTemplate[]).filter((t) => t.enabled)))
      .catch(() => {}); // templates may not be accessible to all roles
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const uploadLogo = async (): Promise<string | undefined> => {
    if (!logoFile) return undefined;
    const fd = new FormData();
    fd.append('file', logoFile);
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${STORE_SERVICE}/api/store/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token ?? ''}` },
      body: fd,
    });
    const data = await res.json();
    return data.url as string;
  };

  const save = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const logoUrl = await uploadLogo();
      const updatedBranding: Branding = { ...branding };
      if (logoUrl) updatedBranding.logoUrl = logoUrl;
      await api.patch('/store', { name: storeName, template, branding: updatedBranding });
      setBranding(updatedBranding);
      setLogoFile(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-neutral-400">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Shop Settings</h1>
      <form onSubmit={save} className="space-y-6">

        <Card>
          <CardHeader><CardTitle className="text-base">General</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Shop Name</Label>
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Currency</Label>
              <div className="flex flex-wrap gap-2">
                {CURRENCIES.map((c) => (
                  <button key={c} type="button"
                    onClick={() => setBranding({ ...branding, currency: c })}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${branding.currency === c ? 'bg-black text-white border-black' : 'border-neutral-300 text-neutral-600 hover:border-black'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Template picker */}
        <Card>
          <CardHeader><CardTitle className="text-base">Storefront Template</CardTitle></CardHeader>
          <CardContent>
            {availableTemplates.length === 0 && (
              <p className="text-sm text-neutral-400">No templates available — contact your super admin.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {availableTemplates.map((t) => (
                <button key={t.key} type="button" onClick={() => setTemplate(t.key)}
                  className={`rounded-xl border-2 p-3 text-left flex flex-col gap-2 transition-all ${template === t.key ? 'border-black bg-neutral-50 shadow-md' : 'border-neutral-200 hover:border-neutral-400'}`}>
                  <TemplateMockupSmall templateKey={t.key} />
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{t.name}</p>
                      {template === t.key && <Badge className="text-xs">Active</Badge>}
                    </div>
                    {t.description && <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{t.description}</p>}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Logo</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {logoPreview && (
              <img src={logoPreview} alt="Logo" className="h-16 w-auto object-contain rounded border p-1" />
            )}
            <input type="file" accept="image/*" className="hidden" id="logo-upload" onChange={handleLogoChange} />
            <label htmlFor="logo-upload">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md cursor-pointer hover:bg-neutral-50">
                {logoPreview ? 'Change Logo' : 'Upload Logo'}
              </span>
            </label>
            {logoFile && <p className="text-xs text-neutral-500">{logoFile.name} selected</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Address</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Street Address</Label>
              <Input value={branding.address || ''} placeholder="123 Main St"
                onChange={(e) => setBranding({ ...branding, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>City</Label>
                <Input value={branding.city || ''} placeholder="New York"
                  onChange={(e) => setBranding({ ...branding, city: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Country</Label>
                <Input value={branding.country || ''} placeholder="US"
                  onChange={(e) => setBranding({ ...branding, country: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={branding.phone || ''} placeholder="+1 555 000 0000"
                onChange={(e) => setBranding({ ...branding, phone: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-600">Settings saved!</p>}
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
      </form>
    </div>
  );
}

function TemplateMockupSmall({ templateKey }: Readonly<{ templateKey: string }>) {
  if (templateKey === 'sidebar') {
    return (
      <div className="w-full aspect-video bg-neutral-100 rounded-lg flex overflow-hidden">
        <div className="w-8 bg-white border-r flex flex-col gap-1 p-1">
          <div className="h-1 bg-black rounded w-6 mb-1" />
          {[1,2,3].map((i) => <div key={i} className="h-0.5 bg-neutral-300 rounded w-5" />)}
        </div>
        <div className="flex-1 p-1 grid grid-cols-3 gap-0.5 content-start">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="aspect-square bg-neutral-200 rounded-sm" />)}
        </div>
      </div>
    );
  }
  if (templateKey === 'card') {
    return (
      <div className="w-full aspect-video rounded-lg overflow-hidden flex flex-col" style={{ background: 'linear-gradient(135deg,#f5f7fa,#e8ecf1)' }}>
        <div className="h-3 bg-white/80 flex items-center px-1.5 gap-1">
          <div className="h-1 w-4 bg-black rounded" />
          <div className="flex-1" />
          <div className="h-1 w-6 bg-neutral-300 rounded" />
        </div>
        <div className="flex-1 p-1 grid grid-cols-2 gap-1">
          {[1,2,3,4].map((i) => <div key={i} className="bg-white rounded-md shadow-sm" />)}
        </div>
      </div>
    );
  }
  return (
    <div className="w-full aspect-video bg-white rounded-lg overflow-hidden flex flex-col">
      <div className="h-3 bg-neutral-900 flex items-center px-1.5 gap-1">
        <div className="h-0.5 w-4 bg-white rounded" />
        <div className="flex gap-1 ml-1">
          {[1,2,3].map((i) => <div key={i} className="h-0.5 w-3 bg-neutral-600 rounded" />)}
        </div>
      </div>
      <div className="h-5 bg-neutral-800" />
      <div className="flex-1 p-1 grid grid-cols-3 gap-0.5">
        {[1,2,3,4,5,6].map((i) => <div key={i} className="aspect-square bg-neutral-200 rounded-sm" />)}
      </div>
    </div>
  );
}
