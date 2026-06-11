CREATE TABLE IF NOT EXISTS "instagram_accounts" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"username" varchar(255) NOT NULL,
	"name" varchar(255),
	"profile_picture_url" text,
	"fb_page_id" varchar(255) NOT NULL,
	"fb_page_access_token" text NOT NULL,
	"token_status" varchar(50) DEFAULT 'valid' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"followers_count" integer DEFAULT 0 NOT NULL,
	"connected_at" timestamp DEFAULT now() NOT NULL,
	"last_token_refresh" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "instagram_accounts" ADD CONSTRAINT "instagram_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_instagram_unique_idx" ON "instagram_accounts" ("user_id","id");