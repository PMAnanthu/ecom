import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StoreConfig {
  id: string;
  name: string;
  subdomain: string;
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
        // Store in both zustand persist AND localStorage so api interceptor can read it
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
    {
      name: 'sf-auth',
      // Persist all auth + store so user stays logged in on refresh
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, store: s.store }),
      onRehydrateStorage: () => (state) => {
        // Sync localStorage token with rehydrated zustand state
        if (state?.accessToken) {
          localStorage.setItem('sf_accessToken', state.accessToken);
        }
      },
    }
  )
);
