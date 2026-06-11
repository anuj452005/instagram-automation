import { Request, Response, NextFunction } from 'express';
import { eq, desc } from 'drizzle-orm';
import { db } from '../config/db';
import { googleAccounts, userSettings, youtubeJobs } from '../../../db/schema';
import { encrypt, decrypt } from '../services/encryption.service';
import { GoogleService } from '../services/google.service';
import { ElevenLabsService } from '../services/elevenlabs.service';
import { youtubeQueue } from '../queues/youtube.queue';

/**
 * GET /api/youtube/google-auth/url
 * Returns Google OAuth consent URL.
 */
export const getGoogleAuthUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const url = GoogleService.getAuthUrl();
    res.json({ success: true, url });
  } catch (err: any) {
    next(err);
  }
};

/**
 * POST /api/youtube/google-auth/callback
 * Exchanges authorization code for tokens, retrieves profile details and saves to DB.
 */
export const handleGoogleCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Code is required.' });
    }

    const userId = req.user!.id;
    const tokens = await GoogleService.exchangeCodeForTokens(code);
    const profile = await GoogleService.getProfileDetails(tokens.access_token);

    const encryptedAccess = encrypt(tokens.access_token);
    const encryptedRefresh = tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined;
    const expiry = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000);

    // Save or update the connected Google account
    await db.insert(googleAccounts)
      .values({
        id: profile.id,
        userId,
        email: profile.email,
        displayName: profile.displayName,
        channelIconUrl: profile.channelIconUrl,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh || '',
        tokenExpiry: expiry,
        tokenStatus: 'valid',
        connectedAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [googleAccounts.userId, googleAccounts.id],
        set: {
          email: profile.email,
          displayName: profile.displayName,
          channelIconUrl: profile.channelIconUrl,
          accessToken: encryptedAccess,
          ...(encryptedRefresh ? { refreshToken: encryptedRefresh } : {}),
          tokenExpiry: expiry,
          tokenStatus: 'valid',
          updatedAt: new Date(),
        },
      });

    res.json({ success: true, profile });
  } catch (err: any) {
    console.error('❌ [YouTubeController.handleGoogleCallback] Error:', err);
    next(err);
  }
};

/**
 * GET /api/youtube/google-account
 * Returns details of the currently connected Google account, if any.
 */
export const getGoogleAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const [account] = await db
      .select()
      .from(googleAccounts)
      .where(eq(googleAccounts.userId, userId))
      .limit(1);

    if (!account) {
      return res.json({ success: true, connected: false });
    }

    res.json({
      success: true,
      connected: true,
      account: {
        id: account.id,
        email: account.email,
        displayName: account.displayName,
        channelIconUrl: account.channelIconUrl,
        connectedAt: account.connectedAt,
        tokenStatus: account.tokenStatus,
      },
    });
  } catch (err: any) {
    next(err);
  }
};

/**
 * DELETE /api/youtube/google-account
 * Disconnects the user's Google account.
 */
export const disconnectGoogleAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    await db.delete(googleAccounts).where(eq(googleAccounts.userId, userId));
    res.json({ success: true, message: 'Google account disconnected successfully.' });
  } catch (err: any) {
    next(err);
  }
};

/**
 * GET /api/youtube/drive-videos
 * Lists video files in the connected user's Google Drive.
 */
export const listDriveVideos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const [account] = await db
      .select()
      .from(googleAccounts)
      .where(eq(googleAccounts.userId, userId))
      .limit(1);

    if (!account) {
      return res.status(400).json({ success: false, error: 'Google account not connected.' });
    }

    let accessToken = decrypt(account.accessToken);
    const refreshToken = decrypt(account.refreshToken);

    // Refresh access token if expired
    const now = new Date();
    if (account.tokenExpiry && now.getTime() >= new Date(account.tokenExpiry).getTime() - 5 * 60 * 1000) {
      console.log(`🔄 [YouTubeController.listDriveVideos] Refreshing expired access token...`);
      try {
        const credentials = await GoogleService.refreshAccessToken(refreshToken);
        accessToken = credentials.access_token;
        const expiry = credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : new Date(Date.now() + 3600 * 1000);

        await db
          .update(googleAccounts)
          .set({
            accessToken: encrypt(accessToken),
            tokenExpiry: expiry,
            updatedAt: new Date(),
          })
          .where(eq(googleAccounts.id, account.id));
      } catch (refreshErr) {
        console.error('❌ [YouTubeController.listDriveVideos] Token refresh failed:', refreshErr);
        await db
          .update(googleAccounts)
          .set({ tokenStatus: 'invalid', updatedAt: new Date() })
          .where(eq(googleAccounts.id, account.id));
        return res.status(401).json({ success: false, error: 'Google authentication expired. Please reconnect.' });
      }
    }

    const files = await GoogleService.listDriveVideos(accessToken);
    res.json({ success: true, files });
  } catch (err: any) {
    next(err);
  }
};

