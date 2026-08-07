'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';

interface StoreTemplate { id: string; key: string; name: string; description?: string; enabled: boolean }

interface ColorSet { bg: string; text: string; accent: string }
interface Preset { name: string; light: ColorSet; dark: ColorSet }

const BUILT_IN_PRESETS: Preset[] = [
  {
    name: 'Classic',
    light: { bg: '#ffffff', text: '#171717', accent: '#000000' },
    dark:  { bg: '#0a0a0a', text: '#fafafa', accent: '#6366f1' },
  },
  {
    name: 'Ocean',
    light: { bg: '#f0f9ff', text: '#0c4a6e', accent: '#0ea5e9' },
    dark:  { bg: '#0a1628', text: '#bae6fd', accent: '#38bdf8' },
  },
  {
    name: 'Forest',
    light: { bg: '#f0fff4', text: '#14532d', accent: '#16a34a' },
    dark:  { bg: '#0f1f0f', text: '#d1fae5', accent: '#34d399' },
  },
  {
    name: 'Sunset',
    light: { bg: '#fff7ed', text: '#7c2d12', accent: '#ea580c' },
    dark:  { bg: '#1c0a00', text: '#fed7aa', accent: '#f97316' },
  },
  {
    name: 'Plum',
    light: { bg: '#faf5ff', text: '#581c87', accent: '#9333ea' },
    dark:  { bg: '#1a0a1a', text: '#f5d0fe', accent: '#c026d3' },
  },
];

interface ThemeData {
  lightBg: string; lightText: string; lightAccent: string;
  darkBg: string;  darkText: string;  darkAccent: string;
}

const defaultTheme: ThemeData = {
  lightBg: '#ffffff', lightText: '#171717', lightAccent: '#000000',
  darkBg: '#0a0a0a',  darkText: '#fafafa',  darkAccent: '#6366f1',
};

function ColorRow({ label, value, onChange }: Readonly<{ label: string; value: string; onChange: (v: string) => void }>) {
  return (
    <div className="flex items-center gap-3">
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        className="w-9 h-8 rounded border cursor-pointer shrink-0" />
      <Input value={value} onChange={e => onChange(e.target.value)} className="font-mono h-8 text-sm w-28" maxLength={7} />
      <span className="text-sm text-neutral-500 flex-1">{label}</span>
    </div>
  );
}

