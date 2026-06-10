import { pgTable, uuid, varchar, timestamp, integer, text, boolean, uniqueIndex, index, jsonb } from 'drizzle-orm/pg-core';

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

