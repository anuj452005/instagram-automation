import { Worker, Job } from 'bullmq';
import { createRedisClient } from '../queues/connection';
import { db } from '../config/db';
import { analyticsEvents, analyticsSnapshots } from '../../../db/schema';
import { sql } from 'drizzle-orm';

const connection = createRedisClient();

export const analyticsWorker = new Worker(
  'analytics',
  async (job: Job) => {
    const { instagramAccountId, automationId, eventType, payload } = job.data;
    console.log(`📊 [Analytics Worker] Logging event: "${eventType}" for account: ${instagramAccountId}, automation: ${automationId || 'none'}`);

    try {
      // 1. Insert raw event
      await db.insert(analyticsEvents).values({
        instagramAccountId,
        automationId: automationId || null,
        eventType,
        payload: payload || null,
      });

      // 2. If no automationId, do not update aggregated snapshots (schema requires automationId to be NOT NULL)
      if (!automationId) {
        console.log(`ℹ️ [Analytics Worker] Event has no associated automation ID. Skipping snapshot aggregation.`);
        return;
      }

      // 3. Perform atomic increment based on event type
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      let commentsIncrement = 0;
      let keywordsIncrement = 0;
      let dmsSentIncrement = 0;
      let failuresIncrement = 0;
      let leadsCollectedIncrement = 0;

      switch (eventType) {
        case 'comment_received':
          commentsIncrement = 1;
          break;
        case 'keyword_matched':
          keywordsIncrement = 1;
          break;
        case 'dm_sent':
          dmsSentIncrement = 1;
          break;
        case 'dm_failed':
          failuresIncrement = 1;
          break;
        case 'lead_collected':
          leadsCollectedIncrement = 1;
          break;
        default:
          console.warn(`⚠️ [Analytics Worker] Unknown event type: ${eventType}`);
          return;
      }

      await db.execute(sql`
        INSERT INTO ${analyticsSnapshots} (
          instagram_account_id, automation_id, date, 
          comments_count, keywords_matched, dms_sent, failures_count, leads_collected
        )
        VALUES (
          ${instagramAccountId}, ${automationId}, ${today},
          ${commentsIncrement}, ${keywordsIncrement}, ${dmsSentIncrement}, ${failuresIncrement}, ${leadsCollectedIncrement}
        )
        ON CONFLICT (instagram_account_id, automation_id, date) DO UPDATE SET
          comments_count = analytics_snapshots.comments_count + ${commentsIncrement},
          keywords_matched = analytics_snapshots.keywords_matched + ${keywordsIncrement},
          dms_sent = analytics_snapshots.dms_sent + ${dmsSentIncrement},
          failures_count = analytics_snapshots.failures_count + ${failuresIncrement},
          leads_collected = analytics_snapshots.leads_collected + ${leadsCollectedIncrement}
      `);
      console.log(`✅ [Analytics Worker] Snapshot atomic upsert completed for ${today}.`);
    } catch (err) {
      console.error(`❌ [Analytics Worker] Failed to process analytics job:`, err);
      throw err;
    }
  },
  {
    connection: connection as any,
    concurrency: 5,
  }
);

analyticsWorker.on('completed', (job) => {
  console.log(`🎉 [Analytics Worker] Job ${job.id} completed successfully`);
});

analyticsWorker.on('failed', (job, err) => {
  console.error(`⚠️ [Analytics Worker] Job ${job?.id} failed:`, err);
});
