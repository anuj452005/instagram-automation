import { Queue } from 'bullmq';
import { createRedisClient } from './connection';

// Create a queue instance using its own dedicated Redis client
const connection = createRedisClient();

export const commentQueue = new Queue('comment-ingest', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true, // Clean up completed jobs automatically to save Redis memory
    removeOnFail: false,   // Keep failed jobs for debugging
  },
});
