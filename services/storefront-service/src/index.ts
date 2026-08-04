import express from 'express';
import cors from 'cors';
import { resolveRouter } from './routes/resolve';

const app = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'storefront-service' }));
app.use('/', resolveRouter);

app.listen(PORT, () => {
  console.log(`storefront-service running on port ${PORT}`);
});

export default app;
