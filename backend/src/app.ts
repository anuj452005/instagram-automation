import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { clerkMiddleware } from '@clerk/express';
import { env } from './config/env';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { accountsRouter } from './routes/accounts';
import { automationsRouter } from './routes/automations';
import { webhooksRouter } from './routes/webhooks';
import { publicRouter } from './routes/public-leads';
import { leadsRouter } from './routes/leads';
import { analyticsRouter } from './routes/analytics';
import { adminRouter, serverAdapter, optionalClerkSync } from './routes/admin';
import { adminAuthMiddleware } from './middleware/adminAuth.middleware';
import { errorHandler } from './middleware/error.middleware';

const app = express();

// Clerk must run early so Bearer tokens from the SPA are verified via getAuth(req)
app.use(clerkMiddleware({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  authorizedParties: [env.FRONTEND_URL],
}));

app.use(cors({
  origin: env.FRONTEND_URL,
}));

app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(cookieParser());

// Request Logger for debugging auth synchronization
app.use((req, res, next) => {
  console.log(`\n🔍 [HTTP Request] ${req.method} ${req.originalUrl}`);
  console.log(`   Headers authorization: ${req.headers.authorization ? 'Present (' + req.headers.authorization.substring(0, 30) + '...)' : 'Missing'}`);
  next();
});

// Routes
app.use(healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/automations', automationsRouter);
app.use('/api/webhooks', webhooksRouter);
app.use(publicRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/admin', adminRouter);
app.use('/admin/queues', optionalClerkSync, adminAuthMiddleware, serverAdapter.getRouter());

// Global Error Handler
app.use(errorHandler);

export default app;
