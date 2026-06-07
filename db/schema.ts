import { pgTable, uuid, varchar, timestamp, integer } from 'drizzle-orm/pg-core';

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
