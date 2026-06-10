import './set-mock-env';
import app from './app';
import { db } from './config/db';
import { users, adminUsers, auditLogs } from '../../db/schema';
import { eq } from 'drizzle-orm';
import http from 'http';
import * as jwt from 'jsonwebtoken';

const TEST_PORT = 3008;

function makeRequest(
  options: http.RequestOptions,
  bodyData?: string
): Promise<{ status: number; body: string; headers: http.IncomingHttpHeaders }> {
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
          headers: res.headers,
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

// Helper to generate a mock Clerk token (like verify-auth.ts does)
function generateMockClerkToken(userId: string, email: string, role: string = 'user') {
  return jwt.sign(
    {
      sub: userId,
      userId: userId,
      email: email,
      email_address: email,
      name: 'Test Account',
      role: role,
    },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '1h' }
  );
}

async function runTests() {
  console.log('🧪 Starting Verification Tests for Units 26, 31, 32, 33 (Admin & Analytics)...');

  const CLERK_USER_ID = 'user_analytics_test';
  const CLERK_ADMIN_ID = 'user_admin_clerk_test';
  
  let clerkUserDbId = '';
  let clerkAdminDbId = '';

  // 1. Cleanup old test data
  try {
    await db.delete(users).where(eq(users.clerkUserId, CLERK_USER_ID));
    await db.delete(users).where(eq(users.clerkUserId, CLERK_ADMIN_ID));
    await db.delete(adminUsers).where(eq(adminUsers.email, 'verify_admin@gramflow.com'));
    console.log('🧹 Cleaned up stale database rows.');
  } catch (err) {
    console.warn('⚠️ Stale cleanup warning:', err);
  }

  // 2. Setup DB entities
  try {
    // Standard User
    const [insertedUser] = await db
      .insert(users)
      .values({
        clerkUserId: CLERK_USER_ID,
        name: 'Analytics Tester',
        email: 'analyticstester@example.com',
        role: 'user',
      })
      .returning();
    clerkUserDbId = insertedUser.id;

    // Admin User via Clerk
    const [insertedAdmin] = await db
      .insert(users)
      .values({
        clerkUserId: CLERK_ADMIN_ID,
        name: 'Admin Clerk Tester',
        email: 'adminclerktester@example.com',
        role: 'admin',
      })
      .returning();
    clerkAdminDbId = insertedAdmin.id;

    console.log('✅ Created mock users in database.');
  } catch (err) {
    console.error('❌ Failed setting up mock records in DB:', err);
    process.exit(1);
  }

  // 3. Start Test Express Server
  const server = app.listen(TEST_PORT, async () => {
    console.log(`🌐 Test server listening on port ${TEST_PORT}`);

    try {
      // Create tokens
      const standardClerkToken = generateMockClerkToken(CLERK_USER_ID, 'analyticstester@example.com', 'user');
      const adminClerkToken = generateMockClerkToken(CLERK_ADMIN_ID, 'adminclerktester@example.com', 'admin');

      // ==========================================================
      // Test 1: Analytics API - standard user access
      // ==========================================================
      console.log('\n--- TEST 1: Analytics API Endpoints (Standard User) ---');
      
      const overviewRes = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/analytics/overview?range=7d',
        method: 'GET',
        headers: { Authorization: `Bearer ${standardClerkToken}` },
      });

      console.log(`Overview Status: ${overviewRes.status}`);
      if (overviewRes.status !== 200) {
        throw new Error(`Expected overview status 200, got ${overviewRes.status}`);
      }
      const overviewJson = JSON.parse(overviewRes.body);
      console.log(`   - Data: ${JSON.stringify(overviewJson.data)}`);
      if (overviewJson.data.dmsSent !== 0 || overviewJson.data.engagementRate !== '0.0%') {
        throw new Error('Expected zeroed metrics for new user.');
      }

      const seriesRes = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/analytics/time-series?range=7d',
        method: 'GET',
        headers: { Authorization: `Bearer ${standardClerkToken}` },
      });

      console.log(`Time-series Status: ${seriesRes.status}`);
      if (seriesRes.status !== 200) {
        throw new Error(`Expected series status 200, got ${seriesRes.status}`);
      }
      const seriesJson = JSON.parse(seriesRes.body);
      console.log(`   - Data points count: ${seriesJson.data.length}`);

      console.log('✅ TEST 1 passed! Analytics endpoints return correct format for standard user.');

      // ==========================================================
      // Test 2: Local Admin Seeding Check
      // ==========================================================
      console.log('\n--- TEST 2: Local Admin Seeding and Login ---');

      // Verify seed admin user exists or insert verify-admin
      const mockSeedResponse = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/admin/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, JSON.stringify({ email: 'admin@gramflow.com', password: 'AdminPassword123' }));

      console.log(`Login status (with seed credentials): ${mockSeedResponse.status}`);
      if (mockSeedResponse.status !== 200) {
        throw new Error(`Expected login status 200, got ${mockSeedResponse.status}`);
      }
      const loginJson = JSON.parse(mockSeedResponse.body);
      const adminToken = loginJson.token;
      console.log(`   - Login success: ${loginJson.success}`);
      console.log(`   - Actor email: ${loginJson.admin.email}`);
      if (!adminToken) {
        throw new Error('Admin token missing in login response.');
      }

      // Invalid Login
      const invalidLoginRes = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/admin/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, JSON.stringify({ email: 'admin@gramflow.com', password: 'wrongpassword' }));

      console.log(`Login status (with wrong password): ${invalidLoginRes.status}`);
      if (invalidLoginRes.status !== 401) {
        throw new Error(`Expected status 401, got ${invalidLoginRes.status}`);
      }

      console.log('✅ TEST 2 passed! Admin login and credential checking verified.');

      // ==========================================================
      // Test 3: Admin Auth Middleware - role-based restrictions
      // ==========================================================
      console.log('\n--- TEST 3: Admin API Protection (Clerk User vs Admin User) ---');

      // Standard Clerk user gets blocked
      const standardBlockRes = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/admin/stats',
        method: 'GET',
        headers: { Authorization: `Bearer ${standardClerkToken}` },
      });

      console.log(`Stats access status (Standard Clerk User): ${standardBlockRes.status}`);
      if (standardBlockRes.status !== 401 && standardBlockRes.status !== 403) {
        throw new Error(`Expected 401 or 403, got ${standardBlockRes.status}`);
      }

      // Admin Clerk user gets access
      const adminClerkStatsRes = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/admin/stats',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminClerkToken}` },
      });

      console.log(`Stats access status (Admin Clerk User): ${adminClerkStatsRes.status}`);
      if (adminClerkStatsRes.status !== 200) {
        throw new Error(`Expected 200, got ${adminClerkStatsRes.status}`);
      }
      const adminClerkStatsJson = JSON.parse(adminClerkStatsRes.body);
      console.log(`   - Dynamic User count: ${adminClerkStatsJson.totalUsers}`);

      // Local Staff Token gets access
      const adminTokenStatsRes = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/admin/stats',
        method: 'GET',
        headers: { 'X-Admin-Token': adminToken },
      });

      console.log(`Stats access status (Local Staff Token): ${adminTokenStatsRes.status}`);
      if (adminTokenStatsRes.status !== 200) {
        throw new Error(`Expected 200, got ${adminTokenStatsRes.status}`);
      }
      const adminTokenStatsJson = JSON.parse(adminTokenStatsRes.body);
      console.log(`   - systemMRR: $${adminTokenStatsJson.systemMRR}`);
      console.log(`   - queueDepths keys: ${Object.keys(adminTokenStatsJson.queueDepths).join(', ')}`);

      console.log('✅ TEST 3 passed! Route protection and auth channels successfully verified.');

      // ==========================================================
      // Test 4: Audit Logging explorer
      // ==========================================================
      console.log('\n--- TEST 4: Audit Logs Generation & Verification ---');

      const logsRes = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/admin/logs',
        method: 'GET',
        headers: { 'X-Admin-Token': adminToken },
      });

      console.log(`Logs status: ${logsRes.status}`);
      if (logsRes.status !== 200) {
        throw new Error(`Expected 200, got ${logsRes.status}`);
      }

      const logsJson = JSON.parse(logsRes.body);
      console.log(`   - Audit logs count: ${logsJson.logs.length}`);
      
      const loginLogs = logsJson.logs.filter((l: any) => l.action.startsWith('admin_login_success') || l.action.startsWith('failed_login_password'));
      console.log(`   - Login events logged: ${loginLogs.length}`);
      if (loginLogs.length < 2) {
        throw new Error('Expected login events to be recorded in audit logs.');
      }

      console.log('✅ TEST 4 passed! Operations events recorded and verifiable in audit logs.');

      console.log('\n🎉 ALL VERIFICATION TESTS FOR UNITS 26, 31, 32, 33 PASSED!');
    } catch (testError) {
      console.error('\n❌ Verification tests failed:', testError);
      process.exitCode = 1;
    } finally {
      console.log('\n🧹 Cleaning up test users and connections...');
      try {
        await db.delete(users).where(eq(users.clerkUserId, CLERK_USER_ID));
        await db.delete(users).where(eq(users.clerkUserId, CLERK_ADMIN_ID));
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
