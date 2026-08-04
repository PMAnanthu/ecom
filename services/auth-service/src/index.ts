import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth-service' }));
app.use('/', authRouter);

app.listen(PORT, () => {
  console.log(`auth-service running on port ${PORT}`);
});

export default app;
