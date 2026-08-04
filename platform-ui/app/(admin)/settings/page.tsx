'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STORE_SERVICE = process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3003';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'SGD', 'AED'];

interface Branding {
  logoUrl?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  currency?: string;
}

export default function SettingsPage() {
  const { storeId } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [storeName, setStoreName] = useState('');
  const [branding, setBranding] = useState<Branding>({ currency: 'USD' });
  const [logoPreview, setLogoPreview] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/store')
      .then((r) => {
        const s = r.data.store;
        setStoreName(s.name || '');
        const b: Branding = typeof s.branding === 'object' ? s.branding : {};
        setBranding({ currency: 'USD', ...b });
        if (b.logoUrl) setLogoPreview(`${STORE_SERVICE}${b.logoUrl}`);
      })
      .catch(() => setError('Failed to load store settings.'))
      .finally(() => setLoading(false));
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
    const res = await fetch(`${STORE_SERVICE}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token ?? ''}` },
      body: fd,
    });
    const data = await res.json();
    return data.url as string;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) { setError('Store not found — please re-login.'); return; }
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const logoUrl = await uploadLogo();
      const updatedBranding: Branding = { ...branding };
      if (logoUrl) updatedBranding.logoUrl = logoUrl;

      await api.patch('/store', { name: storeName, branding: updatedBranding });
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
    <div className="max-w-xl">
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
              <Select value={branding.currency} onValueChange={(v) => v && setBranding({ ...branding, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Logo</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {logoPreview && (
              <img src={logoPreview} alt="Logo" className="h-16 w-auto object-contain rounded border p-1" />
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              {logoPreview ? 'Change Logo' : 'Upload Logo'}
            </Button>
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
