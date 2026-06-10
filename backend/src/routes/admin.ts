import { Router } from 'express';
import { adminLogin, getAdminStats, getAdminLogs, retryQueueJob } from '../controllers/admin.controller';
import { adminAuthMiddleware } from '../middleware/adminAuth.middleware';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { commentQueue } from '../queues/comment.queue';
import { dmQueue } from '../queues/dm.queue';
import { leadQueue } from '../queues/lead.queue';
import { analyticsQueue } from '../queues/analytics.queue';
import { schedulerQueue } from '../queues/scheduler.queue';
import { authMiddleware } from '../middleware/auth.middleware';
import { syncUser } from '../middleware/syncUser.middleware';

export const adminRouter = Router();

// Helper middleware to bind Clerk user details if Clerk token is present, but continue if not
export const optionalClerkSync = (req: any, res: any, next: any) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') && !req.headers.authorization.includes('dev_admin')) {
    return authMiddleware(req, res, () => syncUser(req, res, next));
  }
  next();
};

// 1. API admin login
adminRouter.post('/login', adminLogin);

// 2. Protected JSON API endpoints
adminRouter.get('/stats', optionalClerkSync, adminAuthMiddleware, getAdminStats);
adminRouter.get('/logs', optionalClerkSync, adminAuthMiddleware, getAdminLogs);
adminRouter.post('/queues/retry', optionalClerkSync, adminAuthMiddleware, retryQueueJob);

// 3. Setup Bull Board Express Adapter
export const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(commentQueue),
    new BullMQAdapter(dmQueue),
    new BullMQAdapter(leadQueue),
    new BullMQAdapter(analyticsQueue),
    new BullMQAdapter(schedulerQueue),
  ],
  serverAdapter,
});
