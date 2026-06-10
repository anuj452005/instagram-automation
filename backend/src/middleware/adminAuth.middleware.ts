import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { db } from '../config/db';
import { adminUsers } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { env } from '../config/env';

const JWT_SECRET = env.JWT_SECRET;

export const adminAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // 1. Check if user is a Clerk user synced with "admin" role
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  // 2. Check for local admin token
  let token: string | undefined;

  // Check X-Admin-Token header
  if (req.headers['x-admin-token']) {
    token = req.headers['x-admin-token'] as string;
  }
  // Check Authorization header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check cookies (cookie-parser needs to be configured in app.ts)
  else if (req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Administrative privileges required.',
      },
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

    if (!decoded.adminId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Invalid administrative security token.',
        },
      });
    }

    // Look up admin user in db
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, decoded.adminId))
      .limit(1);

    if (!admin || !admin.isActive) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Administrative account is inactive or does not exist.',
        },
      });
    }

    // Populate adminUser on request context
    req.adminUser = admin;
    return next();
  } catch (err) {
    console.warn('⚠️ Admin Auth verification failed:', err);
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Session expired or invalid token.',
      },
    });
  }
};
