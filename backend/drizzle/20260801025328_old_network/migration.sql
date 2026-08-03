-- whatsapp.* enum values already added in 20260731224523_custom_8a-whatsapp-permissions-enum; skipped here to avoid duplicate migration history.
CREATE TABLE IF NOT EXISTS "whatsapp_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"waba_id" varchar(64) NOT NULL,
	"phone_number_id" varchar(64) NOT NULL UNIQUE,
	"display_name" jsonb,
	"display_phone_number" varchar(32),
	"quality_rating" varchar(16),
	"portfolio_messaging_limit_tier" varchar(32),
	"throughput_level" varchar(16),
	"max_phone_numbers_per_business" varchar(50),
	"encrypted_access_token" text NOT NULL,
	"encrypted_two_step_pin" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_webhook_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
-- Drop the existing non-unique index so the partial unique index below can take its place.
-- IMPORTANT: If duplicate non-NULL provider_message_id values exist, the CREATE UNIQUE INDEX
-- below will fail after the old index has already been dropped, leaving the column unindexed.
-- The pre-check below ensures we abort before making any destructive changes.
DO $$ BEGIN IF EXISTS (SELECT 1 FROM (SELECT provider_message_id FROM "notification_deliveries" WHERE "provider_message_id" IS NOT NULL GROUP BY "provider_message_id" HAVING COUNT(*) > 1 LIMIT 1) d) THEN RAISE EXCEPTION 'Duplicate provider_message_id values exist; deduplicate before running this migration'; END IF; END $$;--> statement-breakpoint
DROP INDEX IF EXISTS "notification_deliveries_provider_message_id_idx";--> statement-breakpoint
-- Create a partial unique index that only enforces uniqueness for non-NULL provider_message_id values.
-- This enables P3 ON CONFLICT upsert by provider_message_id without nulking existing data;
-- if duplicate non-NULL values pre-exist, the index creation will fail-hard and surface the issue
-- rather than silently destroying data with a destructive UPDATE.
CREATE UNIQUE INDEX IF NOT EXISTS "notification_deliveries_provider_message_id_unique" ON "notification_deliveries" ("provider_message_id") WHERE "provider_message_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "whatsapp_accounts_waba_id_idx" ON "whatsapp_accounts" ("waba_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "whatsapp_accounts_is_active_idx" ON "whatsapp_accounts" ("is_active");