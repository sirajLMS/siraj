CREATE TYPE "attendance_evaluation" AS ENUM('PRESENT', 'ABSENT', 'LATE');--> statement-breakpoint
CREATE TYPE "credit_reason" AS ENUM('PURCHASE', 'DEDUCTION', 'REFUND', 'ADJUSTMENT');--> statement-breakpoint
CREATE TYPE "lesson_report_status" AS ENUM('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "teacher_due_status" AS ENUM('PENDING', 'PAID');--> statement-breakpoint
ALTER TYPE "app_permission" ADD VALUE 'lesson_reports.submit';--> statement-breakpoint
ALTER TYPE "app_permission" ADD VALUE 'lesson_reports.review';--> statement-breakpoint
ALTER TYPE "app_permission" ADD VALUE 'lesson_reports.approve';--> statement-breakpoint
ALTER TYPE "app_permission" ADD VALUE 'lesson_reports.reject';--> statement-breakpoint
ALTER TYPE "app_permission" ADD VALUE 'supervisor.view_dashboard';--> statement-breakpoint
ALTER TYPE "app_permission" ADD VALUE 'student.view_own_dashboard';--> statement-breakpoint
ALTER TYPE "app_permission" ADD VALUE 'credits.manage';--> statement-breakpoint
ALTER TYPE "app_permission" ADD VALUE 'teacher_dues.view';--> statement-breakpoint
ALTER TYPE "app_permission" ADD VALUE 'monthly_reports.view';--> statement-breakpoint
ALTER TYPE "notification_event_type" ADD VALUE 'INVOICE_STATUS_CHANGED';--> statement-breakpoint
ALTER TYPE "notification_event_type" ADD VALUE 'CLASS_SCHEDULED';--> statement-breakpoint
ALTER TYPE "notification_event_type" ADD VALUE 'CLASS_ACTIVATED';--> statement-breakpoint
ALTER TYPE "notification_event_type" ADD VALUE 'CLASS_STARTED';--> statement-breakpoint
ALTER TYPE "notification_event_type" ADD VALUE 'CLASS_COMPLETED';--> statement-breakpoint
ALTER TYPE "notification_event_type" ADD VALUE 'CLASS_MARKED_ABSENT';--> statement-breakpoint
ALTER TYPE "notification_event_type" ADD VALUE 'CLASS_MARKED_MISSED';--> statement-breakpoint
ALTER TYPE "notification_event_type" ADD VALUE 'CLASS_LEAVE_REQUESTED';--> statement-breakpoint
ALTER TYPE "notification_event_type" ADD VALUE 'CLASS_RESCHEDULED';--> statement-breakpoint
ALTER TYPE "notification_event_type" ADD VALUE 'CLASS_CANCELLED';--> statement-breakpoint
ALTER TYPE "notification_event_type" ADD VALUE 'CLASS_RESET';--> statement-breakpoint
ALTER TYPE "notification_event_type" ADD VALUE 'STUDENT_TEACHER_REASSIGNED';--> statement-breakpoint
ALTER TYPE "notification_event_type" ADD VALUE 'STUDENT_STATUS_CHANGED';--> statement-breakpoint
ALTER TYPE "notification_event_type" ADD VALUE 'STUDENT_QUOTA_OVERRIDDEN';--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"student_id" uuid NOT NULL,
	"change_amount" integer NOT NULL,
	"reason" "credit_reason" NOT NULL,
	"source_payment_id" uuid,
	"class_instance_id" uuid,
	"notes" text,
	"credited_by_user_id" uuid NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"class_instance_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"lesson_date" timestamp(3) with time zone NOT NULL,
	"duration_minutes" integer NOT NULL,
	"attendance_evaluation" "attendance_evaluation" NOT NULL,
	"teacher_notes" text,
	"student_notes" text,
	"completion_percentage" integer DEFAULT 0 NOT NULL,
	"status" "lesson_report_status" DEFAULT 'PENDING_REVIEW'::"lesson_report_status" NOT NULL,
	"submitted_by_user_id" uuid NOT NULL,
	"submitted_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp(3) with time zone,
	"rejection_reason" text,
	"idempotency_key" varchar(255) NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_reports_completion_percentage_chk" CHECK ("completion_percentage" >= 0 AND "completion_percentage" <= 100),
	CONSTRAINT "lesson_reports_review_consistency_chk" CHECK (("status" != 'REJECTED' OR "rejection_reason" IS NOT NULL) AND ("status" != 'APPROVED' OR "rejection_reason" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "teacher_dues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"teacher_id" uuid NOT NULL,
	"class_instance_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"hours" numeric(8,2) NOT NULL,
	"amount" numeric(12,2) NOT NULL,
	"currency" "currency_code" NOT NULL,
	"status" "teacher_due_status" DEFAULT 'PENDING'::"teacher_due_status" NOT NULL,
	"approved_by_user_id" uuid NOT NULL,
	"approved_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"teacher_payment_id" uuid,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "impersonation_sessions_one_active_per_actor" ON "impersonation_sessions" ("actor_user_id") WHERE "is_active" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "credit_transactions_idempotency_key_unique_idx" ON "credit_transactions" ("idempotency_key");--> statement-breakpoint
CREATE INDEX "credit_transactions_student_id_idx" ON "credit_transactions" ("student_id");--> statement-breakpoint
CREATE INDEX "credit_transactions_reason_idx" ON "credit_transactions" ("reason");--> statement-breakpoint
CREATE INDEX "credit_transactions_class_instance_id_idx" ON "credit_transactions" ("class_instance_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_reports_class_instance_id_unique_idx" ON "lesson_reports" ("class_instance_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_reports_idempotency_key_unique_idx" ON "lesson_reports" ("idempotency_key");--> statement-breakpoint
CREATE INDEX "lesson_reports_status_idx" ON "lesson_reports" ("status");--> statement-breakpoint
CREATE INDEX "lesson_reports_teacher_id_idx" ON "lesson_reports" ("teacher_id");--> statement-breakpoint
CREATE INDEX "lesson_reports_student_id_idx" ON "lesson_reports" ("student_id");--> statement-breakpoint
CREATE INDEX "students_user_id_idx" ON "students" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "students_user_id_unique_idx" ON "students" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "teacher_dues_class_instance_id_unique_idx" ON "teacher_dues" ("class_instance_id");--> statement-breakpoint
CREATE INDEX "teacher_dues_teacher_id_idx" ON "teacher_dues" ("teacher_id");--> statement-breakpoint
CREATE INDEX "teacher_dues_status_idx" ON "teacher_dues" ("status");--> statement-breakpoint
CREATE INDEX "teacher_dues_approved_at_idx" ON "teacher_dues" ("approved_at");--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_student_id_students_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_source_payment_id_payments_id_fkey" FOREIGN KEY ("source_payment_id") REFERENCES "payments"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_class_instance_id_class_instances_id_fkey" FOREIGN KEY ("class_instance_id") REFERENCES "class_instances"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_credited_by_user_id_users_id_fkey" FOREIGN KEY ("credited_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "lesson_reports" ADD CONSTRAINT "lesson_reports_class_instance_id_class_instances_id_fkey" FOREIGN KEY ("class_instance_id") REFERENCES "class_instances"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "lesson_reports" ADD CONSTRAINT "lesson_reports_student_id_students_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "lesson_reports" ADD CONSTRAINT "lesson_reports_teacher_id_teachers_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "lesson_reports" ADD CONSTRAINT "lesson_reports_submitted_by_user_id_users_id_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "lesson_reports" ADD CONSTRAINT "lesson_reports_reviewed_by_user_id_users_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "teacher_dues" ADD CONSTRAINT "teacher_dues_teacher_id_teachers_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "teacher_dues" ADD CONSTRAINT "teacher_dues_class_instance_id_class_instances_id_fkey" FOREIGN KEY ("class_instance_id") REFERENCES "class_instances"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "teacher_dues" ADD CONSTRAINT "teacher_dues_student_id_students_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "teacher_dues" ADD CONSTRAINT "teacher_dues_approved_by_user_id_users_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "teacher_dues" ADD CONSTRAINT "teacher_dues_teacher_payment_id_teacher_payments_id_fkey" FOREIGN KEY ("teacher_payment_id") REFERENCES "teacher_payments"("id") ON DELETE SET NULL;