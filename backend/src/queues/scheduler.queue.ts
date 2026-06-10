import { Queue } from 'bullmq';
import { createRedisClient } from './connection';

const connection = createRedisClient();

export const schedulerQueue = new Queue('scheduler', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export async function setupScheduledActivationJob() {
  const jobs = await schedulerQueue.getRepeatableJobs();
  for (const job of jobs) {
    await schedulerQueue.removeRepeatableByKey(job.key);
  }

  // Repeat every 60 seconds (every minute)
  await schedulerQueue.add(
    'scheduled-activations',
    {},
    {
      repeat: {
        pattern: '* * * * *',
      },
    }
  );
  console.log('⏰ [Scheduler Queue] Repeatable scheduled activation cron registered (every 60 seconds)');
}
