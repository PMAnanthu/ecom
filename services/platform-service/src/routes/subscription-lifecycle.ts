import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
export const subscriptionLifecycleRouter = Router();

function daysForPeriod(period: string): number {
  if (period === 'YEARLY') return 365;
  if (period === 'QUARTERLY') return 90;
  if (period === 'UNLIMITED') return 36500; // ~100 years
  return 30; // MONTHLY
}

// POST /manage/buy — admin self-subscribes (dummy payment)
subscriptionLifecycleRouter.post('/buy', async (req: Request, res: Response) => {
  const parsed = z.object({
    subscriptionId: z.string(),
    adminEmail: z.string().email(),
    paymentMethod: z.string().default('dummy'), // future: stripe/razorpay
    cardLast4: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const sub = await prisma.subscription.findUnique({ where: { id: parsed.data.subscriptionId } });
  if (!sub) { res.status(404).json({ error: 'Subscription plan not found' }); return; }

  const days = daysForPeriod(sub.billingPeriod);
  const renewsAt = new Date(Date.now() + days * 86400000);

  // Dummy payment: always succeeds
  const paymentRef = `DUMMY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const admin = await prisma.adminUser.upsert({
    where: { email: parsed.data.adminEmail },
    update: { subscriptionId: sub.id, availableDays: days, renewsAt },
    create: { email: parsed.data.adminEmail, subscriptionId: sub.id, availableDays: days, renewsAt },
  });

  res.json({
    success: true,
    paymentRef,
    message: `Subscribed to ${sub.name} — ${days} days added`,
    admin,
    renewsAt,
  });
});

// GET /manage — list all admin subscriptions with status (super-admin)
subscriptionLifecycleRouter.get('/', async (_req: Request, res: Response) => {
  const admins = await prisma.adminUser.findMany({
    include: { subscription: true },
    orderBy: { createdAt: 'desc' },
  });
  const now = new Date();
  const result = admins.map(a => ({
    id: a.id,
    email: a.email,
    status: a.status,
    subscriptionId: a.subscriptionId,
    subscriptionName: a.subscription?.name ?? null,
    billingPeriod: a.subscription?.billingPeriod ?? null,
    price: a.subscription?.price ?? null,
    currency: a.subscription?.currency ?? null,
    availableDays: a.availableDays,
    renewsAt: a.renewsAt,
    expired: (a.availableDays ?? 0) <= 0,
    daysUntilExpiry: a.renewsAt ? Math.ceil((new Date(a.renewsAt).getTime() - now.getTime()) / 86400000) : null,
  }));
  res.json({ admins: result });
});

// POST /manage/assign — super-admin assigns a plan to an admin
subscriptionLifecycleRouter.post('/assign', async (req: Request, res: Response) => {
  const parsed = z.object({
    adminEmail: z.string().email(),
    subscriptionId: z.string(),
    startDate: z.string().optional(), // ISO date, defaults to now
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const sub = await prisma.subscription.findUnique({ where: { id: parsed.data.subscriptionId } });
  if (!sub) { res.status(404).json({ error: 'Subscription plan not found' }); return; }

  const days = daysForPeriod(sub.billingPeriod);
  const startDate = parsed.data.startDate ? new Date(parsed.data.startDate) : new Date();
  const renewsAt = new Date(startDate.getTime() + days * 86400000);

  const admin = await prisma.adminUser.upsert({
    where: { email: parsed.data.adminEmail },
    update: { subscriptionId: parsed.data.subscriptionId, availableDays: days, renewsAt },
    create: { email: parsed.data.adminEmail, subscriptionId: parsed.data.subscriptionId, availableDays: days, renewsAt },
  });
  res.json({ admin, daysAssigned: days, renewsAt });
});

// POST /manage/renew — super-admin renews an admin's subscription
subscriptionLifecycleRouter.post('/renew', async (req: Request, res: Response) => {
  const parsed = z.object({
    adminEmail: z.string().email(),
    extendDays: z.number().int().positive().optional(), // override days, else use plan default
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const admin = await prisma.adminUser.findUnique({
    where: { email: parsed.data.adminEmail },
    include: { subscription: true },
  });
  if (!admin) { res.status(404).json({ error: 'Admin not found' }); return; }
  if (!admin.subscriptionId) { res.status(400).json({ error: 'Admin has no subscription to renew' }); return; }

  const days = parsed.data.extendDays ?? daysForPeriod(admin.subscription!.billingPeriod);
  // Extend from today or from current renewsAt (whichever is later)
  const base = admin.renewsAt && new Date(admin.renewsAt) > new Date() ? new Date(admin.renewsAt) : new Date();
  const renewsAt = new Date(base.getTime() + days * 86400000);

  const updated = await prisma.adminUser.update({
    where: { email: parsed.data.adminEmail },
    data: { availableDays: (admin.availableDays ?? 0) + days, renewsAt },
  });
  res.json({ admin: updated, daysAdded: days, newRenewsAt: renewsAt });
});

// POST /manage/cancel — super-admin cancels an admin's subscription
subscriptionLifecycleRouter.post('/cancel', async (req: Request, res: Response) => {
  const { adminEmail } = req.body;
  if (!adminEmail) { res.status(400).json({ error: 'adminEmail required' }); return; }

  const admin = await prisma.adminUser.update({
    where: { email: adminEmail },
    data: { subscriptionId: null, availableDays: 0, renewsAt: null },
  });
  res.json({ admin, message: 'Subscription cancelled' });
});

// GET /manage/expiring — get admins expiring in next N days (default 7)
subscriptionLifecycleRouter.get('/expiring', async (req: Request, res: Response) => {
  const days = Number(req.query.days ?? 7);
  const threshold = new Date(Date.now() + days * 86400000);
  const admins = await prisma.adminUser.findMany({
    where: {
      subscriptionId: { not: null },
      renewsAt: { lte: threshold },
    },
    include: { subscription: true },
    orderBy: { renewsAt: 'asc' },
  });
  res.json({
    count: admins.length,
    admins: admins.map(a => ({
      email: a.email,
      subscriptionName: a.subscription?.name,
      renewsAt: a.renewsAt,
      availableDays: a.availableDays,
      expired: (a.availableDays ?? 0) <= 0,
    })),
  });
});
