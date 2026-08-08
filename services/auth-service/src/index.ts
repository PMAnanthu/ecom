import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth';
import { addressRouter } from './routes/address';
import { adminMgmtRouter } from './routes/admin-mgmt';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth-service' }));

// Internal service-to-service: fetch user info by id
app.get('/users/:id', async (req, res) => {
  const { prisma } = await import('./lib/prisma');
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, email: true, role: true },
  });
  if (!user) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ user });
});

app.use('/', authRouter);
app.use('/addresses', addressRouter);
app.use('/user/addresses', addressRouter);
app.use('/admin-mgmt', adminMgmtRouter);

app.listen(PORT, () => {
  console.log(`auth-service running on port ${PORT}`);
});

export default app;
