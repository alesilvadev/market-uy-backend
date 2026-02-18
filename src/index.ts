import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { onRequest } from 'firebase-functions/v2/https';
import { initializeFirebase } from './utils/firebase';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import cashierRoutes from './routes/cashier';
import adminRoutes from './routes/admin';

initializeFirebase();

const app: Express = express();

app.use(cors({ origin: true }));
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cashier', cashierRoutes);
app.use('/api/admin', adminRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { message: 'Not found' },
  });
});

export const api = onRequest(app);
