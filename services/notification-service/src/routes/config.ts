import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export const configRouter = Router();

const configSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpFrom: z.string().optional(),
  emailEnabled: z.boolean().optional(),
  waProvider: z.enum(['TWILIO', 'META']).optional(),
  waApiKey: z.string().optional(),
  waPhoneId: z.string().optional(),
  waEnabled: z.boolean().optional(),
});

// GET /config/:storeId — super-admin fetches any store's config
configRouter.get('/:storeId', async (req: Request, res: Response) => {
  const role = req.headers['x-user-role'] as string;
  if (role !== 'SUPERADMIN') { res.status(403).json({ error: 'Forbidden' }); return; }

  const config = await prisma.notificationConfig.findUnique({ where: { storeId: req.params.storeId } });
  res.json({ config: config ?? null });
});

// PUT /config/:storeId — upsert config
configRouter.put('/:storeId', async (req: Request, res: Response) => {
  const role = req.headers['x-user-role'] as string;
  if (role !== 'SUPERADMIN') { res.status(403).json({ error: 'Forbidden' }); return; }

  const parsed = configSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const config = await prisma.notificationConfig.upsert({
    where: { storeId: req.params.storeId },
    update: parsed.data,
    create: { storeId: req.params.storeId, ...parsed.data },
  });
  res.json({ config });
});
