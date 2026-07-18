ALTER TYPE "app_permission" ADD VALUE 'teacher_dues.mark_paid' BEFORE 'monthly_reports.view';--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD COLUMN "metadata" jsonb;