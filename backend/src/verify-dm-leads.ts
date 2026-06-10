import './set-mock-env';
import app from './app';
import { db } from './config/db';
import { users, instagramAccounts, automations, automationKeywords, dmJobs, leads, webhookEvents } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { env } from './config/env';
import { encrypt } from './services/encryption.service';
import { redis } from './config/redis';
import http from 'http';
import crypto from 'crypto';

// Import workers to ensure they process jobs
import './workers/comment.worker';
import './workers/dm-sender.worker';
import './workers/lead-processor.worker';

const TEST_PORT = 3006;

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
  console.log('🧪 Starting End-to-End Integration Tests for DM dispatch & Lead Capturing Workers...');

  const USER_CLERK = 'lead_test_clerk';
  const INSTAGRAM_ACCOUNT_ID = 'ig_acct_test_leads';
  const APP_SECRET = env.META_APP_SECRET || '435bbf7da9351adfbcca8e26fec9a510';

  let userRowId = '';
  let automation1Id = '';
  let automation2Id = '';

  // 1. Cleanup old test data
  try {
    await db.delete(users).where(eq(users.clerkUserId, USER_CLERK));
    await db.execute(sql`DROP INDEX IF EXISTS "automation_recipient_unique_idx";`);
    await db.execute(sql`CREATE UNIQUE INDEX "automation_recipient_unique_idx" ON "dm_jobs" ("automation_id", "recipient_ig_id") WHERE status NOT IN ('failed', 'skipped') AND comment_id NOT LIKE 'dm_%';`);
    await redis.del('webhook:dedup:comment_test_1');
    await redis.del('webhook:dedup:comment_test_2');
    await redis.del('webhook:dedup:dm_msg_invalid');
    await redis.del('webhook:dedup:dm_msg_valid_email');
    await redis.del('webhook:dedup:dm_msg_valid_phone');
    await redis.del('lead_session:commenter_user_123');
    console.log('🧹 Cleaned up stale database and Redis rows.');
  } catch (err) {
    console.warn('⚠️ Stale cleanup warning:', err);
  }

  // 2. Setup DB entities
  try {
    const [insertedUser] = await db
      .insert(users)
      .values({
        clerkUserId: USER_CLERK,
        name: 'Lead Test User',
        email: 'leadtest@example.com',
      })
      .returning();
    userRowId = insertedUser.id;

    await db.insert(instagramAccounts).values({
      id: INSTAGRAM_ACCOUNT_ID,
      userId: userRowId,
      username: 'ig_tester_account',
      fbPageId: 'page_test_123',
      fbPageAccessToken: encrypt('mock_page_access_token'),
    });

    // Automation 1: Standard Comment-to-DM (collectLeads = false, alsoReplyComment = true)
    const [auto1] = await db
      .insert(automations)
      .values({
        instagramAccountId: INSTAGRAM_ACCOUNT_ID,
        name: 'Ebook Campaign (No Leads)',
        flowType: 'dm',
        status: 'active',
        dmTemplate: 'Here is your ebook link: http://localhost:3000/download',
        collectLeads: false,
        alsoReplyComment: true,
        commentReplyText: 'Thanks! Check your DMs for the download link.',
      })
      .returning();
    automation1Id = auto1.id;

    await db.insert(automationKeywords).values({
      automationId: automation1Id,
      keyword: 'book',
      matchType: 'exact',
    });

    // Automation 2: Lead Collection Flow (collectLeads = true, fields = ['email', 'phone'])
    const [auto2] = await db
      .insert(automations)
      .values({
        instagramAccountId: INSTAGRAM_ACCOUNT_ID,
        name: 'Webinar Campaign (With Leads)',
        flowType: 'dm',
        status: 'active',
        dmTemplate: 'Registration confirmed! Link: http://localhost:3000/webinar',
        collectLeads: true,
        leadFields: ['email', 'phone'],
        alsoReplyComment: false,
      })
      .returning();
    automation2Id = auto2.id;

    await db.insert(automationKeywords).values({
      automationId: automation2Id,
      keyword: 'leads',
      matchType: 'contains',
    });

    console.log('✅ Created mock database entities (Users, Instagram accounts, Automations, Keywords).');
  } catch (err) {
    console.error('❌ Failed setting up mock records in DB:', err);
    process.exit(1);
  }

  // 3. Start Test Express Server
  const server = app.listen(TEST_PORT, async () => {
    console.log(`🌐 Test server listening on port ${TEST_PORT}`);

    try {
      // ==========================================
      // Test 1: Standard Comment-to-DM (No Leads)
      // ==========================================
      console.log('\n--- TEST 1: Comment matches standard automation trigger ---');
      const commentPayload1 = {
        object: 'instagram',
        entry: [
          {
            id: INSTAGRAM_ACCOUNT_ID,
            time: Date.now(),
            changes: [
              {
                field: 'comments',
                value: {
                  id: 'comment_test_1',
                  text: 'book! 🔥', // exact match after strip
                  from: {
                    id: 'commenter_user_123',
                    username: 'test_commenter_abc',
                  },
                  media: {
                    id: 'post_media_123',
                  },
                },
              },
            ],
          },
        ],
      };

      const payloadStr1 = JSON.stringify(commentPayload1);
      const signature1 = crypto.createHmac('sha256', APP_SECRET).update(payloadStr1).digest('hex');

      const res1 = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/webhooks/instagram',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': `sha256=${signature1}`,
          'Content-Length': Buffer.byteLength(payloadStr1),
        },
      }, payloadStr1);

      console.log(`Webhook Ingest Status: ${res1.status}`);
      if (res1.status !== 200) {
        throw new Error(`Test 1 Ingest failed. Expected 200, got ${res1.status}`);
      }

      console.log('⏳ Waiting for comment worker & dm-sender worker to execute...');
      await sleep(10000);

      // Verify DM Job status
      const test1Jobs = await db
        .select()
        .from(dmJobs)
        .where(eq(dmJobs.automationId, automation1Id));

      console.log(`Found ${test1Jobs.length} DM jobs for Automation 1.`);
      if (test1Jobs.length !== 1) {
        throw new Error(`Expected exactly 1 DM Job, found ${test1Jobs.length}`);
      }

      const job1 = test1Jobs[0];
      console.log(`   - DM Job recipient: ${job1.recipientIgId}`);
      console.log(`   - DM Job status: ${job1.status}`);
      console.log(`   - DM Job message text: "${job1.messageText}"`);

      if (job1.status !== 'sent') {
        throw new Error(`Expected DM Job status to be 'sent', got '${job1.status}'`);
      }
      if (!job1.messageText?.includes('Hello reader') && !job1.messageText?.includes('ebook link')) {
        throw new Error(`Unexpected message text sent: "${job1.messageText}"`);
      }

      console.log('✅ TEST 1 passed! Keyword matched, comment reply triggered, DM marked sent.');

      // ==========================================
      // Test 2: Ingest Comment triggering Lead Flow
      // ==========================================
      console.log('\n--- TEST 2: Comment matches Lead Collection Campaign ---');
      const commentPayload2 = {
        object: 'instagram',
        entry: [
          {
            id: INSTAGRAM_ACCOUNT_ID,
            time: Date.now(),
            changes: [
              {
                field: 'comments',
                value: {
                  id: 'comment_test_2',
                  text: 'Give me some leads!', // contains match
                  from: {
                    id: 'commenter_user_123',
                    username: 'test_commenter_abc',
                  },
                  media: {
                    id: 'post_media_456',
                  },
                },
              },
            ],
          },
        ],
      };

      const payloadStr2 = JSON.stringify(commentPayload2);
      const signature2 = crypto.createHmac('sha256', APP_SECRET).update(payloadStr2).digest('hex');

      const res2 = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/webhooks/instagram',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': `sha256=${signature2}`,
          'Content-Length': Buffer.byteLength(payloadStr2),
        },
      }, payloadStr2);

      if (res2.status !== 200) {
        throw new Error(`Test 2 Ingest failed. Expected 200, got ${res2.status}`);
      }

      console.log('⏳ Waiting for comment worker and lead session initialization...');
      await sleep(10000);

      // Verify DM Job status
      const test2Jobs = await db
        .select()
        .from(dmJobs)
        .where(eq(dmJobs.automationId, automation2Id));

      console.log(`Found ${test2Jobs.length} DM jobs for Automation 2.`);
      if (test2Jobs.length !== 1) {
        throw new Error(`Expected exactly 1 DM Job, found ${test2Jobs.length}`);
      }

      const job2 = test2Jobs[0];
      console.log(`   - DM Job status: ${job2.status}`);
      console.log(`   - DM Job message text: "${job2.messageText}"`);

      if (job2.status !== 'sent') {
        throw new Error(`Expected DM Job status to be 'sent', got '${job2.status}'`);
      }
      if (!job2.messageText?.includes('reply with your email address')) {
        throw new Error(`Expected email prompt message text, got: "${job2.messageText}"`);
      }

      // Verify Redis Session
      const redisSession = await redis.get('lead_session:commenter_user_123');
      console.log(`Redis Session details: ${redisSession}`);
      if (!redisSession) {
        throw new Error('Expected active lead session in Redis, found none.');
      }

      const parsedSession = JSON.parse(redisSession);
      if (parsedSession.currentFieldIndex !== 0 || parsedSession.fieldsToCollect[0] !== 'email') {
        throw new Error(`Unexpected Redis session state: ${JSON.stringify(parsedSession)}`);
      }

      console.log('✅ TEST 2 passed! Lead session initialized, email prompt DM sent.');

      // ==========================================
      // Test 3: User replies to DM with INVALID Email
      // ==========================================
      console.log('\n--- TEST 3: User replies to prompt with invalid email format ---');
      const dmPayload3 = {
        object: 'instagram',
        entry: [
          {
            id: INSTAGRAM_ACCOUNT_ID,
            time: Date.now(),
            messaging: [
              {
                sender: { id: 'commenter_user_123' },
                recipient: { id: INSTAGRAM_ACCOUNT_ID },
                timestamp: Date.now(),
                message: {
                  mid: 'dm_msg_invalid',
                  text: 'myemail_is_fake', // Invalid email
                },
              },
            ],
          },
        ],
      };

      const payloadStr3 = JSON.stringify(dmPayload3);
      const signature3 = crypto.createHmac('sha256', APP_SECRET).update(payloadStr3).digest('hex');

      const res3 = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/webhooks/instagram',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': `sha256=${signature3}`,
          'Content-Length': Buffer.byteLength(payloadStr3),
        },
      }, payloadStr3);

      if (res3.status !== 200) {
        throw new Error(`Test 3 Ingest failed. Expected 200, got ${res3.status}`);
      }

      console.log('⏳ Waiting for lead-processor worker to execute validation and send warning DM...');
      await sleep(10000);

      // Verify warning DM was enqueued and sent
      const allJobs3 = await db
        .select()
        .from(dmJobs)
        .where(eq(dmJobs.automationId, automation2Id));

      console.log(`Found ${allJobs3.length} total DM jobs for Automation 2.`);
      const warningJob = allJobs3.find((j) => j.messageText?.includes("doesn't look like a valid email"));
      if (!warningJob) {
        throw new Error("Could not find validation warning DM job in database.");
      }

      console.log(`   - Warning Job status: ${warningJob.status}`);
      console.log(`   - Warning Job text: "${warningJob.messageText}"`);
      if (warningJob.status !== 'sent') {
        throw new Error(`Expected warning DM status to be 'sent', got '${warningJob.status}'`);
      }

      // Verify session is STILL in Redis and STILL waiting for email
      const redisSession3 = await redis.get('lead_session:commenter_user_123');
      const parsedSession3 = JSON.parse(redisSession3 || '{}');
      if (parsedSession3.currentFieldIndex !== 0) {
        throw new Error(`Expected session currentFieldIndex to remain 0, got ${parsedSession3.currentFieldIndex}`);
      }

      console.log('✅ TEST 3 passed! Invalid format replied with validation warning DM. Session index retained.');

      // ==========================================
      // Test 4: User replies to DM with VALID Email
      // ==========================================
      console.log('\n--- TEST 4: User replies to prompt with valid email format ---');
      const dmPayload4 = {
        object: 'instagram',
        entry: [
          {
            id: INSTAGRAM_ACCOUNT_ID,
            time: Date.now(),
            messaging: [
              {
                sender: { id: 'commenter_user_123' },
                recipient: { id: INSTAGRAM_ACCOUNT_ID },
                timestamp: Date.now(),
                message: {
                  mid: 'dm_msg_valid_email',
                  text: 'valid_test@gmail.com', // Valid email
                },
              },
            ],
          },
        ],
      };

      const payloadStr4 = JSON.stringify(dmPayload4);
      const signature4 = crypto.createHmac('sha256', APP_SECRET).update(payloadStr4).digest('hex');

      const res4 = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/webhooks/instagram',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': `sha256=${signature4}`,
          'Content-Length': Buffer.byteLength(payloadStr4),
        },
      }, payloadStr4);

      if (res4.status !== 200) {
        throw new Error(`Test 4 Ingest failed. Expected 200, got ${res4.status}`);
      }

      console.log('⏳ Waiting for lead-processor to advance session to phone number field...');
      await sleep(10000);

      // Verify next prompt DM (phone number prompt) was sent
      const allJobsInTable = await db.select().from(dmJobs);
      console.log('🔍 [Debug Test 4] Current automation2Id:', automation2Id);
      console.log('🔍 [Debug Test 4] All jobs in table:', allJobsInTable.map(j => ({ id: j.id, automationId: j.automationId, commentId: j.commentId, msg: j.messageText })));

      const allJobs4 = allJobsInTable.filter(j => j.automationId === automation2Id);

      const phonePromptJob = allJobs4.find((j) => j.messageText?.includes('10-digit phone number'));
      if (!phonePromptJob) {
        throw new Error("Could not find phone number prompt DM job in database.");
      }

      console.log(`   - Phone Prompt Job status: ${phonePromptJob.status}`);
      console.log(`   - Phone Prompt Job text: "${phonePromptJob.messageText}"`);

      // Verify session advanced in Redis
      const redisSession4 = await redis.get('lead_session:commenter_user_123');
      const parsedSession4 = JSON.parse(redisSession4 || '{}');
      console.log(`   - Updated session index: ${parsedSession4.currentFieldIndex}`);
      console.log(`   - Collected data: ${JSON.stringify(parsedSession4.collectedData)}`);

      if (parsedSession4.currentFieldIndex !== 1) {
        throw new Error(`Expected session currentFieldIndex to be 1, got ${parsedSession4.currentFieldIndex}`);
      }
      if (parsedSession4.collectedData.email !== 'valid_test@gmail.com') {
        throw new Error(`Expected collected email to be 'valid_test@gmail.com', got ${parsedSession4.collectedData.email}`);
      }

      console.log('✅ TEST 4 passed! Valid email advanced session and sent phone prompt DM.');

      // ==========================================
      // Test 5: User replies to DM with VALID Phone
      // ==========================================
      console.log('\n--- TEST 5: User replies to prompt with valid phone format (completes flow) ---');
      const dmPayload5 = {
        object: 'instagram',
        entry: [
          {
            id: INSTAGRAM_ACCOUNT_ID,
            time: Date.now(),
            messaging: [
              {
                sender: { id: 'commenter_user_123' },
                recipient: { id: INSTAGRAM_ACCOUNT_ID },
                timestamp: Date.now(),
                message: {
                  mid: 'dm_msg_valid_phone',
                  text: '+91 9988776655', // Valid Indian mobile number
                },
              },
            ],
          },
        ],
      };

      const payloadStr5 = JSON.stringify(dmPayload5);
      const signature5 = crypto.createHmac('sha256', APP_SECRET).update(payloadStr5).digest('hex');

      const res5 = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/webhooks/instagram',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': `sha256=${signature5}`,
          'Content-Length': Buffer.byteLength(payloadStr5),
        },
      }, payloadStr5);

      if (res5.status !== 200) {
        throw new Error(`Test 5 Ingest failed. Expected 200, got ${res5.status}`);
      }

      console.log('⏳ Waiting for lead-processor to complete flow, save lead, and dispatch final DM...');
      await sleep(10000);

      // 1. Verify Redis session is deleted
      const redisSession5 = await redis.get('lead_session:commenter_user_123');
      console.log(`Redis Session state: ${redisSession5 || 'null (deleted)'}`);
      if (redisSession5 !== null) {
        throw new Error('Expected Redis lead session to be deleted, but it still exists.');
      }

      // 2. Verify Lead record was written to DB
      const testLeads = await db
        .select()
        .from(leads)
        .where(eq(leads.automationId, automation2Id));

      console.log(`Found ${testLeads.length} leads in database.`);
      if (testLeads.length !== 1) {
        throw new Error(`Expected exactly 1 lead, found ${testLeads.length}`);
      }

      const leadRecord = testLeads[0];
      console.log(`   - Lead Email: ${leadRecord.email}`);
      console.log(`   - Lead Phone: ${leadRecord.phone}`);
      console.log(`   - Lead igUserId: ${leadRecord.igUserId}`);

      if (leadRecord.email !== 'valid_test@gmail.com' || leadRecord.phone !== '9988776655' || leadRecord.igUserId !== 'commenter_user_123') {
        throw new Error(`Lead record values mismatch: ${JSON.stringify(leadRecord)}`);
      }

      // 3. Verify final DM template job was sent
      const allJobs5 = await db
        .select()
        .from(dmJobs)
        .where(eq(dmJobs.automationId, automation2Id));

      const finalDmJob = allJobs5.find((j) => j.messageText?.includes('Registration confirmed!'));
      if (!finalDmJob) {
        throw new Error("Could not find final template DM job in database.");
      }

      console.log(`   - Final DM Job status: ${finalDmJob.status}`);
      console.log(`   - Final DM Job text: "${finalDmJob.messageText}"`);
      if (finalDmJob.status !== 'sent') {
        throw new Error(`Expected final DM status to be 'sent', got '${finalDmJob.status}'`);
      }

      console.log('✅ TEST 5 passed! Flow completed, session deleted, lead persisted in DB, and final DM dispatched.');

      console.log('\n🎉 ALL E2E Integration tests passed successfully!');
    } catch (testError) {
      console.error('\n❌ E2E tests failed:', testError);
      process.exitCode = 1;
    } finally {
      // 4. Cleanup and Shutdown
      console.log('\n🧹 Cleaning up test users and connections...');
      try {
        await db.delete(users).where(eq(users.clerkUserId, USER_CLERK));
        await redis.del('webhook:dedup:comment_test_1');
        await redis.del('webhook:dedup:comment_test_2');
        await redis.del('webhook:dedup:dm_msg_invalid');
        await redis.del('webhook:dedup:dm_msg_valid_email');
        await redis.del('webhook:dedup:dm_msg_valid_phone');
        await redis.del('lead_session:commenter_user_123');
        console.log('✅ Database and Redis cleaned up.');
      } catch (err) {
        console.error('❌ Failed cleaning up database test rows:', err);
      }

      server.close(async () => {
        console.log('🔌 Test server shut down.');
        await redis.quit();
        process.exit(process.exitCode || 0);
      });
    }
  });
}

runTests();
