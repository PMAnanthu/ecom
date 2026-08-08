import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createRazorpayClient, verifySignature } from '../lib/razorpay';

export const subscriptionsRouter = Router();

// POST /subscriptions/create — create Razorpay order for subscription
subscriptionsRouter.post('/create', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const parsed = z.object({
    amount: z.number().int().positive(), // paise
    currency: z.string().default('INR'),
    referenceId: z.string(), // subscriptionPlanId
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const config = await prisma.platformPaymentConfig.findUnique({ where: { id: 'global' } });
  if (!config?.enabled || !config.razorpayKeyId || !config.razorpayKeySecret) {
    res.status(400).json({ error: 'Platform payment not configured' }); return;
  }

  const rz = createRazorpayClient(config.razorpayKeyId, config.razorpayKeySecret);
  const rzOrder = await rz.orders.create({
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    receipt: `sub_${parsed.data.referenceId.slice(-20)}`,
  });

  const paymentOrder = await prisma.paymentOrder.create({
    data: {
      razorpayOrderId: rzOrder.id,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      type: 'SUBSCRIPTION',
      referenceId: parsed.data.referenceId,
      userId,
    },
  });

  res.json({ orderId: rzOrder.id, amount: rzOrder.amount, currency: rzOrder.currency, keyId: config.razorpayKeyId, paymentOrderId: paymentOrder.id });
});

// POST /subscriptions/verify — verify signature and activate subscription
subscriptionsRouter.post('/verify', async (req: Request, res: Response) => {
  const parsed = z.object({
    razorpayOrderId: z.string(),
    razorpayPaymentId: z.string(),
    razorpaySignature: z.string(),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const paymentOrder = await prisma.paymentOrder.findUnique({ where: { razorpayOrderId: parsed.data.razorpayOrderId } });
  if (!paymentOrder) { res.status(404).json({ error: 'Payment order not found' }); return; }

  const config = await prisma.platformPaymentConfig.findUnique({ where: { id: 'global' } });
  if (!config?.razorpayKeySecret) { res.status(400).json({ error: 'Platform payment config missing' }); return; }

  const valid = verifySignature(parsed.data.razorpayOrderId, parsed.data.razorpayPaymentId, parsed.data.razorpaySignature, config.razorpayKeySecret);
  if (!valid) {
    await prisma.paymentOrder.update({ where: { id: paymentOrder.id }, data: { status: 'FAILED' } });
    res.status(400).json({ error: 'Invalid payment signature' }); return;
  }

  await prisma.paymentOrder.update({
    where: { id: paymentOrder.id },
    data: { status: 'PAID', razorpayPaymentId: parsed.data.razorpayPaymentId, razorpaySignature: parsed.data.razorpaySignature },
  });

  res.json({ success: true, referenceId: paymentOrder.referenceId });
});
