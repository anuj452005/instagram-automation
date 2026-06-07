import app from './app';
import { db } from './config/db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import * as jwt from 'jsonwebtoken';
import http from 'http';

const TEST_PORT = 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const TEST_CLERK_ID = 'user_test_clerk_123';
const TEST_EMAIL = 'test_creator@example.com';
const TEST_NAME = 'Test Creator';

// Generate mock token
const token = jwt.sign(
  {
    sub: TEST_CLERK_ID,
    email: TEST_EMAIL,
    name: TEST_NAME,
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

function makeRequest(options: http.RequestOptions): Promise<{ status: number; body: string }> {
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

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting auth sync integration tests...');
  
  // Clean up any stale test user first
  try {
    await db.delete(users).where(eq(users.clerkUserId, TEST_CLERK_ID));
    console.log('🧹 Cleaned up any stale test user.');
  } catch (err) {
    console.warn('⚠️ Error during initial cleanup (can be ignored if table is empty):', err);
  }

  // Start the test server
  const server = app.listen(TEST_PORT, async () => {
    console.log(`🌐 Test server listening on port ${TEST_PORT}`);
    
    try {
      // 1. Test case: Unauthenticated request (no header)
      console.log('\nTest 1: GET /api/auth/me without header');
      const res1 = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/auth/me',
        method: 'GET',
      });
      
      console.log(`Status: ${res1.status}`);
      console.log(`Response: ${res1.body}`);
      if (res1.status !== 401) {
        throw new Error('❌ Test 1 failed: Expected 401 status');
      }
      console.log('✅ Test 1 passed!');

      // 2. Test case: Unauthenticated request (invalid token)
      console.log('\nTest 2: GET /api/auth/me with invalid token');
      const res2 = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/auth/me',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid_token_123',
        },
      });
      
      console.log(`Status: ${res2.status}`);
      console.log(`Response: ${res2.body}`);
      if (res2.status !== 401) {
        throw new Error('❌ Test 2 failed: Expected 401 status');
      }
      console.log('✅ Test 2 passed!');

      // 3. Test case: Successful login and sync (valid token)
      console.log('\nTest 3: GET /api/auth/me with valid mock token');
      const res3 = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/auth/me',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log(`Status: ${res3.status}`);
      console.log(`Response: ${res3.body}`);
      if (res3.status !== 200) {
        throw new Error('❌ Test 3 failed: Expected 200 status');
      }
      
      const payload = JSON.parse(res3.body);
      if (
        payload.clerkUserId !== TEST_CLERK_ID ||
        payload.email !== TEST_EMAIL ||
        payload.name !== TEST_NAME
      ) {
        throw new Error('❌ Test 3 failed: Response payload mismatch');
      }
      console.log('✅ Test 3 passed!');

      // 4. Test case: Check database synchronization
      console.log('\nTest 4: Verify user is synchronized in PostgreSQL');
      const syncedUser = await db.select().from(users).where(eq(users.clerkUserId, TEST_CLERK_ID)).limit(1);
      if (syncedUser.length === 0) {
        throw new Error('❌ Test 4 failed: User not found in database');
      }
      
      const dbUser = syncedUser[0];
      console.log(`Synced Database Row ID: ${dbUser.id}`);
      console.log(`Email: ${dbUser.email}, Name: ${dbUser.name}`);
      if (dbUser.email !== TEST_EMAIL || dbUser.name !== TEST_NAME) {
        throw new Error('❌ Test 4 failed: Database values mismatch');
      }
      console.log('✅ Test 4 passed!');

      // 5. Test case: Subsequent request doesn't duplicate user
      console.log('\nTest 5: Repeat GET /api/auth/me and verify no duplicates');
      const res5 = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/auth/me',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (res5.status !== 200) {
        throw new Error('❌ Test 5 failed: Expected 200 status on second request');
      }
      
      const syncedUserCount = await db.select().from(users).where(eq(users.clerkUserId, TEST_CLERK_ID));
      if (syncedUserCount.length !== 1) {
        throw new Error(`❌ Test 5 failed: Duplicate users found: ${syncedUserCount.length}`);
      }
      console.log('✅ Test 5 passed!');

      console.log('\n🎉 All tests passed successfully!');
    } catch (testError) {
      console.error('\n❌ Integration tests failed:', testError);
      process.exitCode = 1;
    } finally {
      // Clean up test user
      console.log('\n🧹 Cleaning up test user...');
      try {
        await db.delete(users).where(eq(users.clerkUserId, TEST_CLERK_ID));
        console.log('✅ Stale test user cleaned up successfully!');
      } catch (err) {
        console.error('❌ Failed to clean up test user:', err);
      }
      
      // Stop the server
      server.close(() => {
        console.log('🔌 Test server shut down.');
        process.exit(process.exitCode || 0);
      });
    }
  });
}

runTests();
