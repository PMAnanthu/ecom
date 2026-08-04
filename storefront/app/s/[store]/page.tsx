'use client';

import { use } from 'react';
import { TemplateProvider } from '@/lib/template-context';
import HomePage from '@/app/page';

export default function StoreRoute({ params }: Readonly<{ params: Promise<{ store: string }> }>) {
  const { store } = use(params);
  return (
    <TemplateProvider storeSlug={store}>
      <HomePage />
    </TemplateProvider>
  );
}
