'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect } from 'react';
import { useStorefrontStore } from './storefront-store';

interface ThemeState {
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',
      setMode: (mode) => set({ mode }),
      toggle: () => set({ mode: get().mode === 'light' ? 'dark' : 'light' }),
    }),
    { name: 'sf-theme' }
  )
);

export function useThemeMode() { return useThemeStore(s => s.mode); }
export function useThemeToggle() { return useThemeStore(s => s.toggle); }

export function ThemeInjector() {
  const { store } = useStorefrontStore();
  const mode = useThemeStore(s => s.mode);
  const b = (store?.branding || {}) as Record<string, string>;

  useEffect(() => {
    const root = document.documentElement;

    if (mode === 'dark') {
      root.style.setProperty('--sf-bg', b.themeBg && isDark(b.themeBg) ? b.themeBg : getDarkBg(b));
      root.style.setProperty('--sf-text', b.themeText && isDark(b.themeBg || '') ? b.themeText : getDarkText(b));
      root.style.setProperty('--sf-accent', b.themeAccent || '#818cf8');
    } else {
      root.style.setProperty('--sf-bg', b.themeBg && !isDark(b.themeBg) ? b.themeBg : getLightBg(b));
      root.style.setProperty('--sf-text', b.themeText && !isDark(b.themeBg || '') ? b.themeText : getLightText(b));
      root.style.setProperty('--sf-accent', b.themeAccent || '#4f46e5');
    }

    root.style.setProperty('--sf-mode', mode);
    document.body.style.backgroundColor = root.style.getPropertyValue('--sf-bg');
    document.body.style.color = root.style.getPropertyValue('--sf-text');
  }, [mode, b.themeBg, b.themeText, b.themeAccent]);

  return null;
}

function isDark(hex: string): boolean {
  if (!hex || !hex.startsWith('#')) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const bl = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + bl * 114) / 1000 < 128;
}

function getLightBg(b: Record<string, string>) {
  return (!b.themeBg || isDark(b.themeBg)) ? '#ffffff' : b.themeBg;
}
function getLightText(b: Record<string, string>) {
  return (!b.themeText || isDark(b.themeBg || '') !== isDark(b.themeText)) ? '#171717' : b.themeText;
}
function getDarkBg(b: Record<string, string>) {
  return (b.themeBg && isDark(b.themeBg)) ? b.themeBg : '#0a0a0a';
}
function getDarkText(b: Record<string, string>) {
  return (b.themeText && !isDark(b.themeText)) ? b.themeText : '#fafafa';
}
