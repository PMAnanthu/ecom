'use client';

import { ReactNode } from 'react';
import { useTemplate } from '@/lib/template-context';
import { SidebarShell, TopnavShell, CardShell } from './TemplateShells';

export function TemplateWrapper({ children, sidebar }: Readonly<{ children: ReactNode; sidebar?: ReactNode }>) {
  const template = useTemplate();
  if (template === 'sidebar') return <SidebarShell sidebarContent={sidebar}>{children}</SidebarShell>;
  if (template === 'card') return <CardShell>{children}</CardShell>;
  return <TopnavShell>{children}</TopnavShell>;
}
