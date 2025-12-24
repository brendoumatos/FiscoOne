import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiting: 100 requests per 15 mins per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: 'Muitas requisições. Tente novamente em 15 minutos.' }
});
app.use(limiter);

// Basic Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
import authRoutes from './routes/auth';
import companyRoutes from './routes/companies';
import invoiceRoutes from './routes/invoices';
import scoreRoutes from './routes/score';
import readinessRouter from './routes/readiness';
import marketplaceRouter from './routes/marketplace';
import timelineRouter from './routes/timeline';
import accountantRouter from './routes/accountant'; // check filename: accountant.ts
import subscriptionRouter from './routes/subscription'; // check filename: subscription.ts

app.use('/auth', authRoutes);
app.use('/companies', companyRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/score', scoreRoutes);
app.use('/readiness', readinessRouter);
app.use('/marketplace', marketplaceRouter);
app.use('/timeline', timelineRouter);
app.use('/accountants', accountantRouter);
app.use('/subscriptions', subscriptionRouter);


export default app;
