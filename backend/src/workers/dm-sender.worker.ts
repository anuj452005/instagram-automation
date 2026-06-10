import { Worker, Job } from 'bullmq';
import { createRedisClient } from '../queues/connection';
import { db } from '../config/db';
import { dmJobs, automations, instagramAccounts } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from '../services/encryption.service';
import { MetaService } from '../services/meta.service';
import { AnalyticsService } from '../services/analytics.service';

const connection = createRedisClient();

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const dmSenderWorker = new Worker(
  'dm-sender',
  async (job: Job) => {
    const { dmJobId } = job.data;
    console.log(`✉️ [DM-Sender Worker] Processing job ${job.id} for DM Job ID: ${dmJobId}`);

    let dmJobRecord: any = null;

    try {
      console.log(`✉️ [DM-Sender Worker] Step 1: Fetching DM Job details...`);
      const [dmJob] = await db
        .select()
        .from(dmJobs)
        .where(eq(dmJobs.id, dmJobId))
        .limit(1);

      if (!dmJob) {
        console.warn(`⚠️ [DM-Sender Worker] DM Job record ${dmJobId} not found in database. Skipping.`);
        return;
      }
      dmJobRecord = dmJob;
      console.log(`✉️ [DM-Sender Worker] Step 1 complete. Found DM Job.`);

      console.log(`✉️ [DM-Sender Worker] Step 2: Incrementing attempts...`);
      await db
        .update(dmJobs)
        .set({
          attempts: dmJob.attempts + 1,
          bullmqJobId: job.id,
        })
        .where(eq(dmJobs.id, dmJobId));
      console.log(`✉️ [DM-Sender Worker] Step 2 complete.`);

      console.log(`✉️ [DM-Sender Worker] Step 3: Fetching Automation settings...`);
      const [automation] = await db
        .select()
        .from(automations)
        .where(eq(automations.id, dmJob.automationId))
        .limit(1);

      if (!automation) {
        throw new Error(`Automation not found (ID: ${dmJob.automationId})`);
      }
      console.log(`✉️ [DM-Sender Worker] Step 3 complete.`);

      console.log(`✉️ [DM-Sender Worker] Step 4: Fetching Instagram Account settings...`);
      const [instagramAccount] = await db
        .select()
        .from(instagramAccounts)
        .where(eq(instagramAccounts.id, dmJob.instagramAccountId))
        .limit(1);

      if (!instagramAccount) {
        throw new Error(`Instagram account not found (ID: ${dmJob.instagramAccountId})`);
      }
      console.log(`✉️ [DM-Sender Worker] Step 4 complete.`);

      console.log(`✉️ [DM-Sender Worker] Step 5: Decrypting token...`);
      const decryptedToken = decrypt(instagramAccount.fbPageAccessToken);
      console.log(`✉️ [DM-Sender Worker] Step 5 complete.`);

      const jitter = Math.floor(Math.random() * 1000);
      console.log(`⏳ [DM-Sender Worker] Step 6: Applying ${jitter}ms jitter...`);
      await sleep(jitter);
      console.log(`⏳ [DM-Sender Worker] Step 6 complete.`);

      console.log(`🚀 [DM-Sender Worker] Step 7: Sending DM to recipient ${dmJob.recipientIgId}...`);
      await MetaService.sendDM(decryptedToken, dmJob.recipientIgId, dmJob.messageText || '');
      console.log(`🚀 [DM-Sender Worker] Step 7 complete.`);

      if (
        automation.alsoReplyComment &&
        dmJob.commentId &&
        automation.commentReplyText
      ) {
        console.log(`💬 [DM-Sender Worker] Step 8: Replying to comment ${dmJob.commentId}...`);
        await MetaService.replyToComment(
          decryptedToken,
          dmJob.commentId,
          automation.commentReplyText
        );
        console.log(`💬 [DM-Sender Worker] Step 8 complete.`);
      }

      console.log(`✉️ [DM-Sender Worker] Step 9: Updating status to sent...`);
      await db
        .update(dmJobs)
        .set({
          status: 'sent',
          sentAt: new Date(),
        })
        .where(eq(dmJobs.id, dmJobId));
      console.log(`✉️ [DM-Sender Worker] Step 9 complete.`);

      // Track dm_sent event
      await AnalyticsService.trackEvent({
        instagramAccountId: dmJob.instagramAccountId,
        automationId: dmJob.automationId,
        eventType: 'dm_sent',
        payload: { dmJobId: dmJob.id, attempts: dmJob.attempts + 1 },
      });

      console.log(`✅ [DM-Sender Worker] Job ${dmJobId} successfully processed.`);
    } catch (err: any) {
      console.error(`❌ [DM-Sender Worker] Failed processing job ${dmJobId}:`, err);

      console.log(`✉️ [DM-Sender Worker] Step 10: Updating status to failed...`);
      try {
        await db
          .update(dmJobs)
          .set({
            status: 'failed',
            failedAt: new Date(),
            lastError: err.message || String(err),
            errorCode: err.code || 'SEND_FAILURE',
          })
          .where(eq(dmJobs.id, dmJobId));
        console.log(`✉️ [DM-Sender Worker] Step 10 complete.`);
      } catch (dbErr) {
        console.error(`❌ [DM-Sender Worker] Failed to write error status to DB:`, dbErr);
      }

      // Track dm_failed event
      if (dmJobRecord) {
        await AnalyticsService.trackEvent({
          instagramAccountId: dmJobRecord.instagramAccountId,
          automationId: dmJobRecord.automationId,
          eventType: 'dm_failed',
          payload: { dmJobId: dmJobRecord.id, error: err.message || String(err) },
        });
      }

      throw err;
    }
  },
  {
    connection: connection as any,
    limiter: process.env.NODE_ENV === 'test' ? undefined : {
      max: 1,
      duration: 2000,
    },
  }
);

dmSenderWorker.on('completed', (job) => {
  console.log(`🎉 [DM-Sender Worker] Job ${job.id} completed successfully`);
});

dmSenderWorker.on('failed', (job, err) => {
  console.error(`⚠️ [DM-Sender Worker] Job ${job?.id} failed:`, err);
});
