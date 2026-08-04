import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sf_accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // Inject storeId so catalog/order calls are scoped to this store
    try {
      const raw = localStorage.getItem('sf-auth');
      if (raw) {
        const storeId = JSON.parse(raw)?.state?.store?.id;
        if (storeId) config.headers['x-store-id'] = storeId;
      }
    } catch { /* ignore */ }
  }
  return config;
});
