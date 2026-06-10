import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

/**
 * Express middleware to verify Meta webhook signatures in a timing-safe manner.
 * Requires `req.rawBody` to be captured prior to JSON parsing.
 */
export function verifyMetaSignature(req: Request, res: Response, next: NextFunction) {
  const signatureHeader = req.headers['x-hub-signature-256'];
  if (!signatureHeader || typeof signatureHeader !== 'string') {
    console.warn('⚠️ Webhook request missing x-hub-signature-256 header');
    return res.status(403).json({ error: 'Missing x-hub-signature-256 header' });
  }

  const parts = signatureHeader.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    console.warn('⚠️ Webhook request has invalid x-hub-signature-256 format');
    return res.status(403).json({ error: 'Invalid x-hub-signature-256 format' });
  }

  const actualSignature = parts[1];
  const appSecret = env.META_APP_SECRET;

  if (!appSecret) {
    console.error('❌ META_APP_SECRET is not configured in env variables');
    return res.status(403).json({ error: 'Meta App Secret not configured' });
  }

  const rawBody = (req as any).rawBody;
  if (!rawBody) {
    console.error('❌ Raw body buffer was not captured. Ensure express.json() parser is configured with verify.');
    return res.status(500).json({ error: 'Internal configuration error: raw body missing' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');

  const actualBuffer = Buffer.from(actualSignature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    console.warn('⚠️ Webhook request signature mismatch');
    return res.status(403).json({ error: 'Invalid signature' });
  }

  next();
}
