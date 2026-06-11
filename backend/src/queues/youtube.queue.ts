import { Queue } from 'bullmq';
import { createRedisClient } from './connection';

const connection = createRedisClient();

export const youtubeQueue = new Queue('youtube-jobs', {
  connection,
  defaultJobOptions: {
    attempts: 3, // Auto-retry up to 3 times on transient network failures
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
