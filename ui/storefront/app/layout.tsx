import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { TemplateProvider } from '@/lib/template-context';
import { ThemeInjector } from '@/lib/theme-store';

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Your online store',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ backgroundColor: 'var(--sf-bg)', color: 'var(--sf-text)' }}>
        <TemplateProvider>
          <ThemeInjector />
          {children}
        </TemplateProvider>
      </body>
    </html>
  );
}
