import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { cartRouter } from './routes/cart';
import { orderRouter } from './routes/order';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'order-service' }));

app.get('/stats', async (_req, res) => {
  const [total, revenue] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true } }),
  ]);
  res.json({ total, revenue: revenue._sum.total ?? 0 });
});

app.use('/cart', cartRouter);
app.use('/orders', orderRouter);

app.listen(PORT, () => {
  console.log(`order-service running on port ${PORT}`);
});

export default app;
