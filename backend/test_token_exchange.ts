import * as jwt from 'jsonwebtoken';
import app from './src/app';
import { db } from './src/config/db';
import { users, instagramAccounts } from '../db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from './src/services/encryption.service';

const TEST_PORT = 3009;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

async function runTests() {
  console.log('🧪 Starting Unit 08 Integration Tests...');
  
  // 1. Start Server on a dynamic port
  const server = app.listen(TEST_PORT);
  console.log(`Server started on http://localhost:${TEST_PORT}`);

  const mockClerkUserId = 'test_clerk_user_' + Date.now();
  const mockEmail = `test_${Date.now()}@example.com`;
  const mockName = 'Integration Test User';

  // 2. Generate a mock Clerk JWT
  const token = jwt.sign(
    {
      sub: mockClerkUserId,
      email: mockEmail,
      name: mockName,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  try {
    // 3. Test: GET /api/accounts/linkable (Unauthenticated)
    console.log('\n--- Test: GET /linkable (Unauthenticated) ---');
    const unauthRes = await fetch(`http://localhost:${TEST_PORT}/api/accounts/linkable`);
    console.log('Status:', unauthRes.status);
    const unauthBody = await unauthRes.json() as any;
    console.log('Body:', JSON.stringify(unauthBody));
    if (unauthRes.status !== 401) {
      throw new Error('Unauthenticated request should return 401.');
    }
    console.log('✅ Passed');

    // 4. Test: GET /api/accounts/linkable (Authenticated)
    console.log('\n--- Test: GET /linkable (Authenticated) ---');
    const linkableRes = await fetch(`http://localhost:${TEST_PORT}/api/accounts/linkable`, { headers });
    console.log('Status:', linkableRes.status);
    const linkableBody = await linkableRes.json() as any;
    console.log('Body:', JSON.stringify(linkableBody));
    if (linkableRes.status !== 200) {
      throw new Error(`Expected 200 OK, got ${linkableRes.status}`);
    }
    if (!Array.isArray(linkableBody) || linkableBody.length === 0) {
      throw new Error('Expected an array of mock linkable accounts.');
    }
    if (linkableBody[0].instagramAccountId !== 'ig_mock_1' || linkableBody[0].fbPageId !== 'page_mock_1') {
      throw new Error('Mock linkable accounts payload did not match expected structure.');
    }
    console.log('✅ Passed');

    // 5. Verify User Sync occurred successfully
    console.log('\n--- Test: DB User Sync Verification ---');
    const syncedUsers = await db.select().from(users).where(eq(users.clerkUserId, mockClerkUserId)).limit(1);
    if (syncedUsers.length === 0) {
      throw new Error('User was not synchronized to database.');
    }
    const syncedUser = syncedUsers[0];
    console.log(`Synced User ID in DB: ${syncedUser.id}`);
    console.log('✅ Passed');

    // 6. Test: POST /api/accounts/activate (Validation Mismatch)
    console.log('\n--- Test: POST /activate (Validation Mismatch) ---');
    const badActivateRes = await fetch(`http://localhost:${TEST_PORT}/api/accounts/activate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ instagramAccountId: '' }), // Missing fbPageId
    });
    console.log('Status:', badActivateRes.status);
    const badActivateBody = await badActivateRes.json() as any;
    console.log('Body:', JSON.stringify(badActivateBody));
    if (badActivateRes.status !== 422) {
      throw new Error(`Expected 422 Unprocessable Entity, got ${badActivateRes.status}`);
    }
    console.log('✅ Passed');

    // 7. Test: POST /api/accounts/activate (Successful Activation)
    console.log('\n--- Test: POST /activate (Successful Activation) ---');
    const activateRes = await fetch(`http://localhost:${TEST_PORT}/api/accounts/activate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        instagramAccountId: 'ig_mock_1',
        fbPageId: 'page_mock_1',
      }),
    });
    console.log('Status:', activateRes.status);
    const activateBody = await activateRes.json() as any;
    console.log('Body:', JSON.stringify(activateBody));
    if (activateRes.status !== 200) {
      throw new Error(`Expected 200 OK, got ${activateRes.status}`);
    }
    if (activateBody.id !== 'ig_mock_1' || !activateBody.isActive) {
      throw new Error('Activate response is invalid.');
    }
    console.log('✅ Passed');

    // 8. Verify Secure Storage and Encryption
    console.log('\n--- Test: DB Token Storage & Encryption Verification ---');
    const dbAccounts = await db
      .select()
      .from(instagramAccounts)
      .where(eq(instagramAccounts.id, 'ig_mock_1'))
      .limit(1);

    if (dbAccounts.length === 0) {
      throw new Error('Instagram account was not saved to DB.');
    }

    const dbAccount = dbAccounts[0];
    console.log(`Saved Account ID: ${dbAccount.id}`);
    console.log(`Encrypted Token stored in DB: ${dbAccount.fbPageAccessToken}`);
    if (dbAccount.fbPageAccessToken === 'mock_page_access_token_1') {
      throw new Error('Token stored in plain text instead of being encrypted!');
    }

    // Decrypt the stored token
    const decryptedToken = decrypt(dbAccount.fbPageAccessToken);
    console.log(`Decrypted Token: ${decryptedToken}`);
    if (decryptedToken !== 'mock_page_access_token_1') {
      throw new Error(`Decrypted token does not match mock value. Got: ${decryptedToken}`);
    }
    console.log('✅ Passed');

    // 9. Clean up database state
    console.log('\n--- Test Cleanup ---');
    await db.delete(instagramAccounts).where(eq(instagramAccounts.id, 'ig_mock_1'));
    await db.delete(users).where(eq(users.id, syncedUser.id));
    console.log('Cleaned up mock data successfully.');
    console.log('✅ Passed');

    console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    // Attempt cleanup
    try {
      await db.delete(instagramAccounts).where(eq(instagramAccounts.id, 'ig_mock_1'));
      const syncedUsers = await db.select().from(users).where(eq(users.clerkUserId, mockClerkUserId)).limit(1);
      if (syncedUsers.length > 0) {
        await db.delete(users).where(eq(users.id, syncedUsers[0].id));
      }
    } catch (_) {}
    process.exit(1);
  } finally {
    // 10. Close Server
    server.close();
  }
}

runTests();
