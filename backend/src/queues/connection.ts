import Redis from 'ioredis';
import { env } from '../config/env';

/**
 * Creates a dedicated ioredis client instance configured for BullMQ components (queues/workers).
 * BullMQ requires `maxRetriesPerRequest: null` connection options.
 */
export function createRedisClient() {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  client.on('error', (err) => {
    console.error('❌ BullMQ Redis Client Error:', err);
  });

  return client;
}
