import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // Inject storeId for store/catalog/order calls
    try {
      const raw = localStorage.getItem('auth-store');
      if (raw) {
        const storeId = JSON.parse(raw)?.state?.storeId;
        if (storeId) config.headers['x-store-id'] = storeId;
      }
    } catch { /* ignore */ }
  }
  return config;
});

// Auto-refresh token on 401
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('no refresh token');
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        // Update zustand persist
        try {
          const raw = localStorage.getItem('auth-store');
          if (raw) {
            const parsed = JSON.parse(raw);
            parsed.state.accessToken = data.accessToken;
            localStorage.setItem('auth-store', JSON.stringify(parsed));
          }
        } catch { /* ignore */ }
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }
    throw error;
  }
);
