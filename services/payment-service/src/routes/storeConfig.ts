import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export const storeConfigRouter = Router();

// GET /store-config — store admin reads their own config
storeConfigRouter.get('/', async (req: Request, res: Response) => {
  const role = req.headers['x-user-role'] as string;
  const storeId = req.headers['x-store-id'] as string;
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') { res.status(403).json({ error: 'Forbidden' }); return; }
  if (!storeId) { res.status(400).json({ error: 'x-store-id required' }); return; }

  const config = await prisma.storePaymentConfig.findUnique({ where: { storeId } });
  res.json({
    config: config ? {
      ...config,
      razorpayKeySecret: config.razorpayKeySecret ? '••••••••' : '',
    } : null,
  });
});

// PUT /store-config — store admin saves their Razorpay config
storeConfigRouter.put('/', async (req: Request, res: Response) => {
  const role = req.headers['x-user-role'] as string;
  const storeId = req.headers['x-store-id'] as string;
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') { res.status(403).json({ error: 'Forbidden' }); return; }
  if (!storeId) { res.status(400).json({ error: 'x-store-id required' }); return; }

  const schema = z.object({
    razorpayKeyId: z.string().optional(),
    razorpayKeySecret: z.string().optional(),
    enabled: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const data = { ...parsed.data };
  if (data.razorpayKeySecret === '••••••••') delete data.razorpayKeySecret;

  const config = await prisma.storePaymentConfig.upsert({
    where: { storeId },
    update: data,
    create: { storeId, ...data },
  });
  res.json({ config: { ...config, razorpayKeySecret: config.razorpayKeySecret ? '••••••••' : '' } });
});
