import express from 'express';
import cors from 'cors';
import { notifyRouter } from './routes/notify';
import { configRouter } from './routes/config';
import { logsRouter } from './routes/logs';

const app = express();
const PORT = process.env.PORT || 3007;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'notification-service' }));
app.use('/notify', notifyRouter);
app.use('/config', configRouter);
app.use('/logs', logsRouter);

app.listen(PORT, () => console.log(`notification-service running on port ${PORT}`));

export default app;
