import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createRazorpayClient, verifySignature } from '../lib/razorpay';

export const ordersRouter = Router();

// POST /orders/create — create Razorpay order for product purchase
ordersRouter.post('/create', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const storeId = req.headers['x-store-id'] as string;
  if (!userId || !storeId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const parsed = z.object({
    amount: z.number().int().positive(), // paise
    currency: z.string().default('INR'),
    referenceId: z.string(), // orderId from order-service
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const config = await prisma.storePaymentConfig.findUnique({ where: { storeId } });
  if (!config?.enabled || !config.razorpayKeyId || !config.razorpayKeySecret) {
    res.status(400).json({ error: 'Payment not configured for this store' }); return;
  }

  const rz = createRazorpayClient(config.razorpayKeyId, config.razorpayKeySecret);
  const rzOrder = await rz.orders.create({
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    receipt: parsed.data.referenceId.slice(0, 40),
  });

  const paymentOrder = await prisma.paymentOrder.create({
    data: {
      razorpayOrderId: rzOrder.id,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      type: 'PRODUCT',
      referenceId: parsed.data.referenceId,
      storeId,
      userId,
    },
  });

  res.json({ orderId: rzOrder.id, amount: rzOrder.amount, currency: rzOrder.currency, keyId: config.razorpayKeyId, paymentOrderId: paymentOrder.id });
});

// POST /orders/verify — verify Razorpay payment signature
ordersRouter.post('/verify', async (req: Request, res: Response) => {
  const parsed = z.object({
    razorpayOrderId: z.string(),
    razorpayPaymentId: z.string(),
    razorpaySignature: z.string(),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const paymentOrder = await prisma.paymentOrder.findUnique({ where: { razorpayOrderId: parsed.data.razorpayOrderId } });
  if (!paymentOrder) { res.status(404).json({ error: 'Payment order not found' }); return; }

  const config = await prisma.storePaymentConfig.findUnique({ where: { storeId: paymentOrder.storeId! } });
  if (!config?.razorpayKeySecret) { res.status(400).json({ error: 'Payment config missing' }); return; }

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
