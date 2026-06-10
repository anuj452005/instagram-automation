import { Request } from 'express';
import { getAuth } from '@clerk/express';

export interface ResolvedAuth {
  userId: string;
  sessionClaims?: Record<string, unknown>;
}

/**
 * Clerk Express v2 attaches `req.auth` as a function — call getAuth(req) to read userId.
 * Dev/test mock JWTs set `req.mockClerkAuth` instead (see auth.middleware.ts).
 */
export function resolveRequestAuth(req: Request): ResolvedAuth | null {
  if (req.mockClerkAuth?.userId) {
    return req.mockClerkAuth;
  }

  try {
    const auth = getAuth(req);
    if (auth?.userId) {
      return {
        userId: auth.userId,
        sessionClaims: auth.sessionClaims as Record<string, unknown> | undefined,
      };
    }
  } catch {
    // clerkMiddleware not registered or auth unavailable
  }

  return null;
}
