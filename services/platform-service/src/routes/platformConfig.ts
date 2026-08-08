import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const platformConfigRouter = Router();

// GET /platform-config — public (storefront needs Firebase config)
platformConfigRouter.get('/', async (_req: Request, res: Response) => {
  const config = await prisma.platformConfig.findUnique({ where: { id: 'singleton' } });
  const data = (config?.data || {}) as Record<string, unknown>;
  // Only expose public Firebase config (never expose serviceAccountKey)
  res.json({
    firebase: {
      apiKey: data.firebaseApiKey || null,
      authDomain: data.firebaseAuthDomain || null,
      projectId: data.firebaseProjectId || null,
      enableGoogle: data.firebaseEnableGoogle !== false,
      enablePhone: data.firebaseEnablePhone !== false,
      enableFacebook: !!data.firebaseEnableFacebook,
    },
  });
});

// PATCH /platform-config — super-admin only
platformConfigRouter.patch('/', async (req: Request, res: Response) => {
  const incoming = req.body as Record<string, unknown>;
  const existing = await prisma.platformConfig.findUnique({ where: { id: 'singleton' } });
  const current = (existing?.data || {}) as Record<string, unknown>;
  const merged = { ...current, ...incoming } as Parameters<typeof prisma.platformConfig.upsert>[0]['update']['data'];
  const config = await prisma.platformConfig.upsert({
    where: { id: 'singleton' },
    update: { data: merged },
    create: { id: 'singleton', data: merged as Parameters<typeof prisma.platformConfig.create>[0]['data']['data'] },
  });
  res.json({ success: true, config });
});
