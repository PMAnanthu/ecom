'use client';

import Link from 'next/link';
import { useStorefrontStore } from '@/lib/storefront-store';
import { usePathname } from 'next/navigation';

interface FooterLink { label: string; href: string }
interface FooterLinkGroup { heading: string; links: FooterLink[] }
interface FooterSocial { label: string; href: string }

function useStorePath() {
  const pathname = usePathname();
  const match = /^\/s\/([^/]+)/.exec(pathname);
  return match ? `/s/${match[1]}` : '';
}

function parseJson<T>(val: unknown, fallback: T): T {
  if (!val) return fallback;
  if (typeof val === 'object') return val as T;
  try { return JSON.parse(val as string) as T; } catch { return fallback; }
}

// ─── SIMPLE FOOTER ────────────────────────────────────────────────────────────
// Single row: store name + copyright left, nav links right
function SimpleFooter({ b, storeName }: Readonly<{ b: Record<string, unknown>; storeName: string }>) {
  const bg = (b.footerBg as string) || '#111827';
  const text = (b.footerText as string) || '#9ca3af';
  const copyright = (b.footerCopyright as string) || `© ${new Date().getFullYear()} ${storeName}. All rights reserved.`;
  const showLinks = b.footerShowLinks !== false;
  const base = useStorePath();

  const defaultLinks: FooterLink[] = [
    { label: 'Home', href: `${base}/` },
    { label: 'Products', href: `${base}/products` },
    { label: 'About', href: `${base}/about` },
  ];

  return (
    <footer style={{ backgroundColor: bg, color: text }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-base mb-1" style={{ color: text }}>{storeName}</p>
            <p className="text-xs opacity-60">{copyright}</p>
          </div>
          {showLinks && (
            <nav className="flex flex-wrap gap-x-5 gap-y-2">
              {defaultLinks.map(l => (
                <Link key={l.href} href={l.href}
                  className="text-sm hover:opacity-100 opacity-60 transition-opacity"
                  style={{ color: text }}>
                  {l.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </footer>
  );
}

// ─── STANDARD FOOTER ─────────────────────────────────────────────────────────
// 2-row: top = store name + link group columns; bottom = copyright bar
function StandardFooter({ b, storeName }: Readonly<{ b: Record<string, unknown>; storeName: string }>) {
  const bg = (b.footerBg as string) || '#1f2937';
  const text = (b.footerText as string) || '#d1d5db';
  const accent = (b.footerAccent as string) || '#6366f1';
  const copyright = (b.footerCopyright as string) || `© ${new Date().getFullYear()} ${storeName}. All rights reserved.`;
  const tagline = (b.footerTagline as string) || '';
  const groups = parseJson<FooterLinkGroup[]>(b.footerLinkGroups, []);

  return (
    <footer style={{ backgroundColor: bg, color: text }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_repeat(var(--cols),1fr)] gap-8"
          style={{ '--cols': Math.max(1, groups.length) } as React.CSSProperties}>
          {/* Brand column */}
          <div>
            <p className="font-extrabold text-lg mb-2" style={{ color: accent }}>{storeName}</p>
            {tagline && <p className="text-sm opacity-70 max-w-xs">{tagline}</p>}
          </div>
          {/* Link group columns */}
          {groups.map((g, i) => (
            <div key={i}>
              <p className="font-semibold text-sm mb-3" style={{ color: text }}>{g.heading}</p>
              <ul className="space-y-2">
                {g.links.map((l, j) => (
                  <li key={j}>
                    <Link href={l.href} className="text-sm opacity-60 hover:opacity-100 transition-opacity"
                      style={{ color: text }}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      {/* Copyright bar */}
      <div style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
        <div className="max-w-7xl mx-auto px-6 py-3">
          <p className="text-xs opacity-50" style={{ color: text }}>{copyright}</p>
        </div>
      </div>
    </footer>
  );
}

// ─── RICH FOOTER ──────────────────────────────────────────────────────────────
// Multi-column: store info + socials | link group columns | copyright bar
const SOCIAL_ICONS: Record<string, string> = {
  instagram: '📷', facebook: '👥', twitter: '𝕏', x: '𝕏', youtube: '▶️',
  linkedin: '💼', whatsapp: '💬', tiktok: '🎵', pinterest: '📌',
};

function socialIcon(label: string): string {
  const key = label.toLowerCase();
  for (const [k, v] of Object.entries(SOCIAL_ICONS)) {
    if (key.includes(k)) return v;
  }
  return '🔗';
}

function RichFooter({ b, storeName }: Readonly<{ b: Record<string, unknown>; storeName: string }>) {
  const bg = (b.footerBg as string) || '#0f172a';
  const text = (b.footerText as string) || '#94a3b8';
  const accent = (b.footerAccent as string) || '#6366f1';
  const copyright = (b.footerCopyright as string) || `© ${new Date().getFullYear()} ${storeName}. All rights reserved.`;
  const tagline = (b.footerTagline as string) || '';
  const groups = parseJson<FooterLinkGroup[]>(b.footerLinkGroups, []);
  const socials = parseJson<FooterSocial[]>(b.footerSocials, []);

  return (
    <footer style={{ backgroundColor: bg, color: text }}>
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_repeat(var(--cols),1fr)] gap-10"
          style={{ '--cols': Math.max(1, groups.length) } as React.CSSProperties}>

          {/* Brand + socials column */}
          <div>
            <p className="font-extrabold text-xl mb-3" style={{ color: accent }}>{storeName}</p>
            {tagline && <p className="text-sm opacity-60 mb-5 max-w-xs leading-relaxed">{tagline}</p>}
            {socials.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-2">
                {socials.map((s, i) => (
                  <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                    title={s.label}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-base hover:opacity-100 opacity-70 transition-all"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: text }}>
                    {socialIcon(s.label)}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Link group columns */}
          {groups.map((g, i) => (
            <div key={i}>
              <p className="font-semibold text-sm mb-4 uppercase tracking-wider opacity-50"
                style={{ color: text }}>{g.heading}</p>
              <ul className="space-y-2.5">
                {g.links.map((l, j) => (
                  <li key={j}>
                    <Link href={l.href}
                      className="text-sm opacity-60 hover:opacity-100 transition-opacity"
                      style={{ color: text }}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      {/* Copyright bar */}
      <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-xs opacity-40" style={{ color: text }}>{copyright}</p>
        </div>
      </div>
    </footer>
  );
}

// ─── DISPATCHER ───────────────────────────────────────────────────────────────
export function StorefrontFooter() {
  const { store } = useStorefrontStore();
  const b = (store?.branding || {}) as Record<string, unknown>;
  const template = (b.footerTemplate as string) || 'simple';
  const name = store?.name || '';

  if (template === 'standard') return <StandardFooter b={b} storeName={name} />;
  if (template === 'rich') return <RichFooter b={b} storeName={name} />;
  return <SimpleFooter b={b} storeName={name} />;
}
