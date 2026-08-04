import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
export const adminRouter = Router();

const createAdminSchema = z.object({
  email: z.string().email(),
  subscriptionId: z.string().optional(),
});

adminRouter.get('/', async (_req: Request, res: Response) => {
  const admins = await prisma.adminUser.findMany({
    include: { subscription: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ admins });
});

adminRouter.post('/', async (req: Request, res: Response) => {
  const parsed = createAdminSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const admin = await prisma.adminUser.create({ data: parsed.data });
  res.status(201).json({ admin });
});

adminRouter.patch('/:id/status', async (req: Request, res: Response) => {
  const { status } = req.body;
  if (!['ACTIVE', 'SUSPENDED', 'DELETED'].includes(status)) {
    res.status(400).json({ error: 'Invalid status' }); return;
  }
  const admin = await prisma.adminUser.update({ where: { id: req.params.id }, data: { status } });
  res.json({ admin });
});

adminRouter.patch('/:id/subscription', async (req: Request, res: Response) => {
  const { subscriptionId } = req.body;
  const admin = await prisma.adminUser.update({ where: { id: req.params.id }, data: { subscriptionId } });
  res.json({ admin });
});
