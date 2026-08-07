import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { upload, saveUpload } from '../lib/upload';

const prisma = new PrismaClient();
export const storeRouter = Router();

const createSchema = z.object({
  name: z.string().min(1),
  subdomain: z.string().min(3).regex(/^[a-z0-9-]+$/),
  template: z.string().default('default'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  adminId: z.string().optional(), // allow super-admin to assign an admin
});

const updateSchema = z.object({
  name: z.string().optional(),
  template: z.string().optional(),
  branding: z.record(z.unknown()).optional(),
  domain: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  adminId: z.string().optional(),
});

// Super-admin: list all stores
storeRouter.get('/all', async (_req: Request, res: Response) => {
  const stores = await prisma.store.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ stores });
});

// Super-admin: create store with explicit adminId
storeRouter.post('/admin-create', async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const assignedAdminId = parsed.data.adminId;
  if (!assignedAdminId) { res.status(400).json({ error: 'adminId required' }); return; }

  const subdomainTaken = await prisma.store.findUnique({ where: { subdomain: parsed.data.subdomain } });
  if (subdomainTaken) { res.status(409).json({ error: 'Subdomain already taken' }); return; }

  const existing = await prisma.store.findUnique({ where: { adminId: assignedAdminId } });
  if (existing) { res.status(409).json({ error: 'This admin already has a store' }); return; }

  const store = await prisma.store.create({ data: { name: parsed.data.name, subdomain: parsed.data.subdomain, template: parsed.data.template, email: parsed.data.email, phone: parsed.data.phone, adminId: assignedAdminId } });
  res.status(201).json({ store });
});

// Super-admin: update any store by id
storeRouter.patch('/admin-update/:id', async (req: Request, res: Response) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const store = await prisma.store.update({ where: { id: req.params.id }, data: parsed.data as Parameters<typeof prisma.store.update>[0]['data'] });
  res.json({ store });
});

storeRouter.get('/by-ids', async (req: Request, res: Response) => {
  const ids = ((req.query.ids as string) || '').split(',').filter(Boolean);
  if (ids.length === 0) { res.json({ stores: [] }); return; }
  const stores = await prisma.store.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, subdomain: true, published: true },
  });
  res.json({ stores });
});

storeRouter.get('/by-admin/:adminId', async (req: Request, res: Response) => {
  const store = await prisma.store.findUnique({
    where: { adminId: req.params.adminId },
    select: { id: true, name: true, subdomain: true, published: true },
  });
  res.json({ store: store ?? null });
});

storeRouter.get('/', async (req: Request, res: Response) => {
  const adminId = req.headers['x-user-id'] as string;
  const store = await prisma.store.findUnique({ where: { adminId } });
  if (!store) { res.status(404).json({ error: 'Store not found' }); return; }
  res.json({ store });
});

storeRouter.post('/', async (req: Request, res: Response) => {
  const adminId = req.headers['x-user-id'] as string;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const existing = await prisma.store.findUnique({ where: { adminId } });
  if (existing) { res.status(409).json({ error: 'Store already exists for this admin' }); return; }

  const subdomainTaken = await prisma.store.findUnique({ where: { subdomain: parsed.data.subdomain } });
  if (subdomainTaken) { res.status(409).json({ error: 'Subdomain already taken' }); return; }

  const store = await prisma.store.create({ data: { ...parsed.data, adminId } });
  res.status(201).json({ store });
});

storeRouter.patch('/', async (req: Request, res: Response) => {
  const adminId = req.headers['x-user-id'] as string;
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const data: Record<string, unknown> = { ...parsed.data };
  const store = await prisma.store.update({ where: { adminId }, data: data as Parameters<typeof prisma.store.update>[0]['data'] });
  res.json({ store });
});

storeRouter.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const url = await saveUpload(req, res);
    res.json({ url });
  } catch {
    res.status(400).json({ error: 'No file uploaded' });
  }
});

storeRouter.patch('/publish', async (req: Request, res: Response) => {
  const adminId = req.headers['x-user-id'] as string;
  const { published } = req.body;
  const store = await prisma.store.update({ where: { adminId }, data: { published: Boolean(published) } });
  res.json({ store });
});

storeRouter.patch('/domain', async (req: Request, res: Response) => {
  const adminId = req.headers['x-user-id'] as string;
  const { domain } = req.body;
  if (!domain) { res.status(400).json({ error: 'domain required' }); return; }
  const store = await prisma.store.update({ where: { adminId }, data: { domain } });
  res.json({ store, dnsInstructions: `Point CNAME ${domain} → ${store.subdomain}.ecom.app` });
});
