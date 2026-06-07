import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { syncUser } from '../middleware/syncUser.middleware';

const router = Router();

/**
 * GET /api/auth/me
 * Returns the currently authenticated and synced user profile database record.
 */
router.get('/me', authMiddleware, syncUser, (req: Request, res: Response) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'User sync failed or user not authenticated.',
      },
    });
  }

  res.json({
    id: user.id,
    clerkUserId: user.clerkUserId,
    name: user.name,
    email: user.email,
    subscriptionTier: user.subscriptionTier,
    subscriptionStatus: user.subscriptionStatus,
  });
});

export const authRouter = router;
