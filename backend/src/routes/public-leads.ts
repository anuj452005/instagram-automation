import { Router } from 'express';
import { PublicLeadsController } from '../controllers/public-leads.controller';

export const publicRouter = Router();

publicRouter.get('/api/public/campaigns/:token', PublicLeadsController.getCampaign);
publicRouter.post('/api/public/leads/submit', PublicLeadsController.submitLead);
