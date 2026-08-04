import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
export const categoryRouter = Router();

const schema = z.object({ name: z.string().min(1) });

categoryRouter.get('/', async (req: Request, res: Response) => {
  const storeId = req.headers['x-store-id'] as string | undefined;
  const where = storeId ? { storeId } : {};
  const categories = await prisma.category.findMany({ where, orderBy: { name: 'asc' } });
  res.json({ categories });
});

categoryRouter.post('/', async (req: Request, res: Response) => {
  const storeId = req.headers['x-store-id'] as string;
  if (!storeId) { res.status(400).json({ error: 'x-store-id header required' }); return; }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  try {
    const category = await prisma.category.create({ data: { ...parsed.data, storeId } });
    res.status(201).json({ category });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'P2002') {
      // Already exists — return the existing one
      const existing = await prisma.category.findFirst({ where: { storeId, name: parsed.data.name } });
      res.status(200).json({ category: existing });
    } else {
      res.status(500).json({ error: 'Failed to create category' });
    }
  }
});

categoryRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Category not found' });
  }
});
