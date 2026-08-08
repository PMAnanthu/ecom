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

  const pageTemplates = templates.filter(t => !t.key.startsWith('footer-'));
  const footerTemplates = templates.filter(t => t.key.startsWith('footer-'));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Store Templates</h1>
      <p className="text-sm text-neutral-500 mb-6">Control which templates admins can select for their stores.</p>

      {/* Page templates */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {pageTemplates.map((t) => (
          <TemplateCard key={t.id} t={t} onToggle={toggle}>
            <PageMockup templateKey={t.key} />
          </TemplateCard>
        ))}
      </div>

      {/* Footer templates */}
      {footerTemplates.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-1">Footer Templates</h2>
          <p className="text-sm text-neutral-500 mb-4">Control which footer layouts admins can choose for their home page.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {footerTemplates.map((t) => (
              <TemplateCard key={t.id} t={t} onToggle={toggle}>
                <FooterMockup templateKey={t.key} />
              </TemplateCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TemplateCard({ t, onToggle, children }: Readonly<{ t: StoreTemplate; onToggle: (t: StoreTemplate) => void; children: React.ReactNode }>) {
  return (
    <div className={`rounded-xl border-2 p-5 flex flex-col gap-3 transition-all ${t.enabled ? 'border-black bg-white' : 'border-neutral-200 bg-neutral-50 opacity-60'}`}>
      <div className="aspect-video bg-neutral-100 rounded-lg overflow-hidden flex items-end">
        {children}
      </div>
      <div>
        <div className="flex items-center justify-between">
          <p className="font-semibold">{t.name}</p>
          <Badge variant={t.enabled ? 'default' : 'secondary'}>{t.enabled ? 'Enabled' : 'Disabled'}</Badge>
        </div>
        {t.description && <p className="text-xs text-neutral-500 mt-1">{t.description}</p>}
      </div>
      <Button size="sm" variant={t.enabled ? 'destructive' : 'default'} onClick={() => onToggle(t)}>
        {t.enabled ? 'Disable' : 'Enable'}
      </Button>
    </div>
  );
}

function PageMockup({ templateKey }: Readonly<{ templateKey: string }>) {
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

function FooterMockup({ templateKey }: Readonly<{ templateKey: string }>) {
  if (templateKey === 'footer-simple') {
    return (
      <div className="w-full h-full flex flex-col bg-white">
        <div className="flex-1 bg-neutral-50" />
        <div className="h-8 bg-neutral-800 flex items-center justify-between px-3">
          <div className="h-1.5 w-8 bg-neutral-500 rounded" />
          <div className="flex gap-2">
            {[1,2,3].map(i => <div key={i} className="h-1 w-5 bg-neutral-600 rounded" />)}
          </div>
        </div>
      </div>
    );
  }
  if (templateKey === 'footer-standard') {
    return (
      <div className="w-full h-full flex flex-col bg-white">
        <div className="flex-1 bg-neutral-50" />
        <div className="bg-neutral-800 px-3 py-2 space-y-1.5">
          <div className="flex gap-3">
            <div className="flex-[1.5] space-y-1">
              <div className="h-1.5 w-8 bg-indigo-400 rounded" />
              <div className="h-1 w-12 bg-neutral-600 rounded" />
            </div>
            {[1,2].map(i => (
              <div key={i} className="flex-1 space-y-1">
                <div className="h-1 w-6 bg-neutral-500 rounded" />
                {[1,2,3].map(j => <div key={j} className="h-0.5 w-8 bg-neutral-600 rounded" />)}
              </div>
            ))}
          </div>
          <div className="h-0.5 bg-neutral-700 rounded" />
          <div className="h-1 w-16 bg-neutral-700 rounded" />
        </div>
      </div>
    );
  }
  // footer-rich
  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="flex-1 bg-neutral-50" />
      <div className="bg-neutral-900 px-3 py-2 space-y-1.5">
        <div className="flex gap-2">
          <div className="flex-[1.5] space-y-1">
            <div className="h-1.5 w-8 bg-indigo-500 rounded" />
            <div className="h-1 w-10 bg-neutral-700 rounded" />
            <div className="flex gap-1 mt-0.5">
              {[1,2,3].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-neutral-700" />)}
            </div>
          </div>
          {[1,2].map(i => (
            <div key={i} className="flex-1 space-y-1">
              <div className="h-0.5 w-5 bg-neutral-600 rounded" />
              {[1,2,3,4].map(j => <div key={j} className="h-0.5 w-7 bg-neutral-700 rounded" />)}
            </div>
          ))}
        </div>
        <div className="h-0.5 bg-neutral-800 rounded" />
        <div className="h-0.5 w-14 bg-neutral-800 rounded" />
      </div>
    </div>
  );
}
