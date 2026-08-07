import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { adminRouter } from './routes/admin';
import { subscriptionRouter } from './routes/subscription';
import { analyticsRouter } from './routes/analytics';
import { templateRouter } from './routes/template';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'platform-service' }));

// Admin-accessible: check own subscription status by email injected by gateway
app.get('/subscription-status', async (req: Request, res: Response) => {
  const userEmail = req.headers['x-user-email'] as string;
  if (!userEmail) { res.json({ subscribed: false, availableDays: 0, expired: true, subscription: null }); return; }

  const admin = await prisma.adminUser.findUnique({
    where: { email: userEmail },
    include: { subscription: true },
  });

  if (!admin) {
    res.json({ subscribed: false, availableDays: 0, expired: true, subscription: null });
    return;
  }

  res.json({
    subscribed: !!admin.subscriptionId,
    availableDays: admin.availableDays ?? 0,
    expired: (admin.availableDays ?? 0) <= 0,
    renewsAt: admin.renewsAt,
    subscription: admin.subscription ? {
      name: admin.subscription.name,
      price: admin.subscription.price,
      currency: admin.subscription.currency,
      billingPeriod: admin.subscription.billingPeriod,
    } : null,
  });
});

app.use('/admins', adminRouter);
app.use('/subscriptions', subscriptionRouter);
app.use('/analytics', analyticsRouter);
app.use('/templates', templateRouter);

app.listen(PORT, () => {
  console.log(`platform-service running on port ${PORT}`);
});

export default app;
