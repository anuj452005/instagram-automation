import { Router, Request, Response } from 'express';
import { pool } from '../config/db';
import { redis } from '../config/redis';

export const healthRouter = Router();

healthRouter.get('/health', async (req: Request, res: Response): Promise<void> => {
  let dbStatus = 'disconnected';
  let redisStatus = 'disconnected';
  let isHealthy = true;

  // Check database connectivity
  try {
    await pool.query('SELECT 1');
    dbStatus = 'connected';
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    isHealthy = false;
  }

  // Check redis connectivity
  try {
    const pingResult = await redis.ping();
    if (pingResult === 'PONG') {
      redisStatus = 'connected';
    } else {
      isHealthy = false;
    }
  } catch (error) {
    console.error('❌ Redis health check failed:', error);
    isHealthy = false;
  }

  const responsePayload = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    database: dbStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString(),
  };

  if (isHealthy) {
    res.status(200).json(responsePayload);
  } else {
    res.status(503).json(responsePayload);
  }
});
