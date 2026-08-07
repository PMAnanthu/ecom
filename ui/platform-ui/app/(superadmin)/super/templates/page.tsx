'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface StoreTemplate { id: string; key: string; name: string; description?: string; enabled: boolean }

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<StoreTemplate[]>([]);

  const load = () => api.get('/platform/templates').then((r) => setTemplates(r.data.templates)).catch(() => {});
  useEffect(() => { load(); }, []);

  const toggle = async (t: StoreTemplate) => {
    await api.patch(`/platform/templates/${t.id}`, { enabled: !t.enabled });
    await load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Store Templates</h1>
      <p className="text-sm text-neutral-500 mb-6">Control which templates admins can select for their stores.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {templates.map((t) => (
          <div key={t.id} className={`rounded-xl border-2 p-5 flex flex-col gap-3 transition-all ${t.enabled ? 'border-black bg-white' : 'border-neutral-200 bg-neutral-50 opacity-60'}`}>
            {/* Template preview mockup */}
            <div className="aspect-video bg-neutral-100 rounded-lg overflow-hidden flex items-end">
              <TemplateMockup templateKey={t.key} />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{t.name}</p>
                <Badge variant={t.enabled ? 'default' : 'secondary'}>{t.enabled ? 'Enabled' : 'Disabled'}</Badge>
              </div>
              {t.description && <p className="text-xs text-neutral-500 mt-1">{t.description}</p>}
            </div>
            <Button size="sm" variant={t.enabled ? 'destructive' : 'default'} onClick={() => toggle(t)}>
              {t.enabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplateMockup({ templateKey }: Readonly<{ templateKey: string }>) {
  if (templateKey === 'sidebar') {
    return (
      <div className="w-full h-full flex text-[6px]">
        <div className="w-10 bg-white border-r h-full flex flex-col gap-1 p-1">
          <div className="h-1.5 bg-black rounded w-8 mb-1" />
          {[1,2,3,4].map((i) => <div key={i} className="h-1 bg-neutral-200 rounded w-7" />)}
        </div>
        <div className="flex-1 p-2 grid grid-cols-3 gap-1 content-start">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="aspect-square bg-neutral-200 rounded" />)}
        </div>
      </div>
    );
  }
  if (templateKey === 'card') {
    return (
      <div className="w-full h-full flex flex-col" style={{ background: 'linear-gradient(135deg,#f5f7fa,#e8ecf1)' }}>
        <div className="h-4 bg-white/80 flex items-center px-2 gap-1">
          <div className="h-1.5 w-6 bg-black rounded" />
          <div className="flex-1" />
          <div className="h-1.5 w-8 bg-neutral-200 rounded" />
        </div>
        <div className="flex-1 p-1.5 grid grid-cols-2 gap-1.5">
          {[1,2,3,4].map((i) => <div key={i} className="bg-white rounded-lg flex flex-col overflow-hidden shadow-sm"><div className="flex-1 bg-neutral-200"/><div className="h-2 bg-white"/></div>)}
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="h-4 bg-neutral-900 flex items-center px-2 gap-2">
        <div className="h-1.5 w-6 bg-white rounded" />
        <div className="flex gap-1 ml-1">
          {[1,2,3].map((i) => <div key={i} className="h-1 w-4 bg-neutral-600 rounded" />)}
        </div>
      </div>
      <div className="h-8 bg-neutral-800 flex items-center justify-center">
        <div className="h-2 w-16 bg-neutral-600 rounded" />
      </div>
      <div className="flex-1 p-1.5 grid grid-cols-3 gap-1">
        {[1,2,3,4,5,6].map((i) => <div key={i} className="aspect-square bg-neutral-200 rounded" />)}
      </div>
    </div>
  );
}
