import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { upload, saveUpload } from '../lib/upload';

const prisma = new PrismaClient();
export const productRouter = Router();

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0).default(0),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  categoryId: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

productRouter.get('/', async (req: Request, res: Response) => {
  const storeId = req.headers['x-store-id'] as string | undefined;
  const { category, search, tag, page = '1', limit = '20' } = req.query;

  const where: Record<string, unknown> = {};
  if (storeId) where.storeId = storeId;
  if (category) where.categoryId = category;
  if (search) where.name = { contains: search as string, mode: 'insensitive' };
  if (tag) where.tags = { has: tag as string };

  const skip = (Number.parseInt(page as string, 10) - 1) * Number.parseInt(limit as string, 10);
  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, include: { category: true }, skip, take: Number.parseInt(limit as string, 10), orderBy: { createdAt: 'desc' } }),
    prisma.product.count({ where }),
  ]);

  res.json({ products, total, page: Number.parseInt(page as string, 10), limit: Number.parseInt(limit as string, 10) });
});

productRouter.get('/tags', async (req: Request, res: Response) => {
  const storeId = req.headers['x-store-id'] as string | undefined;
  const where = storeId ? { storeId } : {};
  const products = await prisma.product.findMany({ where, select: { tags: true } });
  const tags = [...new Set(products.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b));
  res.json({ tags });
});

productRouter.get('/:id', async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id }, include: { category: true } });
  if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
  res.json({ product });
});

productRouter.post('/', async (req: Request, res: Response) => {
  const storeId = req.headers['x-store-id'] as string;
  if (!storeId) { res.status(400).json({ error: 'x-store-id header required' }); return; }

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const product = await prisma.product.create({ data: { ...parsed.data, storeId } });
  res.status(201).json({ product });
});

productRouter.patch('/:id', async (req: Request, res: Response) => {
  const storeId = req.headers['x-store-id'] as string;
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (product?.storeId !== storeId) { res.status(404).json({ error: 'Product not found' }); return; }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const updated = await prisma.product.update({ where: { id: req.params.id }, data: parsed.data });
  res.json({ product: updated });
});

productRouter.delete('/:id', async (req: Request, res: Response) => {
  const storeId = req.headers['x-store-id'] as string;
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (product?.storeId !== storeId) { res.status(404).json({ error: 'Product not found' }); return; }

  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

productRouter.post('/:id/images', upload.single('image'), async (req: Request, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) { res.status(404).json({ error: 'Product not found' }); return; }

  const imageUrl = await saveUpload(req, res);
  const images = [...(product.images as string[]), imageUrl];
  const updated = await prisma.product.update({ where: { id: req.params.id }, data: { images } });
  res.json({ product: updated });
});

// Accept a pre-uploaded URL (from gateway GCS upload) and add to product images
productRouter.post('/:id/images-url', async (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url) { res.status(400).json({ error: 'url required' }); return; }
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) { res.status(404).json({ error: 'Product not found' }); return; }

  const images = [...(product.images as string[]), url];
  const updated = await prisma.product.update({ where: { id: req.params.id }, data: { images } });
  res.json({ product: updated });
});
