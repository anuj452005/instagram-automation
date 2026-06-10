import { env } from '../config/env';

/**
 * Returns a BullMQ-compatible connection options object parsed from REDIS_URL.
 * Passing an options object (not an ioredis instance) avoids the dual-ioredis
 * TypeScript incompatibility between the root ioredis and BullMQ's bundled copy.
 */
export function createRedisConnection() {
  const url = new URL(env.REDIS_URL);

  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    password: url.password || undefined,
    username: url.username || undefined,
    tls: url.protocol === 'rediss:' ? {} : undefined,
    maxRetriesPerRequest: null, // Required by BullMQ
  };
}

// Legacy alias — workers that call createRedisClient() still work
export const createRedisClient = createRedisConnection;
