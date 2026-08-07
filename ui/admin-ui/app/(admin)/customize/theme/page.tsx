'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StoreTemplate { id: string; key: string; name: string; description?: string; enabled: boolean }

const LIGHT_PRESETS = [
  { name: 'Ivory', bg: '#FFFFF0', text: '#1a1a1a', accent: '#4f46e5' },
  { name: 'Snow', bg: '#FFFFFF', text: '#171717', accent: '#000000' },
  { name: 'Cream', bg: '#FFF8F0', text: '#2d1b00', accent: '#c2410c' },
  { name: 'Mint', bg: '#F0FFF4', text: '#14532d', accent: '#16a34a' },
  { name: 'Sky', bg: '#F0F9FF', text: '#0c4a6e', accent: '#0ea5e9' },
];

const DARK_PRESETS = [
  { name: 'Noir', bg: '#0a0a0a', text: '#fafafa', accent: '#6366f1' },
  { name: 'Slate', bg: '#1e293b', text: '#e2e8f0', accent: '#38bdf8' },
  { name: 'Forest', bg: '#0f1f0f', text: '#d1fae5', accent: '#34d399' },
  { name: 'Plum', bg: '#1a0a1a', text: '#f5d0fe', accent: '#c026d3' },
  { name: 'Amber', bg: '#1c1000', text: '#fef3c7', accent: '#f59e0b' },
];

interface ThemeConfig {
  themeBg: string;
  themeText: string;
  themeAccent: string;
  themeMode: 'light' | 'dark' | 'custom';
}

const defaultTheme: ThemeConfig = { themeBg: '#ffffff', themeText: '#171717', themeAccent: '#000000', themeMode: 'custom' };

function ColorRow({ label, value, onChange }: Readonly<{ label: string; value: string; onChange: (v: string) => void }>) {
  return (
    <div className="flex items-center gap-3">
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        className="w-10 h-8 rounded border cursor-pointer shrink-0" />
      <Input value={value} onChange={e => onChange(e.target.value)} className="font-mono h-8 text-sm w-32" maxLength={7} />
      <span className="text-sm text-neutral-500">{label}</span>
    </div>
  );
}

