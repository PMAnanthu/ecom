import express from 'express';
import cors from 'cors';
import path from 'path';
import { storeRouter } from './routes/store';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'store-service' }));
app.use('/', storeRouter);

app.listen(PORT, () => {
  console.log(`store-service running on port ${PORT}`);
});

export default app;
