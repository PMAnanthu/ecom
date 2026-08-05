import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export const adminMgmtRouter = Router();

// Create admin user with password + optional store info (super-admin only)
adminMgmtRouter.post('/', async (req: Request, res: Response) => {
  const parsed = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    storeName: z.string().min(1).optional(),
    subdomain: z.string().min(3).regex(/^[a-z0-9-]+$/).optional(),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) { res.status(409).json({ error: 'Email already in use' }); return; }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: { email: parsed.data.email, passwordHash, role: 'ADMIN' },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  // If store details provided, create store via store-service URL stored in env
  let store = null;
  if (parsed.data.storeName && parsed.data.subdomain) {
    try {
      const storeServiceUrl = process.env.STORE_SERVICE_URL || 'http://store-service:3003';
      const { signAccessToken } = await import('../lib/jwt');
      const token = signAccessToken({ userId: user.id, email: user.email, role: 'ADMIN', storeId: null });
      const storeRes = await fetch(`${storeServiceUrl}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-user-id': user.id, 'x-user-role': 'ADMIN' },
        body: JSON.stringify({ name: parsed.data.storeName, subdomain: parsed.data.subdomain }),
      });
      if (storeRes.ok) store = ((await storeRes.json()) as { store: unknown }).store;
    } catch { /* store creation is best-effort */ }
  }

  res.status(201).json({ user, store });
});

// List all admin users
adminMgmtRouter.get('/', async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ users });
});

// Change any user's password (super-admin)
adminMgmtRouter.patch('/:id/password', async (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password || password.length < 6) { res.status(400).json({ error: 'Password must be at least 6 characters' }); return; }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash } });
  res.json({ success: true });
});

// Delete admin user
adminMgmtRouter.delete('/:id', async (req: Request, res: Response) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// Change own password (any authenticated user)
adminMgmtRouter.post('/change-password', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) { res.status(400).json({ error: 'New password too short' }); return; }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }

  if (currentPassword) {
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) { res.status(401).json({ error: 'Current password incorrect' }); return; }
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  res.json({ success: true });
});
