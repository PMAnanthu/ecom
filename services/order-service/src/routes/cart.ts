import { Router, Request, Response } from 'express';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
export const cartRouter = Router();

function cartKey(userId: string, sessionId?: string): string {
  return userId ? `cart:${userId}` : `cart:guest:${sessionId}`;
}

cartRouter.get('/', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const sessionId = req.headers['x-session-id'] as string;
  const key = cartKey(userId, sessionId);

  const data = await redis.get(key);
  res.json({ cart: data ? JSON.parse(data) : { items: [] } });
});

cartRouter.post('/items', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const sessionId = req.headers['x-session-id'] as string;
  const key = cartKey(userId, sessionId);
  const { productId, name, price, qty = 1 } = req.body;

  if (!productId || !price) { res.status(400).json({ error: 'productId and price required' }); return; }

  const data = await redis.get(key);
  const cart = data ? JSON.parse(data) : { items: [] };

  const existing = cart.items.find((i: { productId: string }) => i.productId === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.items.push({ productId, name, price, qty });
  }

  await redis.set(key, JSON.stringify(cart), 'EX', 60 * 60 * 24 * 7);
  res.json({ cart });
});

cartRouter.patch('/items/:productId', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const sessionId = req.headers['x-session-id'] as string;
  const key = cartKey(userId, sessionId);
  const { qty } = req.body;

  const data = await redis.get(key);
  if (!data) { res.status(404).json({ error: 'Cart not found' }); return; }

  const cart = JSON.parse(data);
  const item = cart.items.find((i: { productId: string }) => i.productId === req.params.productId);
  if (!item) { res.status(404).json({ error: 'Item not in cart' }); return; }

  if (qty <= 0) {
    cart.items = cart.items.filter((i: { productId: string }) => i.productId !== req.params.productId);
  } else {
    item.qty = qty;
  }

  await redis.set(key, JSON.stringify(cart), 'EX', 60 * 60 * 24 * 7);
  res.json({ cart });
});

cartRouter.delete('/items/:productId', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const sessionId = req.headers['x-session-id'] as string;
  const key = cartKey(userId, sessionId);

  const data = await redis.get(key);
  if (!data) { res.json({ cart: { items: [] } }); return; }

  const cart = JSON.parse(data);
  cart.items = cart.items.filter((i: { productId: string }) => i.productId !== req.params.productId);
  await redis.set(key, JSON.stringify(cart), 'EX', 60 * 60 * 24 * 7);
  res.json({ cart });
});

cartRouter.delete('/', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const sessionId = req.headers['x-session-id'] as string;
  const key = cartKey(userId, sessionId);
  await redis.del(key);
  res.json({ success: true });
});
