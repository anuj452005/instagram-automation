import { z } from 'zod';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Clerk backend SDK expects CLERK_PUBLISHABLE_KEY (frontend uses VITE_ prefix)
if (process.env.VITE_CLERK_PUBLISHABLE_KEY && !process.env.CLERK_PUBLISHABLE_KEY) {
  process.env.CLERK_PUBLISHABLE_KEY = process.env.VITE_CLERK_PUBLISHABLE_KEY;
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  FRONTEND_URL: z.string().url(),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  // AES-256-GCM Encryption Key. Must be 32 bytes (64 hex characters) in production.
  ENCRYPTION_KEY: z.string().default('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'),
  // Toggle Mocking vs Real Meta Graph API connection
  MOCK_META_API: z.enum(['true', 'false']).default('true').transform((val) => val === 'true'),
  // Meta App Credentials (required in production for token exchange)
  META_APP_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  // Meta Webhook Verification Token
  META_VERIFY_TOKEN: z.string().default('gramflow_verify_token'),
  // JWT secret for admin token signing
  JWT_SECRET: z.string().default('dev-secret'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;

