import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
export const categoryRouter = Router();

const schema = z.object({ name: z.string().min(1) });

categoryRouter.get('/', async (req: Request, res: Response) => {
  const storeId = req.headers['x-store-id'] as string | undefined;
  const where = storeId ? { storeId } : {};
  const categories = await prisma.category.findMany({ where });
  res.json({ categories });
});

categoryRouter.post('/', async (req: Request, res: Response) => {
  const storeId = req.headers['x-store-id'] as string;
  if (!storeId) { res.status(400).json({ error: 'x-store-id header required' }); return; }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const category = await prisma.category.create({ data: { ...parsed.data, storeId } });
  res.status(201).json({ category });
});

categoryRouter.delete('/:id', async (req: Request, res: Response) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});
