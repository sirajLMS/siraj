CREATE TYPE "invoice_payment_submission_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TYPE "app_permission" ADD VALUE 'billing.submit_payment_proof' BEFORE 'billing.delete_invoice';--> statement-breakpoint
ALTER TYPE "app_permission" ADD VALUE 'billing.manage_fx_provider' BEFORE 'payment_methods.manage_catalogs';--> statement-breakpoint
ALTER TYPE "app_permission" ADD VALUE 'billing.override_exchange_rates' BEFORE 'payment_methods.manage_catalogs';--> statement-breakpoint
ALTER TYPE "app_permission" ADD VALUE 'billing.manage_currency_hedges' BEFORE 'payment_methods.manage_catalogs';--> statement-breakpoint
ALTER TYPE "app_permission" ADD VALUE 'meeting_configs.manage_class';--> statement-breakpoint
ALTER TYPE "invoice_status" ADD VALUE 'PAYMENT_PENDING' BEFORE 'PAID';--> statement-breakpoint
ALTER TYPE "payment_method_type" ADD VALUE 'PROOF_UPLOAD';--> statement-breakpoint
CREATE TABLE "invoice_payment_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"invoice_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"submitted_by_user_id" uuid NOT NULL,
	"submitted_at" timestamp(3) with time zone NOT NULL,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp(3) with time zone,
	"status" "invoice_payment_submission_status" NOT NULL,
	"rejection_reason" text,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_meeting_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"class_instance_id" uuid,
	"recurring_schedule_id" uuid,
	"provider_id" uuid NOT NULL,
	"label" varchar(100),
	"is_default" boolean DEFAULT false NOT NULL,
	"details" jsonb NOT NULL,
	"encrypted_secret" text,
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	CONSTRAINT "class_meeting_configs_scope_chk" CHECK ((
        ("class_instance_id" IS NOT NULL AND "recurring_schedule_id" IS NULL)
        OR ("class_instance_id" IS NULL AND "recurring_schedule_id" IS NOT NULL)
      ))
);
--> statement-breakpoint
DROP INDEX "teachers_status_idx";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" "account_status" DEFAULT 'ACTIVATED'::"account_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ALTER COLUMN "event_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ALTER COLUMN "event_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "notification_event_type";--> statement-breakpoint
CREATE TYPE "notification_event_type" AS ENUM('CLASS_REMINDER', 'INVOICE_GENERATED', 'COMPLAINT_RESPONSE', 'PAYMENT_METHOD_CHANGED', 'NEW_COMPLAINT', 'NEW_SUGGESTION', 'SUGGESTION_ACKNOWLEDGED', 'SUGGESTION_DUPLICATE_MARKED');--> statement-breakpoint
ALTER TABLE "notification_deliveries" ALTER COLUMN "event_type" SET DATA TYPE "notification_event_type" USING "event_type"::"notification_event_type";--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ALTER COLUMN "event_type" SET DATA TYPE "notification_event_type" USING "event_type"::"notification_event_type";--> statement-breakpoint
ALTER TABLE "parents" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "parent_status";--> statement-breakpoint
CREATE TYPE "parent_status" AS ENUM('REGULAR', 'ON_LEAVE', 'SUSPENDED', 'ON_TRIAL');--> statement-breakpoint
ALTER TABLE "parents" ALTER COLUMN "status" SET DATA TYPE "parent_status" USING "status"::"parent_status";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "staff_profiles" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "staff_profiles" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "teachers" DROP COLUMN "status";--> statement-breakpoint
CREATE INDEX "invoice_payment_submissions_invoice_id_idx" ON "invoice_payment_submissions" ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_payment_submissions_status_idx" ON "invoice_payment_submissions" ("status");--> statement-breakpoint
CREATE INDEX "invoice_payment_submissions_file_id_idx" ON "invoice_payment_submissions" ("file_id");--> statement-breakpoint
CREATE INDEX "class_meeting_configs_class_instance_id_idx" ON "class_meeting_configs" ("class_instance_id");--> statement-breakpoint
CREATE INDEX "class_meeting_configs_recurring_schedule_id_idx" ON "class_meeting_configs" ("recurring_schedule_id");--> statement-breakpoint
CREATE INDEX "class_meeting_configs_provider_id_idx" ON "class_meeting_configs" ("provider_id");--> statement-breakpoint
CREATE UNIQUE INDEX "class_meeting_configs_one_default_per_instance_idx" ON "class_meeting_configs" ("class_instance_id") WHERE "is_default" = true AND "class_instance_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "class_meeting_configs_one_default_per_recurring_idx" ON "class_meeting_configs" ("recurring_schedule_id") WHERE "is_default" = true AND "recurring_schedule_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" ("status");--> statement-breakpoint
ALTER TABLE "invoice_payment_submissions" ADD CONSTRAINT "invoice_payment_submissions_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "invoice_payment_submissions" ADD CONSTRAINT "invoice_payment_submissions_file_id_storage_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "storage_file"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "invoice_payment_submissions" ADD CONSTRAINT "invoice_payment_submissions_submitted_by_user_id_users_id_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "invoice_payment_submissions" ADD CONSTRAINT "invoice_payment_submissions_reviewed_by_user_id_users_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "class_meeting_configs" ADD CONSTRAINT "class_meeting_configs_class_instance_id_class_instances_id_fkey" FOREIGN KEY ("class_instance_id") REFERENCES "class_instances"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "class_meeting_configs" ADD CONSTRAINT "class_meeting_configs_hyosSBhez29d_fkey" FOREIGN KEY ("recurring_schedule_id") REFERENCES "recurring_schedules"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "class_meeting_configs" ADD CONSTRAINT "class_meeting_configs_provider_id_meeting_providers_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "meeting_providers"("id") ON DELETE RESTRICT;