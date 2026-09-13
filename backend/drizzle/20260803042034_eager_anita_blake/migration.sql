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
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cron_queue_backend') THEN
        CREATE TYPE "cron_queue_backend" AS ENUM('PG_BOSS', 'BULLMQ_POSTGRES', 'BULLMQ_REDIS', 'CUSTOM_SQL');
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
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cron_trigger_source') THEN
        CREATE TYPE "cron_trigger_source" AS ENUM('VERCEL_TICKER', 'VERCEL_EXPLICIT', 'EXTERNAL', 'MANUAL', 'WORKER_RETRY');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ondemand_no_credits_outcome') THEN
        CREATE TYPE "ondemand_no_credits_outcome" AS ENUM('AUTO_CANCEL', 'AUTO_ABSENT_NO_CREDITS', 'REMIND_ONLY');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ondemand_status') THEN
        CREATE TYPE "ondemand_status" AS ENUM('PENDING_CREDIT', 'AVAILABLE', 'CONVERTED', 'NO_CREDITS_CANCELLED', 'NO_CREDITS_ABSENT', 'CANCELLED');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quota_kind') THEN
        CREATE TYPE "quota_kind" AS ENUM('PACKAGE', 'PERIODIC');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quota_ledger_reason') THEN
        CREATE TYPE "quota_ledger_reason" AS ENUM('GRANT', 'RESERVE', 'REDEEM', 'RELEASE', 'EXPIRE', 'ADJUST');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quota_period_type') THEN
        CREATE TYPE "quota_period_type" AS ENUM('WEEKLY', 'MONTHLY', 'CUSTOM');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quota_status') THEN
        CREATE TYPE "quota_status" AS ENUM('ACTIVE', 'EXPIRED', 'ARCHIVED');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scheduling_mode') THEN
        CREATE TYPE "scheduling_mode" AS ENUM('NUMBER_OF_CLASSES', 'ON_DEMAND', 'QUOTA');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'whatsapp.view'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'whatsapp.view';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'whatsapp.config_manage'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'whatsapp.config_manage';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'whatsapp.templates_manage'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'whatsapp.templates_manage';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'quotas.view'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'quotas.view';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'quotas.manage'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'quotas.manage';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'cron.manage'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'cron.manage';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'class_execution_state') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'class_execution_state' AND e.enumlabel = 'ON_DEMAND_PENDING_CREDITS'
    ) THEN
        ALTER TYPE "class_execution_state" ADD VALUE 'ON_DEMAND_PENDING_CREDITS';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'class_execution_state') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'class_execution_state' AND e.enumlabel = 'ON_DEMAND_CONFLICT_HELD'
    ) THEN
        ALTER TYPE "class_execution_state" ADD VALUE 'ON_DEMAND_CONFLICT_HELD';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'class_execution_state') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'class_execution_state' AND e.enumlabel = 'ON_DEMAND_NO_CREDITS_CANCELLED'
    ) THEN
        ALTER TYPE "class_execution_state" ADD VALUE 'ON_DEMAND_NO_CREDITS_CANCELLED';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'class_execution_state') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'class_execution_state' AND e.enumlabel = 'ON_DEMAND_NO_CREDITS_ABSENT'
    ) THEN
        ALTER TYPE "class_execution_state" ADD VALUE 'ON_DEMAND_NO_CREDITS_ABSENT';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'notification_channel' AND e.enumlabel = 'WHATSAPP'
    ) THEN
        ALTER TYPE "notification_channel" ADD VALUE 'WHATSAPP';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_event_type') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'notification_event_type' AND e.enumlabel = 'QUOTA_EXPIRING_SOON'
    ) THEN
        ALTER TYPE "notification_event_type" ADD VALUE 'QUOTA_EXPIRING_SOON';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_event_type') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'notification_event_type' AND e.enumlabel = 'QUOTA_EXPIRED'
    ) THEN
        ALTER TYPE "notification_event_type" ADD VALUE 'QUOTA_EXPIRED';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_event_type') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'notification_event_type' AND e.enumlabel = 'QUOTA_LOW_BALANCE'
    ) THEN
        ALTER TYPE "notification_event_type" ADD VALUE 'QUOTA_LOW_BALANCE';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_event_type') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'notification_event_type' AND e.enumlabel = 'ON_DEMAND_INSTANCE_PENDING_CREDIT'
    ) THEN
        ALTER TYPE "notification_event_type" ADD VALUE 'ON_DEMAND_INSTANCE_PENDING_CREDIT';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_event_type') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'notification_event_type' AND e.enumlabel = 'ON_DEMAND_INSTANCE_REMINDER_T3'
    ) THEN
        ALTER TYPE "notification_event_type" ADD VALUE 'ON_DEMAND_INSTANCE_REMINDER_T3';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_event_type') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'notification_event_type' AND e.enumlabel = 'ON_DEMAND_INSTANCE_REMINDER_T1'
    ) THEN
        ALTER TYPE "notification_event_type" ADD VALUE 'ON_DEMAND_INSTANCE_REMINDER_T1';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_event_type') AND NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'notification_event_type' AND e.enumlabel = 'ON_DEMAND_TEACHER_DAILY_DIGEST'
    ) THEN
        ALTER TYPE "notification_event_type" ADD VALUE 'ON_DEMAND_TEACHER_DAILY_DIGEST';
    END IF;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quota_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"quota_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"recurring_schedule_id" uuid,
	"class_instance_id" uuid,
	"delta" integer NOT NULL,
	"reason" "quota_ledger_reason" NOT NULL,
	"reason_note" text,
	"idempotency_key" varchar(255) NOT NULL,
	"actor_user_id" uuid,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quotas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"student_id" uuid NOT NULL,
	"kind" "quota_kind" NOT NULL,
	"name" varchar(255) NOT NULL,
	"total_classes" integer NOT NULL,
	"remaining" integer DEFAULT 0 NOT NULL,
	"reserved_classes" integer DEFAULT 0 NOT NULL,
	"used_this_period" integer DEFAULT 0 NOT NULL,
	"period_type" "quota_period_type",
	"period_days" integer,
	"period_anchor" timestamp(3) with time zone,
	"valid_from" date,
	"valid_until" date,
	"status" "quota_status" DEFAULT 'ACTIVE'::"quota_status" NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"rollover_policy" jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp(3) with time zone,
	CONSTRAINT "quotas_kind_period_consistency_chk" CHECK (
        ("kind" = 'PACKAGE' AND "period_type" IS NULL AND "period_days" IS NULL AND "period_anchor" IS NULL) OR
        ("kind" = 'PERIODIC' AND "period_type" IS NOT NULL AND "period_days" IS NOT NULL)
      ),
	CONSTRAINT "quotas_total_classes_positive_chk" CHECK ("total_classes" > 0),
	CONSTRAINT "quotas_priority_non_negative_chk" CHECK ("priority" >= 0),
	CONSTRAINT "quotas_remaining_non_negative_chk" CHECK ("remaining" >= 0),
	CONSTRAINT "quotas_reserved_classes_non_negative_chk" CHECK ("reserved_classes" >= 0),
	CONSTRAINT "quotas_reserved_not_exceed_remaining_chk" CHECK ("reserved_classes" <= "remaining"),
	CONSTRAINT "quotas_used_this_period_non_negative_chk" CHECK ("used_this_period" >= 0),
	CONSTRAINT "quotas_rollover_policy_valid_chk" CHECK (
        "rollover_policy" IS NULL OR (
          jsonb_typeof("rollover_policy") = 'object' AND
          "rollover_policy" ? 'maxRolloverPercent' AND
          "rollover_policy" ? 'accumulationCap'
        )
      )
);--> statement-breakpoint
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
DROP INDEX IF EXISTS "notification_deliveries_provider_message_id_idx";--> statement-breakpoint
ALTER TABLE "class_instances" ADD COLUMN IF NOT EXISTS "scheduling_mode" "scheduling_mode" DEFAULT 'NUMBER_OF_CLASSES'::"scheduling_mode" NOT NULL;--> statement-breakpoint
ALTER TABLE "class_instances" ADD COLUMN IF NOT EXISTS "ondemand_status" "ondemand_status";--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD COLUMN IF NOT EXISTS "quota_id" uuid;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD COLUMN IF NOT EXISTS "earmarked_classes" integer;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD COLUMN IF NOT EXISTS "scheduling_mode" "scheduling_mode" DEFAULT 'NUMBER_OF_CLASSES'::"scheduling_mode" NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD COLUMN IF NOT EXISTS "generation_horizon_weeks" integer;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD COLUMN IF NOT EXISTS "ondemand_no_credits_outcome" "ondemand_no_credits_outcome";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "quota_ledger_idempotency_key_unique_idx" ON "quota_ledger" ("idempotency_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quota_ledger_quota_id_created_at_idx" ON "quota_ledger" ("quota_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quota_ledger_student_id_idx" ON "quota_ledger" ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quota_ledger_class_instance_id_idx" ON "quota_ledger" ("class_instance_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quota_ledger_recurring_schedule_id_idx" ON "quota_ledger" ("recurring_schedule_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "quotas_idempotency_key_unique_idx" ON "quotas" ("idempotency_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quotas_student_id_idx" ON "quotas" ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quotas_student_status_remaining_idx" ON "quotas" ("student_id","status","remaining") WHERE deleted_at IS NULL AND status = 'ACTIVE' AND remaining > 0;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quotas_valid_until_idx" ON "quotas" ("valid_until") WHERE deleted_at IS NULL AND status = 'ACTIVE';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quotas_admin_list_idx" ON "quotas" ("student_id","status","deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "class_instances_ondemand_status_idx" ON "class_instances" ("ondemand_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recurring_schedules_quota_id_idx" ON "recurring_schedules" ("quota_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "notification_deliveries_provider_message_id_unique" ON "notification_deliveries" ("provider_message_id") WHERE "provider_message_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cron_heartbeats_run_id_last_beat_at_idx" ON "cron_heartbeats" ("run_id","last_beat_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cron_runs_schedule_id_status_started_at_idx" ON "cron_runs" ("schedule_id","status","started_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cron_runs_status_started_at_idx" ON "cron_runs" ("status","started_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cron_runs_worker_id_status_idx" ON "cron_runs" ("worker_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cron_schedules_status_next_run_at_idx" ON "cron_schedules" ("status","next_run_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cron_schedules_name_unique_idx" ON "cron_schedules" ("name") WHERE "status" IN ('ACTIVE', 'PAUSED');--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cron_schedules_job_kind_idx" ON "cron_schedules" ("job_kind");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "whatsapp_accounts_waba_id_idx" ON "whatsapp_accounts" ("waba_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "whatsapp_accounts_is_active_idx" ON "whatsapp_accounts" ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "whatsapp_accounts_active_created_at_idx" ON "whatsapp_accounts" ("is_active","created_at");--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "quota_ledger" ADD CONSTRAINT "quota_ledger_quota_id_quotas_id_fkey" FOREIGN KEY ("quota_id") REFERENCES "quotas"("id") ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "quota_ledger" ADD CONSTRAINT "quota_ledger_student_id_students_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "quota_ledger" ADD CONSTRAINT "quota_ledger_recurring_schedule_id_recurring_schedules_id_fkey" FOREIGN KEY ("recurring_schedule_id") REFERENCES "recurring_schedules"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "quota_ledger" ADD CONSTRAINT "quota_ledger_class_instance_id_class_instances_id_fkey" FOREIGN KEY ("class_instance_id") REFERENCES "class_instances"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "quota_ledger" ADD CONSTRAINT "quota_ledger_actor_user_id_users_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "quotas" ADD CONSTRAINT "quotas_student_id_students_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "recurring_schedules" ADD CONSTRAINT "recurring_schedules_quota_id_quotas_id_fkey" FOREIGN KEY ("quota_id") REFERENCES "quotas"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
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
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "class_instances" ADD CONSTRAINT "class_instances_ondemand_status_scheduling_mode_chk" CHECK (
        ("ondemand_status" IS NULL AND "scheduling_mode" != 'ON_DEMAND') OR
        ("ondemand_status" IS NOT NULL AND "scheduling_mode" = 'ON_DEMAND')
      );
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "class_instances" DROP CONSTRAINT "class_instances_state_machine_chk", ADD CONSTRAINT "class_instances_state_machine_chk" CHECK (
        ("execution_state" != 'COMPLETED' OR "outcome" != 'PENDING') AND
        ("execution_state" != 'NOT_ACTIVATED' OR "actual_start_at" IS NULL) AND
        ("force_activated" = false OR "force_activated_by_user_id" IS NOT NULL) AND
        ("outcome" != 'TAKEN' OR "actual_start_at" IS NOT NULL) AND
        ("is_rate_overridden" = false OR "rate_amount" IS NOT NULL) AND
        ("execution_state" NOT IN ('ON_DEMAND_PENDING_CREDITS', 'ON_DEMAND_CONFLICT_HELD', 'ON_DEMAND_NO_CREDITS_CANCELLED', 'ON_DEMAND_NO_CREDITS_ABSENT') OR "scheduling_mode" = 'ON_DEMAND')
      );
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;