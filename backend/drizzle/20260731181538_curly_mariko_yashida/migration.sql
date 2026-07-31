CREATE TYPE "ondemand_no_credits_outcome" AS ENUM('AUTO_CANCEL', 'AUTO_ABSENT_NO_CREDITS', 'REMIND_ONLY');--> statement-breakpoint
CREATE TYPE "ondemand_status" AS ENUM('PENDING_CREDIT', 'AVAILABLE', 'CONVERTED', 'NO_CREDITS_CANCELLED', 'NO_CREDITS_ABSENT', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "quota_kind" AS ENUM('PACKAGE', 'PERIODIC');--> statement-breakpoint
CREATE TYPE "quota_ledger_reason" AS ENUM('GRANT', 'RESERVE', 'REDEEM', 'RELEASE', 'EXPIRE', 'ADJUST');--> statement-breakpoint
CREATE TYPE "quota_period_type" AS ENUM('WEEKLY', 'MONTHLY', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "quota_status" AS ENUM('ACTIVE', 'EXPIRED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "scheduling_mode" AS ENUM('NUMBER_OF_CLASSES', 'ON_DEMAND', 'QUOTA');--> statement-breakpoint
ALTER TYPE "class_execution_state" ADD VALUE 'ON_DEMAND_PENDING_CREDITS';--> statement-breakpoint
ALTER TYPE "class_execution_state" ADD VALUE 'ON_DEMAND_CONFLICT_HELD';--> statement-breakpoint
ALTER TYPE "class_execution_state" ADD VALUE 'ON_DEMAND_NO_CREDITS_CANCELLED';--> statement-breakpoint
ALTER TYPE "class_execution_state" ADD VALUE 'ON_DEMAND_NO_CREDITS_ABSENT';--> statement-breakpoint
ALTER TYPE "notification_event_type" ADD VALUE 'QUOTA_EXPIRING_SOON';--> statement-breakpoint
ALTER TYPE "notification_event_type" ADD VALUE 'QUOTA_EXPIRED';--> statement-breakpoint
ALTER TYPE "notification_event_type" ADD VALUE 'QUOTA_LOW_BALANCE';--> statement-breakpoint
ALTER TYPE "notification_event_type" ADD VALUE 'ON_DEMAND_INSTANCE_PENDING_CREDIT';--> statement-breakpoint
ALTER TYPE "notification_event_type" ADD VALUE 'ON_DEMAND_INSTANCE_REMINDER_T3';--> statement-breakpoint
ALTER TYPE "notification_event_type" ADD VALUE 'ON_DEMAND_INSTANCE_REMINDER_T1';--> statement-breakpoint
ALTER TYPE "notification_event_type" ADD VALUE 'ON_DEMAND_TEACHER_DAILY_DIGEST';--> statement-breakpoint
CREATE TABLE "quota_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"quota_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"recurring_schedule_id" uuid,
	"class_instance_id" uuid,
	"delta" integer NOT NULL,
	"reason" "quota_ledger_reason" NOT NULL,
	"reason_note" text,
	"idempotency_key" varchar(255) NOT NULL,
	"actor_user_id" uuid,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"student_id" uuid NOT NULL,
	"kind" "quota_kind" NOT NULL,
	"name" varchar(255) NOT NULL,
	"total_classes" integer NOT NULL,
	"remaining" integer DEFAULT 0 NOT NULL,
	"reserved_classes" integer DEFAULT 0 NOT NULL,
	"used_this_period" integer DEFAULT 0 NOT NULL,
	"period_type" "quota_period_type",
	"period_days" integer,
	"period_anchor" timestamp(3) with time zone,
	"valid_from" date,
	"valid_until" date,
	"status" "quota_status" DEFAULT 'ACTIVE'::"quota_status" NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"rollover_policy" jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp(3) with time zone,
	CONSTRAINT "quotas_kind_period_consistency_chk" CHECK (
        ("kind" = 'PACKAGE' AND "period_type" IS NULL AND "period_days" IS NULL AND "period_anchor" IS NULL) OR
        ("kind" = 'PERIODIC' AND "period_type" IS NOT NULL AND "period_days" IS NOT NULL)
      ),
	CONSTRAINT "quotas_remaining_non_negative_chk" CHECK ("remaining" >= 0),
	CONSTRAINT "quotas_reserved_not_exceed_remaining_chk" CHECK ("reserved_classes" <= "remaining"),
	CONSTRAINT "quotas_used_this_period_non_negative_chk" CHECK ("used_this_period" >= 0),
	CONSTRAINT "quotas_rollover_policy_valid_chk" CHECK (
        "rollover_policy" IS NULL OR (
          jsonb_typeof("rollover_policy") = 'object' AND
          "rollover_policy" ? 'maxRolloverPercent' AND
          "rollover_policy" ? 'accumulationCap'
        )
      )
);
--> statement-breakpoint
ALTER TABLE "class_instances" ADD COLUMN "scheduling_mode" "scheduling_mode" DEFAULT 'NUMBER_OF_CLASSES'::"scheduling_mode" NOT NULL;--> statement-breakpoint
ALTER TABLE "class_instances" ADD COLUMN "ondemand_status" "ondemand_status";--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD COLUMN "quota_id" uuid;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD COLUMN "earmarked_classes" integer;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD COLUMN "scheduling_mode" "scheduling_mode" DEFAULT 'NUMBER_OF_CLASSES'::"scheduling_mode" NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD COLUMN "generation_horizon_weeks" integer;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD COLUMN "ondemand_no_credits_outcome" "ondemand_no_credits_outcome";--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "key" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "app_permission";--> statement-breakpoint
CREATE TYPE "app_permission" AS ENUM('auth.login', 'dashboard.view', 'dashboard.view_metrics', 'dashboard.filter_metrics', 'dashboard.metrics.view_all', 'schedule.view_list', 'schedule.filter_advanced', 'schedule.view_all', 'schedule.view_assigned', 'schedule.view_family', 'schedule.search_availability', 'schedule.manage_recurring', 'schedule.dst_migrate', 'session.view_details', 'session.activate_class', 'session.activate_override', 'session.update_status.start', 'session.update_status.absent', 'session.update_status.leave', 'session.reschedule', 'session.reset', 'session.override_actions', 'dashboard.search', 'schedule.view_timezones', 'settings.timezones_view', 'history.view_calendar', 'history.view_details', 'teacher.view_dashboard', 'teacher.view_students', 'system.enforce_time_window', 'system.enforce_leave_limit', 'teachers.list', 'teachers.create', 'teachers.edit', 'teachers.manage_schedule', 'staff.view_directory', 'schedule.view_weekly', 'schedule.view_workload', 'schedule.create_class', 'parents.list', 'parents.create', 'parents.edit', 'students.list', 'students.create', 'students.edit', 'students.change_teacher', 'students.change_status', 'students.override_quota', 'invoices.list', 'invoices.delete', 'invoices.create', 'invoices.mark_paid', 'invoices.edit', 'resources.list', 'resources.delete', 'resources.upload', 'reports.generate', 'report.generate_custom', 'report.view_financials', 'complaints.list', 'complaints.delete', 'complaints.respond', 'support.submit_complaint', 'support.view_history', 'communication.submit_suggestion', 'system.dispatch_email', 'staff.list', 'staff.create', 'staff.edit', 'permission_groups.manage', 'permission_groups.assign', 'notification.view_alerts', 'billing.view_unpaid_invoices', 'schedule.delete_class', 'schedule.clear_weekly', 'system.bulk_update_dst', 'parent.view_directory', 'parent.view_students', 'parent.manage_status', 'student.view_associated', 'student.edit_quota', 'billing.view_history', 'document.manage_parent_docs', 'billing.create_invoice', 'billing.update_status_paid', 'billing.submit_payment_proof', 'billing.delete_invoice', 'student.reassign_teacher', 'student.manage_status', 'system.sync_notifications', 'system.enforce_suspended_lock', 'system.process_student_leave', 'system.restrict_resource_access', 'suggestions.list', 'suggestions.review', 'suggestions.delete', 'subjects.list', 'subjects.create', 'subjects.update', 'subjects.delete', 'subjects.view_resources', 'subjects.manage_resources', 'categories.list', 'categories.create', 'categories.update', 'categories.delete', 'notes.list', 'notes.create', 'notes.update', 'notes.delete', 'test.system_only', 'test.custom_only', 'test.custom_alt', 'storage.manage', 'billing.view_exchange_rates', 'billing.refresh_exchange_rates', 'billing.manage_fx_provider', 'billing.override_exchange_rates', 'billing.manage_currency_hedges', 'billing.manage_currencies', 'payment_methods.manage_catalogs', 'payment_methods.verify_bank_transfer', 'meeting_providers.manage_catalog', 'meeting_configs.manage_own', 'meeting_configs.manage_other', 'meeting_configs.manage_class', 'profile.core_identity.view_own', 'profile.core_identity.view_other', 'profile.core_identity.edit_own', 'profile.core_identity.edit_other', 'profile.core_contact.view_own', 'profile.core_contact.view_other', 'profile.core_contact.edit_own', 'profile.core_contact.edit_other', 'profile.teacher_professional.view_own', 'profile.teacher_professional.view_other', 'profile.teacher_professional.edit_own', 'profile.teacher_professional.edit_other', 'profile.teacher_identity.view_own', 'profile.teacher_identity.view_other', 'profile.teacher_identity.edit_own', 'profile.teacher_identity.edit_other', 'profile.parent_social.view_own', 'profile.parent_social.view_other', 'profile.parent_social.edit_own', 'profile.parent_social.edit_other', 'profile.parent_identity.view_own', 'profile.parent_identity.view_other', 'profile.parent_identity.edit_own', 'profile.parent_identity.edit_other', 'profile.parent_billing.view_own', 'profile.parent_billing.view_other', 'profile.parent_billing.edit_own', 'profile.parent_billing.edit_other', 'profile.parent_account.view_own', 'profile.parent_account.view_other', 'profile.parent_account.edit_own', 'profile.parent_account.edit_other', 'profile.parent_students.view_own', 'profile.parent_students.view_other', 'profile.parent_students.edit_own', 'profile.parent_students.edit_other', 'profile.teacher_students.view_own', 'profile.teacher_students.view_other', 'profile.teacher_students.edit_own', 'profile.teacher_students.edit_other', 'profile.staff_role.view_own', 'profile.staff_role.view_other', 'profile.staff_role.edit_own', 'profile.staff_role.edit_other', 'profile.staff_permissions.view_own', 'profile.staff_permissions.view_other', 'profile.staff_permissions.edit_own', 'profile.staff_permissions.edit_other', 'profile.payment_methods.view_own', 'profile.payment_methods.view_other', 'profile.payment_methods.edit_own', 'profile.payment_methods.edit_other', 'profile.meeting_configs.view_own', 'profile.meeting_configs.view_other', 'profile.meeting_configs.edit_own', 'profile.meeting_configs.edit_other', 'student.student_identity.view_own', 'student.student_identity.view_other', 'student.student_identity.edit_own', 'student.student_identity.edit_other', 'student.student_academic.view_own', 'student.student_academic.view_other', 'student.student_academic.edit_own', 'student.student_academic.edit_other', 'student.student_teacher.view_own', 'student.student_teacher.view_other', 'student.student_teacher.edit_own', 'student.student_teacher.edit_other', 'student.student_parent.view_own', 'student.student_parent.view_other', 'student.student_parent.edit_own', 'student.student_parent.edit_other', 'student.student_schedule.view_own', 'student.student_schedule.view_other', 'student.student_schedule.edit_own', 'student.student_schedule.edit_other', 'student.student_history.view_own', 'student.student_history.view_other', 'student.student_history.edit_own', 'student.student_history.edit_other', 'student.student_quota_edit.view_own', 'student.student_quota_edit.view_other', 'student.student_quota_edit.edit_own', 'student.student_quota_edit.edit_other', 'lesson_reports.submit', 'lesson_reports.review', 'lesson_reports.approve', 'lesson_reports.reject', 'supervisor.view_dashboard', 'student.view_own_dashboard', 'credits.manage', 'teacher_dues.view', 'teacher_dues.mark_paid', 'monthly_reports.view', 'settings.view', 'settings.edit_general', 'settings.edit_env', 'settings.edit_session', 'settings.audit_view', 'settings.site_content_manage', 'quotas.view', 'quotas.manage');--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "key" SET DATA TYPE "app_permission" USING "key"::"app_permission";--> statement-breakpoint
CREATE UNIQUE INDEX "quota_ledger_idempotency_key_unique_idx" ON "quota_ledger" ("idempotency_key");--> statement-breakpoint
CREATE INDEX "quota_ledger_quota_id_created_at_idx" ON "quota_ledger" ("quota_id","created_at");--> statement-breakpoint
CREATE INDEX "quota_ledger_student_id_idx" ON "quota_ledger" ("student_id");--> statement-breakpoint
CREATE INDEX "quota_ledger_class_instance_id_idx" ON "quota_ledger" ("class_instance_id");--> statement-breakpoint
CREATE INDEX "quota_ledger_recurring_schedule_id_idx" ON "quota_ledger" ("recurring_schedule_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quotas_idempotency_key_unique_idx" ON "quotas" ("idempotency_key");--> statement-breakpoint
CREATE INDEX "quotas_student_id_idx" ON "quotas" ("student_id");--> statement-breakpoint
CREATE INDEX "quotas_student_status_remaining_idx" ON "quotas" ("student_id","status","remaining") WHERE deleted_at IS NULL AND status = 'ACTIVE' AND remaining > 0;--> statement-breakpoint
CREATE INDEX "quotas_valid_until_idx" ON "quotas" ("valid_until") WHERE deleted_at IS NULL AND status = 'ACTIVE';--> statement-breakpoint
CREATE INDEX "class_instances_ondemand_status_idx" ON "class_instances" ("ondemand_status");--> statement-breakpoint
CREATE INDEX "recurring_schedules_quota_id_idx" ON "recurring_schedules" ("quota_id");--> statement-breakpoint
ALTER TABLE "quota_ledger" ADD CONSTRAINT "quota_ledger_quota_id_quotas_id_fkey" FOREIGN KEY ("quota_id") REFERENCES "quotas"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "quota_ledger" ADD CONSTRAINT "quota_ledger_student_id_students_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "quota_ledger" ADD CONSTRAINT "quota_ledger_recurring_schedule_id_recurring_schedules_id_fkey" FOREIGN KEY ("recurring_schedule_id") REFERENCES "recurring_schedules"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "quota_ledger" ADD CONSTRAINT "quota_ledger_class_instance_id_class_instances_id_fkey" FOREIGN KEY ("class_instance_id") REFERENCES "class_instances"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "quota_ledger" ADD CONSTRAINT "quota_ledger_actor_user_id_users_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "quotas" ADD CONSTRAINT "quotas_student_id_students_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD CONSTRAINT "recurring_schedules_quota_id_quotas_id_fkey" FOREIGN KEY ("quota_id") REFERENCES "quotas"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "class_instances" ADD CONSTRAINT "class_instances_ondemand_status_scheduling_mode_chk" CHECK (
        ("ondemand_status" IS NULL AND "scheduling_mode" != 'ON_DEMAND') OR
        ("ondemand_status" IS NOT NULL AND "scheduling_mode" = 'ON_DEMAND')
      );--> statement-breakpoint
ALTER TABLE "class_instances" DROP CONSTRAINT "class_instances_state_machine_chk", ADD CONSTRAINT "class_instances_state_machine_chk" CHECK (
        ("execution_state" != 'COMPLETED' OR "outcome" != 'PENDING') AND
        ("execution_state" != 'NOT_ACTIVATED' OR "actual_start_at" IS NULL) AND
        ("force_activated" = false OR "force_activated_by_user_id" IS NOT NULL) AND
        ("outcome" != 'TAKEN' OR "actual_start_at" IS NOT NULL) AND
        ("is_rate_overridden" = false OR "rate_amount" IS NOT NULL) AND
        ("execution_state" NOT IN ('ON_DEMAND_PENDING_CREDITS', 'ON_DEMAND_CONFLICT_HELD', 'ON_DEMAND_NO_CREDITS_CANCELLED', 'ON_DEMAND_NO_CREDITS_ABSENT') OR "scheduling_mode" = 'ON_DEMAND')
      );