import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
export const adminRouter = Router();

adminRouter.get('/', async (_req: Request, res: Response) => {
  const admins = await prisma.adminUser.findMany({
    include: { subscription: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ admins });
});

adminRouter.post('/', async (req: Request, res: Response) => {
  const parsed = z.object({
    email: z.string().email(),
    subscriptionId: z.string().optional(),
  }).safeParse(req.body);
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
  const { subscriptionId, renewsAt } = req.body;
  const data: { subscriptionId?: string | null; renewsAt?: Date | null; availableDays?: number } = {};
  if (subscriptionId !== undefined) data.subscriptionId = subscriptionId || null;
  if (renewsAt !== undefined) data.renewsAt = renewsAt ? new Date(renewsAt) : null;

  // Reset availableDays based on billing period when subscription changes
  if (subscriptionId) {
    const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (sub) {
      let days = 30;
      if (sub.billingPeriod === 'YEARLY') days = 365;
      else if (sub.billingPeriod === 'QUARTERLY') days = 90;
      data.availableDays = days;
    }
  }

  const admin = await prisma.adminUser.update({ where: { id: req.params.id }, data });
  res.json({ admin });
});
