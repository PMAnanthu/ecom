import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const logsRouter = Router();

logsRouter.get('/', async (req: Request, res: Response) => {
  const role = req.headers['x-user-role'] as string;
  const storeId = req.query.storeId as string | undefined;

  if (role !== 'SUPERADMIN' && role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden' }); return;
  }

  // ADMIN can only see their own store's logs
  const filterStoreId = role === 'ADMIN' ? (req.headers['x-store-id'] as string) : storeId;

  const logs = await prisma.notificationLog.findMany({
    where: filterStoreId ? { storeId: filterStoreId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({ logs });
});
