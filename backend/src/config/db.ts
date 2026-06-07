import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from './env';
import * as schema from '../../../db/schema';

const isSslRequired = env.DATABASE_URL.includes('sslmode=require') || env.NODE_ENV === 'production';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: isSslRequired ? { rejectUnauthorized: false } : false,
  max: 20, // tuned for Azure Container Apps scale-to-zero model
});

export const db = drizzle(pool, { schema });
