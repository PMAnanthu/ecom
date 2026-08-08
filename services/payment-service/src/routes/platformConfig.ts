import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export const platformConfigRouter = Router();

// GET /platform-config — super-admin reads global Razorpay config
platformConfigRouter.get('/', async (req: Request, res: Response) => {
  const role = req.headers['x-user-role'] as string;
  if (role !== 'SUPERADMIN') { res.status(403).json({ error: 'Forbidden' }); return; }

  const config = await prisma.platformPaymentConfig.findUnique({ where: { id: 'global' } });
  res.json({
    config: config ? {
      ...config,
      razorpayKeySecret: config.razorpayKeySecret ? '••••••••' : '',
    } : null,
  });
});

// PUT /platform-config — super-admin saves global Razorpay config
platformConfigRouter.put('/', async (req: Request, res: Response) => {
  const role = req.headers['x-user-role'] as string;
  if (role !== 'SUPERADMIN') { res.status(403).json({ error: 'Forbidden' }); return; }

  const schema = z.object({
    razorpayKeyId: z.string().optional(),
    razorpayKeySecret: z.string().optional(),
    enabled: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const data = { ...parsed.data };
  if (data.razorpayKeySecret === '••••••••') delete data.razorpayKeySecret;

  const config = await prisma.platformPaymentConfig.upsert({
    where: { id: 'global' },
    update: data,
    create: { id: 'global', ...data },
  });
  res.json({ config: { ...config, razorpayKeySecret: config.razorpayKeySecret ? '••••••••' : '' } });
});
