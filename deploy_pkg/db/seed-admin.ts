import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import crypto from 'crypto';
import { adminUsers } from './schema';
import { eq } from 'drizzle-orm';

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
  max: 1,
});

const db = drizzle(pool);

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@gramflow.com';
  const password = process.env.ADMIN_PASSWORD || 'AdminPassword123';
  const fullName = process.env.ADMIN_NAME || 'GramFlow Admin';

  console.log(`⏳ Seeding admin user: ${email}...`);

  try {
    const existing = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);

    if (existing.length > 0) {
      console.log(`⚠️ Admin user with email "${email}" already exists.`);
      return;
    }

    const passwordHash = hashPassword(password);

    await db.insert(adminUsers).values({
      email,
      passwordHash,
      fullName,
      role: 'superadmin',
      isActive: true,
    });

    console.log(`✅ Admin user seeded successfully!`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedAdmin();
