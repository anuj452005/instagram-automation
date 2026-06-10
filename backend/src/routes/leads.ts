import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { syncUser } from '../middleware/syncUser.middleware';
import { LeadsController } from '../controllers/leads.controller';

const router = Router();

router.get('/', authMiddleware, syncUser, LeadsController.getLeads);
router.get('/export', authMiddleware, syncUser, LeadsController.exportLeads);

export const leadsRouter = router;
