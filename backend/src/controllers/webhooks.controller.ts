import crypto from 'crypto';
import { Request, Response } from 'express';
import { env } from '../config/env';
import { redis } from '../config/redis';
import { db } from '../config/db';
import { webhookEvents } from '../../../db/schema';
import { commentQueue } from '../queues/comment.queue';
import { leadQueue } from '../queues/lead.queue';

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

    const entry = payload.entry?.[0];
    const messaging = entry?.messaging?.[0];
    const change = entry?.changes?.[0];

    const isMessaging = !!messaging;
    const commentId = change?.value?.id;
    const messageId = messaging?.message?.mid;

    // 1. Redis deduplication logic check
    let dedupKey: string;
    if (isMessaging) {
      dedupKey = messageId 
        ? `webhook:dedup:${messageId}` 
        : `webhook:dedup:hash:${crypto.createHash('md5').update(rawBody).digest('hex')}`;
    } else {
      dedupKey = commentId 
        ? `webhook:dedup:${commentId}` 
        : `webhook:dedup:hash:${crypto.createHash('md5').update(rawBody).digest('hex')}`;
    }

    // Set with EX (expire 24h) + NX (only if not exists) — ioredis v5 argument order
    const isNew = await redis.set(dedupKey, '1', 'EX', 86400, 'NX');

    if (!isNew) {
      console.log(`ℹ️ Duplicate webhook event ignored. Key: ${dedupKey}`);
      // Return 200 OK to Meta to avoid retries, but skip processing
      return res.status(200).send('Duplicate event');
    }

    // 2. Extract metadata for database logging
    let igUserId = 'unknown';
    let eventType = 'unknown';

    if (isMessaging) {
      igUserId = messaging?.recipient?.id || 'unknown';
      eventType = 'messages';
    } else {
      igUserId = entry?.id || 'unknown';
      eventType = change?.field || 'unknown';
    }

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

    // 4. Enqueue background job via BullMQ
    if (isMessaging) {
      const senderId = messaging?.sender?.id;
      const messageText = messaging?.message?.text;

      await leadQueue.add('lead-processor', {
        igUserId: senderId,
        igUsername: null, // Meta DM payload doesn't include username by default
        instagramAccountId: igUserId,
        text: messageText,
        messageId: messageId,
      });

      const elapsed = Date.now() - startTime;
      console.log(`🚀 Webhook (DM) ingested & queued to lead-processor in ${elapsed}ms (DB ID: ${insertedEvent.id})`);
    } else {
      await commentQueue.add('comment-ingest', {
        webhookEventId: insertedEvent.id,
        payload,
      });

      const elapsed = Date.now() - startTime;
      console.log(`🚀 Webhook (Comment) ingested & queued to comment-ingest in ${elapsed}ms (DB ID: ${insertedEvent.id})`);
    }

    // Return 200 OK under sub-200ms timing guarantee
    return res.status(200).json({ success: true, eventId: insertedEvent.id });
  } catch (err: any) {
    console.error('❌ Error ingesting webhook event:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
