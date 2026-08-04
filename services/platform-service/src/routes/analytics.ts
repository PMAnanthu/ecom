import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const analyticsRouter = Router();

analyticsRouter.get('/', async (_req, res) => {
  const [totalAdmins, activeAdmins, totalSubscriptions] = await Promise.all([
    prisma.adminUser.count(),
    prisma.adminUser.count({ where: { status: 'ACTIVE' } }),
    prisma.subscription.count(),
  ]);

  res.json({
    admins: { total: totalAdmins, active: activeAdmins },
    subscriptions: { total: totalSubscriptions },
  });
});
