'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { useStorefrontStore } from '@/lib/storefront-store';

const TemplateContext = createContext<string>('default');

export function useTemplate() { return useContext(TemplateContext); }

export function TemplateProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { store, setStore } = useStorefrontStore();

  useEffect(() => {
    if (!store) {
      const host = window.location.hostname;
      api.get(`/storefront/resolve?domain=${host}`)
        .then((r) => setStore(r.data.store))
        .catch(() => {});
    }
  }, [store, setStore]);

  return (
    <TemplateContext.Provider value={store?.template || 'default'}>
      {children}
    </TemplateContext.Provider>
  );
}
