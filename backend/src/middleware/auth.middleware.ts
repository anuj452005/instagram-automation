import { Request, Response, NextFunction } from 'express';
import { clerkMiddleware } from '@clerk/express';
import * as jwt from 'jsonwebtoken';

// Copy Vite prefix key to standard Clerk environment variable if missing
if (process.env.VITE_CLERK_PUBLISHABLE_KEY && !process.env.CLERK_PUBLISHABLE_KEY) {
  process.env.CLERK_PUBLISHABLE_KEY = process.env.VITE_CLERK_PUBLISHABLE_KEY;
}

let clerkMiddlewareInstance: any = null;

if (process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY) {
  try {
    clerkMiddlewareInstance = clerkMiddleware();
  } catch (error) {
    console.warn('⚠️ Failed to initialize Clerk middleware:', error);
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // 1. In dev/test, attempt to verify using local secret first (for integration tests)
  if (process.env.NODE_ENV !== 'production' && authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
      
      // Inject auth info mirroring Clerk's shape
      req.auth = {
        userId: decoded.sub || decoded.userId || 'dev_user',
        sessionClaims: decoded,
      };
      
      return next();
    } catch (err) {
      // Token is not a valid local mock token; fall through to Clerk verification
    }
  }

  // 2. Fall back to standard Clerk verification
  if (clerkMiddlewareInstance) {
    return clerkMiddlewareInstance(req, res, (err?: any) => {
      if (err) return next(err);
      
      const auth = req.auth;
      if (!auth || !auth.userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Unauthenticated request.',
          },
        });
      }
      next();
    });
  }

  // 3. Unauthenticated if no token matched and Clerk is not configured
  return res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Unauthenticated request.',
    },
  });
};
