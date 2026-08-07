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

// GET /config — fetch global config (password masked)
configRouter.get('/', async (req: Request, res: Response) => {
  const role = req.headers['x-user-role'] as string;
  if (role !== 'SUPERADMIN') { res.status(403).json({ error: 'Forbidden' }); return; }

  const config = await prisma.notificationConfig.findUnique({ where: { id: 'global' } });
  if (!config) { res.json({ config: null }); return; }

  // Mask secrets in response
  res.json({
    config: {
      ...config,
      smtpPassword: config.smtpPassword ? '••••••••' : '',
      waApiKey: config.waApiKey ? '••••••••' : '',
    },
  });
});

// PUT /config — upsert global config
configRouter.put('/', async (req: Request, res: Response) => {
  const role = req.headers['x-user-role'] as string;
  if (role !== 'SUPERADMIN') { res.status(403).json({ error: 'Forbidden' }); return; }

  const parsed = configSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  // Don't overwrite secrets if placeholder sent
  const data = { ...parsed.data };
  if (data.smtpPassword === '••••••••') delete data.smtpPassword;
  if (data.waApiKey === '••••••••') delete data.waApiKey;

  const config = await prisma.notificationConfig.upsert({
    where: { id: 'global' },
    update: data,
    create: { id: 'global', ...data },
  });

  res.json({
    config: {
      ...config,
      smtpPassword: config.smtpPassword ? '••••••••' : '',
      waApiKey: config.waApiKey ? '••••••••' : '',
    },
  });
});
