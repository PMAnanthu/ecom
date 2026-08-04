import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const resolveRouter = Router();

// Resolves a domain or subdomain to store config — called by storefront Next.js app
resolveRouter.get('/resolve', async (req: Request, res: Response) => {
  const { domain } = req.query as { domain: string };
  if (!domain) { res.status(400).json({ error: 'domain query param required' }); return; }

  // Try custom domain first, then subdomain (strip .ecom.app suffix)
  const subdomain = domain.replace(/\.ecom\.app$/, '');
  const store = await prisma.store.findFirst({
    where: {
      published: true,
      OR: [{ domain }, { subdomain }],
    },
  });

  if (!store) { res.status(404).json({ error: 'Store not found or not published' }); return; }

  res.json({ store });
});
