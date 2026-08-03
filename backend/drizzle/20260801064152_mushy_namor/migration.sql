DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cron_concurrency_policy') THEN
        CREATE TYPE "cron_concurrency_policy" AS ENUM('ALLOW', 'SKIP', 'REPLACE');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cron_job_kind') THEN
        CREATE TYPE "cron_job_kind" AS ENUM('NOOP');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cron_run_status') THEN
        CREATE TYPE "cron_run_status" AS ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'TIMEOUT', 'CANCELLED', 'RETRYING');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cron_schedule_status') THEN
        CREATE TYPE "cron_schedule_status" AS ENUM('ACTIVE', 'PAUSED', 'DISABLED');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cron_queue_backend') THEN
        CREATE TYPE "cron_queue_backend" AS ENUM('PG_BOSS', 'BULLMQ_POSTGRES', 'BULLMQ_REDIS', 'CUSTOM_SQL');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cron_trigger_source') THEN
        CREATE TYPE "cron_trigger_source" AS ENUM('VERCEL_TICKER', 'VERCEL_EXPLICIT', 'MANUAL');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'cron_trigger_source' AND e.enumlabel = 'EXTERNAL'
    ) THEN
        ALTER TYPE "cron_trigger_source" ADD VALUE 'EXTERNAL';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'cron_trigger_source' AND e.enumlabel = 'WORKER_RETRY'
    ) THEN
        ALTER TYPE "cron_trigger_source" ADD VALUE 'WORKER_RETRY';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'cron.manage'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'cron.manage';
    END IF;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cron_heartbeats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"run_id" uuid NOT NULL,
	"worker_id" varchar(255) NOT NULL,
	"last_beat_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"progress" jsonb,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cron_runs" (
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
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cron_schedules" (
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
);--> statement-breakpoint
-- NOTE: A partial cleanup index on created_at WHERE created_at < now() - interval '7 days' was
-- originally generated here but removed: PostgreSQL rejects STABLE functions (now()) in index
-- predicates ("functions in index predicate must be marked IMMUTABLE", 42P17). The retention
-- cleanup is handled by the sweeper job; a plain un-partialled index on created_at is not needed
-- for the cleanup query shape. The schema (backend/db/schema/cron/cron.ts cronHeartbeats) no
-- longer declares this index, so this statement is intentionally absent.--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cron_heartbeats_run_id_last_beat_at_idx" ON "cron_heartbeats" ("run_id","last_beat_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cron_runs_schedule_id_status_started_at_idx" ON "cron_runs" ("schedule_id","status","started_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cron_runs_status_started_at_idx" ON "cron_runs" ("status","started_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cron_runs_worker_id_status_idx" ON "cron_runs" ("worker_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cron_schedules_status_next_run_at_idx" ON "cron_schedules" ("status","next_run_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cron_schedules_name_unique_idx" ON "cron_schedules" ("name") WHERE "status" IN ('ACTIVE', 'PAUSED');--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cron_schedules_job_kind_idx" ON "cron_schedules" ("job_kind");--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "cron_heartbeats" ADD CONSTRAINT "cron_heartbeats_run_id_cron_runs_id_fkey" FOREIGN KEY ("run_id") REFERENCES "cron_runs"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "cron_runs" ADD CONSTRAINT "cron_runs_schedule_id_cron_schedules_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "cron_schedules"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "cron_schedules" ADD CONSTRAINT "cron_schedules_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "cron_schedules" ADD CONSTRAINT "cron_schedules_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;