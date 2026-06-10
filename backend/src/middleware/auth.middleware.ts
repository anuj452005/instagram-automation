import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { resolveRequestAuth } from './auth.utils';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // Dev/test: verify local mock JWT (integration tests in verify-auth.ts)
  if (process.env.NODE_ENV !== 'production' && authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as jwt.JwtPayload;

      req.mockClerkAuth = {
        userId: (decoded.sub || decoded.userId || 'dev_user') as string,
        sessionClaims: decoded as Record<string, unknown>,
      };

      return next();
    } catch {
      // Not a mock token — fall through to Clerk verification
    }
  }

  const auth = resolveRequestAuth(req);

  if (auth?.userId) {
    return next();
  }

  console.warn('⚠️ Clerk Auth Verification Failed: No userId found for request.');
  return res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Unauthenticated request.',
    },
  });
};
