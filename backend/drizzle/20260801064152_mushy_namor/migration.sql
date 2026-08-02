CREATE TYPE "cron_concurrency_policy" AS ENUM('ALLOW', 'SKIP', 'REPLACE');--> statement-breakpoint
CREATE TYPE "cron_job_kind" AS ENUM('NOOP');--> statement-breakpoint
CREATE TYPE "cron_run_status" AS ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'TIMEOUT', 'CANCELLED', 'RETRYING');--> statement-breakpoint
CREATE TYPE "cron_schedule_status" AS ENUM('ACTIVE', 'PAUSED', 'DISABLED');--> statement-breakpoint
CREATE TYPE "cron_queue_backend" AS ENUM('PG_BOSS', 'BULLMQ_POSTGRES', 'BULLMQ_REDIS', 'CUSTOM_SQL');--> statement-breakpoint
CREATE TYPE "cron_trigger_source" AS ENUM('VERCEL_TICKER', 'VERCEL_EXPLICIT', 'MANUAL');--> statement-breakpoint
ALTER TYPE "cron_trigger_source" ADD VALUE IF NOT EXISTS 'EXTERNAL';--> statement-breakpoint
ALTER TYPE "cron_trigger_source" ADD VALUE IF NOT EXISTS 'WORKER_RETRY';--> statement-breakpoint
ALTER TYPE "app_permission" ADD VALUE IF NOT EXISTS 'cron.manage';--> statement-breakpoint
CREATE TABLE "cron_heartbeats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"run_id" uuid NOT NULL,
	"worker_id" varchar(255) NOT NULL,
	"last_beat_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"progress" jsonb,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cron_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"schedule_id" uuid NOT NULL,
	"job_kind" "cron_job_kind" NOT NULL,
	"status" "cron_run_status" DEFAULT 'PENDING'::"cron_run_status" NOT NULL,
	"trigger_source" "cron_trigger_source" NOT NULL,
	"payload" jsonb,
	"attempt" integer DEFAULT 1 NOT NULL,
	"started_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp(3) with time zone,
	"duration_ms" integer,
	"error_message" text,
	"error_stack" text,
	"worker_id" varchar(255),
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cron_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"description" text,
	"cron_expression" varchar(255) NOT NULL,
	"job_kind" "cron_job_kind" NOT NULL,
	"payload" jsonb,
	"status" "cron_schedule_status" DEFAULT 'ACTIVE'::"cron_schedule_status" NOT NULL,
	"timezone" varchar(100) DEFAULT 'UTC' NOT NULL,
	"next_run_at" timestamp(3) with time zone,
	"last_run_at" timestamp(3) with time zone,
	"concurrency_policy" "cron_concurrency_policy" DEFAULT 'ALLOW'::"cron_concurrency_policy" NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"retry_backoff_seconds" integer DEFAULT 60 NOT NULL,
	"timeout_seconds" integer DEFAULT 300 NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"updated_by_user_id" uuid
);
--> statement-breakpoint
-- NOTE: cron_heartbeats has unbounded growth potential. A retention policy (e.g. a scheduled
-- cleanup job that deletes rows older than N days) should be added in a future migration.
-- The partial index below supports efficient cleanup queries on old rows.
CREATE INDEX IF NOT EXISTS "cron_heartbeats_created_at_cleanup_idx" ON "cron_heartbeats" ("created_at") WHERE "created_at" < now() - interval '7 days';--> statement-breakpoint
CREATE INDEX "cron_heartbeats_run_id_last_beat_at_idx" ON "cron_heartbeats" ("run_id","last_beat_at");--> statement-breakpoint
CREATE INDEX "cron_runs_schedule_id_status_started_at_idx" ON "cron_runs" ("schedule_id","status","started_at");--> statement-breakpoint
CREATE INDEX "cron_runs_status_started_at_idx" ON "cron_runs" ("status","started_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cron_runs_worker_id_status_idx" ON "cron_runs" ("worker_id","status");--> statement-breakpoint
CREATE INDEX "cron_schedules_status_next_run_at_idx" ON "cron_schedules" ("status","next_run_at");--> statement-breakpoint
CREATE UNIQUE INDEX "cron_schedules_name_unique_idx" ON "cron_schedules" ("name") WHERE "status" IN ('ACTIVE', 'PAUSED');--> statement-breakpoint
CREATE INDEX "cron_schedules_job_kind_idx" ON "cron_schedules" ("job_kind");--> statement-breakpoint
ALTER TABLE "cron_heartbeats" ADD CONSTRAINT "cron_heartbeats_run_id_cron_runs_id_fkey" FOREIGN KEY ("run_id") REFERENCES "cron_runs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cron_runs" ADD CONSTRAINT "cron_runs_schedule_id_cron_schedules_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "cron_schedules"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cron_schedules" ADD CONSTRAINT "cron_schedules_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "cron_schedules" ADD CONSTRAINT "cron_schedules_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;