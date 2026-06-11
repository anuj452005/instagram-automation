CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"subscription_tier" varchar(50) DEFAULT 'free' NOT NULL,
	"subscription_status" varchar(50) DEFAULT 'active' NOT NULL,
	"subscription_id" varchar(255),
	"razorpay_customer_id" varchar(255),
	"subscription_ends_at" timestamp,
	"monthly_dm_count" integer DEFAULT 0 NOT NULL,
	"dm_count_reset_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
