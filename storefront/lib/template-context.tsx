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

function resolveStoreDomain(storeSlug?: string): string {
  if (storeSlug) return `${storeSlug}.ecom.app`;

  const host = window.location.hostname;

  // /s/<subdomain> path routing
  const pathMatch = /^\/s\/([^/]+)/.exec(window.location.pathname);
  if (pathMatch) return `${pathMatch[1]}.ecom.app`;

  // ?store=<subdomain> query param
  const storeParam = new URLSearchParams(window.location.search).get('store');
  if (storeParam) return `${storeParam}.ecom.app`;

  if (host === 'localhost' || host === '127.0.0.1') {
    return process.env.NEXT_PUBLIC_STORE_SUBDOMAIN || 'demoshop.ecom.app';
  }
  return host;
}

interface TemplateProviderProps {
  children: ReactNode;
  storeSlug?: string;
}

export function TemplateProvider({ children, storeSlug }: Readonly<TemplateProviderProps>) {
  const { store, setStore } = useStorefrontStore();
  const [ctx, setCtx] = useState<StoreContext>(defaultCtx);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const domain = resolveStoreDomain(storeSlug);
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
        if (store?.template) setCtx(c => ({ ...c, template: store!.template }));
      })
      .finally(() => setReady(true));
  }, [storeSlug]);

  if (!ready) return null;

  return (
    <TemplateContext.Provider value={ctx}>
      {children}
    </TemplateContext.Provider>
  );
}
