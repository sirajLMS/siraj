ALTER TABLE "class_instances" ALTER COLUMN "student_id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "class_instances" ALTER COLUMN "teacher_id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "class_instances" ALTER COLUMN "subject_id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "recurring_schedules" ALTER COLUMN "student_id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "recurring_schedules" ALTER COLUMN "teacher_id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "recurring_schedules" ALTER COLUMN "subject_id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "session_metadata" ALTER COLUMN "user_id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "user_id" SET DEFAULT gen_random_uuid();