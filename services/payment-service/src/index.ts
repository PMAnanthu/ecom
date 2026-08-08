import express from 'express';
import cors from 'cors';
import { platformConfigRouter } from './routes/platformConfig';
import { storeConfigRouter } from './routes/storeConfig';
import { ordersRouter } from './routes/orders';
import { subscriptionsRouter } from './routes/subscriptions';

const app = express();
const PORT = process.env.PORT || 3008;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'payment-service' }));
app.use('/platform-config', platformConfigRouter);
app.use('/store-config', storeConfigRouter);
app.use('/orders', ordersRouter);
app.use('/subscriptions', subscriptionsRouter);

app.listen(PORT, () => console.log(`payment-service running on port ${PORT}`));

export default app;
