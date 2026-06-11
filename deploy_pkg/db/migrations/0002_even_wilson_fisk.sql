CREATE TABLE IF NOT EXISTS "automation_keywords" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"automation_id" uuid NOT NULL,
	"keyword" varchar(255) NOT NULL,
	"match_type" varchar(50) DEFAULT 'exact' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "automations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instagram_account_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"post_id" varchar(255),
	"post_url" text,
	"post_type" varchar(20),
	"flow_type" varchar(50) NOT NULL,
	"dm_template" text NOT NULL,
	"collect_leads" boolean DEFAULT false NOT NULL,
	"lead_fields" jsonb DEFAULT '["email"]'::jsonb,
	"landing_page_token" varchar(100),
	"also_reply_comment" boolean DEFAULT false NOT NULL,
	"comment_reply_text" text,
	"scheduled_activate_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "automation_keywords" ADD CONSTRAINT "automation_keywords_automation_id_automations_id_fk" FOREIGN KEY ("automation_id") REFERENCES "public"."automations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "automations" ADD CONSTRAINT "automations_instagram_account_id_instagram_accounts_id_fk" FOREIGN KEY ("instagram_account_id") REFERENCES "public"."instagram_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "automation_keywords_automation_id_idx" ON "automation_keywords" ("automation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "automations_instagram_account_id_idx" ON "automations" ("instagram_account_id");