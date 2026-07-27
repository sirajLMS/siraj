DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rate_source') THEN
        CREATE TYPE "rate_source" AS ENUM('OVERRIDE', 'RECURRING', 'SUBJECT', 'TEACHER');
    END IF;
END $$;--> statement-breakpoint
ALTER TABLE "class_subjects" ADD COLUMN IF NOT EXISTS "hourly_rate" numeric(12,2);--> statement-breakpoint
ALTER TABLE "class_subjects" ADD COLUMN IF NOT EXISTS "rate_currency" "currency_code";--> statement-breakpoint
ALTER TABLE "class_instances" ADD COLUMN IF NOT EXISTS "rate_source" "rate_source";--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD COLUMN IF NOT EXISTS "hourly_rate" numeric(12,2);--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD COLUMN IF NOT EXISTS "rate_currency" "currency_code";--> statement-breakpoint
ALTER TABLE "teacher_dues" ADD COLUMN IF NOT EXISTS "rate_source" "rate_source";