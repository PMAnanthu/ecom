import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
export const categoryRouter = Router();

const schema = z.object({
  name: z.string().min(1),
  parentId: z.string().optional().nullable(),
});

// Build a nested tree from flat list
function buildTree(cats: { id: string; name: string; parentId: string | null; storeId: string; createdAt: Date }[]) {
  const map = new Map<string, { id: string; name: string; parentId: string | null; children: unknown[] }>();
  cats.forEach(c => map.set(c.id, { ...c, children: [] }));
  const roots: unknown[] = [];
  map.forEach(c => {
    if (c.parentId && map.has(c.parentId)) {
      (map.get(c.parentId)!.children as unknown[]).push(c);
    } else {
      roots.push(c);
    }
  });
  return roots;
}

categoryRouter.get('/', async (req: Request, res: Response) => {
  const storeId = req.headers['x-store-id'] as string | undefined;
  const where = storeId ? { storeId } : {};
  const categories = await prisma.category.findMany({ where, orderBy: { name: 'asc' } });
  // Return both flat list and tree
  const tree = buildTree(categories as Parameters<typeof buildTree>[0]);
  res.json({ categories, tree });
});

categoryRouter.post('/', async (req: Request, res: Response) => {
  const storeId = req.headers['x-store-id'] as string;
  if (!storeId) { res.status(400).json({ error: 'x-store-id header required' }); return; }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  try {
    const category = await prisma.category.create({
      data: { name: parsed.data.name, storeId, parentId: parsed.data.parentId ?? null },
    });
    res.status(201).json({ category });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'P2002') {
      const existing = await prisma.category.findFirst({
        where: { storeId, name: parsed.data.name, parentId: parsed.data.parentId ?? null },
      });
      res.status(200).json({ category: existing });
    } else {
      res.status(500).json({ error: 'Failed to create category' });
    }
  }
});

categoryRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    // Reassign children to parent before deleting
    const cat = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (cat) {
      await prisma.category.updateMany({ where: { parentId: cat.id }, data: { parentId: cat.parentId } });
    }
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Category not found' });
  }
});
