DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'appraisal.submit'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'appraisal.submit';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'appraisal.view'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'appraisal.view';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_permission' AND e.enumlabel = 'appraisal.feedback'
    ) THEN
        ALTER TYPE "app_permission" ADD VALUE 'appraisal.feedback';
    END IF;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "appraisal_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"appraisal_id" uuid NOT NULL,
	"author_user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monthly_appraisals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"student_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"month" timestamp(3) with time zone NOT NULL,
	"behavior_grade" integer,
	"behavior_comment" text,
	"attendance_grade" integer,
	"attendance_comment" text,
	"punctuality_grade" integer,
	"punctuality_comment" text,
	"overall_grade" integer,
	"overall_comment" text,
	"learning_targets" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "signed_url" ADD COLUMN IF NOT EXISTS "uploaded_by_user_id" varchar(36);--> statement-breakpoint
DROP INDEX IF EXISTS "class_categories_slug_idx";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "class_categories_slug_idx" ON "class_categories" ("slug");--> statement-breakpoint
DROP INDEX IF EXISTS "parents_user_id_idx";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "parents_user_id_idx" ON "parents" ("user_id");--> statement-breakpoint
DROP INDEX IF EXISTS "staff_profiles_user_id_idx";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "staff_profiles_user_id_idx" ON "staff_profiles" ("user_id");--> statement-breakpoint
DROP INDEX IF EXISTS "teachers_user_id_idx";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "teachers_user_id_idx" ON "teachers" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appraisal_feedback_appraisal_id_idx" ON "appraisal_feedback" ("appraisal_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appraisal_feedback_author_user_id_idx" ON "appraisal_feedback" ("author_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appraisal_feedback_created_at_idx" ON "appraisal_feedback" ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "monthly_appraisals_student_teacher_month_unique_idx" ON "monthly_appraisals" ("student_id","teacher_id","month");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "monthly_appraisals_student_id_idx" ON "monthly_appraisals" ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "monthly_appraisals_teacher_id_idx" ON "monthly_appraisals" ("teacher_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "monthly_appraisals_month_idx" ON "monthly_appraisals" ("month");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "monthly_appraisals_created_at_idx" ON "monthly_appraisals" ("created_at");--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "appraisal_feedback" ADD CONSTRAINT "appraisal_feedback_appraisal_id_monthly_appraisals_id_fkey" FOREIGN KEY ("appraisal_id") REFERENCES "monthly_appraisals"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "appraisal_feedback" ADD CONSTRAINT "appraisal_feedback_author_user_id_users_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "monthly_appraisals" ADD CONSTRAINT "monthly_appraisals_student_id_students_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "monthly_appraisals" ADD CONSTRAINT "monthly_appraisals_teacher_id_teachers_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "lesson_reports" DROP CONSTRAINT IF EXISTS "lesson_reports_submitted_by_user_id_users_id_fkey", ADD CONSTRAINT "lesson_reports_submitted_by_user_id_users_id_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;