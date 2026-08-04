'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';
import { useStorefrontStore } from '@/lib/storefront-store';

const TemplateContext = createContext<string>('default');
export function useTemplate() { return useContext(TemplateContext); }

function resolveStoreDomain(): string {
  const host = window.location.hostname;
  const storeParam = new URLSearchParams(window.location.search).get('store');
  if (storeParam) return `${storeParam}.ecom.app`;
  if (host === 'localhost' || host === '127.0.0.1') {
    return process.env.NEXT_PUBLIC_STORE_SUBDOMAIN || 'demoshop.ecom.app';
  }
  return host;
}

export function TemplateProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { store, setStore } = useStorefrontStore();
  const [template, setTemplate] = useState<string>(store?.template || 'default');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const domain = resolveStoreDomain();

    // If cached store doesn't match current domain, clear it
    const cachedSubdomain = store?.subdomain;
    const requestedSubdomain = domain.replace(/\.ecom\.app$/, '');
    if (cachedSubdomain && cachedSubdomain !== requestedSubdomain) {
      setStore(null as never);
    }

    api.get(`/storefront/resolve?domain=${domain}`)
      .then((r) => {
        setStore(r.data.store);
        setTemplate(r.data.store.template || 'default');
      })
      .catch(() => {
        if (store?.template) setTemplate(store.template);
      })
      .finally(() => setReady(true));
  }, []);

  // Show nothing until store is resolved to avoid flicker with wrong store data
  if (!ready) return null;

  return (
    <TemplateContext.Provider value={template}>
      {children}
    </TemplateContext.Provider>
  );
}
