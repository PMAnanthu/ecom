import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
export const subscriptionRouter = Router();

const schema = z.object({
  name: z.string(),
  maxProducts: z.number().int().positive().default(50),
  price: z.number().min(0).default(0),
  currency: z.string().default('USD'),
  billingPeriod: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).default('MONTHLY'),
  features: z.record(z.unknown()).default({}),
});

subscriptionRouter.get('/', async (_req, res) => {
  const subs = await prisma.subscription.findMany({ orderBy: { price: 'asc' } });
  res.json({ subscriptions: subs });
});

subscriptionRouter.post('/', async (req: Request, res: Response) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const sub = await prisma.subscription.create({ data: { ...parsed.data, features: parsed.data.features as object } });
  res.status(201).json({ subscription: sub });
});

subscriptionRouter.delete('/:id', async (req: Request, res: Response) => {
  await prisma.subscription.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});