function PresetSwatch({ preset, active, onClick }: Readonly<{ preset: { name: string; bg: string; text: string; accent: string }; active: boolean; onClick: () => void }>) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-xl p-3 border-2 transition-all text-left ${active ? 'border-black' : 'border-neutral-200 hover:border-neutral-400'}`}
      style={{ backgroundColor: preset.bg }}>
      <div className="flex gap-1 mb-2">
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.accent }} />
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.text, opacity: 0.5 }} />
      </div>
      <p className="text-xs font-medium" style={{ color: preset.text }}>{preset.name}</p>
    </button>
  );
}

export default function CustomizeThemePage() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme);
  const [templates, setTemplates] = useState<StoreTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    api.get('/store').then(r => {
      const b = r.data.store?.branding || {};
      setTheme({
        themeBg: b.themeBg || '#ffffff',
        themeText: b.themeText || '#171717',
        themeAccent: b.themeAccent || '#000000',
        themeMode: b.themeMode || 'custom',
      });
      setSelectedTemplate(r.data.store?.template || 'default');
    }).catch(() => {});
    api.get('/platform/templates').then(r => setTemplates((r.data.templates || []).filter((t: StoreTemplate) => t.enabled))).catch(() => {});
  }, []);

  const applyPreset = (preset: { bg: string; text: string; accent: string }, mode: 'light' | 'dark') => {
    setTheme({ themeBg: preset.bg, themeText: preset.text, themeAccent: preset.accent, themeMode: mode });
  };

  const saveTheme = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const storeRes = await api.get('/store');
      const existing = storeRes.data.store?.branding || {};
      await api.patch('/store', { branding: { ...existing, ...theme } });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally { setSaving(false); }
  };

  const saveTemplate = async (key: string) => {
    setSavingTemplate(true);
    try {
      await api.patch('/store', { template: key });
      setSelectedTemplate(key);
    } finally { setSavingTemplate(false); }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Theme & Template</h1>
        <p className="text-sm text-neutral-500">Customize colors and choose your storefront layout.</p>
      </div>

      {/* Storefront Template */}
      <Card>
        <CardHeader><CardTitle className="text-base">Storefront Template</CardTitle></CardHeader>
        <CardContent>
          {templates.length === 0 && <p className="text-sm text-neutral-400">No templates available.</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {templates.map(t => (
              <button key={t.key} type="button" onClick={() => saveTemplate(t.key)}
                className={`rounded-xl border-2 p-3 text-left transition-all ${selectedTemplate === t.key ? 'border-black' : 'border-neutral-200 hover:border-neutral-400'}`}>
                <div className="aspect-video bg-neutral-100 rounded-lg mb-2 overflow-hidden">
                  <TemplateMockup templateKey={t.key} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{t.name}</p>
                  {selectedTemplate === t.key && <Badge className="text-xs">Active</Badge>}
                </div>
                {t.description && <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">{t.description}</p>}
              </button>
            ))}
          </div>
          {savingTemplate && <p className="text-xs text-neutral-400 mt-2">Saving…</p>}
        </CardContent>
      </Card>

      {/* Color Theme */}
      <form onSubmit={saveTheme} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Light Presets</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {LIGHT_PRESETS.map(p => (
                <PresetSwatch key={p.name} preset={p}
                  active={theme.themeMode === 'light' && theme.themeBg === p.bg}
                  onClick={() => applyPreset(p, 'light')} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Dark Presets</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {DARK_PRESETS.map(p => (
                <PresetSwatch key={p.name} preset={p}
                  active={theme.themeMode === 'dark' && theme.themeBg === p.bg}
                  onClick={() => applyPreset(p, 'dark')} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Custom Colors</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <ColorRow label="Background" value={theme.themeBg} onChange={v => setTheme(t => ({ ...t, themeBg: v, themeMode: 'custom' }))} />
            <ColorRow label="Text" value={theme.themeText} onChange={v => setTheme(t => ({ ...t, themeText: v, themeMode: 'custom' }))} />
            <ColorRow label="Accent / CTA" value={theme.themeAccent} onChange={v => setTheme(t => ({ ...t, themeAccent: v, themeMode: 'custom' }))} />
            <div className="mt-3 p-3 rounded-lg border text-sm" style={{ backgroundColor: theme.themeBg, color: theme.themeText }}>
              <span>Preview — </span>
              <span style={{ color: theme.themeAccent, fontWeight: 600 }}>Accent text</span>
              <span> · Normal text</span>
            </div>
          </CardContent>
        </Card>

        {success && <p className="text-sm text-green-600">✓ Theme saved!</p>}
        <Button type="submit" disabled={saving} className="w-full">{saving ? 'Saving…' : 'Save Theme'}</Button>
      </form>
    </div>
  );
}

function TemplateMockup({ templateKey }: Readonly<{ templateKey: string }>) {
  if (templateKey === 'sidebar') return (
    <div className="w-full h-full flex text-[6px]">
      <div className="w-10 bg-white border-r h-full flex flex-col gap-1 p-1">
        <div className="h-1.5 bg-black rounded w-8 mb-1" />
        {[1,2,3].map(i => <div key={i} className="h-1 bg-neutral-200 rounded w-7" />)}
      </div>
      <div className="flex-1 p-1.5 grid grid-cols-3 gap-1 content-start">
        {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-square bg-neutral-200 rounded" />)}
      </div>
    </div>
  );
  if (templateKey === 'card') return (
    <div className="w-full h-full flex flex-col" style={{ background: 'linear-gradient(135deg,#f5f7fa,#e8ecf1)' }}>
      <div className="h-4 bg-white/80 flex items-center px-2 gap-1">
        <div className="h-1.5 w-6 bg-black rounded" /><div className="flex-1" />
        <div className="h-1.5 w-8 bg-neutral-200 rounded" />
      </div>
      <div className="flex-1 p-1.5 grid grid-cols-2 gap-1.5">
        {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-lg flex flex-col overflow-hidden shadow-sm"><div className="flex-1 bg-neutral-200"/><div className="h-2 bg-white"/></div>)}
      </div>
    </div>
  );
  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="h-4 bg-neutral-900 flex items-center px-2 gap-2">
        <div className="h-1.5 w-6 bg-white rounded" />
        <div className="flex gap-1 ml-1">{[1,2,3].map(i => <div key={i} className="h-1 w-4 bg-neutral-600 rounded" />)}</div>
      </div>
      <div className="h-8 bg-neutral-800 flex items-center justify-center">
        <div className="h-2 w-16 bg-neutral-600 rounded" />
      </div>
      <div className="flex-1 p-1.5 grid grid-cols-3 gap-1">
        {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-square bg-neutral-200 rounded" />)}
      </div>
    </div>
  );
}
