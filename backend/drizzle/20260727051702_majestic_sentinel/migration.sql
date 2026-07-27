CREATE TYPE "rate_source" AS ENUM('OVERRIDE', 'RECURRING', 'SUBJECT', 'TEACHER');--> statement-breakpoint
ALTER TABLE "class_subjects" ADD COLUMN "hourly_rate" numeric(12,2);--> statement-breakpoint
ALTER TABLE "class_subjects" ADD COLUMN "rate_currency" "currency_code";--> statement-breakpoint
ALTER TABLE "class_instances" ADD COLUMN "rate_source" "rate_source";--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD COLUMN "hourly_rate" numeric(12,2);--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD COLUMN "rate_currency" "currency_code";--> statement-breakpoint
ALTER TABLE "teacher_dues" ADD COLUMN "rate_source" "rate_source";