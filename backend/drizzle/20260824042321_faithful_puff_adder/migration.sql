DO $$ BEGIN
    ALTER TABLE "suggestions" RENAME CONSTRAINT "suggestions_duplicate_of_id_fkey" TO "suggestions_duplicate_of_id_suggestions_id_fkey";
EXCEPTION WHEN undefined_object OR duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
ALTER TABLE "currency_exchange_audit_logs" ALTER COLUMN "old_rate" SET DATA TYPE text USING "old_rate"::text;--> statement-breakpoint
ALTER TABLE "currency_exchange_audit_logs" ALTER COLUMN "new_rate" SET DATA TYPE text USING "new_rate"::text;--> statement-breakpoint
ALTER TABLE "currency_exchange_rates" ALTER COLUMN "rate" SET DATA TYPE text USING "rate"::text;--> statement-breakpoint
ALTER TABLE "currency_hedges" ALTER COLUMN "amount" SET DATA TYPE text USING "amount"::text;--> statement-breakpoint
ALTER TABLE "invoice_coverage_months" ALTER COLUMN "year" SET DATA TYPE integer USING "year"::integer;--> statement-breakpoint
ALTER TABLE "invoice_coverage_months" ALTER COLUMN "month" SET DATA TYPE integer USING "month"::integer;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "issue_date" SET DATA TYPE text USING "issue_date"::text;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "due_date" SET DATA TYPE text USING "due_date"::text;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "paid_date" SET DATA TYPE text USING "paid_date"::text;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "amount" SET DATA TYPE text USING "amount"::text;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "exchange_rate_snapshot" SET DATA TYPE text USING "exchange_rate_snapshot"::text;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "amount" SET DATA TYPE text USING "amount"::text;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "refunded_amount" SET DATA TYPE text USING "refunded_amount"::text;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "exchange_rate_snapshot" SET DATA TYPE text USING "exchange_rate_snapshot"::text;--> statement-breakpoint
ALTER TABLE "supported_currencies" ALTER COLUMN "decimals" SET DATA TYPE integer USING "decimals"::integer;--> statement-breakpoint
ALTER TABLE "quotas" ALTER COLUMN "valid_from" SET DATA TYPE text USING "valid_from"::text;--> statement-breakpoint
ALTER TABLE "quotas" ALTER COLUMN "valid_until" SET DATA TYPE text USING "valid_until"::text;--> statement-breakpoint
ALTER TABLE "class_subjects" ALTER COLUMN "hourly_rate" SET DATA TYPE text USING "hourly_rate"::text;--> statement-breakpoint
ALTER TABLE "class_instances" ALTER COLUMN "student_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "class_instances" ALTER COLUMN "teacher_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "class_instances" ALTER COLUMN "subject_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "class_instances" ALTER COLUMN "rate_amount" SET DATA TYPE text USING "rate_amount"::text;--> statement-breakpoint
ALTER TABLE "leave_quota_usage" ALTER COLUMN "period_year" SET DATA TYPE integer USING "period_year"::integer;--> statement-breakpoint
ALTER TABLE "leave_quota_usage" ALTER COLUMN "period_month" SET DATA TYPE integer USING "period_month"::integer;--> statement-breakpoint
ALTER TABLE "recurring_schedule_days" ALTER COLUMN "start_time" SET DATA TYPE text USING "start_time"::text;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ALTER COLUMN "student_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ALTER COLUMN "teacher_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ALTER COLUMN "subject_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ALTER COLUMN "default_start_time" SET DATA TYPE text USING "default_start_time"::text;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ALTER COLUMN "hourly_rate" SET DATA TYPE text USING "hourly_rate"::text;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ALTER COLUMN "effective_from" SET DATA TYPE text USING "effective_from"::text;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ALTER COLUMN "effective_until" SET DATA TYPE text USING "effective_until"::text;--> statement-breakpoint
ALTER TABLE "parents" ALTER COLUMN "fee_amount" SET DATA TYPE text USING "fee_amount"::text;--> statement-breakpoint
ALTER TABLE "rate_limit_cache" ALTER COLUMN "expires_at" SET DATA TYPE timestamp(3) with time zone USING "expires_at"::timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "session_cache" ALTER COLUMN "expires_at" SET DATA TYPE timestamp(3) with time zone USING "expires_at"::timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "hours_per_week" SET DATA TYPE text USING "hours_per_week"::text;--> statement-breakpoint
ALTER TABLE "staff_profiles" ALTER COLUMN "hourly_rate" SET DATA TYPE text USING "hourly_rate"::text;--> statement-breakpoint
ALTER TABLE "teacher_availability_windows" ALTER COLUMN "start_time" SET DATA TYPE text USING "start_time"::text;--> statement-breakpoint
ALTER TABLE "teacher_availability_windows" ALTER COLUMN "end_time" SET DATA TYPE text USING "end_time"::text;--> statement-breakpoint
ALTER TABLE "teacher_availability_windows" ALTER COLUMN "effective_from" SET DATA TYPE text USING "effective_from"::text;--> statement-breakpoint
ALTER TABLE "teacher_availability_windows" ALTER COLUMN "effective_until" SET DATA TYPE text USING "effective_until"::text;--> statement-breakpoint
ALTER TABLE "teacher_recurring_unavailability" ALTER COLUMN "start_time" SET DATA TYPE text USING "start_time"::text;--> statement-breakpoint
ALTER TABLE "teacher_recurring_unavailability" ALTER COLUMN "end_time" SET DATA TYPE text USING "end_time"::text;--> statement-breakpoint
ALTER TABLE "teacher_recurring_unavailability" ALTER COLUMN "effective_from" SET DATA TYPE text USING "effective_from"::text;--> statement-breakpoint
ALTER TABLE "teacher_recurring_unavailability" ALTER COLUMN "effective_until" SET DATA TYPE text USING "effective_until"::text;--> statement-breakpoint
ALTER TABLE "teacher_dues" ALTER COLUMN "hours" SET DATA TYPE text USING "hours"::text;--> statement-breakpoint
ALTER TABLE "teacher_dues" ALTER COLUMN "amount" SET DATA TYPE text USING "amount"::text;--> statement-breakpoint
ALTER TABLE "teacher_payments" ALTER COLUMN "amount" SET DATA TYPE text USING "amount"::text;--> statement-breakpoint
ALTER TABLE "teachers" ALTER COLUMN "date_of_birth" SET DATA TYPE text USING "date_of_birth"::text;--> statement-breakpoint
ALTER TABLE "teachers" ALTER COLUMN "hourly_rate" SET DATA TYPE text USING "hourly_rate"::text;--> statement-breakpoint
ALTER TABLE "session_metadata" ALTER COLUMN "user_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "user_id" DROP DEFAULT;