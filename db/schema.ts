import { pgTable, uuid, varchar, timestamp, integer, text, boolean, uniqueIndex, index, jsonb, date, inet } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('user').notNull(),
  subscriptionTier: varchar('subscription_tier', { length: 50 }).default('free').notNull(),
  subscriptionStatus: varchar('subscription_status', { length: 50 }).default('active').notNull(),
  subscriptionId: varchar('subscription_id', { length: 255 }),
  razorpayCustomerId: varchar('razorpay_customer_id', { length: 255 }),
  subscriptionEndsAt: timestamp('subscription_ends_at'),
  monthlyDmCount: integer('monthly_dm_count').default(0).notNull(),
  dmCountResetAt: timestamp('dm_count_reset_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const instagramAccounts = pgTable('instagram_accounts', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  username: varchar('username', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  profilePictureUrl: text('profile_picture_url'),
  fbPageId: varchar('fb_page_id', { length: 255 }).notNull(),
  fbPageAccessToken: text('fb_page_access_token').notNull(),
  tokenStatus: varchar('token_status', { length: 50 }).default('valid').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  followersCount: integer('followers_count').default(0).notNull(),
  connectedAt: timestamp('connected_at').defaultNow().notNull(),
  lastTokenRefresh: timestamp('last_token_refresh'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    userInstagramUniqueIndex: uniqueIndex('user_instagram_unique_idx').on(table.userId, table.id),
  };
});

export const automations = pgTable('automations', {
  id: uuid('id').primaryKey().defaultRandom(),
  instagramAccountId: varchar('instagram_account_id', { length: 255 })
    .references(() => instagramAccounts.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('draft').notNull(), // draft | active | paused | archived
  postId: varchar('post_id', { length: 255 }), // null = global trigger
  postUrl: text('post_url'),
  postType: varchar('post_type', { length: 20 }), // FEED | REEL | STORY
  flowType: varchar('flow_type', { length: 50 }).notNull(), // dm | landing_page
  dmTemplate: text('dm_template').notNull(),
  collectLeads: boolean('collect_leads').default(false).notNull(),
  leadFields: jsonb('lead_fields').default(['email']).$type<string[]>(),
  landingPageToken: varchar('landing_page_token', { length: 100 }),
  alsoReplyComment: boolean('also_reply_comment').default(false).notNull(),
  commentReplyText: text('comment_reply_text'),
  scheduledActivateAt: timestamp('scheduled_activate_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    instagramAccountIdIdx: index('automations_instagram_account_id_idx').on(table.instagramAccountId),
  };
});

export const automationKeywords = pgTable('automation_keywords', {
  id: uuid('id').primaryKey().defaultRandom(),
  automationId: uuid('automation_id')
    .references(() => automations.id, { onDelete: 'cascade' })
    .notNull(),
  keyword: varchar('keyword', { length: 255 }).notNull(),
  matchType: varchar('match_type', { length: 50 }).default('exact').notNull(), // exact | contains | starts_with
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    automationIdIdx: index('automation_keywords_automation_id_idx').on(table.automationId),
  };
});

export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  igUserId: varchar('ig_user_id', { length: 100 }).notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  rawPayload: jsonb('raw_payload').notNull(),
  processed: boolean('processed').default(false).notNull(),
  skippable: boolean('skippable').default(false).notNull(),
  processingError: text('processing_error'),
  receivedAt: timestamp('received_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
}, (table) => {
  return {
    unprocessedIdx: index('webhook_events_unprocessed_idx')
      .on(table.processed, table.receivedAt)
      .where(sql`processed = false AND skippable = false`),
  };
});


