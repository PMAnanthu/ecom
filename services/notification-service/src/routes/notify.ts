import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { notifyOrderEvent, NotifEvent } from '../services/notificationService';

export const notifyRouter = Router();

const sendSchema = z.object({
  event: z.enum(['ORDER_PLACED', 'ORDER_STATUS_UPDATED', 'ORDER_CANCELLED']),
  orderId: z.string(),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  customerName: z.string(),
  status: z.string().optional(),
  total: z.number().optional(),
});

notifyRouter.post('/send', async (req: Request, res: Response) => {
  const storeId = req.headers['x-store-id'] as string;
  if (!storeId) { res.status(400).json({ error: 'x-store-id header required' }); return; }

  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  await notifyOrderEvent(parsed.data.event as NotifEvent, { ...parsed.data, storeId });
  res.json({ ok: true });
});
