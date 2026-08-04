import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';

const prisma = new PrismaClient();
export const storeRouter = Router();

const upload = multer({ dest: path.join(__dirname, '../../uploads') });

const createSchema = z.object({
  name: z.string().min(1),
  subdomain: z.string().min(3).regex(/^[a-z0-9-]+$/),
  template: z.string().default('default'),
});

const updateSchema = z.object({
  name: z.string().optional(),
  template: z.string().optional(),
  branding: z.record(z.unknown()).optional(),
  domain: z.string().optional(),
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
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
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
