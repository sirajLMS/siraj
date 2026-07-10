-- Migration: fx_sync_runs table + supporting enums
-- Idempotent: guards CREATE TYPE and ALTER TYPE ADD VALUE so the migration
-- is safe to run on databases where the FX permission enum values or the
-- fx_provider/fx_sync_status types may already exist.

DO $$ BEGIN
  CREATE TYPE "fx_provider" AS ENUM('openexchangerates', 'fixer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "fx_sync_status" AS ENUM('running', 'success', 'partial', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

ALTER TYPE "app_permission" ADD VALUE IF NOT EXISTS 'billing.view_exchange_rates';
--> statement-breakpoint
ALTER TYPE "app_permission" ADD VALUE IF NOT EXISTS 'billing.refresh_exchange_rates';
--> statement-breakpoint

DO $$ BEGIN
  CREATE TABLE "fx_sync_runs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "provider" "fx_provider" NOT NULL,
    "status" "fx_sync_status" NOT NULL,
    "pairs_written" varchar(10) DEFAULT '0' NOT NULL,
    "pairs_failed" varchar(10) DEFAULT '0' NOT NULL,
    "error_message" varchar(500),
    "provider_response" jsonb,
    "trigger_type" varchar(20) NOT NULL,
    "triggered_by_user_id" uuid,
    "started_at" timestamp(3) with time zone NOT NULL,
    "finished_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "fx_sync_runs_status_idx" ON "fx_sync_runs" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fx_sync_runs_provider_started_idx" ON "fx_sync_runs" ("provider","started_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fx_sync_runs_triggered_by_idx" ON "fx_sync_runs" ("triggered_by_user_id");
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "fx_sync_runs"
    ADD CONSTRAINT "fx_sync_runs_triggered_by_user_id_users_id_fkey"
    FOREIGN KEY ("triggered_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
