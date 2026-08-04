import express from 'express';
import cors from 'cors';
import path from 'path';
import { productRouter } from './routes/product';
import { categoryRouter } from './routes/category';

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'catalog-service' }));
app.use('/products', productRouter);
app.use('/categories', categoryRouter);

app.listen(PORT, () => {
  console.log(`catalog-service running on port ${PORT}`);
});

export default app;
