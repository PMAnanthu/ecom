'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';
import { useStorefrontStore } from '@/lib/storefront-store';

interface StoreContext {
  template: string;
  currency: string;
  currencySymbol: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', INR: '₹', AUD: 'A$',
  CAD: 'C$', SGD: 'S$', AED: 'د.إ',
};

const defaultCtx: StoreContext = { template: 'default', currency: 'USD', currencySymbol: '$' };
const TemplateContext = createContext<StoreContext>(defaultCtx);

export function useTemplate() { return useContext(TemplateContext).template; }
export function useCurrency() {
  const { currency, currencySymbol } = useContext(TemplateContext);
  return { currency, symbol: currencySymbol };
}

function resolveStoreDomain(storeSlug?: string): string | null {
  if (storeSlug) return `${storeSlug}.ecom.app`;
  const host = window.location.hostname;
  const pathMatch = /^\/s\/([^/]+)/.exec(window.location.pathname);
  if (pathMatch) return `${pathMatch[1]}.ecom.app`;
  const storeParam = new URLSearchParams(window.location.search).get('store');
  if (storeParam) return `${storeParam}.ecom.app`;
  if (host === 'localhost' || host === '127.0.0.1') {
    const envSlug = process.env.NEXT_PUBLIC_STORE_SUBDOMAIN;
    if (!envSlug) return null;
    return `${envSlug}`;
  }
  return host;
}

interface TemplateProviderProps { children: ReactNode; storeSlug?: string }

export function TemplateProvider({ children, storeSlug }: Readonly<TemplateProviderProps>) {
  const { store, setStore } = useStorefrontStore();
  const [ctx, setCtx] = useState<StoreContext>(defaultCtx);
  const [ready, setReady] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const domain = resolveStoreDomain(storeSlug);

    if (!domain) {
      setNotFound(true);
      setReady(true);
      return;
    }

    const requestedSubdomain = domain.replace(/\.ecom\.app$/, '');
    if (store?.subdomain && store.subdomain !== requestedSubdomain) {
      setStore(null as never);
    }

    api.get(`/storefront/resolve?domain=${domain}`)
      .then((r) => {
        const s = r.data.store;
        setStore(s);
        const currency = (s.branding as Record<string, string>)?.currency || 'USD';
        setCtx({
          template: s.template || 'default',
          currency,
          currencySymbol: CURRENCY_SYMBOLS[currency] || currency,
        });
      })
      .catch(() => {
        setNotFound(true);
      })
      .finally(() => setReady(true));
  }, [storeSlug]);

  // Show minimal skeleton while loading instead of blank screen
  if (!ready) return (
    <div className="min-h-screen bg-neutral-50 animate-pulse">
      <div className="h-14 bg-white border-b" />
    </div>
  );

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center px-6">
          <p className="text-6xl mb-4">🏪</p>
          <h1 className="text-2xl font-bold mb-2">Store not found</h1>
          <p className="text-neutral-500">Use a URL like <code className="bg-neutral-100 px-2 py-1 rounded text-sm">/s/your-store-name</code></p>
        </div>
      </div>
    );
  }

  return (
    <TemplateContext.Provider value={ctx}>
      {children}
    </TemplateContext.Provider>
  );
}
