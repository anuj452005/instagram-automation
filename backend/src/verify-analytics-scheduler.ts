import './set-mock-env';
import app from './app';
import { db } from './config/db';
import { users, instagramAccounts, automations, leads, analyticsEvents, analyticsSnapshots } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { env } from './config/env';
import { encrypt } from './services/encryption.service';
import { redis } from './config/redis';
import http from 'http';
import { AnalyticsService } from './services/analytics.service';

// Import workers
import './workers/analytics.worker';
import './workers/scheduler.worker';
import { schedulerQueue } from './queues/scheduler.queue';
import { analyticsQueue } from './queues/analytics.queue';

const TEST_PORT = 3007;

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
  console.log('🧪 Starting End-to-End Tests for Units 21-25 (Analytics, Scheduler, Public Leads)...');

  const USER_CLERK = 'analytics_test_clerk';
  const INSTAGRAM_ACCOUNT_ID = 'ig_acct_test_analytics';

  let userRowId = '';
  let draftAutomationId = '';
  let activeAutomationId = '';
  let activeCampaignToken = 'test-lp-token-123';

  // 1. Cleanup old test data
  try {
    await db.delete(users).where(eq(users.clerkUserId, USER_CLERK));
    console.log('🧹 Cleaned up stale database rows.');
  } catch (err) {
    console.warn('⚠️ Stale cleanup warning:', err);
  }

  // 2. Setup DB entities
  try {
    const [insertedUser] = await db
      .insert(users)
      .values({
        clerkUserId: USER_CLERK,
        name: 'Analytics Test User',
        email: 'analyticstest@example.com',
      })
      .returning();
    userRowId = insertedUser.id;

    await db.insert(instagramAccounts).values({
      id: INSTAGRAM_ACCOUNT_ID,
      userId: userRowId,
      username: 'ig_analytics_tester',
      fbPageId: 'page_test_456',
      fbPageAccessToken: encrypt('mock_page_access_token_analytics'),
    });

    // Campaign 1: Draft automation scheduled in the past
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const [draftAuto] = await db
      .insert(automations)
      .values({
        instagramAccountId: INSTAGRAM_ACCOUNT_ID,
        name: 'Scheduled Promo Draft',
        flowType: 'landing_page',
        status: 'draft',
        dmTemplate: 'Check out the landing page: http://localhost:3000/l/promo',
        collectLeads: true,
        leadFields: ['email', 'fullName'],
        landingPageToken: 'draft-lp-token-999',
        scheduledActivateAt: oneMinuteAgo,
      })
      .returning();
    draftAutomationId = draftAuto.id;

    // Campaign 2: Active automation
    const [activeAuto] = await db
      .insert(automations)
      .values({
        instagramAccountId: INSTAGRAM_ACCOUNT_ID,
        name: 'Active Landing Page Campaign',
        flowType: 'landing_page',
        status: 'active',
        dmTemplate: 'Confirm details at: http://localhost:3000/l/active',
        collectLeads: true,
        leadFields: ['email', 'phone', 'fullName'],
        landingPageToken: activeCampaignToken,
      })
      .returning();
    activeAutomationId = activeAuto.id;

    console.log('✅ Created draft and active campaigns in DB.');
  } catch (err) {
    console.error('❌ Failed setting up mock records in DB:', err);
    process.exit(1);
  }

  // 3. Start Test Express Server
  const server = app.listen(TEST_PORT, async () => {
    console.log(`🌐 Test server listening on port ${TEST_PORT}`);

    try {
      // ==========================================================
      // Test 1: Scheduled Automation Scheduler (Unit 23)
      // ==========================================================
      console.log('\n--- TEST 1: Scheduled Activation Scheduler Worker ---');
      
      // Trigger a manual run of the scheduler worker by adding a job to the queue
      await schedulerQueue.add('scheduled-activations', {});
      
      console.log('⏳ Waiting for scheduler worker scan...');
      await sleep(3000);

      // Verify draft automation has been transitioned to active status
      const [updatedDraft] = await db
        .select()
        .from(automations)
        .where(eq(automations.id, draftAutomationId))
        .limit(1);

      console.log(`   - Scheduled Draft Status: ${updatedDraft.status}`);
      if (updatedDraft.status !== 'active') {
        throw new Error(`Expected draft status to be 'active', got '${updatedDraft.status}'`);
      }
      console.log('✅ TEST 1 passed! Draft automation successfully transitioned to active status.');

      // ==========================================================
      // Test 2: Analytics Ingestion & Aggregate Snapshot (Unit 25)
      // ==========================================================
      console.log('\n--- TEST 2: Analytics Ingest and Atomic Snapshots ---');

      // Track a few events for active campaign
      await AnalyticsService.trackEvent({
        instagramAccountId: INSTAGRAM_ACCOUNT_ID,
        automationId: activeAutomationId,
        eventType: 'comment_received',
      });
      await AnalyticsService.trackEvent({
        instagramAccountId: INSTAGRAM_ACCOUNT_ID,
        automationId: activeAutomationId,
        eventType: 'keyword_matched',
      });
      await AnalyticsService.trackEvent({
        instagramAccountId: INSTAGRAM_ACCOUNT_ID,
        automationId: activeAutomationId,
        eventType: 'dm_sent',
      });
      await AnalyticsService.trackEvent({
        instagramAccountId: INSTAGRAM_ACCOUNT_ID,
        automationId: activeAutomationId,
        eventType: 'dm_sent', // 2nd sent
      });
      await AnalyticsService.trackEvent({
        instagramAccountId: INSTAGRAM_ACCOUNT_ID,
        automationId: activeAutomationId,
        eventType: 'dm_failed',
      });

      console.log('⏳ Waiting for analytics worker to process queue...');
      await sleep(3000);

      // Verify raw events logged
      const events = await db
        .select()
        .from(analyticsEvents)
        .where(eq(analyticsEvents.automationId, activeAutomationId));
      
      console.log(`   - Raw events logged in DB: ${events.length}`);
      if (events.length !== 5) {
        throw new Error(`Expected exactly 5 raw analytics events, found ${events.length}`);
      }

      // Verify atomic increments in snapshots
      const snapshots = await db
        .select()
        .from(analyticsSnapshots)
        .where(eq(analyticsSnapshots.automationId, activeAutomationId));

      if (snapshots.length !== 1) {
        throw new Error(`Expected exactly 1 snapshot aggregate row, found ${snapshots.length}`);
      }

      const snap = snapshots[0];
      console.log('   - Aggregated Snapshot columns:');
      console.log(`     - commentsCount: ${snap.commentsCount} (Expected: 1)`);
      console.log(`     - keywordsMatched: ${snap.keywordsMatched} (Expected: 1)`);
      console.log(`     - dmsSent: ${snap.dmsSent} (Expected: 2)`);
      console.log(`     - failuresCount: ${snap.failuresCount} (Expected: 1)`);

      if (snap.commentsCount !== 1 || snap.keywordsMatched !== 1 || snap.dmsSent !== 2 || snap.failuresCount !== 1) {
        throw new Error('Aggregate values in snapshots table mismatch the expected increments.');
      }
      console.log('✅ TEST 2 passed! Atomic metrics increments validated successfully.');

      // ==========================================================
      // Test 3: Public Campaign Resolve API (Unit 21)
      // ==========================================================
      console.log('\n--- TEST 3: Public Campaign Details endpoint ---');

      const campRes = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: `/api/public/campaigns/${activeCampaignToken}`,
        method: 'GET',
      });

      console.log(`Public Campaign Resolve status: ${campRes.status}`);
      if (campRes.status !== 200) {
        throw new Error(`Expected status 200, got ${campRes.status}`);
      }

      const campJson = JSON.parse(campRes.body);
      console.log(`   - Resolved campaign name: "${campJson.name}"`);
      console.log(`   - Resolved lead fields: ${JSON.stringify(campJson.leadFields)}`);

      if (campJson.id !== activeAutomationId || campJson.name !== 'Active Landing Page Campaign') {
        throw new Error('Resolved campaign metadata fields do not match.');
      }
      console.log('✅ TEST 3 passed! Public campaign details API works.');

      // ==========================================================
      // Test 4: Public Lead Capture Submit Form Validation (Unit 21)
      // ==========================================================
      console.log('\n--- TEST 4: Lead submission validation constraints ---');

      // Attempt submission with missing fields (Active campaign requires email, phone, fullName)
      const invalidPayload = JSON.stringify({
        landingPageToken: activeCampaignToken,
        email: 'invalid-email-format',
        phone: '123',
      });

      const submitResInvalid = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/public/leads/submit',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(invalidPayload),
        },
      }, invalidPayload);

      console.log(`Lead Submission Ingest status (with invalid values): ${submitResInvalid.status}`);
      if (submitResInvalid.status !== 422) {
        throw new Error(`Expected status 422 Unprocessable Entity, got ${submitResInvalid.status}`);
      }

      const errJson = JSON.parse(submitResInvalid.body);
      console.log(`   - Received Validation errors: ${JSON.stringify(errJson.errors)}`);
      if (!errJson.errors || errJson.errors.length === 0) {
        throw new Error('Expected validation errors list, found none.');
      }
      console.log('✅ TEST 4 passed! Invalid fields rejected with 422 Unprocessable Entity.');

      // ==========================================================
      // Test 5: Valid Public Lead Form submission (Unit 21)
      // ==========================================================
      console.log('\n--- TEST 5: Successful Lead submission and background logging ---');

      const validPayload = JSON.stringify({
        landingPageToken: activeCampaignToken,
        email: 'supporter@gmail.com',
        phone: '+91 9988112233',
        fullName: 'Supportive Follower',
      });

      const submitResValid = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/public/leads/submit',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(validPayload),
        },
      }, validPayload);

      console.log(`Lead Submission Ingest status (valid values): ${submitResValid.status}`);
      if (submitResValid.status !== 200) {
        throw new Error(`Expected status 200 OK, got ${submitResValid.status}`);
      }

      console.log('⏳ Waiting for background analytics tracking...');
      await sleep(3000);

      // Verify Lead persisted in DB
      const dbLeads = await db
        .select()
        .from(leads)
        .where(eq(leads.automationId, activeAutomationId));

      console.log(`   - Leads written to database: ${dbLeads.length}`);
      if (dbLeads.length !== 1) {
        throw new Error(`Expected exactly 1 lead in database, found ${dbLeads.length}`);
      }

      const leadRecord = dbLeads[0];
      console.log(`     - Name: "${leadRecord.fullName}"`);
      console.log(`     - Email: "${leadRecord.email}"`);
      console.log(`     - Phone: "${leadRecord.phone}"`);
      console.log(`     - Generated igUserId: "${leadRecord.igUserId}"`);

      if (leadRecord.email !== 'supporter@gmail.com' || leadRecord.phone !== '9988112233' || !leadRecord.igUserId.startsWith('web_')) {
        throw new Error('Lead DB record columns do not match valid submission inputs.');
      }

      // Verify lead_collected tracked in snapshot
      const finalSnapshots = await db
        .select()
        .from(analyticsSnapshots)
        .where(eq(analyticsSnapshots.automationId, activeAutomationId));
      
      const updatedSnap = finalSnapshots[0];
      console.log(`     - leadsCollected in snapshot: ${updatedSnap.leadsCollected} (Expected: 1)`);
      if (updatedSnap.leadsCollected !== 1) {
        throw new Error(`Expected 1 lead collected in snapshot, found ${updatedSnap.leadsCollected}`);
      }

      console.log('✅ TEST 5 passed! Valid form submission successfully captured lead details, generated igUserId, and registered analytics.');

      console.log('\n🎉 ALL INTEGRATION TESTS FOR UNITS 21-25 PASSED SUCCESSFULLY!');
    } catch (testError) {
      console.error('\n❌ E2E tests failed:', testError);
      process.exitCode = 1;
    } finally {
      // 4. Cleanup and Shutdown
      console.log('\n🧹 Cleaning up test users and connections...');
      try {
        await db.delete(users).where(eq(users.clerkUserId, USER_CLERK));
        console.log('✅ Database cleaned up.');
      } catch (err) {
        console.error('❌ Failed cleaning up database test rows:', err);
      }

      server.close(async () => {
        console.log('🔌 Test server shut down.');
        await schedulerQueue.close();
        await analyticsQueue.close();
        await redis.quit();
        process.exit(process.exitCode || 0);
      });
    }
  });
}

runTests();
