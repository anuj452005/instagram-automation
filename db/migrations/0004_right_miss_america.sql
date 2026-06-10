CREATE TABLE IF NOT EXISTS "dm_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"automation_id" uuid NOT NULL,
	"instagram_account_id" varchar(255) NOT NULL,
	"recipient_ig_id" varchar(100) NOT NULL,
	"recipient_username" varchar(100),
	"comment_id" varchar(100) NOT NULL,
	"comment_text" text,
	"keyword_matched" varchar(255),
	"message_text" text,
	"status" varchar(50) DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"error_code" varchar(100),
	"bullmq_job_id" varchar(255),
	"queued_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp,
	"failed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"automation_id" uuid NOT NULL,
	"instagram_account_id" varchar(255) NOT NULL,
	"ig_user_id" varchar(100) NOT NULL,
	"ig_username" varchar(100),
	"email" varchar(255),
	"phone" varchar(50),
	"full_name" varchar(255),
	"source_comment" text,
	"source_dm_job_id" uuid,
	"captured_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dm_jobs" ADD CONSTRAINT "dm_jobs_automation_id_automations_id_fk" FOREIGN KEY ("automation_id") REFERENCES "public"."automations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dm_jobs" ADD CONSTRAINT "dm_jobs_instagram_account_id_instagram_accounts_id_fk" FOREIGN KEY ("instagram_account_id") REFERENCES "public"."instagram_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leads" ADD CONSTRAINT "leads_automation_id_automations_id_fk" FOREIGN KEY ("automation_id") REFERENCES "public"."automations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leads" ADD CONSTRAINT "leads_source_dm_job_id_dm_jobs_id_fk" FOREIGN KEY ("source_dm_job_id") REFERENCES "public"."dm_jobs"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "automation_recipient_unique_idx" ON "dm_jobs" ("automation_id","recipient_ig_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "automation_ig_user_unique_idx" ON "leads" ("automation_id","ig_user_id");