/**
 * GET /api/youtube/settings
 * Returns masked ElevenLabs API key and last-updated details.
 */
export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (!settings || !settings.elevenLabsApiKey) {
      return res.json({ success: true, elevenLabsKeyConfigured: false });
    }

    const rawKey = decrypt(settings.elevenLabsApiKey);
    const maskedKey =
      rawKey.length > 8
        ? `${rawKey.substring(0, 3)}••••••••${rawKey.substring(rawKey.length - 4)}`
        : '••••••••';

    const reveal = req.query.reveal === 'true';

    res.json({
      success: true,
      elevenLabsKeyConfigured: true,
      maskedKey: reveal ? rawKey : maskedKey,
      updatedAt: settings.elevenLabsKeyUpdatedAt || settings.updatedAt,
    });
  } catch (err: any) {
    next(err);
  }
};

/**
 * PATCH /api/youtube/settings
 * Updates/encrypts ElevenLabs API key in settings.
 */
export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { elevenLabsApiKey } = req.body;

    if (!elevenLabsApiKey) {
      return res.status(400).json({ success: false, error: 'ElevenLabs API key is required.' });
    }

    // Verify key validity with ElevenLabs API
    try {
      await ElevenLabsService.getVoices(elevenLabsApiKey);
    } catch (verifyErr: any) {
      return res.status(400).json({
        success: false,
        error: `Could not verify key with ElevenLabs: ${verifyErr.message}`,
      });
    }

    const encryptedKey = encrypt(elevenLabsApiKey);

    await db.insert(userSettings)
      .values({
        userId,
        elevenLabsApiKey: encryptedKey,
        elevenLabsKeyUpdatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          elevenLabsApiKey: encryptedKey,
          elevenLabsKeyUpdatedAt: new Date(),
          updatedAt: new Date(),
        },
      });

    res.json({ success: true, message: 'ElevenLabs API key updated and verified successfully.' });
  } catch (err: any) {
    next(err);
  }
};

/**
 * GET /api/youtube/voices
 * Returns available voices from ElevenLabs.
 */
export const getVoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (!settings || !settings.elevenLabsApiKey) {
      return res.status(400).json({ success: false, error: 'ElevenLabs API key not configured.' });
    }

    const apiKey = decrypt(settings.elevenLabsApiKey);
    const voices = await ElevenLabsService.getVoices(apiKey);
    res.json({ success: true, voices });
  } catch (err: any) {
    next(err);
  }
};

/**
 * POST /api/youtube/schedule
 * Enqueues a generation + upload task.
 */
export const scheduleJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const {
      title,
      description,
      scheduledPublishTime,
      googleDriveFileId,
      googleDriveFileName,
      scriptText,
      voiceId,
      voiceName,
      privacyStatus,
    } = req.body;

    if (
      !title ||
      !scheduledPublishTime ||
      !googleDriveFileId ||
      !googleDriveFileName ||
      !scriptText ||
      !voiceId ||
      !voiceName
    ) {
      return res.status(400).json({ success: false, error: 'Missing required parameters for scheduling.' });
    }

    const publishDate = new Date(scheduledPublishTime);
    if (isNaN(publishDate.getTime()) || publishDate.getTime() <= Date.now()) {
      return res.status(400).json({ success: false, error: 'Publish time must be a valid future timestamp.' });
    }

    // Insert job record in database
    const [job] = await db
      .insert(youtubeJobs)
      .values({
        userId,
        title,
        description: description || null,
        status: 'queued',
        scheduledPublishTime: publishDate,
        googleDriveFileId,
        googleDriveFileName,
        scriptText,
        voiceId,
        voiceName,
        privacyStatus: privacyStatus || 'private',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Queue background task with BullMQ
    await youtubeQueue.add('youtube-automation-task', { jobId: job.id });

    res.status(201).json({
      success: true,
      message: 'Short generation and upload scheduled successfully.',
      job,
    });
  } catch (err: any) {
    next(err);
  }
};

/**
 * GET /api/youtube/jobs
 * Lists user's YouTube Shorts generation jobs.
 */
export const getJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const list = await db
      .select()
      .from(youtubeJobs)
      .where(eq(youtubeJobs.userId, userId))
      .orderBy(desc(youtubeJobs.createdAt))
      .limit(50);

    res.json({ success: true, jobs: list });
  } catch (err: any) {
    next(err);
  }
};
