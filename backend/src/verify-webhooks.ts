import app from './app';
import { db } from './config/db';
import { webhookEvents } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { env } from './config/env';
import { redis } from './config/redis';
import http from 'http';
import crypto from 'crypto';
import './workers/comment.worker';

const TEST_PORT = 3005;

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

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('🧪 Starting Webhook Ingestion & Worker integration tests...');

  // Clean up any stale Redis keys from previous runs
  try {
    await redis.del('webhook:dedup:comment_test_id_999');
    console.log('🧹 Cleaned up stale Redis keys.');
  } catch (err) {
    console.warn('⚠️ Stale cleanup warning:', err);
  }

  // Start the server
  const server = app.listen(TEST_PORT, async () => {
    console.log(`🌐 Test server listening on port ${TEST_PORT}`);

    try {
      const verifyToken = env.META_VERIFY_TOKEN;
      const appSecret = env.META_APP_SECRET || '435bbf7da9351adfbcca8e26fec9a510';

      // ==========================================
      // Test 1: GET /api/webhooks/instagram (Valid)
      // ==========================================
      console.log('\nTest 1: GET webhook challenge verification with valid token');
      const challengeStr = 'test_challenge_123';
      const res1 = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: `/api/webhooks/instagram?hub.mode=subscribe&hub.challenge=${challengeStr}&hub.verify_token=${verifyToken}`,
        method: 'GET',
      });

      console.log(`Status: ${res1.status}`);
      console.log(`Body: ${res1.body}`);

      if (res1.status !== 200 || res1.body !== challengeStr) {
        throw new Error(`❌ Test 1 failed: Expected 200 and challenge body '${challengeStr}', got status ${res1.status} and body '${res1.body}'`);
      }
      console.log('✅ Test 1 passed!');

      // ============================================
      // Test 2: GET /api/webhooks/instagram (Invalid)
      // ============================================
      console.log('\nTest 2: GET webhook challenge verification with invalid token');
      const res2 = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: `/api/webhooks/instagram?hub.mode=subscribe&hub.challenge=${challengeStr}&hub.verify_token=wrong_token`,
        method: 'GET',
      });

      console.log(`Status: ${res2.status}`);
      if (res2.status !== 403) {
        throw new Error(`❌ Test 2 failed: Expected 403 Forbidden, got ${res2.status}`);
      }
      console.log('✅ Test 2 passed!');

      // =============================================
      // Test 3: POST /api/webhooks/instagram (Invalid Signature)
      // =============================================
      console.log('\nTest 3: POST webhook with invalid signature');
      const mockPayload = {
        object: 'instagram',
        entry: [
          {
            id: 'ig_test_user_123',
            time: Date.now(),
            changes: [
              {
                field: 'comments',
                value: {
                  id: 'comment_test_id_999',
                  text: 'hello world',
                  from: {
                    id: 'commenter_user_456',
                    username: 'test_commenter',
                  },
                  media: {
                    id: 'media_test_post_789',
                  },
                },
              },
            ],
          },
        ],
      };
      const payloadStr = JSON.stringify(mockPayload);

      const res3 = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/webhooks/instagram',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': 'sha256=invalid_signature_hash_here',
          'Content-Length': Buffer.byteLength(payloadStr),
        },
      }, payloadStr);

      console.log(`Status: ${res3.status}`);
      if (res3.status !== 403) {
        throw new Error(`❌ Test 3 failed: Expected 403 Forbidden for invalid signature, got ${res3.status}`);
      }
      console.log('✅ Test 3 passed!');

      // =============================================
      // Test 4: POST /api/webhooks/instagram (Valid Signature & Worker execution)
      // =============================================
      console.log('\nTest 4: POST webhook with valid signature (Ingestion & Background queueing)');
      const expectedSignature = crypto
        .createHmac('sha256', appSecret)
        .update(payloadStr)
        .digest('hex');

      const res4 = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/webhooks/instagram',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': `sha256=${expectedSignature}`,
          'Content-Length': Buffer.byteLength(payloadStr),
        },
      }, payloadStr);

      console.log(`Status: ${res4.status}`);
      console.log(`Body: ${res4.body}`);

      if (res4.status !== 200) {
        throw new Error(`❌ Test 4 failed: Expected 200 OK status, got ${res4.status}`);
      }

      const parsedRes4 = JSON.parse(res4.body);
      const insertedEventId = parsedRes4.eventId;
      if (!insertedEventId) {
        throw new Error(`❌ Test 4 failed: Response body did not return eventId`);
      }
      console.log(`✅ Webhook ingested successfully. Event ID: ${insertedEventId}`);

      // Wait a short duration for the BullMQ worker to pick up and process the job
      console.log('⏳ Waiting for background worker to process enqueued job...');
      await sleep(2000);

      // Verify the event state in the database
      const [dbRow] = await db
        .select()
        .from(webhookEvents)
        .where(eq(webhookEvents.id, insertedEventId));

      if (!dbRow) {
        throw new Error(`❌ Test 4 failed: Webhook event row was not found in the database.`);
      }

      console.log(`Database state:`);
      console.log(`   - ID: ${dbRow.id}`);
      console.log(`   - igUserId: ${dbRow.igUserId}`);
      console.log(`   - eventType: ${dbRow.eventType}`);
      console.log(`   - processed: ${dbRow.processed}`);
      console.log(`   - processingError: ${dbRow.processingError || 'None'}`);

      if (!dbRow.processed) {
        throw new Error(`❌ Test 4 failed: Webhook event processed status is still false.`);
      }
      console.log('✅ Test 4 passed! Worker successfully processed the event.');

      // =============================================
      // Test 5: POST /api/webhooks/instagram (Deduplication Check)
      // =============================================
      console.log('\nTest 5: POST webhook duplicate verification (should skip ingestion)');
      // Post the identical payload again
      const res5 = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/webhooks/instagram',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': `sha256=${expectedSignature}`,
          'Content-Length': Buffer.byteLength(payloadStr),
        },
      }, payloadStr);

      console.log(`Status: ${res5.status}`);
      console.log(`Body: ${res5.body}`);

      if (res5.status !== 200 || res5.body !== 'Duplicate event') {
        throw new Error(`❌ Test 5 failed: Expected 200 OK with 'Duplicate event' string, got status ${res5.status} and body '${res5.body}'`);
      }
      console.log('✅ Test 5 passed! Deduplication returned 200 OK (Duplicate).');

      // Clean up the test database entries
      await db.delete(webhookEvents).where(eq(webhookEvents.id, insertedEventId));
      // Clean up Redis deduplication key
      await redis.del(`webhook:dedup:comment_test_id_999`);
      console.log('🧹 Cleaned up test database row and Redis keys.');

      console.log('\n🎉 All Webhook Ingestion & Worker integration tests passed successfully!');
    } catch (testError) {
      console.error('\n❌ Webhook API tests failed:', testError);
      process.exitCode = 1;
    } finally {
      server.close(async () => {
        console.log('🔌 Test server shut down.');
        // Clean up connections
        await redis.quit();
        // Force exit to ensure workers close immediately
        process.exit(process.exitCode || 0);
      });
    }
  });
}

runTests();
