import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { syncUser } from '../middleware/syncUser.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  createAutomation,
  getAutomations,
  getAutomationById,
  updateAutomation,
  deleteAutomation,
} from '../controllers/automations.controller';
import { z } from 'zod';

const router = Router();

// Zod schemas for request validation
const createAutomationSchema = z.object({
  body: z.object({
    instagramAccountId: z.string().min(1, 'instagramAccountId is required'),
    name: z.string().min(1, 'Automation name is required').max(255),
    flowType: z.enum(['dm', 'landing_page']),
    dmTemplate: z.string().min(1, 'DM template is required'),
    status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
    postId: z.string().nullable().optional(),
    postUrl: z.string().nullable().optional(),
    postType: z.enum(['FEED', 'REEL', 'STORY']).nullable().optional(),
    collectLeads: z.boolean().optional(),
    leadFields: z.array(z.string()).optional(),
    landingPageToken: z.string().nullable().optional(),
    alsoReplyComment: z.boolean().optional(),
    commentReplyText: z.string().nullable().optional(),
    scheduledActivateAt: z.string().nullable().optional(),
    keywords: z
      .array(
        z.object({
          keyword: z.string().min(1, 'Keyword string cannot be empty'),
          matchType: z.enum(['exact', 'contains', 'starts_with']).optional(),
        })
      )
      .min(1, 'At least one keyword is required'),
  }),
});

const updateAutomationSchema = z.object({
  body: z.object({
    instagramAccountId: z.string().min(1).optional(),
    name: z.string().min(1).max(255).optional(),
    flowType: z.enum(['dm', 'landing_page']).optional(),
    dmTemplate: z.string().min(1).optional(),
    status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
    postId: z.string().nullable().optional(),
    postUrl: z.string().nullable().optional(),
    postType: z.enum(['FEED', 'REEL', 'STORY']).nullable().optional(),
    collectLeads: z.boolean().optional(),
    leadFields: z.array(z.string()).optional(),
    landingPageToken: z.string().nullable().optional(),
    alsoReplyComment: z.boolean().optional(),
    commentReplyText: z.string().nullable().optional(),
    scheduledActivateAt: z.string().nullable().optional(),
    keywords: z
      .array(
        z.object({
          keyword: z.string().min(1, 'Keyword string cannot be empty'),
          matchType: z.enum(['exact', 'contains', 'starts_with']).optional(),
        })
      )
      .min(1)
      .optional(),
  }),
});

// All endpoints require session validation & postgres profile synchronization
router.post(
  '/',
  authMiddleware,
  syncUser,
  validateRequest(createAutomationSchema),
  createAutomation
);

router.get(
  '/',
  authMiddleware,
  syncUser,
  getAutomations
);

router.get(
  '/:id',
  authMiddleware,
  syncUser,
  getAutomationById
);

router.put(
  '/:id',
  authMiddleware,
  syncUser,
  validateRequest(updateAutomationSchema),
  updateAutomation
);

router.delete(
  '/:id',
  authMiddleware,
  syncUser,
  deleteAutomation
);

export const automationsRouter = router;
