CREATE TYPE "ondemand_no_credits_outcome" AS ENUM('AUTO_CANCEL', 'AUTO_ABSENT_NO_CREDITS', 'REMIND_ONLY');--> statement-breakpoint
CREATE TYPE "ondemand_status" AS ENUM('PENDING_CREDIT', 'AVAILABLE', 'CONVERTED', 'NO_CREDITS_CANCELLED', 'NO_CREDITS_ABSENT', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "quota_kind" AS ENUM('PACKAGE', 'PERIODIC');--> statement-breakpoint
CREATE TYPE "quota_ledger_reason" AS ENUM('GRANT', 'RESERVE', 'REDEEM', 'RELEASE', 'EXPIRE', 'ADJUST');--> statement-breakpoint
CREATE TYPE "quota_period_type" AS ENUM('WEEKLY', 'MONTHLY', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "quota_status" AS ENUM('ACTIVE', 'EXPIRED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "scheduling_mode" AS ENUM('NUMBER_OF_CLASSES', 'ON_DEMAND', 'QUOTA');--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'class_execution_state' AND e.enumlabel = 'ON_DEMAND_PENDING_CREDITS'
    ) THEN
        ALTER TYPE "class_execution_state" ADD VALUE 'ON_DEMAND_PENDING_CREDITS';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'class_execution_state' AND e.enumlabel = 'ON_DEMAND_CONFLICT_HELD'
    ) THEN
        ALTER TYPE "class_execution_state" ADD VALUE 'ON_DEMAND_CONFLICT_HELD';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'class_execution_state' AND e.enumlabel = 'ON_DEMAND_NO_CREDITS_CANCELLED'
    ) THEN
        ALTER TYPE "class_execution_state" ADD VALUE 'ON_DEMAND_NO_CREDITS_CANCELLED';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'class_execution_state' AND e.enumlabel = 'ON_DEMAND_NO_CREDITS_ABSENT'
    ) THEN
        ALTER TYPE "class_execution_state" ADD VALUE 'ON_DEMAND_NO_CREDITS_ABSENT';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'notification_event_type' AND e.enumlabel = 'QUOTA_EXPIRING_SOON'
    ) THEN
        ALTER TYPE "notification_event_type" ADD VALUE 'QUOTA_EXPIRING_SOON';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'notification_event_type' AND e.enumlabel = 'QUOTA_EXPIRED'
    ) THEN
        ALTER TYPE "notification_event_type" ADD VALUE 'QUOTA_EXPIRED';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'notification_event_type' AND e.enumlabel = 'QUOTA_LOW_BALANCE'
    ) THEN
        ALTER TYPE "notification_event_type" ADD VALUE 'QUOTA_LOW_BALANCE';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'notification_event_type' AND e.enumlabel = 'ON_DEMAND_INSTANCE_PENDING_CREDIT'
    ) THEN
        ALTER TYPE "notification_event_type" ADD VALUE 'ON_DEMAND_INSTANCE_PENDING_CREDIT';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'notification_event_type' AND e.enumlabel = 'ON_DEMAND_INSTANCE_REMINDER_T3'
    ) THEN
        ALTER TYPE "notification_event_type" ADD VALUE 'ON_DEMAND_INSTANCE_REMINDER_T3';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'notification_event_type' AND e.enumlabel = 'ON_DEMAND_INSTANCE_REMINDER_T1'
    ) THEN
        ALTER TYPE "notification_event_type" ADD VALUE 'ON_DEMAND_INSTANCE_REMINDER_T1';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'notification_event_type' AND e.enumlabel = 'ON_DEMAND_TEACHER_DAILY_DIGEST'
    ) THEN
        ALTER TYPE "notification_event_type" ADD VALUE 'ON_DEMAND_TEACHER_DAILY_DIGEST';
    END IF;
