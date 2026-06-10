import app from './app';
import { db } from './config/db';
import { users, instagramAccounts, automations, automationKeywords } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import * as jwt from 'jsonwebtoken';
import http from 'http';

const TEST_PORT = 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// User 1
const USER_A_CLERK = 'user_test_clerk_a';
const USER_A_EMAIL = 'user_a@example.com';
const USER_A_NAME = 'User A';

// User 2 (unauthorized tenant)
const USER_B_CLERK = 'user_test_clerk_b';
const USER_B_EMAIL = 'user_b@example.com';
const USER_B_NAME = 'User B';

// Mock Token Generators
const tokenA = jwt.sign({ sub: USER_A_CLERK, email: USER_A_EMAIL, name: USER_A_NAME }, JWT_SECRET, { expiresIn: '1h' });
const tokenB = jwt.sign({ sub: USER_B_CLERK, email: USER_B_EMAIL, name: USER_B_NAME }, JWT_SECRET, { expiresIn: '1h' });

function makeRequest(
  options: http.RequestOptions,
  bodyData?: string
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode || 0,
          body: data,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (bodyData) {
      req.write(bodyData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Automations CRUD API integration tests...');
  
  let userARowId = '';
  let userBRowId = '';
  let instagramAccountAId = 'ig_acct_a';
  let instagramAccountBId = 'ig_acct_b';

  // Clean up any stale data from previous runs
  try {
    await db.delete(users).where(eq(users.clerkUserId, USER_A_CLERK));
    await db.delete(users).where(eq(users.clerkUserId, USER_B_CLERK));
    console.log('🧹 Cleaned up any stale test user rows.');
  } catch (err) {
    console.warn('⚠️ Stale cleanup warning:', err);
  }

  // 1. Create mock database entities
  try {
    const [insertedUserA] = await db.insert(users).values({
      clerkUserId: USER_A_CLERK,
      name: USER_A_NAME,
      email: USER_A_EMAIL,
    }).returning();
    userARowId = insertedUserA.id;

    const [insertedUserB] = await db.insert(users).values({
      clerkUserId: USER_B_CLERK,
      name: USER_B_NAME,
      email: USER_B_EMAIL,
    }).returning();
    userBRowId = insertedUserB.id;

    await db.insert(instagramAccounts).values({
      id: instagramAccountAId,
      userId: userARowId,
      username: 'user_a_instagram',
      fbPageId: 'page_a_123',
      fbPageAccessToken: 'encrypted_token_a',
    });

    await db.insert(instagramAccounts).values({
      id: instagramAccountBId,
      userId: userBRowId,
      username: 'user_b_instagram',
      fbPageId: 'page_b_123',
      fbPageAccessToken: 'encrypted_token_b',
    });

    console.log('✅ Created User records and Instagram profiles in DB.');
  } catch (err) {
    console.error('❌ Failed setting up mock records in DB:', err);
    process.exit(1);
  }

  const server = app.listen(TEST_PORT, async () => {
    console.log(`🌐 Test server listening on port ${TEST_PORT}`);
    let testAutomationId = '';

    try {
      // Test 1: POST /api/automations - valid payload
      console.log('\nTest 1: POST /api/automations with User A valid payload');
      const payloadA = JSON.stringify({
        instagramAccountId: instagramAccountAId,
        name: 'Ebook Giveaway',
        flowType: 'dm',
        dmTemplate: 'Here is your ebook link: http://localhost:3000/ebook',
        keywords: [
          { keyword: 'book', matchType: 'exact' },
          { keyword: 'giveaway', matchType: 'contains' }
        ]
      });

      const res1 = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/automations',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payloadA)
        }
      }, payloadA);

      console.log(`Status: ${res1.status}`);
      console.log(`Body: ${res1.body}`);

      if (res1.status !== 201) {
        throw new Error('❌ Test 1 failed: Expected 201 status');
      }

      const parsed1 = JSON.parse(res1.body);
      testAutomationId = parsed1.id;
      if (!testAutomationId || parsed1.name !== 'Ebook Giveaway' || parsed1.keywords.length !== 2) {
        throw new Error('❌ Test 1 failed: Missing fields or nested keywords');
      }
      console.log('✅ Test 1 passed!');

      // Test 2: POST /api/automations - invalid payload (missing keywords)
      console.log('\nTest 2: POST /api/automations validation error (empty keywords)');
      const payloadInvalid = JSON.stringify({
        instagramAccountId: instagramAccountAId,
        name: 'Empty Keywords',
        flowType: 'dm',
        dmTemplate: 'No keywords',
        keywords: [] // invalid, must have min 1
      });

      const res2 = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/automations',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payloadInvalid)
        }
      }, payloadInvalid);

      console.log(`Status: ${res2.status}`);
      console.log(`Body: ${res2.body}`);

      if (res2.status !== 422) {
        throw new Error('❌ Test 2 failed: Expected 422 Unprocessable Entity status');
      }
      const parsed2 = JSON.parse(res2.body);
      if (parsed2.error?.code !== 'VALIDATION_ERROR') {
        throw new Error('❌ Test 2 failed: Expected VALIDATION_ERROR code');
      }
      console.log('✅ Test 2 passed!');

      // Test 3: POST /api/automations - Tenant isolation check (User B tries to write to User A\'s IG Account)
      console.log('\nTest 3: POST /api/automations tenant isolation check');
      const payloadTenantHijack = JSON.stringify({
        instagramAccountId: instagramAccountAId, // owned by A
        name: 'Hijack Attack',
        flowType: 'dm',
        dmTemplate: 'Malicious payload',
        keywords: [{ keyword: 'evil', matchType: 'exact' }]
      });

      const res3 = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/automations',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenB}`, // user B token
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payloadTenantHijack)
        }
      }, payloadTenantHijack);

      console.log(`Status: ${res3.status}`);
      console.log(`Body: ${res3.body}`);

      if (res3.status !== 403) {
        throw new Error('❌ Test 3 failed: Expected 403 Forbidden status');
      }
      console.log('✅ Test 3 passed!');

      // Test 4: GET /api/automations - fetch User A list
      console.log('\nTest 4: GET /api/automations for User A');
      const res4 = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/automations',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenA}`
        }
      });

      console.log(`Status: ${res4.status}`);
      console.log(`Body: ${res4.body}`);

      if (res4.status !== 200) {
        throw new Error('❌ Test 4 failed: Expected 200 status');
      }
      const list4 = JSON.parse(res4.body);
      if (list4.length !== 1 || list4[0].id !== testAutomationId || list4[0].keywords.length !== 2) {
        throw new Error('❌ Test 4 failed: List results mismatch');
      }
      console.log('✅ Test 4 passed!');

      // Test 5: GET /api/automations - fetch User B list (should be empty)
      console.log('\nTest 5: GET /api/automations for User B (should be empty list)');
      const res5 = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/automations',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenB}`
        }
      });

      console.log(`Status: ${res5.status}`);
      console.log(`Body: ${res5.body}`);

      if (res5.status !== 200) {
        throw new Error('❌ Test 5 failed: Expected 200 status');
      }
      const list5 = JSON.parse(res5.body);
      if (list5.length !== 0) {
        throw new Error('❌ Test 5 failed: User B list should be empty');
      }
      console.log('✅ Test 5 passed!');

      // Test 6: GET /api/automations/:id
      console.log(`\nTest 6: GET /api/automations/${testAutomationId} for User A`);
      const res6 = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: `/api/automations/${testAutomationId}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenA}`
        }
      });

      console.log(`Status: ${res6.status}`);
      if (res6.status !== 200) {
        throw new Error('❌ Test 6 failed: Expected 200 status');
      }
      console.log('✅ Test 6 passed!');

      // Test 7: GET /api/automations/:id - tenant isolation check (User B tries to read User A\'s automation)
      console.log(`\nTest 7: GET /api/automations/${testAutomationId} for User B (should be 404/not found)`);
      const res7 = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: `/api/automations/${testAutomationId}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenB}`
        }
      });

      console.log(`Status: ${res7.status}`);
      console.log(`Body: ${res7.body}`);
      if (res7.status !== 404) {
        throw new Error('❌ Test 7 failed: Expected 404 status');
      }
      console.log('✅ Test 7 passed!');

      // Test 8: PUT /api/automations/:id - update fields & keywords
      console.log(`\nTest 8: PUT /api/automations/${testAutomationId} update fields & keywords`);
      const payloadUpdate = JSON.stringify({
        name: 'Ebook Campaign - Updated',
        status: 'active',
        dmTemplate: 'Updated link: http://localhost:3000/new-ebook',
        keywords: [
          { keyword: 'ebook', matchType: 'exact' } // changed from 'book' & 'giveaway' to just 'ebook'
        ]
      });

      const res8 = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: `/api/automations/${testAutomationId}`,
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payloadUpdate)
        }
      }, payloadUpdate);

      console.log(`Status: ${res8.status}`);
      console.log(`Body: ${res8.body}`);

      if (res8.status !== 200) {
        throw new Error('❌ Test 8 failed: Expected 200 status');
      }

      const parsed8 = JSON.parse(res8.body);
      if (
        parsed8.name !== 'Ebook Campaign - Updated' ||
        parsed8.status !== 'active' ||
        parsed8.keywords.length !== 1 ||
        parsed8.keywords[0].keyword !== 'ebook'
      ) {
        throw new Error('❌ Test 8 failed: Fields not properly updated');
      }
      console.log('✅ Test 8 passed!');

      // Test 9: DELETE /api/automations/:id
      console.log(`\nTest 9: DELETE /api/automations/${testAutomationId}`);
      const res9 = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: `/api/automations/${testAutomationId}`,
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokenA}`
        }
      });

      console.log(`Status: ${res9.status}`);
      if (res9.status !== 200) {
        throw new Error('❌ Test 9 failed: Expected 200 status');
      }

      // Verify cascading keyword deletes in database
      const deletedKeywords = await db
        .select()
        .from(automationKeywords)
        .where(eq(automationKeywords.automationId, testAutomationId));

      if (deletedKeywords.length !== 0) {
        throw new Error('❌ Test 9 failed: Keywords were not cascaded deleted in DB!');
      }
      console.log('✅ Test 9 passed!');

      console.log('\n🎉 All Automations CRUD API integration tests passed successfully!');
    } catch (testError) {
      console.error('\n❌ Automation API tests failed:', testError);
      process.exitCode = 1;
    } finally {
      // Cleanup
      console.log('\n🧹 Cleaning up test users and connections...');
      try {
        await db.delete(users).where(eq(users.clerkUserId, USER_A_CLERK));
        await db.delete(users).where(eq(users.clerkUserId, USER_B_CLERK));
        console.log('✅ Database cleaned up.');
      } catch (err) {
        console.error('❌ Failed cleaning up database test rows:', err);
      }

      server.close(() => {
        console.log('🔌 Test server shut down.');
        process.exit(process.exitCode || 0);
      });
    }
  });
}

runTests();
