import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
export const adminRouter = Router();

const STORE_SERVICE_URL = process.env.STORE_SERVICE_URL || 'http://store-service:3003';
const STOREFRONT_URL = process.env.STOREFRONT_URL || 'https://ecom-storefront-m6jmogmpra-ue.a.run.app';

async function getStoreForAdmin(authUserId: string): Promise<{ subdomain?: string; name?: string } | null> {
  try {
    const res = await fetch(`${STORE_SERVICE_URL}/by-admin/${authUserId}`);
    if (!res.ok) return null;
    return (await res.json() as { store: { subdomain?: string; name?: string } }).store;
  } catch { return null; }
}

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
  const data: { subscriptionId?: string | null; renewsAt?: Date | null } = {};
  if (subscriptionId !== undefined) data.subscriptionId = subscriptionId || null;
  if (renewsAt !== undefined) data.renewsAt = renewsAt ? new Date(renewsAt) : null;
  const admin = await prisma.adminUser.update({ where: { id: req.params.id }, data });
  res.json({ admin });
});
