import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { TemplateProvider } from '@/lib/template-context';

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Your online store',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TemplateProvider>
          {children}
        </TemplateProvider>
      </body>
    </html>
  );
}
