'use client';

import Link from 'next/link';
import { useTemplate } from '@/lib/template-context';
import { useStorefrontStore } from '@/lib/storefront-store';
import { TemplateWrapper } from '@/components/templates/TemplateWrapper';

export default function AboutPage() {
  const template = useTemplate();
  const { store } = useStorefrontStore();
  const branding = store?.branding as Record<string, string> | undefined;
  const isCard = template === 'card';

  return (
    <TemplateWrapper>
      <div className={`mx-auto px-6 py-12 max-w-3xl`}>
        {isCard && (
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-10 mb-10 text-center">
            <h1 className="text-4xl font-extrabold mb-2">{store?.name || 'About Us'}</h1>
            <p className="text-indigo-200">We&apos;re passionate about bringing you the best products.</p>
          </div>
        )}
        {!isCard && <h1 className="text-3xl font-bold mb-8">{store?.name || 'About Us'}</h1>}

        <div className={`${isCard ? 'bg-white rounded-2xl shadow p-8' : 'space-y-6'}`}>
          <p className="text-neutral-600 leading-relaxed">
            Welcome to <strong>{store?.name || 'our store'}</strong>. We are dedicated to offering a curated selection of quality products and providing an excellent shopping experience.
          </p>

          {(branding?.address || branding?.city || branding?.country || branding?.phone) && (
            <div className={`mt-6 ${isCard ? 'border-t pt-6' : ''} space-y-2`}>
              <h2 className="font-semibold text-lg mb-3">Contact Us</h2>
              {branding?.address && <p className="text-neutral-600">📍 {branding.address}{branding.city ? `, ${branding.city}` : ''}{branding.country ? `, ${branding.country}` : ''}</p>}
              {branding?.phone && <p className="text-neutral-600">📞 {branding.phone}</p>}
            </div>
          )}

          <div className={`mt-6 ${isCard ? 'border-t pt-6' : ''}`}>
            <Link href="/products" className={`inline-block font-semibold px-6 py-2.5 rounded-full transition-colors ${isCard ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-black text-white hover:bg-neutral-800'}`}>
              Browse Products →
            </Link>
          </div>
        </div>
      </div>
    </TemplateWrapper>
  );
}
