import { db } from './config/db';
import { users, instagramAccounts } from '../../db/schema';
import { eq } from 'drizzle-orm';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const USER_CLERK = 'user_curl_test_clerk';
const USER_EMAIL = 'curl_tester@example.com';
const USER_NAME = 'Curl Tester';
const IG_ACCOUNT_ID = 'ig_curl_test_acct';

async function main() {
  console.log('Inserting curl test entities...');
  // clean up first
  await db.delete(users).where(eq(users.clerkUserId, USER_CLERK));

  // insert user
  const [user] = await db.insert(users).values({
    clerkUserId: USER_CLERK,
    name: USER_NAME,
    email: USER_EMAIL,
  }).returning();

  // insert instagram account
  await db.insert(instagramAccounts).values({
    id: IG_ACCOUNT_ID,
    userId: user.id,
    username: 'curl_instagram_tester',
    fbPageId: 'curl_page_123',
    fbPageAccessToken: 'encrypted_curl_token',
  });

  // generate token
  const token = jwt.sign({
    sub: USER_CLERK,
    email: USER_EMAIL,
    name: USER_NAME,
  }, JWT_SECRET, { expiresIn: '24h' });

  console.log('\n================================================================');
  console.log('🎉 Setup complete! Use the following token and curl commands:');
  console.log('================================================================\n');
  console.log(`Token:\n${token}\n`);
  console.log('1. POST Create Automation:');
  console.log(`curl -X POST http://localhost:3000/api/automations \\`);
  console.log(`  -H "Authorization: Bearer ${token}" \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"instagramAccountId":"${IG_ACCOUNT_ID}","name":"Curl Automation","flowType":"dm","dmTemplate":"Reply from curl!","keywords":[{"keyword":"test","matchType":"exact"}]}'\n`);
  console.log('2. GET All Automations:');
  console.log(`curl -X GET http://localhost:3000/api/automations \\`);
  console.log(`  -H "Authorization: Bearer ${token}"\n`);
  console.log('3. GET Single Automation (replace :id with the returned UUID):');
  console.log(`curl -X GET http://localhost:3000/api/automations/:id \\`);
  console.log(`  -H "Authorization: Bearer ${token}"\n`);
  console.log('4. PUT Update Automation (replace :id with the returned UUID):');
  console.log(`curl -X PUT http://localhost:3000/api/automations/:id \\`);
  console.log(`  -H "Authorization: Bearer ${token}" \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"name":"Updated Curl Automation","dmTemplate":"Updated reply from curl!","keywords":[{"keyword":"new_keyword","matchType":"contains"}]}'\n`);
  console.log('5. DELETE Automation (replace :id with the returned UUID):');
  console.log(`curl -X DELETE http://localhost:3000/api/automations/:id \\`);
  console.log(`  -H "Authorization: Bearer ${token}"\n`);
  process.exit(0);
}

main().catch(console.error);
