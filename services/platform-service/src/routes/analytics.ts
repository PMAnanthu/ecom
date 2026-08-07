import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const analyticsRouter = Router();

analyticsRouter.get('/', async (_req, res) => {
  const storeServiceUrl = process.env.STORE_SERVICE_URL || 'http://store-service:3003';
  const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://order-service:3005';
  const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';

  const [totalAdmins, activeAdmins, totalSubscriptions, storeStats, orderStats, customerStats] = await Promise.all([
    prisma.adminUser.count(),
    prisma.adminUser.count({ where: { status: 'ACTIVE' } }),
    prisma.subscription.count(),
    fetch(`${storeServiceUrl}/stats`).then(r => r.ok ? r.json() : { total: 0, published: 0 }).catch(() => ({ total: 0, published: 0 })),
    fetch(`${orderServiceUrl}/stats`).then(r => r.ok ? r.json() : { total: 0, revenue: 0 }).catch(() => ({ total: 0, revenue: 0 })),
    fetch(`${authServiceUrl}/admin-mgmt/stats`).then(r => r.ok ? r.json() : { customers: { total: 0, active: 0, inactive: 0 } }).catch(() => ({ customers: { total: 0, active: 0, inactive: 0 } })),
  ]);

  res.json({
    admins: { total: totalAdmins, active: activeAdmins },
    subscriptions: { total: totalSubscriptions },
    stores: storeStats,
    orders: orderStats,
    customers: customerStats.customers,
  });
});
