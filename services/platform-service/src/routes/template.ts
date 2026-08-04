import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const templateRouter = Router();

// Public — used by both admin picker and storefront
templateRouter.get('/', async (_req: Request, res: Response) => {
  const templates = await prisma.storeTemplate.findMany({ orderBy: { name: 'asc' } });
  res.json({ templates });
});

// Super-admin: toggle enabled/disabled
templateRouter.patch('/:id', async (req: Request, res: Response) => {
  const { enabled } = req.body;
  const template = await prisma.storeTemplate.update({
    where: { id: req.params.id },
    data: { enabled: Boolean(enabled) },
  });
  res.json({ template });
});
