import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { syncUser } from '../middleware/syncUser.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { getLinkableAccounts, activateAccount, getConnectedAccounts, deactivateAccount } from '../controllers/accounts.controller';
import { z } from 'zod';

const router = Router();

// Schema to validate POST /api/accounts/activate payload
const activateSchema = z.object({
  body: z.object({
    instagramAccountId: z.string().min(1, 'instagramAccountId is required'),
    fbPageId: z.string().min(1, 'fbPageId is required'),
  }),
});

// Schema to validate POST /api/accounts/deactivate payload
const deactivateSchema = z.object({
  body: z.object({
    instagramAccountId: z.string().min(1, 'instagramAccountId is required'),
  }),
});

router.get('/', authMiddleware, syncUser, getConnectedAccounts);
router.get('/linkable', authMiddleware, syncUser, getLinkableAccounts);
router.post('/activate', authMiddleware, syncUser, validateRequest(activateSchema), activateAccount);
router.post('/deactivate', authMiddleware, syncUser, validateRequest(deactivateSchema), deactivateAccount);

export const accountsRouter = router;
