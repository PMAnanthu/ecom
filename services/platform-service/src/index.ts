import express from 'express';
import cors from 'cors';
import { adminRouter } from './routes/admin';
import { subscriptionRouter } from './routes/subscription';
import { analyticsRouter } from './routes/analytics';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'platform-service' }));
app.use('/admins', adminRouter);
app.use('/subscriptions', subscriptionRouter);
app.use('/analytics', analyticsRouter);

app.listen(PORT, () => {
  console.log(`platform-service running on port ${PORT}`);
});

export default app;
