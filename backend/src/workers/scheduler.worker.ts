import { Worker, Job } from 'bullmq';
import { createRedisClient } from '../queues/connection';
import { db } from '../config/db';
import { automations } from '../../../db/schema';
import { eq, and, lte } from 'drizzle-orm';

const connection = createRedisClient();

export const schedulerWorker = new Worker(
  'scheduler',
  async (job: Job) => {
    console.log(`⏰ [Scheduler Worker] Scanning for campaigns scheduled to activate...`);

    try {
      const now = new Date();

      // Find draft automations whose scheduled activation time has elapsed
      const pendingActivations = await db
        .select()
        .from(automations)
        .where(
          and(
            eq(automations.status, 'draft'),
            lte(automations.scheduledActivateAt, now)
          )
        );

      if (pendingActivations.length === 0) {
        console.log(`ℹ️ [Scheduler Worker] No pending draft campaign activations found.`);
        return;
      }

      console.log(`⏰ [Scheduler Worker] Found ${pendingActivations.length} campaigns to activate.`);

      // Update status to 'active'
      for (const campaign of pendingActivations) {
        await db
          .update(automations)
          .set({
            status: 'active',
            updatedAt: new Date(),
          })
          .where(eq(automations.id, campaign.id));
        
        console.log(`✅ [Scheduler Worker] Campaign "${campaign.name}" (ID: ${campaign.id}) has been activated automatically.`);
      }
    } catch (err) {
      console.error(`❌ [Scheduler Worker] Error running scheduler scan:`, err);
      throw err;
    }
  },
  {
    connection: connection as any,
    concurrency: 1,
  }
);

schedulerWorker.on('completed', (job) => {
  console.log(`🎉 [Scheduler Worker] Scan completed successfully`);
});

schedulerWorker.on('failed', (job, err) => {
  console.error(`⚠️ [Scheduler Worker] Job ${job?.id} failed:`, err);
});
