CREATE TABLE IF NOT EXISTS "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instagram_account_id" varchar(255) NOT NULL,
	"automation_id" uuid,
	"event_type" varchar(50) NOT NULL,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analytics_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instagram_account_id" varchar(255) NOT NULL,
	"automation_id" uuid NOT NULL,
	"date" date NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"keywords_matched" integer DEFAULT 0 NOT NULL,
	"dms_sent" integer DEFAULT 0 NOT NULL,
	"failures_count" integer DEFAULT 0 NOT NULL,
	"leads_collected" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_automation_id_automations_id_fk" FOREIGN KEY ("automation_id") REFERENCES "public"."automations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_instagram_account_id_instagram_accounts_id_fk" FOREIGN KEY ("instagram_account_id") REFERENCES "public"."instagram_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_automation_id_automations_id_fk" FOREIGN KEY ("automation_id") REFERENCES "public"."automations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_ig_acct_created_at_idx" ON "analytics_events" ("instagram_account_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "analytics_snapshots_unique_idx" ON "analytics_snapshots" ("instagram_account_id","automation_id","date");