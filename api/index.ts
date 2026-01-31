import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handle } from 'hono/vercel';

import { authMiddleware } from './middleware/auth';
import authRoutes from './routes/auth';
import accountsRoutes from './routes/accounts';
import transactionsRoutes from './routes/transactions';
import tagsRoutes from './routes/tags';
import budgetsRoutes from './routes/budgets';
import goalsRoutes from './routes/goals';
import recurringPaymentsRoutes from './routes/recurring-payments';
import analyticsRoutes from './routes/analytics';

type Variables = {
  userId: string;
};

const app = new Hono<{ Variables: Variables }>().basePath('/api');

// CORS для всех запросов
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Public routes
app.route('/auth', authRoutes);

// Protected routes - применяем middleware
app.use('/accounts/*', authMiddleware);
app.use('/transactions/*', authMiddleware);
app.use('/tags/*', authMiddleware);
app.use('/budgets/*', authMiddleware);
app.use('/goals/*', authMiddleware);
app.use('/recurring-payments/*', authMiddleware);
app.use('/analytics/*', authMiddleware);

// Также защищаем /auth/me
app.use('/auth/me', authMiddleware);

// Mount routes
app.route('/accounts', accountsRoutes);
app.route('/transactions', transactionsRoutes);
app.route('/tags', tagsRoutes);
app.route('/budgets', budgetsRoutes);
app.route('/goals', goalsRoutes);
app.route('/recurring-payments', recurringPaymentsRoutes);
app.route('/analytics', analyticsRoutes);

// 404 handler
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// Error handler
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

// Vercel Edge export
export default handle(app);

export const config = {
  runtime: 'edge',
};
