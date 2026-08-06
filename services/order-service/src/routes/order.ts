import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { z } from 'zod';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
export const orderRouter = Router();

const checkoutSchema = z.object({
  shippingAddress: z.object({
    name: z.string(),
    line1: z.string(),
    city: z.string(),
    country: z.string(),
    zip: z.string(),
  }),
  storeId: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    price: z.number(),
    qty: z.number().int().positive(),
  })).optional(),
});

orderRouter.post('/checkout', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  // Prefer items sent directly from client; fall back to Redis cart
  let cartItems = parsed.data.items ?? [];
  if (cartItems.length === 0) {
    const cartKey = `cart:${userId}`;
    const cartData = await redis.get(cartKey);
    if (!cartData) { res.status(400).json({ error: 'Cart is empty' }); return; }
    const cart = JSON.parse(cartData);
    if (!cart.items?.length) { res.status(400).json({ error: 'Cart is empty' }); return; }
    cartItems = cart.items as { productId: string; name: string; price: number; qty: number }[];
  }

  const total = cartItems.reduce((sum: number, i: { price: number; qty: number }) => sum + i.price * i.qty, 0);

  const order = await prisma.order.create({
    data: {
      storeId: parsed.data.storeId,
      userId,
      total,
      shippingAddress: parsed.data.shippingAddress,
      items: {
        create: cartItems.map((i: { productId: string; name: string; price: number; qty: number }) => ({
          productId: i.productId,
          productName: i.name,
          qty: i.qty,
          priceAtOrder: i.price,
        })),
      },
    },
    include: { items: true },
  });

  // Clear Redis cart if it exists
  await redis.del(`cart:${userId}`);
  res.status(201).json({ order });
});

orderRouter.get('/', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const role = req.headers['x-user-role'] as string;
  const storeId = req.headers['x-store-id'] as string;

  const where = role === 'ADMIN' ? { storeId } : { userId };
  const orders = await prisma.order.findMany({ where, include: { items: true }, orderBy: { createdAt: 'desc' } });
  res.json({ orders });
});

orderRouter.get('/:id', async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
  if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
  res.json({ order });
});

orderRouter.patch('/:id/status', async (req: Request, res: Response) => {
  const role = req.headers['x-user-role'] as string;
  if (role !== 'ADMIN') { res.status(403).json({ error: 'Forbidden' }); return; }

  const { status } = req.body;
  const valid = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  if (!valid.includes(status)) { res.status(400).json({ error: 'Invalid status' }); return; }

  const order = await prisma.order.update({ where: { id: req.params.id }, data: { status } });
  res.json({ order });
});
