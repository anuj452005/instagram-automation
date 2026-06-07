import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is missing.');
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL;
const isSslRequired = dbUrl.includes('sslmode=require') || process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: dbUrl,
  ssl: isSslRequired ? { rejectUnauthorized: false } : false,
  max: 1, // Only 1 connection needed for running migrations
});

const db = drizzle(pool);

async function runMigrations() {
  console.log('⏳ Running database migrations...');
  try {
    await migrate(db, {
      migrationsFolder: path.join(__dirname, 'migrations'),
    });
    console.log('✅ Migrations applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
