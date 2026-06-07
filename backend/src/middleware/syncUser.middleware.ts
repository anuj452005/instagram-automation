import { Request, Response, NextFunction } from 'express';
import { db } from '../config/db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { clerkClient } from '@clerk/express';

export const syncUser = async (req: Request, res: Response, next: NextFunction) => {
  const auth = req.auth;
  if (!auth || !auth.userId) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication context missing.',
      },
    });
  }

  const clerkUserId = auth.userId;

  try {
    // 1. Check if user already exists in local DB
    const existingUsers = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);

    if (existingUsers.length > 0) {
      req.user = existingUsers[0];
      return next();
    }

    // 2. User doesn't exist, extract claims
    let email = auth.sessionClaims?.email || auth.sessionClaims?.email_address;
    let name = auth.sessionClaims?.name || auth.sessionClaims?.full_name;

    // Optional: Fetch from Clerk API if claims are incomplete and we have a secret key
    if ((!email || !name) && process.env.CLERK_SECRET_KEY) {
      try {
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        email = clerkUser.emailAddresses[0]?.emailAddress;
        name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();
      } catch (err) {
        console.warn(`⚠️ Failed to retrieve profile from Clerk API for ${clerkUserId}:`, err);
      }
    }

    // Fallbacks
    email = email || 'user@example.com';
    name = name || 'GramFlow User';

    // 3. Create user in PostgreSQL
    const [newUser] = await db.insert(users).values({
      clerkUserId,
      name,
      email,
      role: 'user',
      subscriptionTier: 'free',
      subscriptionStatus: 'active',
      monthlyDmCount: 0,
    }).returning();

    req.user = newUser;
    next();
  } catch (error) {
    next(error);
  }
};
