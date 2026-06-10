import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { syncUser } from '../middleware/syncUser.middleware';
import { getAnalyticsOverview, getAnalyticsTimeSeries, getAnalyticsCampaigns } from '../controllers/analytics.controller';

export const analyticsRouter = Router();

analyticsRouter.use(authMiddleware);
analyticsRouter.use(syncUser);

analyticsRouter.get('/overview', getAnalyticsOverview);
analyticsRouter.get('/time-series', getAnalyticsTimeSeries);
analyticsRouter.get('/campaigns', getAnalyticsCampaigns);