END $$;--> statement-breakpoint
CREATE TABLE "quota_ledger" (
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
);
--> statement-breakpoint
CREATE TABLE "quotas" (
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
	CONSTRAINT "quotas_remaining_non_negative_chk" CHECK ("remaining" >= 0),
	CONSTRAINT "quotas_reserved_plus_remaining_chk" CHECK ("reserved_classes" + "remaining" <= "total_classes"),
	CONSTRAINT "quotas_used_this_period_non_negative_chk" CHECK ("used_this_period" >= 0),
	CONSTRAINT "quotas_rollover_policy_valid_chk" CHECK (
        "rollover_policy" IS NULL OR (
          jsonb_typeof("rollover_policy") = 'object' AND
          "rollover_policy" ? 'maxRolloverPercent' AND
          "rollover_policy" ? 'accumulationCap'
        )
      )
);
--> statement-breakpoint
ALTER TABLE "class_instances" ADD COLUMN "scheduling_mode" "scheduling_mode" DEFAULT 'NUMBER_OF_CLASSES'::"scheduling_mode" NOT NULL;--> statement-breakpoint
ALTER TABLE "class_instances" ADD COLUMN "ondemand_status" "ondemand_status";--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD COLUMN "quota_id" uuid;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD COLUMN "earmarked_classes" integer;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD COLUMN "scheduling_mode" "scheduling_mode" DEFAULT 'NUMBER_OF_CLASSES'::"scheduling_mode" NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD COLUMN "generation_horizon_weeks" integer;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD COLUMN "ondemand_no_credits_outcome" "ondemand_no_credits_outcome";--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "key" SET DATA TYPE text;--> statement-breakpoint
-- DEPENDENCY: The next statement casts "permissions"."key" from text → app_permission.
-- This cast can ONLY succeed if the app_permission enum already contains the
-- values 'quotas.view' and 'quotas.manage' (and all other values present in the
-- permissions.key column). These enum values are added by manual migration
-- 7c-quota_permissions_enum.sql (ALTER TYPE ADD VALUE). If 7c has NOT been
-- applied first, the USING cast will raise "invalid input value for enum"
-- for any row whose key is not a valid app_permission label.
-- Ensure 7c-quota_permissions_enum runs before this Drizzle migration.
-- NOTE: This re-cast assumes all existing permission keys are in app_permission enum — verify before deploying to production.
ALTER TABLE "permissions" ALTER COLUMN "key" SET DATA TYPE "app_permission" USING "key"::"app_permission";--> statement-breakpoint
CREATE UNIQUE INDEX "quota_ledger_idempotency_key_unique_idx" ON "quota_ledger" ("idempotency_key");--> statement-breakpoint
CREATE INDEX "quota_ledger_quota_id_created_at_idx" ON "quota_ledger" ("quota_id","created_at");--> statement-breakpoint
CREATE INDEX "quota_ledger_student_id_idx" ON "quota_ledger" ("student_id");--> statement-breakpoint
CREATE INDEX "quota_ledger_class_instance_id_idx" ON "quota_ledger" ("class_instance_id");--> statement-breakpoint
CREATE INDEX "quota_ledger_recurring_schedule_id_idx" ON "quota_ledger" ("recurring_schedule_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quotas_idempotency_key_unique_idx" ON "quotas" ("idempotency_key");--> statement-breakpoint
CREATE INDEX "quotas_student_id_idx" ON "quotas" ("student_id");--> statement-breakpoint
CREATE INDEX "quotas_student_status_remaining_idx" ON "quotas" ("student_id","status","remaining") WHERE deleted_at IS NULL AND status = 'ACTIVE' AND remaining > 0;--> statement-breakpoint
CREATE INDEX "quotas_valid_until_idx" ON "quotas" ("valid_until") WHERE deleted_at IS NULL AND status = 'ACTIVE';--> statement-breakpoint
CREATE INDEX "class_instances_ondemand_status_idx" ON "class_instances" ("ondemand_status");--> statement-breakpoint
CREATE INDEX "recurring_schedules_quota_id_idx" ON "recurring_schedules" ("quota_id");--> statement-breakpoint
ALTER TABLE "quota_ledger" ADD CONSTRAINT "quota_ledger_quota_id_quotas_id_fkey" FOREIGN KEY ("quota_id") REFERENCES "quotas"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "quota_ledger" ADD CONSTRAINT "quota_ledger_student_id_students_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "quota_ledger" ADD CONSTRAINT "quota_ledger_recurring_schedule_id_recurring_schedules_id_fkey" FOREIGN KEY ("recurring_schedule_id") REFERENCES "recurring_schedules"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "quota_ledger" ADD CONSTRAINT "quota_ledger_class_instance_id_class_instances_id_fkey" FOREIGN KEY ("class_instance_id") REFERENCES "class_instances"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "quota_ledger" ADD CONSTRAINT "quota_ledger_actor_user_id_users_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "quotas" ADD CONSTRAINT "quotas_student_id_students_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD CONSTRAINT "recurring_schedules_quota_id_quotas_id_fkey" FOREIGN KEY ("quota_id") REFERENCES "quotas"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "class_instances" ADD CONSTRAINT "class_instances_ondemand_status_scheduling_mode_chk" CHECK (
        ("ondemand_status" IS NULL AND "scheduling_mode" != 'ON_DEMAND') OR
        ("ondemand_status" IS NOT NULL AND "scheduling_mode" = 'ON_DEMAND')
      );--> statement-breakpoint
ALTER TABLE "class_instances" DROP CONSTRAINT "class_instances_state_machine_chk", ADD CONSTRAINT "class_instances_state_machine_chk" CHECK (
        ("execution_state" != 'COMPLETED' OR "outcome" != 'PENDING') AND
        ("execution_state" != 'NOT_ACTIVATED' OR "actual_start_at" IS NULL) AND
        ("force_activated" = false OR "force_activated_by_user_id" IS NOT NULL) AND
        ("outcome" != 'TAKEN' OR "actual_start_at" IS NOT NULL) AND
        ("is_rate_overridden" = false OR "rate_amount" IS NOT NULL) AND
        ("execution_state" NOT IN ('ON_DEMAND_PENDING_CREDITS', 'ON_DEMAND_CONFLICT_HELD', 'ON_DEMAND_NO_CREDITS_CANCELLED', 'ON_DEMAND_NO_CREDITS_ABSENT') OR "scheduling_mode" = 'ON_DEMAND')
      );