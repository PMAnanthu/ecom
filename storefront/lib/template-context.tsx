'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';
import { useStorefrontStore } from '@/lib/storefront-store';

const TemplateContext = createContext<string>('default');

export function useTemplate() { return useContext(TemplateContext); }

export function TemplateProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { store, setStore } = useStorefrontStore();
  const [template, setTemplate] = useState<string>(store?.template || 'default');

  useEffect(() => {
    // Always re-fetch on mount so template changes are reflected immediately
    const host = window.location.hostname;
    api.get(`/storefront/resolve?domain=${host}`)
      .then((r) => {
        setStore(r.data.store);
        setTemplate(r.data.store.template || 'default');
      })
      .catch(() => {
        // Fall back to cached template if offline
        if (store?.template) setTemplate(store.template);
      });
  }, []);

  return (
    <TemplateContext.Provider value={template}>
      {children}
    </TemplateContext.Provider>
  );
}
