import crypto from 'crypto';
import { Request, Response } from 'express';
import { env } from '../config/env';
import { redis } from '../config/redis';
import { db } from '../config/db';
import { webhookEvents } from '../../../db/schema';
import { commentQueue } from '../queues/comment.queue';

/**
 * Handle subscription validation challenge from Meta.
 */
export async function verifyWebhook(req: Request, res: Response) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.META_VERIFY_TOKEN) {
    console.log('✅ Meta Webhook subscription verified successfully.');
    // Respond directly with the plain text challenge string as required by Meta
    return res.status(200).send(challenge);
  }

  console.warn(`⚠️ Webhook verification challenge failed. Mode: ${mode}, Token Match: ${token === env.META_VERIFY_TOKEN}`);
  return res.status(403).send('Forbidden');
}

/**
 * Capture webhook payload, log to db, deduplicate, and enqueue for processing.
 */
export async function ingestWebhook(req: Request, res: Response) {
  const startTime = Date.now();
  try {
    const payload = req.body;
    const rawBody = (req as any).rawBody || Buffer.from(JSON.stringify(payload));

    // 1. Redis deduplication logic check
    // We expect standard comment webhooks payload to have entry -> changes -> value -> id (commentId).
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const commentId = change?.value?.id;

    // Deduplication Key:
    // If we have a commentId, deduplicate on it. Else fallback to MD5 hash of raw body.
    const dedupKey = commentId 
      ? `webhook:dedup:${commentId}` 
      : `webhook:dedup:hash:${crypto.createHash('md5').update(rawBody).digest('hex')}`;

    // Set NX (Not Exists) and EX (expire in 24 hours = 86400 seconds)
    const isNew = await redis.set(dedupKey, '1', 'NX', 'EX', 86400);

    if (!isNew) {
      console.log(`ℹ️ Duplicate webhook event ignored. Key: ${dedupKey}`);
      // Return 200 OK to Meta to avoid retries, but skip processing
      return res.status(200).send('Duplicate event');
    }

    // 2. Extract metadata for database logging
    const igUserId = entry?.id || 'unknown';
    const eventType = change?.field || 'unknown';

    // 3. Persist raw event to database (Unit 13)
    const [insertedEvent] = await db
      .insert(webhookEvents)
      .values({
        igUserId,
        eventType,
        rawPayload: payload,
        processed: false,
        skippable: false,
      })
      .returning();

    // 4. Enqueue background job via BullMQ (Unit 15)
    await commentQueue.add('comment-ingest', {
      webhookEventId: insertedEvent.id,
      payload,
    });

    const elapsed = Date.now() - startTime;
    console.log(`🚀 Webhook ingested & queued successfully in ${elapsed}ms (DB ID: ${insertedEvent.id})`);

    // Return 200 OK under sub-200ms timing guarantee
    return res.status(200).json({ success: true, eventId: insertedEvent.id });
  } catch (err: any) {
    console.error('❌ Error ingesting webhook event:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
