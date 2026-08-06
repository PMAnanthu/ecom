'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTemplate } from '@/lib/template-context';
import { useStorefrontStore } from '@/lib/storefront-store';
import { TemplateWrapper } from '@/components/templates/TemplateWrapper';

function useStorePath() {
  const pathname = usePathname();
  const match = /^\/s\/([^/]+)/.exec(pathname);
  return match ? `/s/${match[1]}` : '';
}

const SOCIAL_ICONS: Record<string, { icon: string; label: string }> = {
  contactEmail:    { icon: '✉️', label: 'Email' },
  contactPhone:    { icon: '📱', label: 'Phone' },
  socialWhatsapp:  { icon: '💬', label: 'WhatsApp' },
  socialInstagram: { icon: '📷', label: 'Instagram' },
  socialFacebook:  { icon: '👥', label: 'Facebook' },
  socialYoutube:   { icon: '▶️', label: 'YouTube' },
  socialX:         { icon: '𝕏', label: 'X / Twitter' },
};

export default function AboutPage() {
  const template = useTemplate();
  const { store } = useStorefrontStore();
  const b = (store?.branding || {}) as Record<string, string>;
  const isCard = template === 'card';
  const base = useStorePath();

  const title = b.aboutTitle || store?.name || 'About Us';
  const description = b.aboutDescription || `Welcome to ${store?.name || 'our store'}. We are dedicated to offering quality products and an excellent shopping experience.`;
  const hasSocial = Object.keys(SOCIAL_ICONS).some(k => b[k]);

  const socialLink = (key: string, value: string) => {
    if (key === 'contactEmail') return `mailto:${value}`;
    if (key === 'contactPhone') return `tel:${value}`;
    return value;
  };

  return (
    <TemplateWrapper>
      <div className="mx-auto px-6 py-12 max-w-3xl">
        {isCard && (
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-10 mb-10 text-center">
            <h1 className="text-4xl font-extrabold mb-2">{title}</h1>
            {b.heroSubtext && <p className="text-indigo-200">{b.heroSubtext}</p>}
          </div>
        )}
        {!isCard && <h1 className="text-3xl font-bold mb-8">{title}</h1>}

        <div className={isCard ? 'bg-white rounded-2xl shadow p-8 space-y-6' : 'space-y-6'}>
          {/* Description */}
          <p className="text-neutral-600 leading-relaxed whitespace-pre-wrap">{description}</p>

          {/* Business Hours */}
          {b.businessHours && (
            <div className={isCard ? 'border-t pt-6' : ''}>
              <h2 className="font-semibold text-lg mb-2">Business Hours</h2>
              <p className="text-neutral-600">🕐 {b.businessHours}</p>
            </div>
          )}

          {/* Contact & Social Media */}
          {hasSocial && (
            <div className={isCard ? 'border-t pt-6' : ''}>
              <h2 className="font-semibold text-lg mb-3">Contact Us</h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(SOCIAL_ICONS).map(([key, { icon, label }]) => {
                  const val = b[key];
                  if (!val) return null;
                  return (
                    <a key={key} href={socialLink(key, val)} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors hover:shadow ${isCard ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100' : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'}`}>
                      <span>{icon}</span>
                      <span>{label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Address */}
          {(b.address || b.city) && (
            <div className={isCard ? 'border-t pt-6' : ''}>
              <p className="text-neutral-600">📍 {[b.address, b.city, b.country].filter(Boolean).join(', ')}</p>
            </div>
          )}

          <div className={isCard ? 'border-t pt-6' : ''}>
            <Link href={`${base}/products`}
              className={`inline-block font-semibold px-6 py-2.5 rounded-full transition-colors ${isCard ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-black text-white hover:bg-neutral-800'}`}>
              Browse Products →
            </Link>
          </div>
        </div>
      </div>
    </TemplateWrapper>
  );
}
