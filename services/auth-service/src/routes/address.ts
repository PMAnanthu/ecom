import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
export const addressRouter = Router();

const schema = z.object({
  name: z.string().min(1),
  line1: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  zip: z.string().min(1),
  isDefault: z.boolean().optional(),
});

addressRouter.get('/', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const addresses = await prisma.address.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  res.json({ addresses });
});

addressRouter.post('/', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  if (parsed.data.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }
  const address = await prisma.address.create({ data: { ...parsed.data, userId } });
  res.status(201).json({ address });
});

addressRouter.patch('/:id/default', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  const address = await prisma.address.update({ where: { id: req.params.id }, data: { isDefault: true } });
  res.json({ address });
});

addressRouter.delete('/:id', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  await prisma.address.deleteMany({ where: { id: req.params.id, userId } });
  res.json({ success: true });
});
