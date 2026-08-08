import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { adminRouter } from './routes/admin';
import { subscriptionRouter } from './routes/subscription';
import { subscriptionLifecycleRouter } from './routes/subscription-lifecycle';
import { analyticsRouter } from './routes/analytics';
import { templateRouter } from './routes/template';
import { platformConfigRouter } from './routes/platformConfig';

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

  const now = new Date();
  // Compute days remaining from renewsAt (live calculation, not stored counter)
  const availableDays = admin.renewsAt
    ? Math.max(0, Math.floor((new Date(admin.renewsAt).getTime() - now.getTime()) / 86400000))
    : (admin.availableDays ?? 0);

  res.json({
    subscribed: !!admin.subscriptionId,
    availableDays,
    expired: availableDays <= 0,
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
app.use('/manage', subscriptionLifecycleRouter);
app.use('/analytics', analyticsRouter);
app.use('/templates', templateRouter);
app.use('/platform-config', platformConfigRouter);

app.listen(PORT, async () => {
  // Ensure PlatformConfig table exists (created here if DB push wasn't run)
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS platform_svc."PlatformConfig" (
        id TEXT NOT NULL DEFAULT 'singleton',
        data JSONB NOT NULL DEFAULT '{}',
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PlatformConfig_pkey" PRIMARY KEY (id)
      )
    `);
  } catch { /* table already exists */ }

  // Seed built-in templates (upsert — safe to run every startup)
  const builtInTemplates = [
    { key: 'default', name: 'Top Nav', description: 'Clean top navigation bar with hero banner.', enabled: true },
    { key: 'sidebar', name: 'Sidebar', description: 'Left sidebar with category filters. Best for large catalogs.', enabled: true },
    { key: 'card', name: 'Card Grid', description: 'Large card layout with gradient background. Bold and modern.', enabled: true },
    { key: 'footer-simple', name: 'Simple Footer', description: 'Single row — store name, copyright and nav links.', enabled: true },
    { key: 'footer-standard', name: 'Standard Footer', description: 'Two rows — brand column with link groups, then copyright bar.', enabled: true },
    { key: 'footer-rich', name: 'Rich Footer', description: 'Multi-column with social icons, link groups and copyright bar.', enabled: true },
  ];
  for (const t of builtInTemplates) {
    await prisma.storeTemplate.upsert({
      where: { key: t.key },
      update: { name: t.name, description: t.description },
      create: { key: t.key, name: t.name, description: t.description, enabled: t.enabled },
    }).catch(() => {});
  }

  console.log(`platform-service running on port ${PORT}`);
});

export default app;
