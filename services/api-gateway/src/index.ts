import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import httpProxy from 'http-proxy';
import { authenticate, requireRole } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 4000;

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const PLATFORM_URL = process.env.PLATFORM_SERVICE_URL || 'http://platform-service:3002';
const STORE_URL = process.env.STORE_SERVICE_URL || 'http://store-service:3003';
const CATALOG_URL = process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3004';
const ORDER_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3005';
const STOREFRONT_URL = process.env.STOREFRONT_SERVICE_URL || 'http://storefront-service:3006';

const proxy = httpProxy.createProxyServer({ changeOrigin: true });
proxy.on('error', (err, _req, res) => {
  console.error('Proxy error:', err.message);
  (res as Response).status(502).json({ error: 'Bad gateway' });
});

// Rewrites /api/<prefix>/rest → /rest and proxies to target
function forward(target: string, apiPrefix: string) {
  return (req: Request, res: Response) => {
    const stripped = req.url.replace(new RegExp(`^/api/${apiPrefix}`), '') || '/';
    req.url = stripped;
    proxy.web(req, res, { target });
  };
}

function mw(...handlers: Array<(req: Request, res: Response, next: NextFunction) => void>) {
  return handlers;
}

app.use(cors());
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'api-gateway' }));

// Using app.all with wildcard keeps req.url = full path, so our rewrite works correctly

// Protected auth routes (addresses, profile) — must be before public /api/auth/*
app.all('/api/auth/addresses', ...mw(authenticate), forward(AUTH_URL, 'auth'));
app.all('/api/auth/addresses/*', ...mw(authenticate), forward(AUTH_URL, 'auth'));

// Public: auth (login/register/refresh)
app.all('/api/auth', forward(AUTH_URL, 'auth'));
app.all('/api/auth/*', forward(AUTH_URL, 'auth'));

// Public: storefront resolver
app.all('/api/storefront', forward(STOREFRONT_URL, 'storefront'));
app.all('/api/storefront/*', forward(STOREFRONT_URL, 'storefront'));

// Catalog reads: public GET — must be before protected catalog route
app.get('/api/catalog/products', forward(CATALOG_URL, 'catalog'));
app.get('/api/catalog/products/*', forward(CATALOG_URL, 'catalog'));
app.get('/api/catalog/categories', forward(CATALOG_URL, 'catalog'));
app.get('/api/catalog/categories/*', forward(CATALOG_URL, 'catalog'));

// Public: templates list (admin picker needs it)
app.get('/api/platform/templates', forward(PLATFORM_URL, 'platform'));

// Platform: super-admin only (all other platform routes)
app.all('/api/platform', ...mw(authenticate, requireRole('SUPERADMIN')), forward(PLATFORM_URL, 'platform'));
app.all('/api/platform/*', ...mw(authenticate, requireRole('SUPERADMIN')), forward(PLATFORM_URL, 'platform'));

// Store: admin only
app.all('/api/store', ...mw(authenticate, requireRole('ADMIN')), forward(STORE_URL, 'store'));
app.all('/api/store/*', ...mw(authenticate, requireRole('ADMIN')), forward(STORE_URL, 'store'));

// Catalog writes: admin only
app.all('/api/catalog', ...mw(authenticate, requireRole('ADMIN')), forward(CATALOG_URL, 'catalog'));
app.all('/api/catalog/*', ...mw(authenticate, requireRole('ADMIN')), forward(CATALOG_URL, 'catalog'));

// Addresses: authenticated users only
app.all('/api/addresses', ...mw(authenticate), forward(AUTH_URL, 'addresses'));
app.all('/api/addresses/*', ...mw(authenticate), forward(AUTH_URL, 'addresses'));

// Orders: any authenticated user
app.all('/api/orders', ...mw(authenticate), forward(ORDER_URL, 'orders'));
app.all('/api/orders/*', ...mw(authenticate), forward(ORDER_URL, 'orders'));

app.listen(PORT, () => console.log(`api-gateway running on port ${PORT}`));

export default app;
