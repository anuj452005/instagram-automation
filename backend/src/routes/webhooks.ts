import { Router } from 'express';
import { verifyWebhook, ingestWebhook } from '../controllers/webhooks.controller';
import { verifyMetaSignature } from '../services/webhook-verifier.service';

const router = Router();

// subscription verification challenge from Meta
router.get('/instagram', verifyWebhook);

// incoming webhook payload ingestion with timing-safe signature verification middleware
router.post('/instagram', verifyMetaSignature, ingestWebhook);

export const webhooksRouter = router;
