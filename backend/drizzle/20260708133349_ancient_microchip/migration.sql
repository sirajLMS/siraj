ALTER TYPE "app_permission" ADD VALUE 'auth.edit_own_profile' BEFORE 'dashboard.view';--> statement-breakpoint
ALTER TYPE "app_permission" ADD VALUE 'teacher.edit_own_profile' BEFORE 'system.enforce_time_window';--> statement-breakpoint
ALTER TYPE "app_permission" ADD VALUE 'user.edit_profile' BEFORE 'schedule.delete_class';--> statement-breakpoint
ALTER TYPE "app_permission" ADD VALUE 'parent.edit_own_profile' BEFORE 'parent.manage_status';--> statement-breakpoint
ALTER TABLE "parents" DROP COLUMN "skype";--> statement-breakpoint
ALTER TABLE "staff_profiles" DROP COLUMN "skype_id";--> statement-breakpoint
ALTER TABLE "teachers" DROP COLUMN "skype_id";