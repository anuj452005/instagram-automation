import { Queue } from 'bullmq';
import { createRedisClient } from './connection';

const connection = createRedisClient();

export const leadQueue = new Queue('lead-processor', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
