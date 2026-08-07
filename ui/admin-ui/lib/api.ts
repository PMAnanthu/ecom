import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({ baseURL: API_BASE });

function readState() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('auth-store-v2');
    return raw ? (JSON.parse(raw)?.state ?? {}) : {};
  } catch { return {}; }
}

api.interceptors.request.use((config) => {
  const state = readState();
  if (state.accessToken) config.headers.Authorization = `Bearer ${state.accessToken}`;
  if (state.storeId) config.headers['x-store-id'] = state.storeId;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { refreshToken } = readState();
        if (!refreshToken) throw new Error('no refresh token');
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        try {
          const raw = localStorage.getItem('auth-store-v2');
          if (raw) {
            const parsed = JSON.parse(raw);
            parsed.state.accessToken = data.accessToken;
            parsed.state.refreshToken = data.refreshToken;
            localStorage.setItem('auth-store-v2', JSON.stringify(parsed));
          }
        } catch { /* ignore */ }
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('auth-store-v2');
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }
    throw error;
  }
);
