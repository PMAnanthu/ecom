'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';
import { useStorefrontStore } from '@/lib/storefront-store';

const TemplateContext = createContext<string>('default');

export function useTemplate() { return useContext(TemplateContext); }

// In dev on localhost, use the env var to identify which store to load.
// In production, use the actual hostname.
function resolveStoreDomain(): string {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return process.env.NEXT_PUBLIC_STORE_SUBDOMAIN || 'demoshop.ecom.app';
  }
  return host;
}

export function TemplateProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { store, setStore } = useStorefrontStore();
  const [template, setTemplate] = useState<string>(store?.template || 'default');

  useEffect(() => {
    const domain = resolveStoreDomain();
    api.get(`/storefront/resolve?domain=${domain}`)
      .then((r) => {
        setStore(r.data.store);
        setTemplate(r.data.store.template || 'default');
      })
      .catch(() => {
        if (store?.template) setTemplate(store.template);
      });
  }, []);

  return (
    <TemplateContext.Provider value={template}>
      {children}
    </TemplateContext.Provider>
  );
}
