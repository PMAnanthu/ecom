import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ecom Admin',
  description: 'ecom Admin Dashboard',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-neutral-50">{children}</body>
    </html>
  );
}
