import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StoreConfig {
  id: string;
  name: string;
  template: string;
  branding: Record<string, string>;
}

interface AuthState {
  user: { id: string; email: string; role: string } | null;
  accessToken: string | null;
  store: StoreConfig | null;
  setAuth: (user: AuthState['user'], accessToken: string, refreshToken: string) => void;
  setStore: (store: StoreConfig) => void;
  clearAuth: () => void;
}

export const useStorefrontStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      store: null,
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('sf_accessToken', accessToken);
        localStorage.setItem('sf_refreshToken', refreshToken);
        set({ user, accessToken });
      },
      setStore: (store) => set({ store }),
      clearAuth: () => {
        localStorage.removeItem('sf_accessToken');
        localStorage.removeItem('sf_refreshToken');
        set({ user: null, accessToken: null });
      },
    }),
    { name: 'sf-auth', partialize: (s) => ({ user: s.user, accessToken: s.accessToken, store: s.store }) }
  )
);
