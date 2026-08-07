'use client';

import { use } from 'react';
import { TemplateProvider } from '@/lib/template-context';

export default function StoreLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ store: string }>;
}>) {
  const { store } = use(params);
  return <TemplateProvider storeSlug={store}>{children}</TemplateProvider>;
}
