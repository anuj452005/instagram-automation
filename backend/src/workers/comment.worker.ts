import { Worker, Job } from 'bullmq';
import { createRedisClient } from '../queues/connection';
import { db } from '../config/db';
import { webhookEvents } from '../../../db/schema';
import { eq } from 'drizzle-orm';

const connection = createRedisClient();

export const commentWorker = new Worker(
  'comment-ingest',
  async (job: Job) => {
    const { webhookEventId, payload } = job.data;
    console.log(`🤖 [Worker] Processing webhook event: ${webhookEventId}`);

    try {
      // Parse payload to extract commenter's ID and post ID
      const entry = payload?.entry?.[0];
      const change = entry?.changes?.[0];
      const changeValue = change?.value;

      const commenterId = changeValue?.from?.id;
      const commenterUsername = changeValue?.from?.username;
      const postId = changeValue?.media?.id;
      const commentId = changeValue?.id;
      const commentText = changeValue?.text;

      console.log(`💬 [Worker] Extracted comment details:`);
      console.log(`   - Commenter ID: ${commenterId || 'N/A'}`);
      console.log(`   - Commenter Username: ${commenterUsername || 'N/A'}`);
      console.log(`   - Post ID: ${postId || 'N/A'}`);
      console.log(`   - Comment ID: ${commentId || 'N/A'}`);
      console.log(`   - Text: "${commentText || ''}"`);

      // Update database row in webhook_events to marked processed = true
      await db
        .update(webhookEvents)
        .set({
          processed: true,
          processedAt: new Date(),
        })
        .where(eq(webhookEvents.id, webhookEventId));

      console.log(`✅ [Worker] Webhook event ${webhookEventId} marked as processed.`);
    } catch (err: any) {
      console.error(`❌ [Worker] Error processing webhook event ${webhookEventId}:`, err);

      // Save error details in DB
      await db
        .update(webhookEvents)
        .set({
          processed: false,
          processingError: err.message || String(err),
        })
        .where(eq(webhookEvents.id, webhookEventId));

      throw err; // Rethrow to let BullMQ handle retry / failure state
    }
  },
  {
    connection,
    concurrency: 5, // Process up to 5 events concurrently
  }
);

commentWorker.on('completed', (job) => {
  console.log(`🎉 [Worker] Job ${job.id} completed successfully`);
});

commentWorker.on('failed', (job, err) => {
  console.error(`⚠️ [Worker] Job ${job?.id} failed:`, err);
});
