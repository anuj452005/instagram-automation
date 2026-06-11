CREATE TABLE IF NOT EXISTS "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ig_user_id" varchar(100) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"raw_payload" jsonb NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"skippable" boolean DEFAULT false NOT NULL,
	"processing_error" text,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_events_unprocessed_idx" ON "webhook_events" ("processed","received_at");