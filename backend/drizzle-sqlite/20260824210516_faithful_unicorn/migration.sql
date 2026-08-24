CREATE TABLE `appraisal_feedback` (
	`id` text PRIMARY KEY,
	`appraisal_id` text NOT NULL,
	`author_user_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_appraisal_feedback_appraisal_id_monthly_appraisals_id_fk` FOREIGN KEY (`appraisal_id`) REFERENCES `monthly_appraisals`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_appraisal_feedback_author_user_id_users_id_fk` FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `monthly_appraisals` (
	`id` text PRIMARY KEY,
	`student_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`month` integer NOT NULL,
	`behavior_grade` integer,
	`behavior_comment` text,
	`attendance_grade` integer,
	`attendance_comment` text,
	`punctuality_grade` integer,
	`punctuality_comment` text,
	`overall_grade` integer,
	`overall_comment` text,
	`learning_targets` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_monthly_appraisals_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_monthly_appraisals_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `signed_url` ADD `uploaded_by_user_id` text;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_lesson_reports` (
	`id` text PRIMARY KEY,
	`class_instance_id` text NOT NULL,
	`student_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`lesson_date` integer NOT NULL,
	`duration_minutes` integer NOT NULL,
	`attendance_evaluation` text NOT NULL,
	`teacher_notes` text,
	`student_notes` text,
	`completion_percentage` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'PENDING_REVIEW' NOT NULL,
	`submitted_by_user_id` text NOT NULL,
	`submitted_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`reviewed_by_user_id` text,
	`reviewed_at` integer,
	`rejection_reason` text,
	`idempotency_key` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_lesson_reports_class_instance_id_class_instances_id_fk` FOREIGN KEY (`class_instance_id`) REFERENCES `class_instances`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_lesson_reports_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_lesson_reports_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_lesson_reports_submitted_by_user_id_users_id_fk` FOREIGN KEY (`submitted_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_lesson_reports_reviewed_by_user_id_users_id_fk` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
	CONSTRAINT "lesson_reports_completion_percentage_chk" CHECK("completion_percentage" >= 0 AND "completion_percentage" <= 100),
	CONSTRAINT "lesson_reports_review_consistency_chk" CHECK(("status" != 'REJECTED' OR "rejection_reason" IS NOT NULL) AND ("status" != 'APPROVED' OR "rejection_reason" IS NULL))
);
--> statement-breakpoint
INSERT INTO `__new_lesson_reports`(`id`, `class_instance_id`, `student_id`, `teacher_id`, `lesson_date`, `duration_minutes`, `attendance_evaluation`, `teacher_notes`, `student_notes`, `completion_percentage`, `status`, `submitted_by_user_id`, `submitted_at`, `reviewed_by_user_id`, `reviewed_at`, `rejection_reason`, `idempotency_key`, `created_at`, `updated_at`) SELECT `id`, `class_instance_id`, `student_id`, `teacher_id`, `lesson_date`, `duration_minutes`, `attendance_evaluation`, `teacher_notes`, `student_notes`, `completion_percentage`, `status`, `submitted_by_user_id`, `submitted_at`, `reviewed_by_user_id`, `reviewed_at`, `rejection_reason`, `idempotency_key`, `created_at`, `updated_at` FROM `lesson_reports`;--> statement-breakpoint
DROP TABLE `lesson_reports`;--> statement-breakpoint
ALTER TABLE `__new_lesson_reports` RENAME TO `lesson_reports`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_reports_class_instance_id_unique_idx` ON `lesson_reports` (`class_instance_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_reports_idempotency_key_unique_idx` ON `lesson_reports` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `lesson_reports_status_idx` ON `lesson_reports` (`status`);--> statement-breakpoint
CREATE INDEX `lesson_reports_teacher_id_idx` ON `lesson_reports` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `lesson_reports_student_id_idx` ON `lesson_reports` (`student_id`);--> statement-breakpoint
CREATE INDEX `lesson_reports_submitted_by_user_id_idx` ON `lesson_reports` (`submitted_by_user_id`);--> statement-breakpoint
CREATE INDEX `lesson_reports_reviewed_by_user_id_idx` ON `lesson_reports` (`reviewed_by_user_id`);--> statement-breakpoint
CREATE INDEX `lesson_reports_submitted_at_idx` ON `lesson_reports` (`submitted_at`);--> statement-breakpoint
CREATE INDEX `lesson_reports_reviewed_at_idx` ON `lesson_reports` (`reviewed_at`);--> statement-breakpoint
CREATE INDEX `lesson_reports_lesson_date_idx` ON `lesson_reports` (`lesson_date`);--> statement-breakpoint
CREATE INDEX `lesson_reports_attendance_evaluation_idx` ON `lesson_reports` (`attendance_evaluation`);--> statement-breakpoint
CREATE INDEX `lesson_reports_status_submitted_at_idx` ON `lesson_reports` (`status`,`submitted_at`);--> statement-breakpoint
CREATE INDEX `lesson_reports_teacher_id_status_idx` ON `lesson_reports` (`teacher_id`,`status`);--> statement-breakpoint
CREATE INDEX `lesson_reports_student_id_status_idx` ON `lesson_reports` (`student_id`,`status`);--> statement-breakpoint
CREATE INDEX `appraisal_feedback_appraisal_id_idx` ON `appraisal_feedback` (`appraisal_id`);--> statement-breakpoint
CREATE INDEX `appraisal_feedback_author_user_id_idx` ON `appraisal_feedback` (`author_user_id`);--> statement-breakpoint
CREATE INDEX `appraisal_feedback_created_at_idx` ON `appraisal_feedback` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `monthly_appraisals_student_teacher_month_unique_idx` ON `monthly_appraisals` (`student_id`,`teacher_id`,`month`);--> statement-breakpoint
CREATE INDEX `monthly_appraisals_student_id_idx` ON `monthly_appraisals` (`student_id`);--> statement-breakpoint
CREATE INDEX `monthly_appraisals_teacher_id_idx` ON `monthly_appraisals` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `monthly_appraisals_month_idx` ON `monthly_appraisals` (`month`);--> statement-breakpoint
CREATE INDEX `monthly_appraisals_created_at_idx` ON `monthly_appraisals` (`created_at`);