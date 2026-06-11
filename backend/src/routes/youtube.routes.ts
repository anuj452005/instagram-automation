import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { syncUser } from '../middleware/syncUser.middleware';
import {
  getGoogleAuthUrl,
  handleGoogleCallback,
  getGoogleAccount,
  disconnectGoogleAccount,
  listDriveVideos,
  getSettings,
  updateSettings,
  getVoices,
  scheduleJob,
  getJobs,
} from '../controllers/youtube.controller';

const router = Router();

// Secure all endpoints with Clerk authentication & database synchronization
router.use(authMiddleware);
router.use(syncUser);

// Google OAuth
router.get('/google-auth/url', getGoogleAuthUrl);
router.post('/google-auth/callback', handleGoogleCallback);
router.get('/google-account', getGoogleAccount);
router.delete('/google-account', disconnectGoogleAccount);

// Google Drive Resources
router.get('/drive-videos', listDriveVideos);

// ElevenLabs Settings & Voices
router.get('/settings', getSettings);
router.patch('/settings', updateSettings);
router.get('/voices', getVoices);

// Shorts Automation Job Scheduling
router.post('/schedule', scheduleJob);
router.get('/jobs', getJobs);

export const youtubeRouter = router;
