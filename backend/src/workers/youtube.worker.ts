import { Worker, Job } from 'bullmq';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { createRedisClient } from '../queues/connection';
import { db } from '../config/db';
import { youtubeJobs, userSettings, googleAccounts } from '../../../db/schema';
import { decrypt, encrypt } from '../services/encryption.service';
import { ElevenLabsService } from '../services/elevenlabs.service';
import { GoogleService } from '../services/google.service';
import { VideoProcessorService } from '../services/video-processor.service';

const connection = createRedisClient();

export const youtubeWorker = new Worker(
  'youtube-jobs',
  async (job: Job) => {
    const { jobId } = job.data;
    console.log(`🤖 [YouTube Worker] Processing job ${job.id} (youtube_jobs.id = ${jobId})`);

    // Fetch the job record from database
    const [jobRecord] = await db
      .select()
      .from(youtubeJobs)
      .where(eq(youtubeJobs.id, jobId))
      .limit(1);

    if (!jobRecord) {
      throw new Error(`Job with ID ${jobId} not found in the database.`);
    }

    let audioPath: string | null = null;
    let videoPath: string | null = null;
    let outputPath: string | null = null;

    try {
      // 1. GENERATING AUDIO
      console.log(`🎙️ [YouTube Worker] Step 1: Generating voiceover audio`);
      await db
        .update(youtubeJobs)
        .set({ status: 'generating_audio', updatedAt: new Date() })
        .where(eq(youtubeJobs.id, jobId));

      const [settings] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, jobRecord.userId))
        .limit(1);

      if (!settings || !settings.elevenLabsApiKey) {
        throw new Error('ElevenLabs API Key is not configured. Please add your key in Settings.');
      }

      const elevenLabsKey = decrypt(settings.elevenLabsApiKey);
      audioPath = await ElevenLabsService.generateSpeech(
        elevenLabsKey,
        jobRecord.voiceId,
        jobRecord.scriptText
      );

      // 2. DOWNLOADING DRIVE VIDEO & MERGING
      console.log(`🎬 [YouTube Worker] Step 2: Downloading Drive video & merging media`);
      await db
        .update(youtubeJobs)
        .set({ status: 'merging', updatedAt: new Date() })
        .where(eq(youtubeJobs.id, jobId));

      const [googleAccount] = await db
        .select()
        .from(googleAccounts)
        .where(eq(googleAccounts.userId, jobRecord.userId))
        .limit(1);

      if (!googleAccount) {
        throw new Error('Google/YouTube account is not connected. Please connect your account first.');
      }

      let googleAccessToken = decrypt(googleAccount.accessToken);
      const googleRefreshToken = decrypt(googleAccount.refreshToken);

      // Verify and refresh Google OAuth token if necessary
      const now = new Date();
      const needsRefresh =
        !googleAccount.tokenExpiry ||
        now.getTime() >= new Date(googleAccount.tokenExpiry).getTime() - 5 * 60 * 1000;

      if (needsRefresh) {
        console.log(`🔄 [YouTube Worker] Google access token expired or expiring soon. Refreshing...`);
        try {
          const credentials = await GoogleService.refreshAccessToken(googleRefreshToken);
          googleAccessToken = credentials.access_token;
          const newExpiry = credentials.expiry_date
            ? new Date(credentials.expiry_date)
            : new Date(Date.now() + 3600 * 1000);

          await db
            .update(googleAccounts)
            .set({
              accessToken: encrypt(googleAccessToken),
              tokenExpiry: newExpiry,
              tokenStatus: 'valid',
              updatedAt: new Date(),
            })
            .where(eq(googleAccounts.id, googleAccount.id));
        } catch (refreshErr: any) {
          console.error('❌ [YouTube Worker] Failed to refresh Google access token:', refreshErr);
          await db
            .update(googleAccounts)
            .set({ tokenStatus: 'invalid', updatedAt: new Date() })
            .where(eq(googleAccounts.id, googleAccount.id));
          throw new Error(`Google connection expired and could not be refreshed. Please reconnect your account.`);
        }
      }

      // Download the Google Drive background video
      const tempDir = path.join(os.tmpdir(), 'gramflow-youtube');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      videoPath = path.join(tempDir, `video-${Date.now()}-${crypto.randomUUID()}.mp4`);
      console.log(`📥 [YouTube Worker] Downloading Drive video file: ${jobRecord.googleDriveFileName}`);
      await GoogleService.downloadDriveFile(googleAccessToken, jobRecord.googleDriveFileId, videoPath);

      // Perform FFmpeg cropping/merging
      outputPath = path.join(tempDir, `output-${Date.now()}-${crypto.randomUUID()}.mp4`);
      await VideoProcessorService.mergeAudioVideo(videoPath, audioPath, outputPath);

      // 3. UPLOADING TO YOUTUBE
      console.log(`📤 [YouTube Worker] Step 3: Uploading Short to YouTube`);
      await db
        .update(youtubeJobs)
        .set({ status: 'uploading', updatedAt: new Date() })
        .where(eq(youtubeJobs.id, jobId));

      const uploadResult = await GoogleService.uploadToYouTube(googleAccessToken, outputPath, {
        title: jobRecord.title,
        description: jobRecord.description || undefined,
        privacyStatus: jobRecord.privacyStatus as any,
        scheduledPublishTime: jobRecord.scheduledPublishTime,
      });

      // 4. FINALIZE SUCCESS
      console.log(`🎉 [YouTube Worker] Job completed successfully!`);
      await db
        .update(youtubeJobs)
        .set({
          status: 'scheduled',
          youtubeVideoId: uploadResult.videoId,
          youtubeVideoUrl: uploadResult.videoUrl,
          updatedAt: new Date(),
        })
        .where(eq(youtubeJobs.id, jobId));

    } catch (err: any) {
      console.error(`❌ [YouTube Worker] Job execution failed:`, err);

      await db
        .update(youtubeJobs)
        .set({
          status: 'failed',
          errorMessage: err.message || 'An unknown error occurred during job processing.',
          updatedAt: new Date(),
        })
        .where(eq(youtubeJobs.id, jobId));

      throw err;
    } finally {
      // Ensure all temp files are deleted
      console.log(`🧹 [YouTube Worker] Cleaning up temporary files`);
      const filesToClean = [audioPath, videoPath, outputPath];
      for (const file of filesToClean) {
        if (file && fs.existsSync(file)) {
          try {
            fs.unlinkSync(file);
            console.log(`🗑️ Deleted temp file: ${file}`);
          } catch (unlinkErr) {
            console.warn(`⚠️ Failed to delete temp file ${file}:`, unlinkErr);
          }
        }
      }
    }
  },
  {
    connection: connection as any,
    concurrency: 2, // process up to 2 video renders in parallel
  }
);

youtubeWorker.on('completed', (job) => {
  console.log(`🎉 [YouTube Worker] BullMQ job ${job.id} finished successfully`);
});

youtubeWorker.on('failed', (job, err) => {
  console.error(`⚠️ [YouTube Worker] BullMQ job ${job?.id} failed:`, err);
});
