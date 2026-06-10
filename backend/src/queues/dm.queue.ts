import { Queue } from 'bullmq';
import { createRedisClient } from './connection';

const connection = createRedisClient();

export const dmQueue = new Queue('dm-sender', {
  connection,
  defaultJobOptions: {
    attempts: 3, // Auto-retry up to 3 times on transient network failures
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
