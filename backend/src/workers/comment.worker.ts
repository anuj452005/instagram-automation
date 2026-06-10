import { Worker, Job } from 'bullmq';
import { createRedisClient } from '../queues/connection';
import { db } from '../config/db';
import { webhookEvents, automations, automationKeywords, dmJobs } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { MatcherService } from '../services/matcher.service';
import { LeadSessionService } from '../services/lead-session.service';
import { dmQueue } from '../queues/dm.queue';
import { AnalyticsService } from '../services/analytics.service';

const connection = createRedisClient();

export const commentWorker = new Worker(
  'comment-ingest',
  async (job: Job) => {
    const { webhookEventId, payload } = job.data;
    console.log(`🤖 [Worker] Processing webhook event: ${webhookEventId}`);

    try {
      // Parse payload to extract commenter's ID and post ID
      const entry = payload?.entry?.[0];
      const change = entry?.changes?.[0];
      const changeValue = change?.value;

      const commenterId = changeValue?.from?.id;
      const commenterUsername = changeValue?.from?.username;
      const postId = changeValue?.media?.id;
      const commentId = changeValue?.id;
      const commentText = changeValue?.text;
      const igUserId = entry?.id || 'unknown';

      console.log(`💬 [Worker] Extracted comment details:`);
      console.log(`   - Commenter ID: ${commenterId || 'N/A'}`);
      console.log(`   - Commenter Username: ${commenterUsername || 'N/A'}`);
      console.log(`   - Post ID: ${postId || 'N/A'}`);
      console.log(`   - Comment ID: ${commentId || 'N/A'}`);
      console.log(`   - Text: "${commentText || ''}"`);

      if (commenterId && commentText && igUserId) {
        // 1. Fetch active automations and keywords for the receiving Instagram account
        const activeTriggers = await db
          .select({
            automation: automations,
            keyword: automationKeywords,
          })
          .from(automations)
          .innerJoin(
            automationKeywords,
            eq(automations.id, automationKeywords.automationId)
          )
          .where(
            and(
              eq(automations.instagramAccountId, igUserId),
              eq(automations.status, 'active')
            )
          );

        // 2. Sort triggers: post-specific triggers before global triggers
        const sortedTriggers = [...activeTriggers].sort((a, b) => {
          const aIsPostSpecific = a.automation.postId === postId;
          const bIsPostSpecific = b.automation.postId === postId;
          if (aIsPostSpecific && !bIsPostSpecific) return -1;
          if (!aIsPostSpecific && bIsPostSpecific) return 1;
          return 0;
        });

        // 3. Find first matching trigger
        let matchedTrigger = null;
        for (const trigger of sortedTriggers) {
          const { automation, keyword } = trigger;

          // If the automation is post-specific, it must match the current post ID
          if (automation.postId && automation.postId !== postId) {
            continue;
          }

          const isMatch = MatcherService.match(
            commentText,
            keyword.keyword,
            keyword.matchType as any
          );

          if (isMatch) {
            matchedTrigger = trigger;
            break;
          }
        }

        // 4. If match is found, handle lead capture initialization and DM queuing
        if (matchedTrigger) {
          console.log(`🎯 Automation match found for keyword "${matchedTrigger.keyword.keyword}" (Automation ID: ${matchedTrigger.automation.id})`);

          // Track comment_received & keyword_matched events
          await AnalyticsService.trackEvent({
            instagramAccountId: igUserId,
            automationId: matchedTrigger.automation.id,
            eventType: 'comment_received',
            payload: { commentId, text: commentText },
          });

          await AnalyticsService.trackEvent({
            instagramAccountId: igUserId,
            automationId: matchedTrigger.automation.id,
            eventType: 'keyword_matched',
            payload: { keyword: matchedTrigger.keyword.keyword, matchType: matchedTrigger.keyword.matchType },
          });

          const collectLeads = matchedTrigger.automation.collectLeads;
          const fieldsToCollect = matchedTrigger.automation.leadFields || ['email'];
          let messageText = matchedTrigger.automation.dmTemplate;

          if (collectLeads && fieldsToCollect.length > 0) {
            const firstField = fieldsToCollect[0];
            if (firstField === 'email') {
              messageText = 'Thanks for your comment! Please reply with your email address to receive the link.';
            } else if (firstField === 'phone') {
              messageText = 'Thanks for your comment! Please reply with your 10-digit phone number.';
            } else {
              messageText = `Thanks for your comment! Please reply with your ${firstField}.`;
            }
          }

          try {
            // Insert a queued record into dm_jobs (prevents duplicates via UNIQUE index)
            const [insertedDmJob] = await db
              .insert(dmJobs)
              .values({
                automationId: matchedTrigger.automation.id,
                instagramAccountId: igUserId,
                recipientIgId: commenterId,
                recipientUsername: commenterUsername,
                commentId: commentId,
                commentText: commentText,
                keywordMatched: matchedTrigger.keyword.keyword,
                messageText: messageText,
                status: 'queued',
              })
              .returning();

            // Initialize Redis session if lead capture is active
            if (collectLeads && fieldsToCollect.length > 0) {
              await LeadSessionService.createSession(commenterId, {
                automationId: matchedTrigger.automation.id,
                instagramAccountId: igUserId,
                igUserId: commenterId,
                igUsername: commenterUsername,
                currentFieldIndex: 0,
                fieldsToCollect,
                collectedData: {},
                sourceComment: commentText,
                sourceDmJobId: insertedDmJob.id,
              });
              console.log(`🔑 [Worker] Initialized lead session for user ${commenterId}`);
            }

            // Enqueue DM to the outbound rate-limited queue
            await dmQueue.add('dm-sender', {
              dmJobId: insertedDmJob.id,
              instagramAccountId: igUserId,
            });
            console.log(`🚀 [Worker] Outbound DM job queued for DM Job ID: ${insertedDmJob.id}`);
          } catch (dbErr: any) {
            if (dbErr.code === '23505') {
              console.log(`ℹ️ [Worker] Duplicate DM prevention triggered. User ${commenterId} has already interacted with automation campaign ${matchedTrigger.automation.id}. Skipping.`);
            } else {
              throw dbErr;
            }
          }
        } else {
          console.log(`ℹ️ [Worker] No matching automation found for comment text: "${commentText}"`);
          
          // Track comment_received with null automationId
          await AnalyticsService.trackEvent({
            instagramAccountId: igUserId,
            automationId: null,
            eventType: 'comment_received',
            payload: { commentId, text: commentText },
          });
        }
      }

      // Update database row in webhook_events to marked processed = true
      await db
        .update(webhookEvents)
        .set({
          processed: true,
          processedAt: new Date(),
        })
        .where(eq(webhookEvents.id, webhookEventId));

      console.log(`✅ [Worker] Webhook event ${webhookEventId} marked as processed.`);
    } catch (err: any) {
      console.error(`❌ [Worker] Error processing webhook event ${webhookEventId}:`, err);

      // Save error details in DB
      await db
        .update(webhookEvents)
        .set({
          processed: false,
          processingError: err.message || String(err),
        })
        .where(eq(webhookEvents.id, webhookEventId));

      throw err; // Rethrow to let BullMQ handle retry / failure state
    }
  },
  {
    connection: connection as any,
    concurrency: 5,
  }
);

commentWorker.on('completed', (job) => {
  console.log(`🎉 [Worker] Job ${job.id} completed successfully`);
});

commentWorker.on('failed', (job, err) => {
  console.error(`⚠️ [Worker] Job ${job?.id} failed:`, err);
});
