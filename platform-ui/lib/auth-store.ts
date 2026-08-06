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
  refreshToken: string | null;
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
      refreshToken: null,
      storeId: null,
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, accessToken, refreshToken });
      },
      setStoreId: (storeId) => set({ storeId }),
      clearAuth: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null, storeId: null });
      },
    }),
    {
      name: 'auth-store-v2',
      version: 2,
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        storeId: s.storeId,
      }),
      onRehydrateStorage: () => (state) => {
        // Re-sync tokens to localStorage on page load so api interceptor works
        if (state?.accessToken) localStorage.setItem('accessToken', state.accessToken);
        if (state?.refreshToken) localStorage.setItem('refreshToken', state.refreshToken);
      },
    }
  )
);
