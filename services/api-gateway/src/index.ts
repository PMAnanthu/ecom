import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import httpProxy from 'http-proxy';
import multer from 'multer';
import { authenticate, requireRole } from './middleware/auth';

const GCS_BUCKET = process.env.GCS_BUCKET || 'ecom-uploads-e-com-504518';
const USE_GCS = process.env.NODE_ENV === 'production' || !!process.env.GCS_BUCKET;
const memUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

async function handleUpload(req: Request, res: Response) {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  try {
    if (USE_GCS) {
      // Use GCS XML API with service account token from metadata server
      const tokenRes = await fetch(
        'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
        { headers: { 'Metadata-Flavor': 'Google' } }
      );
      const { access_token } = await tokenRes.json() as { access_token: string };
      const filename = `${Date.now()}-${req.file.originalname.replace(/[^a-z0-9.]/gi, '_')}`;
      const uploadRes = await fetch(
        `https://storage.googleapis.com/upload/storage/v1/b/${GCS_BUCKET}/o?uploadType=media&name=${filename}&predefinedAcl=publicRead`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': req.file.mimetype },
          body: req.file.buffer,
        }
      );
      if (!uploadRes.ok) {
        const err = await uploadRes.text();
        console.error('GCS error status:', uploadRes.status, 'body:', err.slice(0, 500));
        throw new Error(`GCS upload failed: ${uploadRes.status}`);
      }
      res.json({ url: `https://storage.googleapis.com/${GCS_BUCKET}/${filename}` });
    } else {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const crypto = await import('node:crypto');
      const uploadDir = path.join(process.cwd(), 'uploads');
      fs.mkdirSync(uploadDir, { recursive: true });
      const filename = crypto.randomBytes(16).toString('hex');
      fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);
      res.json({ url: `/uploads/${filename}` });
    }
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
}

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

// Admin management (super-admin only) — protected before public /api/auth/*
app.all('/api/auth/admin-mgmt', ...mw(authenticate, requireRole('SUPERADMIN')), forward(AUTH_URL, 'auth'));
app.all('/api/auth/admin-mgmt/*', ...mw(authenticate, requireRole('SUPERADMIN')), forward(AUTH_URL, 'auth'));

// Change own password — any authenticated user
app.all('/api/auth/admin-mgmt/change-password', ...mw(authenticate), forward(AUTH_URL, 'auth'));

// Protected auth routes (addresses, profile)
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

// Store: admin only — upload handled directly in gateway (multipart proxy issue)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.post('/api/store/upload', ...mw(authenticate, requireRole('ADMIN')), memUpload.single('file') as any, (req: Request, res: Response) => handleUpload(req, res));
app.all('/api/store/upload', ...mw(authenticate, requireRole('ADMIN')), forward(STORE_URL, 'store'));
app.all('/api/store', ...mw(authenticate, requireRole('ADMIN')), forward(STORE_URL, 'store'));
app.all('/api/store/*', ...mw(authenticate, requireRole('ADMIN')), forward(STORE_URL, 'store'));

// Catalog product image upload — handled directly in gateway
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.post('/api/catalog/products/:id/images', ...mw(authenticate, requireRole('ADMIN')), memUpload.single('image') as any, (req: Request, res: Response) => handleUpload(req, res));

// Catalog writes: admin only
app.all('/api/catalog/products/*/images', ...mw(authenticate, requireRole('ADMIN')), forward(CATALOG_URL, 'catalog'));
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