export const dmJobs = pgTable('dm_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  automationId: uuid('automation_id')
    .references(() => automations.id, { onDelete: 'cascade' })
    .notNull(),
  instagramAccountId: varchar('instagram_account_id', { length: 255 })
    .references(() => instagramAccounts.id, { onDelete: 'cascade' })
    .notNull(),
  recipientIgId: varchar('recipient_ig_id', { length: 100 }).notNull(),
  recipientUsername: varchar('recipient_username', { length: 100 }),
  commentId: varchar('comment_id', { length: 100 }).notNull(),
  commentText: text('comment_text'),
  keywordMatched: varchar('keyword_matched', { length: 255 }),
  messageText: text('message_text'),
  status: varchar('status', { length: 50 }).default('queued').notNull(), // queued | sent | failed | skipped | rate_limited
  attempts: integer('attempts').default(0).notNull(),
  lastError: text('last_error'),
  errorCode: varchar('error_code', { length: 100 }),
  bullmqJobId: varchar('bullmq_job_id', { length: 255 }),
  queuedAt: timestamp('queued_at').defaultNow().notNull(),
  sentAt: timestamp('sent_at'),
  failedAt: timestamp('failed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    automationRecipientUniqueIdx: uniqueIndex('automation_recipient_unique_idx')
      .on(table.automationId, table.recipientIgId)
      .where(sql`status NOT IN ('failed', 'skipped') AND comment_id NOT LIKE 'dm_%'`),
  };
});

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  automationId: uuid('automation_id')
      .references(() => automations.id, { onDelete: 'set null' }),
  instagramAccountId: varchar('instagram_account_id', { length: 255 }).notNull(),
  igUserId: varchar('ig_user_id', { length: 100 }).notNull(),
  igUsername: varchar('ig_username', { length: 100 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  fullName: varchar('full_name', { length: 255 }),
  sourceComment: text('source_comment'),
  sourceDmJobId: uuid('source_dm_job_id')
    .references(() => dmJobs.id, { onDelete: 'set null' }),
  capturedAt: timestamp('captured_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    automationIgUserUniqueIdx: uniqueIndex('automation_ig_user_unique_idx')
      .on(table.automationId, table.igUserId),
  };
});

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  instagramAccountId: varchar('instagram_account_id', { length: 255 }).notNull(),
  automationId: uuid('automation_id')
    .references(() => automations.id, { onDelete: 'set null' }),
  eventType: varchar('event_type', { length: 50 }).notNull(), // comment_received | keyword_matched | dm_sent | dm_failed | lead_collected
  payload: jsonb('payload'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    instagramAccountIdCreatedAtIdx: index('analytics_events_ig_acct_created_at_idx').on(table.instagramAccountId, table.createdAt),
  };
});

export const analyticsSnapshots = pgTable('analytics_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  instagramAccountId: varchar('instagram_account_id', { length: 255 })
    .references(() => instagramAccounts.id, { onDelete: 'cascade' })
    .notNull(),
  automationId: uuid('automation_id')
    .references(() => automations.id, { onDelete: 'cascade' })
    .notNull(),
  date: date('date').notNull(),
  commentsCount: integer('comments_count').default(0).notNull(),
  keywordsMatched: integer('keywords_matched').default(0).notNull(),
  dmsSent: integer('dms_sent').default(0).notNull(),
  failuresCount: integer('failures_count').default(0).notNull(),
  leadsCollected: integer('leads_collected').default(0).notNull(),
}, (table) => {
  return {
    snapshotUniqueIdx: uniqueIndex('analytics_snapshots_unique_idx').on(table.instagramAccountId, table.automationId, table.date),
  };
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  actorType: varchar('actor_type', { length: 50 }).default('user').notNull(), // user | system | admin | worker
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }),
  entityId: uuid('entity_id'),
  oldData: jsonb('old_data'),
  newData: jsonb('new_data'),
  ipAddress: inet('ip_address'),
  requestId: varchar('request_id', { length: 100 }),
  occurredAt: timestamp('occurred_at').defaultNow().notNull(),
}, (table) => {
  return {
    userIdOccurredAtIdx: index('audit_logs_user_occurred_idx').on(table.userId, table.occurredAt),
    entityTypeEntityIdIdx: index('audit_logs_entity_idx').on(table.entityType, table.entityId),
  };
});

export const adminUsers = pgTable('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('support').notNull(), // support | ops | superadmin
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userSettings = pgTable('user_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  elevenLabsApiKey: text('eleven_labs_api_key'), // AES-256-GCM encrypted via encryption.service.ts
  elevenLabsKeyUpdatedAt: timestamp('eleven_labs_key_updated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const googleAccounts = pgTable('google_accounts', {
  id: varchar('id', { length: 255 }).primaryKey(), // Google user / channel ID
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  channelIconUrl: varchar('channel_icon_url', { length: 512 }),
  accessToken: text('access_token').notNull(),   // AES-256-GCM encrypted
  refreshToken: text('refresh_token').notNull(), // AES-256-GCM encrypted
  tokenExpiry: timestamp('token_expiry'),
  tokenStatus: varchar('token_status', { length: 50 }).default('valid').notNull(),
  connectedAt: timestamp('connected_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    userGoogleUniqueIndex: uniqueIndex('user_google_unique_idx').on(table.userId, table.id),
  };
});

export const youtubeJobs = pgTable('youtube_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('queued').notNull(), // queued | generating_audio | merging | uploading | scheduled | completed | failed
  scheduledPublishTime: timestamp('scheduled_publish_time').notNull(), // Required — always scheduled
  googleDriveFileId: varchar('google_drive_file_id', { length: 255 }).notNull(),
  googleDriveFileName: varchar('google_drive_file_name', { length: 255 }).notNull(),
  scriptText: text('script_text').notNull(),
  voiceId: varchar('voice_id', { length: 100 }).notNull(),
  voiceName: varchar('voice_name', { length: 100 }).notNull(),
  privacyStatus: varchar('privacy_status', { length: 50 }).default('private').notNull(),
  youtubeVideoId: varchar('youtube_video_id', { length: 100 }),
  youtubeVideoUrl: varchar('youtube_video_url', { length: 512 }),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});





