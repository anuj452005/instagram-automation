import { users, adminUsers } from '../../../db/schema';
import type { ResolvedAuth } from '../middleware/auth.utils';

declare global {
  namespace Express {
    interface Request {
      /** Populated by auth.middleware for dev/test mock JWTs only */
      mockClerkAuth?: ResolvedAuth;
      user?: typeof users.$inferSelect;
      adminUser?: typeof adminUsers.$inferSelect;
    }
  }
}
