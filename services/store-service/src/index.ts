import express from 'express';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { storeRouter } from './routes/store';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'store-service' }));

app.get('/stats', async (_req, res) => {
  const [total, published] = await Promise.all([
    prisma.store.count(),
    prisma.store.count({ where: { published: true } }),
  ]);
  res.json({ total, published, unpublished: total - published });
});

app.use('/', storeRouter);

app.listen(PORT, () => {
  console.log(`store-service running on port ${PORT}`);
});

export default app;
