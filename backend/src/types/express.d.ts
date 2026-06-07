import { users } from '../../../db/schema';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionClaims: any;
      };
      user?: typeof users.$inferSelect;
    }
  }
}
