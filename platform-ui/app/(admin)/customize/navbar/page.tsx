'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NavLink { label: string; href: string; enabled: boolean }

const DEFAULT_LINKS: NavLink[] = [
  { label: 'Home', href: '/', enabled: true },
  { label: 'Products', href: '/products', enabled: true },
  { label: 'About', href: '/about', enabled: true },
  { label: 'Orders', href: '/orders', enabled: true },
];

export default function CustomizeNavbarPage() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState({
    navBgColor: '#ffffff',
    navTextColor: '#171717',
    navAccentColor: '#000000',
    navShowCart: true,
    navShowLogin: true,
    navLinks: DEFAULT_LINKS,
  });

  useEffect(() => {
    api.get('/store').then((r) => {
      const b = r.data.store?.branding || {};
      setConfig({
        navBgColor: b.navBgColor || '#ffffff',
        navTextColor: b.navTextColor || '#171717',
        navAccentColor: b.navAccentColor || '#000000',
        navShowCart: b.navShowCart !== false,
        navShowLogin: b.navShowLogin !== false,
        navLinks: b.navLinks || DEFAULT_LINKS,
      });
    }).catch(() => {});
  }, []);

  const updateLink = (i: number, field: keyof NavLink, val: string | boolean) =>
    setConfig(prev => ({ ...prev, navLinks: prev.navLinks.map((l, j) => j === i ? { ...l, [field]: val } : l) }));

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
      <h1 className="text-2xl font-bold mb-6">Customize Navbar</h1>
      <form onSubmit={save} className="space-y-5">

        <Card>
          <CardHeader><CardTitle className="text-base">Colors</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                ['navBgColor', 'Background'],
                ['navTextColor', 'Text'],
                ['navAccentColor', 'Accent / CTA'],
              ].map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={config[key as keyof typeof config] as string}
                      onChange={e => setConfig({ ...config, [key]: e.target.value })}
                      className="w-10 h-8 rounded border cursor-pointer" />
                    <Input value={config[key as keyof typeof config] as string}
                      onChange={e => setConfig({ ...config, [key]: e.target.value })}
                      className="text-xs h-8 font-mono" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Visibility</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              ['navShowCart', 'Show Cart button'],
              ['navShowLogin', 'Show Sign in / Logout'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer" htmlFor={key}>
                <input id={key} type="checkbox"
                  checked={config[key as keyof typeof config] as boolean}
                  onChange={e => setConfig({ ...config, [key]: e.target.checked })}
                  className="accent-black" />
                <span>{label}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Navigation Links</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {config.navLinks.map((link, i) => (
              <div key={`${link.href}-${i}`} className="flex items-center gap-2">
                <input type="checkbox" checked={link.enabled}
                  onChange={e => updateLink(i, 'enabled', e.target.checked)}
                  className="accent-black shrink-0" aria-label={`Enable ${link.label}`} />
                <Input value={link.label} placeholder="Label"
                  onChange={e => updateLink(i, 'label', e.target.value)}
                  className="w-28 h-8 text-sm" />
                <Input value={link.href} placeholder="/path"
                  onChange={e => updateLink(i, 'href', e.target.value)}
                  className="flex-1 h-8 text-sm font-mono" />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm"
              onClick={() => setConfig(prev => ({ ...prev, navLinks: [...prev.navLinks, { label: '', href: '/', enabled: true }] }))}>
              + Add Link
            </Button>
          </CardContent>
        </Card>

        {success && <p className="text-sm text-green-600">✓ Saved!</p>}
        <Button type="submit" disabled={saving} className="w-full">{saving ? 'Saving…' : 'Save Navbar'}</Button>
      </form>
    </div>
  );
}
