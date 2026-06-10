import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/express';
import { env } from '../config/env';
import { MetaService } from '../services/meta.service';
import { encrypt } from '../services/encryption.service';
import { db } from '../config/db';
import { instagramAccounts } from '../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/accounts/linkable
 * Retrieves a list of Instagram Creator/Business accounts connected to the user's Facebook account.
 */
export const getLinkableAccounts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User session not synchronized.',
        },
      });
      return;
    }

    let fbUserAccessToken = 'mock_user_access_token';

    if (!env.MOCK_META_API) {
      try {
        const oauthTokens = await clerkClient.users.getUserOauthAccessToken(user.clerkUserId, 'oauth_facebook');
        const token = oauthTokens.data?.[0]?.token;
        if (!token) {
          res.status(400).json({
            success: false,
            error: {
              code: 'FACEBOOK_NOT_CONNECTED',
              message: 'Please connect your Facebook account in your profile settings first.',
            },
          });
          return;
        }
        fbUserAccessToken = token;
      } catch (err: any) {
        console.error('❌ Failed to fetch Facebook OAuth token from Clerk:', err);
        res.status(400).json({
          success: false,
          error: {
            code: 'CLERK_OAUTH_ERROR',
            message: 'Failed to retrieve Facebook credentials from authentication provider.',
          },
        });
        return;
      }
    }

    const linkable = await MetaService.getLinkableAccounts(fbUserAccessToken);

    // Format output mapping, explicitly excluding the raw page access token
    const clientPayload = linkable.map((account) => ({
      instagramAccountId: account.instagramAccountId,
      username: account.username,
      name: account.name,
      profilePictureUrl: account.profilePictureUrl,
      fbPageId: account.fbPageId,
    }));

    res.status(200).json(clientPayload);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/accounts/activate
 * Securely exchanges and encrypts the long-lived Facebook Page Access Token for an Instagram account.
 */
export const activateAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User session not synchronized.',
        },
      });
      return;
    }

    const { instagramAccountId, fbPageId } = req.body;

    let fbUserAccessToken = 'mock_user_access_token';

    if (!env.MOCK_META_API) {
      const oauthTokens = await clerkClient.users.getUserOauthAccessToken(user.clerkUserId, 'oauth_facebook');
      const token = oauthTokens.data?.[0]?.token;
      if (!token) {
        res.status(400).json({
          success: false,
          error: {
            code: 'FACEBOOK_NOT_CONNECTED',
            message: 'Facebook account connection not found or expired.',
          },
        });
        return;
      }
      fbUserAccessToken = token;
    }

    // Retrieve Meta accounts to verify matching IDs and fetch the corresponding Page Access Token
    const linkable = await MetaService.getLinkableAccounts(fbUserAccessToken);
    const targetAccount = linkable.find(
      (acc) => acc.instagramAccountId === instagramAccountId && acc.fbPageId === fbPageId
    );

    if (!targetAccount) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ACCOUNT_NOT_FOUND',
          message: 'The requested Instagram account could not be found under your Facebook managed pages.',
        },
      });
      return;
    }

    // Encrypt Page Access Token
    const encryptedToken = encrypt(targetAccount.fbPageAccessToken);

    const now = new Date();
    const existingAccounts = await db
      .select()
      .from(instagramAccounts)
      .where(eq(instagramAccounts.id, instagramAccountId))
      .limit(1);

    let dbAccount;

    if (existingAccounts.length > 0) {
      // Tenant isolation validation
      if (existingAccounts[0].userId !== user.id) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'This Instagram account is linked to another user.',
          },
        });
        return;
      }

      // Update existing
      const [updated] = await db
        .update(instagramAccounts)
        .set({
          name: targetAccount.name,
          username: targetAccount.username,
          profilePictureUrl: targetAccount.profilePictureUrl,
          fbPageId: targetAccount.fbPageId,
          fbPageAccessToken: encryptedToken,
          isActive: true,
          tokenStatus: 'valid',
          lastTokenRefresh: now,
          updatedAt: now,
        })
        .where(eq(instagramAccounts.id, instagramAccountId))
        .returning();

      dbAccount = updated;
    } else {
      // Insert new
      const [inserted] = await db
        .insert(instagramAccounts)
        .values({
          id: instagramAccountId,
          userId: user.id,
          username: targetAccount.username,
          name: targetAccount.name,
          profilePictureUrl: targetAccount.profilePictureUrl,
          fbPageId: targetAccount.fbPageId,
          fbPageAccessToken: encryptedToken,
          isActive: true,
          tokenStatus: 'valid',
          lastTokenRefresh: now,
        })
        .returning();

      dbAccount = inserted;
    }

    res.status(200).json({
      id: dbAccount.id,
      username: dbAccount.username,
      isActive: dbAccount.isActive,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/accounts
 * Retrieves all connected Instagram accounts for the authenticated user.
 */
export const getConnectedAccounts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User session not synchronized.',
        },
      });
      return;
    }

    const accounts = await db
      .select({
        id: instagramAccounts.id,
        username: instagramAccounts.username,
        name: instagramAccounts.name,
        profilePictureUrl: instagramAccounts.profilePictureUrl,
        isActive: instagramAccounts.isActive,
        followersCount: instagramAccounts.followersCount,
        connectedAt: instagramAccounts.connectedAt,
      })
      .from(instagramAccounts)
      .where(eq(instagramAccounts.userId, user.id));

    res.status(200).json(accounts);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/accounts/deactivate
 * Deactivates an Instagram account connection (sets isActive to false).
 */
export const deactivateAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User session not synchronized.',
        },
      });
      return;
    }

    const { instagramAccountId } = req.body;

    const existingAccounts = await db
      .select()
      .from(instagramAccounts)
      .where(eq(instagramAccounts.id, instagramAccountId))
      .limit(1);

    if (existingAccounts.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Instagram account connection not found.',
        },
      });
      return;
    }

    if (existingAccounts[0].userId !== user.id) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'This Instagram account is linked to another user.',
        },
      });
      return;
    }

    const [updated] = await db
      .update(instagramAccounts)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(instagramAccounts.id, instagramAccountId))
      .returning();

    res.status(200).json({
      id: updated.id,
      username: updated.username,
      isActive: updated.isActive,
    });
  } catch (error) {
    next(error);
  }
};
