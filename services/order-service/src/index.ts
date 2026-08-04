import express from 'express';
import cors from 'cors';
import { cartRouter } from './routes/cart';
import { orderRouter } from './routes/order';

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'order-service' }));
app.use('/cart', cartRouter);
app.use('/orders', orderRouter);

app.listen(PORT, () => {
  console.log(`order-service running on port ${PORT}`);
});

export default app;
