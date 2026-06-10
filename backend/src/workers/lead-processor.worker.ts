import { Worker, Job } from 'bullmq';
import { createRedisClient } from '../queues/connection';
import { db } from '../config/db';
import { leads, dmJobs, automations } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { LeadSessionService } from '../services/lead-session.service';
import { LeadParserService } from '../services/lead-parser.service';
import { dmQueue } from '../queues/dm.queue';
import { AnalyticsService } from '../services/analytics.service';

const connection = createRedisClient();

export const leadProcessorWorker = new Worker(
  'lead-processor',
  async (job: Job) => {
    const { igUserId, igUsername, instagramAccountId, text, messageId } = job.data;
    console.log(`🤖 [Lead-Processor Worker] Processing DM from ${igUserId}: "${text}"`);

    // 1. Fetch active session from Redis
    const session = await LeadSessionService.getSession(igUserId);

    if (!session) {
      console.log(`ℹ️ [Lead-Processor Worker] No active lead session for user ${igUserId}. Ignoring message.`);
      return;
    }

    if (session.instagramAccountId !== instagramAccountId) {
      console.warn(`⚠️ [Lead-Processor Worker] Session instagramAccountId mismatch: ${session.instagramAccountId} vs ${instagramAccountId}. Ignoring.`);
      return;
    }

    const currentField = session.fieldsToCollect[session.currentFieldIndex];
    console.log(`🤖 [Lead-Processor Worker] Validating field "${currentField}" (Index: ${session.currentFieldIndex})`);

    // 2. Validate user input against field type
    let parsedValue: string | null = null;
    let warningMessage = 'Invalid input. Please try again.';

    if (currentField === 'email') {
      parsedValue = LeadParserService.parseEmail(text);
      warningMessage = "That doesn't look like a valid email. Please try again.";
    } else if (currentField === 'phone') {
      parsedValue = LeadParserService.parseIndianPhone(text);
      warningMessage = "That doesn't look like a valid 10-digit phone number. Please try again.";
    } else {
      // Fallback for custom fields: accept non-empty text
      const cleanVal = text?.trim();
      if (cleanVal) {
        parsedValue = cleanVal;
      }
    }

    // 3. Handle Validation FAILURE
    if (parsedValue === null) {
      console.log(`❌ [Lead-Processor Worker] Validation failed for field "${currentField}". Sending warning DM.`);
      
      // Insert warning DM into dm_jobs
      const [insertedDmJob] = await db
        .insert(dmJobs)
        .values({
          automationId: session.automationId,
          instagramAccountId: session.instagramAccountId,
          recipientIgId: session.igUserId,
          recipientUsername: session.igUsername,
          commentId: 'dm_validation_warning',
          commentText: text,
          messageText: warningMessage,
          status: 'queued',
        })
        .returning();

      // Enqueue warning message
      await dmQueue.add('dm-sender', {
        dmJobId: insertedDmJob.id,
        instagramAccountId: session.instagramAccountId,
      });

      return;
    }

    // 4. Handle Validation SUCCESS
    console.log(`✅ [Lead-Processor Worker] Validation succeeded for "${currentField}": "${parsedValue}"`);
    const updatedCollectedData = {
      ...session.collectedData,
      [currentField]: parsedValue,
    };

    const nextFieldIndex = session.currentFieldIndex + 1;

    // A. Check if we have MORE fields to collect
    if (nextFieldIndex < session.fieldsToCollect.length) {
      const nextField = session.fieldsToCollect[nextFieldIndex];
      let promptMessage = `Please reply with your ${nextField}.`;

      if (nextField === 'email') {
        promptMessage = 'Thanks! Please reply with your email address.';
      } else if (nextField === 'phone') {
        promptMessage = 'Thanks! Now, please reply with your 10-digit phone number.';
      }

      console.log(`⏳ [Lead-Processor Worker] Flow incomplete. Prompting for next field: "${nextField}".`);

      // Insert next prompt DM into dm_jobs
      const [insertedDmJob] = await db
        .insert(dmJobs)
        .values({
          automationId: session.automationId,
          instagramAccountId: session.instagramAccountId,
          recipientIgId: session.igUserId,
          recipientUsername: session.igUsername,
          commentId: 'dm_prompt_next',
          commentText: text,
          messageText: promptMessage,
          status: 'queued',
        })
        .returning();

      // Enqueue next prompt DM
      await dmQueue.add('dm-sender', {
        dmJobId: insertedDmJob.id,
        instagramAccountId: session.instagramAccountId,
      });

      // Update Redis session
      await LeadSessionService.updateSession(igUserId, {
        currentFieldIndex: nextFieldIndex,
        collectedData: updatedCollectedData,
      });

    } else {
      // B. ALL FIELDS COLLECTED - Complete the flow!
      console.log('🎉 [Lead-Processor Worker] All fields captured. Saving lead & sending final payload.');

      // 1. Delete session from Redis
      await LeadSessionService.deleteSession(igUserId);

      // 2. Fetch the Automation configuration
      const [automation] = await db
        .select()
        .from(automations)
        .where(eq(automations.id, session.automationId))
        .limit(1);

      if (!automation) {
        console.error(`❌ [Lead-Processor Worker] Automation ${session.automationId} not found at final step.`);
        return;
      }

      // 3. Insert Lead record into Postgres
      try {
        await db.insert(leads).values({
          automationId: session.automationId,
          instagramAccountId: session.instagramAccountId,
          igUserId: session.igUserId,
          igUsername: session.igUsername,
          email: updatedCollectedData.email || null,
          phone: updatedCollectedData.phone || null,
          sourceComment: session.sourceComment,
          sourceDmJobId: session.sourceDmJobId,
        });
        console.log(`✅ [Lead-Processor Worker] Lead persisted successfully.`);

        // Track lead_collected event
        await AnalyticsService.trackEvent({
          instagramAccountId: session.instagramAccountId,
          automationId: session.automationId,
          eventType: 'lead_collected',
          payload: { email: updatedCollectedData.email, phone: updatedCollectedData.phone },
        });
      } catch (err: any) {
        // Unique key constraint collision (pg error code 23505)
        if (err.code === '23505') {
          console.warn(`⚠️ [Lead-Processor Worker] Duplicate lead detected for campaign ${session.automationId} and user ${session.igUserId}. Proceeding without duplicate insertion.`);
        } else {
          console.error(`❌ [Lead-Processor Worker] Failed to persist lead:`, err);
        }
      }

      // 4. Send the final template DM
      const [insertedDmJob] = await db
        .insert(dmJobs)
        .values({
          automationId: session.automationId,
          instagramAccountId: session.instagramAccountId,
          recipientIgId: session.igUserId,
          recipientUsername: session.igUsername,
          commentId: 'dm_final_template',
          commentText: text,
          messageText: automation.dmTemplate,
          status: 'queued',
        })
        .returning();

      // Enqueue final DM
      await dmQueue.add('dm-sender', {
        dmJobId: insertedDmJob.id,
        instagramAccountId: session.instagramAccountId,
      });
    }
  },
  {
    connection: connection as any,
    concurrency: 5,
  }
);

leadProcessorWorker.on('completed', (job) => {
  console.log(`🎉 [Lead-Processor Worker] Job ${job.id} completed successfully`);
});

leadProcessorWorker.on('failed', (job, err) => {
  console.error(`⚠️ [Lead-Processor Worker] Job ${job?.id} failed:`, err);
});
