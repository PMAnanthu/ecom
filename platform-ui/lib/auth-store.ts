import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'USER';
  storeId?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  storeId: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setStoreId: (storeId: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      storeId: null,
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, accessToken });
      },
      setStoreId: (storeId) => set({ storeId }),
      clearAuth: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, storeId: null });
      },
    }),
    { name: 'auth-store',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, storeId: s.storeId }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) localStorage.setItem('accessToken', state.accessToken);
        if (state?.storeId) {
          // Re-sync storeId into the raw key the api interceptor reads
          const raw = localStorage.getItem('auth-store');
          if (!raw) return;
          try {
            const parsed = JSON.parse(raw);
            parsed.state.storeId = state.storeId;
            localStorage.setItem('auth-store', JSON.stringify(parsed));
          } catch { /* ignore */ }
        }
      },
    }
  )
);