function PresetCard({ preset, active, onClick }: Readonly<{ preset: Preset; active: boolean; onClick: () => void }>) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-xl border-2 overflow-hidden transition-all text-left w-full ${active ? 'border-black' : 'border-neutral-200 hover:border-neutral-400'}`}>
      <div className="flex h-10">
        <div className="flex-1 flex items-center justify-center gap-1.5" style={{ backgroundColor: preset.light.bg }}>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.light.accent }} />
          <span className="text-[9px] font-medium" style={{ color: preset.light.text }}>☀</span>
        </div>
        <div className="flex-1 flex items-center justify-center gap-1.5" style={{ backgroundColor: preset.dark.bg }}>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.dark.accent }} />
          <span className="text-[9px] font-medium" style={{ color: preset.dark.text }}>🌙</span>
        </div>
      </div>
      <div className="px-2 py-1.5 bg-white border-t">
        <p className="text-xs font-medium truncate">{preset.name}</p>
      </div>
    </button>
  );
}

export default function CustomizeThemePage() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [theme, setTheme] = useState<ThemeData>(defaultTheme);
  const [templates, setTemplates] = useState<StoreTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [customPresets, setCustomPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    api.get('/store').then(r => {
      const b = r.data.store?.branding || {};
      setTheme({
        lightBg: b.lightBg || b.themeBg || '#ffffff',
        lightText: b.lightText || b.themeText || '#171717',
        lightAccent: b.lightAccent || b.themeAccent || '#000000',
        darkBg: b.darkBg || '#0a0a0a',
        darkText: b.darkText || '#fafafa',
        darkAccent: b.darkAccent || '#6366f1',
      });
      setSelectedTemplate(r.data.store?.template || 'default');
      setCustomPresets(b.customPresets || []);
    }).catch(() => {});
    api.get('/platform/templates').then(r => setTemplates((r.data.templates || []).filter((t: StoreTemplate) => t.enabled))).catch(() => {});
  }, []);

  const applyPreset = (p: Preset) => {
    setActivePreset(p.name);
    setTheme({ lightBg: p.light.bg, lightText: p.light.text, lightAccent: p.light.accent, darkBg: p.dark.bg, darkText: p.dark.text, darkAccent: p.dark.accent });
  };

  const saveCustomPreset = async () => {
    const name = presetName.trim() || `My Preset ${customPresets.length + 1}`;
    const newPreset: Preset = { name, light: { bg: theme.lightBg, text: theme.lightText, accent: theme.lightAccent }, dark: { bg: theme.darkBg, text: theme.darkText, accent: theme.darkAccent } };
    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    setPresetName('');
    const storeRes = await api.get('/store');
    const existing = storeRes.data.store?.branding || {};
    await api.patch('/store', { branding: { ...existing, customPresets: updated } });
  };

  const removeCustomPreset = async (i: number) => {
    const updated = customPresets.filter((_, j) => j !== i);
    setCustomPresets(updated);
    const storeRes = await api.get('/store');
    const existing = storeRes.data.store?.branding || {};
    await api.patch('/store', { branding: { ...existing, customPresets: updated } });
  };

  const saveTheme = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const storeRes = await api.get('/store');
      const existing = storeRes.data.store?.branding || {};
      // Save both new fields and legacy fields for backward compat
      await api.patch('/store', { branding: { ...existing, ...theme, themeBg: theme.lightBg, themeText: theme.lightText, themeAccent: theme.lightAccent } });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally { setSaving(false); }
  };

  const saveTemplate = async (key: string) => {
    setSavingTemplate(true);
    try { await api.patch('/store', { template: key }); setSelectedTemplate(key); }
    finally { setSavingTemplate(false); }
  };

  const allPresets = [...BUILT_IN_PRESETS, ...customPresets];

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Theme & Template</h1>
        <p className="text-sm text-neutral-500">Each preset defines light and dark mode colors together.</p>
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
              </button>
            ))}
          </div>
          {savingTemplate && <p className="text-xs text-neutral-400 mt-2">Saving…</p>}
        </CardContent>
      </Card>

      {/* Presets */}
      <Card>
        <CardHeader><CardTitle className="text-base">Presets</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {allPresets.map((p, i) => (
              <div key={`${p.name}-${i}`} className="relative group">
                <PresetCard preset={p} active={activePreset === p.name} onClick={() => applyPreset(p)} />
                {i >= BUILT_IN_PRESETS.length && (
                  <button type="button" onClick={() => removeCustomPreset(i - BUILT_IN_PRESETS.length)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center">
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Color editors */}
      <form onSubmit={saveTheme} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2">☀️ Light Mode</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <ColorRow label="Background" value={theme.lightBg} onChange={v => setTheme(t => ({ ...t, lightBg: v }))} />
              <ColorRow label="Text" value={theme.lightText} onChange={v => setTheme(t => ({ ...t, lightText: v }))} />
              <ColorRow label="Accent / CTA" value={theme.lightAccent} onChange={v => setTheme(t => ({ ...t, lightAccent: v }))} />
              <div className="mt-2 p-2.5 rounded-lg border text-xs" style={{ backgroundColor: theme.lightBg, color: theme.lightText }}>
                Preview — <span style={{ color: theme.lightAccent, fontWeight: 600 }}>Accent</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2">🌙 Dark Mode</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <ColorRow label="Background" value={theme.darkBg} onChange={v => setTheme(t => ({ ...t, darkBg: v }))} />
              <ColorRow label="Text" value={theme.darkText} onChange={v => setTheme(t => ({ ...t, darkText: v }))} />
              <ColorRow label="Accent / CTA" value={theme.darkAccent} onChange={v => setTheme(t => ({ ...t, darkAccent: v }))} />
              <div className="mt-2 p-2.5 rounded-lg border text-xs" style={{ backgroundColor: theme.darkBg, color: theme.darkText }}>
                Preview — <span style={{ color: theme.darkAccent, fontWeight: 600 }}>Accent</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save as custom preset */}
        <Card>
          <CardHeader><CardTitle className="text-base">Save as Custom Preset</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input placeholder="Preset name" value={presetName} onChange={e => setPresetName(e.target.value)} className="h-8 text-sm" />
              <Button type="button" variant="outline" size="sm" onClick={saveCustomPreset}>Save Preset</Button>
            </div>
            <p className="text-xs text-neutral-400 mt-1.5">Saves current light + dark colors as a reusable preset.</p>
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
    <div className="w-full h-full flex">
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
