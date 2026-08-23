CREATE TABLE `appearance_settings` (
	`id` text PRIMARY KEY,
	`primary_main` text NOT NULL,
	`secondary_main` text NOT NULL,
	`logo_url` text,
	`site_name` text NOT NULL,
	`site_title` text NOT NULL,
	`site_description` text NOT NULL,
	`default_color_scheme` text NOT NULL,
	`draft_fields` text NOT NULL,
	`updated_by_user_id` text,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_appearance_settings_updated_by_user_id_users_id_fk` FOREIGN KEY (`updated_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `admin_audit_logs` (
	`id` text PRIMARY KEY,
	`actor_user_id` text NOT NULL,
	`target_user_id` text,
	`action` text NOT NULL,
	`description` text,
	`previous_state` text,
	`new_state` text,
	`ip_address` text,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_admin_audit_logs_actor_user_id_users_id_fk` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_admin_audit_logs_target_user_id_users_id_fk` FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY,
	`actor_user_id` text,
	`actor_type` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`description` text,
	`previous_state` text,
	`new_state` text,
	`changes` text,
	`ip_address` text,
	`user_agent` text,
	`metadata` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_audit_logs_actor_user_id_users_id_fk` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `impersonation_sessions` (
	`id` text PRIMARY KEY,
	`actor_user_id` text NOT NULL,
	`target_user_id` text NOT NULL,
	`session_id` text NOT NULL,
	`reason` text,
	`started_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`ended_at` integer,
	`ip_address` text,
	`user_agent` text,
	`is_active` integer DEFAULT true NOT NULL,
	CONSTRAINT `fk_impersonation_sessions_actor_user_id_users_id_fk` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_impersonation_sessions_target_user_id_users_id_fk` FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `currency_exchange_audit_logs` (
	`id` text PRIMARY KEY,
	`from_currency` text NOT NULL,
	`to_currency` text NOT NULL,
	`old_rate` text,
	`new_rate` text NOT NULL,
	`source` text NOT NULL,
	`changed_by_user_id` text,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_currency_exchange_audit_logs_changed_by_user_id_users_id_fk` FOREIGN KEY (`changed_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `currency_exchange_rates` (
	`id` text PRIMARY KEY,
	`from_currency` text NOT NULL,
	`to_currency` text NOT NULL,
	`rate` text NOT NULL,
	`source` text,
	`provider_response` text,
	`effective_date` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `currency_hedges` (
	`id` text PRIMARY KEY,
	`currency` text NOT NULL,
	`amount` text NOT NULL,
	`hedge_type` text NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invoice_coverage_months` (
	`invoice_id` text NOT NULL,
	`year` integer NOT NULL,
	`month` integer NOT NULL,
	CONSTRAINT `invoice_coverage_months_pk` PRIMARY KEY(`invoice_id`, `year`, `month`),
	CONSTRAINT `fk_invoice_coverage_months_invoice_id_invoices_id_fk` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY,
	`parent_id` text NOT NULL,
	`student_id` text,
	`issue_date` text NOT NULL,
	`due_date` text NOT NULL,
	`paid_date` text,
	`amount` text NOT NULL,
	`currency` text NOT NULL,
	`status` text NOT NULL,
	`invoice_type` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`exchange_rate_snapshot` text,
	`exchange_rate_source` text,
	`created_by_user_id` text,
	`email_sent_at` integer,
	`idempotency_key` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	CONSTRAINT `fk_invoices_parent_id_parents_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_invoices_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_invoices_created_by_user_id_users_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY,
	`invoice_id` text NOT NULL,
	`amount` text NOT NULL,
	`currency` text NOT NULL,
	`payment_date` integer NOT NULL,
	`user_payment_method_id` text,
	`payment_method_type` text NOT NULL,
	`payment_method_snapshot` text NOT NULL,
	`transaction_id` text,
	`gateway_response` text,
	`refunded_amount` text DEFAULT '0.00' NOT NULL,
	`exchange_rate_snapshot` text,
	`exchange_rate_source` text,
	`idempotency_key` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_payments_invoice_id_invoices_id_fk` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_payments_user_payment_method_id_user_payment_methods_id_fk` FOREIGN KEY (`user_payment_method_id`) REFERENCES `user_payment_methods`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `credit_transactions` (
	`id` text PRIMARY KEY,
	`student_id` text NOT NULL,
	`change_amount` integer NOT NULL,
	`reason` text NOT NULL,
	`source_payment_id` text,
	`class_instance_id` text,
	`notes` text,
	`credited_by_user_id` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_credit_transactions_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_credit_transactions_source_payment_id_payments_id_fk` FOREIGN KEY (`source_payment_id`) REFERENCES `payments`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_credit_transactions_class_instance_id_class_instances_id_fk` FOREIGN KEY (`class_instance_id`) REFERENCES `class_instances`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_credit_transactions_credited_by_user_id_users_id_fk` FOREIGN KEY (`credited_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `supported_currencies` (
	`code` text PRIMARY KEY,
	`symbol` text NOT NULL,
	`country_code` text,
	`decimals` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fx_sync_runs` (
	`id` text PRIMARY KEY,
	`provider` text NOT NULL,
	`status` text NOT NULL,
	`pairs_written` text DEFAULT '0' NOT NULL,
	`pairs_failed` text DEFAULT '0' NOT NULL,
	`error_message` text,
	`provider_response` text,
	`trigger_type` text NOT NULL,
	`triggered_by_user_id` text,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_fx_sync_runs_triggered_by_user_id_users_id_fk` FOREIGN KEY (`triggered_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `invoice_payment_submissions` (
	`id` text PRIMARY KEY,
	`invoice_id` text NOT NULL,
	`file_id` text NOT NULL,
	`submitted_by_user_id` text NOT NULL,
	`submitted_at` integer NOT NULL,
	`reviewed_by_user_id` text,
	`reviewed_at` integer,
	`status` text NOT NULL,
	`rejection_reason` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_invoice_payment_submissions_invoice_id_invoices_id_fk` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_invoice_payment_submissions_file_id_storage_file_id_fk` FOREIGN KEY (`file_id`) REFERENCES `storage_file`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_invoice_payment_submissions_submitted_by_user_id_users_id_fk` FOREIGN KEY (`submitted_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_invoice_payment_submissions_reviewed_by_user_id_users_id_fk` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `quota_ledger` (
	`id` text PRIMARY KEY,
	`quota_id` text NOT NULL,
	`student_id` text NOT NULL,
	`recurring_schedule_id` text,
	`class_instance_id` text,
	`delta` integer NOT NULL,
	`reason` text NOT NULL,
	`reason_note` text,
	`idempotency_key` text NOT NULL,
	`actor_user_id` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_quota_ledger_quota_id_quotas_id_fk` FOREIGN KEY (`quota_id`) REFERENCES `quotas`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_quota_ledger_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_quota_ledger_recurring_schedule_id_recurring_schedules_id_fk` FOREIGN KEY (`recurring_schedule_id`) REFERENCES `recurring_schedules`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_quota_ledger_class_instance_id_class_instances_id_fk` FOREIGN KEY (`class_instance_id`) REFERENCES `class_instances`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_quota_ledger_actor_user_id_users_id_fk` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `quotas` (
	`id` text PRIMARY KEY,
	`student_id` text NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`total_classes` integer NOT NULL,
	`remaining` integer DEFAULT 0 NOT NULL,
	`reserved_classes` integer DEFAULT 0 NOT NULL,
	`used_this_period` integer DEFAULT 0 NOT NULL,
	`period_type` text,
	`period_days` integer,
	`period_anchor` integer,
	`valid_from` text,
	`valid_until` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`rollover_policy` text,
	`version` integer DEFAULT 1 NOT NULL,
	`idempotency_key` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`deleted_at` integer,
	CONSTRAINT `fk_quotas_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
	CONSTRAINT "quotas_kind_period_consistency_chk" CHECK(
        ("kind" = 'PACKAGE' AND "period_type" IS NULL AND "period_days" IS NULL AND "period_anchor" IS NULL) OR
        ("kind" = 'PERIODIC' AND "period_type" IS NOT NULL AND "period_days" IS NOT NULL)
      ),
	CONSTRAINT "quotas_total_classes_positive_chk" CHECK("total_classes" > 0),
	CONSTRAINT "quotas_priority_non_negative_chk" CHECK("priority" >= 0),
	CONSTRAINT "quotas_remaining_non_negative_chk" CHECK("remaining" >= 0),
	CONSTRAINT "quotas_reserved_classes_non_negative_chk" CHECK("reserved_classes" >= 0),
	CONSTRAINT "quotas_reserved_not_exceed_remaining_chk" CHECK("reserved_classes" <= "remaining"),
	CONSTRAINT "quotas_used_this_period_non_negative_chk" CHECK("used_this_period" >= 0)
);
--> statement-breakpoint
CREATE TABLE `supported_mobile_wallets` (
	`id` text PRIMARY KEY,
	`slug` text NOT NULL UNIQUE,
	`name` text NOT NULL,
	`description` text,
	`instructions` text,
	`country_code` text,
	`currency_code` text,
	`phone_region` text,
	`supported_directions` text DEFAULT 'BOTH' NOT NULL,
	`logo_url` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `supported_online_accounts` (
	`id` text PRIMARY KEY,
	`slug` text NOT NULL UNIQUE,
	`name` text NOT NULL,
	`description` text,
	`instructions` text,
	`identifier_kind` text NOT NULL,
	`identifier_label` text NOT NULL,
	`supported_directions` text DEFAULT 'BOTH' NOT NULL,
	`logo_url` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `supported_payment_links` (
	`id` text PRIMARY KEY,
	`slug` text NOT NULL UNIQUE,
	`name` text NOT NULL,
	`description` text,
	`instructions` text,
	`url_allowlist` text NOT NULL,
	`url_example` text,
	`supported_directions` text DEFAULT 'BOTH' NOT NULL,
	`logo_url` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_payment_methods` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`direction` text NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`label` text,
	`details` text NOT NULL,
	`verified_at` integer,
	`verified_by_user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_user_payment_methods_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_user_payment_methods_verified_by_user_id_users_id_fk` FOREIGN KEY (`verified_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `books` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`availability_status` text NOT NULL,
	`created_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `class_categories` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `class_subjects` (
	`id` text PRIMARY KEY,
	`category_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`avatar_url` text,
	`hourly_rate` text,
	`rate_currency` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`deleted_at` integer,
	CONSTRAINT `fk_class_subjects_category_id_class_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `class_categories`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `class_communications` (
	`id` text PRIMARY KEY,
	`group_class_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`is_delivered` integer,
	`notification_delivery_id` text,
	`class_status_event_id` text,
	`timestamp` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_class_communications_group_class_id_group_classes_id_fk` FOREIGN KEY (`group_class_id`) REFERENCES `group_classes`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_class_communications_notification_delivery_id_notification_deliveries_id_fk` FOREIGN KEY (`notification_delivery_id`) REFERENCES `notification_deliveries`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_class_communications_class_status_event_id_class_status_events_id_fk` FOREIGN KEY (`class_status_event_id`) REFERENCES `class_status_events`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `group_class_enrollments` (
	`id` text PRIMARY KEY,
	`group_class_id` text NOT NULL,
	`student_id` text NOT NULL,
	`student_id_number` text,
	`attendance_status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_group_class_enrollments_group_class_id_group_classes_id_fk` FOREIGN KEY (`group_class_id`) REFERENCES `group_classes`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_group_class_enrollments_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `group_classes` (
	`id` text PRIMARY KEY,
	`class_instance_id` text NOT NULL,
	`course_name` text NOT NULL,
	`teacher_name` text NOT NULL,
	`class_type` text NOT NULL,
	`original_date` integer,
	`rescheduled_date` integer,
	`time_slot` text NOT NULL,
	`status` text NOT NULL,
	`audit_remark` text,
	`audit_logged_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_group_classes_class_instance_id_class_instances_id_fk` FOREIGN KEY (`class_instance_id`) REFERENCES `class_instances`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `lesson_reports` (
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
	CONSTRAINT `fk_lesson_reports_submitted_by_user_id_users_id_fk` FOREIGN KEY (`submitted_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_lesson_reports_reviewed_by_user_id_users_id_fk` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
	CONSTRAINT "lesson_reports_completion_percentage_chk" CHECK("completion_percentage" >= 0 AND "completion_percentage" <= 100),
	CONSTRAINT "lesson_reports_review_consistency_chk" CHECK(("status" != 'REJECTED' OR "rejection_reason" IS NOT NULL) AND ("status" != 'APPROVED' OR "rejection_reason" IS NULL))
);
--> statement-breakpoint
CREATE TABLE `class_instance_performance` (
	`id` text PRIMARY KEY,
	`class_instance_id` text NOT NULL UNIQUE,
	`engagement_score` integer,
	`assessment_progress` integer,
	`assessment_total` integer,
	`focus_level` text,
	`session_health` text,
	`heatmap_data` text,
	`latency_ms` integer,
	`authorization_label` text,
	`attendance_rate` integer,
	`avg_grade` text,
	`last_class_days_ago` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_class_instance_performance_class_instance_id_class_instances_id_fk` FOREIGN KEY (`class_instance_id`) REFERENCES `class_instances`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `class_instances` (
	`id` text PRIMARY KEY,
	`student_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`recurring_schedule_id` text,
	`original_class_id` text,
	`scheduled_start_at` integer NOT NULL,
	`scheduled_end_at` integer NOT NULL,
	`booking_timezone_id` integer,
	`booking_timezone` text,
	`booking_utc_offset` integer,
	`duration_minutes` integer NOT NULL,
	`class_type` text NOT NULL,
	`outcome` text DEFAULT 'PENDING' NOT NULL,
	`execution_state` text DEFAULT 'NOT_ACTIVATED' NOT NULL,
	`is_rescheduled` integer DEFAULT false NOT NULL,
	`is_frozen` integer DEFAULT false NOT NULL,
	`meeting_join_url` text,
	`user_meeting_config_id` text,
	`meeting_provider_id` text,
	`meeting_config_snapshot` text,
	`activated_at` integer,
	`activated_by_user_id` text,
	`force_activated` integer DEFAULT false NOT NULL,
	`force_activated_by_user_id` text,
	`actual_start_at` integer,
	`actual_end_at` integer,
	`quota_deducted` integer DEFAULT false NOT NULL,
	`scheduling_mode` text DEFAULT 'NUMBER_OF_CLASSES' NOT NULL,
	`ondemand_status` text,
	`payroll_credited` integer DEFAULT false NOT NULL,
	`rate_amount` text,
	`rate_currency` text,
	`is_rate_overridden` integer DEFAULT false NOT NULL,
	`rate_source` text,
	`remarks` text,
	`admin_notes` text,
	`idempotency_key` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	CONSTRAINT `fk_class_instances_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_class_instances_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_class_instances_subject_id_class_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `class_subjects`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_class_instances_recurring_schedule_id_recurring_schedules_id_fk` FOREIGN KEY (`recurring_schedule_id`) REFERENCES `recurring_schedules`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_class_instances_original_class_id_class_instances_id_fk` FOREIGN KEY (`original_class_id`) REFERENCES `class_instances`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_class_instances_booking_timezone_id_timezones_id_fk` FOREIGN KEY (`booking_timezone_id`) REFERENCES `timezones`(`id`),
	CONSTRAINT `fk_class_instances_user_meeting_config_id_user_meeting_configs_id_fk` FOREIGN KEY (`user_meeting_config_id`) REFERENCES `user_meeting_configs`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_class_instances_meeting_provider_id_meeting_providers_id_fk` FOREIGN KEY (`meeting_provider_id`) REFERENCES `meeting_providers`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_class_instances_activated_by_user_id_users_id_fk` FOREIGN KEY (`activated_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_class_instances_force_activated_by_user_id_users_id_fk` FOREIGN KEY (`force_activated_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
	CONSTRAINT "class_instances_state_machine_chk" CHECK(
        ("execution_state" != 'COMPLETED' OR "outcome" != 'PENDING') AND
        ("execution_state" != 'NOT_ACTIVATED' OR "actual_start_at" IS NULL) AND
        ("force_activated" = false OR "force_activated_by_user_id" IS NOT NULL) AND
        ("outcome" != 'TAKEN' OR "actual_start_at" IS NOT NULL) AND
        ("is_rate_overridden" = false OR "rate_amount" IS NOT NULL) AND
        ("execution_state" NOT IN ('ON_DEMAND_PENDING_CREDITS', 'ON_DEMAND_CONFLICT_HELD', 'ON_DEMAND_NO_CREDITS_CANCELLED', 'ON_DEMAND_NO_CREDITS_ABSENT') OR "scheduling_mode" = 'ON_DEMAND')
      ),
	CONSTRAINT "class_instances_ondemand_status_scheduling_mode_chk" CHECK(
        ("ondemand_status" IS NULL AND "scheduling_mode" != 'ON_DEMAND') OR
        ("ondemand_status" IS NOT NULL AND "scheduling_mode" = 'ON_DEMAND')
      ),
	CONSTRAINT "class_instances_reschedule_not_self_chk" CHECK("original_class_id" IS NULL OR "original_class_id" != "id"),
	CONSTRAINT "class_instances_rescheduled_no_quota_chk" CHECK("is_rescheduled" = false OR "quota_deducted" = false),
	CONSTRAINT "class_instances_rescheduled_no_complete_chk" CHECK("is_rescheduled" = false OR ("execution_state" != 'COMPLETED' OR "outcome" != 'TAKEN'))
);
--> statement-breakpoint
CREATE TABLE `class_status_events` (
	`id` text PRIMARY KEY,
	`class_instance_id` text NOT NULL,
	`event_type` text NOT NULL,
	`from_state` text,
	`to_state` text,
	`description` text,
	`actor_user_id` text,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_class_status_events_class_instance_id_class_instances_id_fk` FOREIGN KEY (`class_instance_id`) REFERENCES `class_instances`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_class_status_events_actor_user_id_users_id_fk` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `dst_migration_entries` (
	`id` text PRIMARY KEY,
	`run_id` text NOT NULL,
	`recurring_schedule_id` text NOT NULL,
	`result` text NOT NULL,
	`conflict_detail` text,
	CONSTRAINT `fk_dst_migration_entries_run_id_dst_migration_runs_id_fk` FOREIGN KEY (`run_id`) REFERENCES `dst_migration_runs`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_dst_migration_entries_recurring_schedule_id_recurring_schedules_id_fk` FOREIGN KEY (`recurring_schedule_id`) REFERENCES `recurring_schedules`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `dst_migration_runs` (
	`id` text PRIMARY KEY,
	`run_by_user_id` text NOT NULL,
	`offset_minutes` integer NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_dst_migration_runs_run_by_user_id_users_id_fk` FOREIGN KEY (`run_by_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `leave_quota_usage` (
	`id` text PRIMARY KEY,
	`teacher_id` text,
	`student_id` text,
	`period_year` integer NOT NULL,
	`period_month` integer NOT NULL,
	`used_count` integer DEFAULT 0 NOT NULL,
	CONSTRAINT `fk_leave_quota_usage_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_leave_quota_usage_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT,
	CONSTRAINT "leave_quota_usage_teacher_student_xor_chk" CHECK(("teacher_id" IS NOT NULL AND "student_id" IS NULL) OR ("teacher_id" IS NULL AND "student_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE `leave_requests` (
	`id` text PRIMARY KEY,
	`class_instance_id` text NOT NULL,
	`requested_by_user_id` text NOT NULL,
	`requester_type` text NOT NULL,
	`reason` text,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`processed_at` integer,
	`processed_by_user_id` text,
	CONSTRAINT `fk_leave_requests_class_instance_id_class_instances_id_fk` FOREIGN KEY (`class_instance_id`) REFERENCES `class_instances`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_leave_requests_requested_by_user_id_users_id_fk` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_leave_requests_processed_by_user_id_users_id_fk` FOREIGN KEY (`processed_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `recurring_schedule_days` (
	`id` text PRIMARY KEY,
	`recurring_schedule_id` text NOT NULL,
	`day_of_week` text NOT NULL,
	`start_time` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	CONSTRAINT `fk_recurring_schedule_days_recurring_schedule_id_recurring_schedules_id_fk` FOREIGN KEY (`recurring_schedule_id`) REFERENCES `recurring_schedules`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `recurring_schedules` (
	`id` text PRIMARY KEY,
	`student_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`avatar_url` text,
	`duration_minutes` integer NOT NULL,
	`default_start_time` text NOT NULL,
	`timezone_id` integer,
	`timezone` text NOT NULL,
	`utc_offset_snapshot` integer,
	`hourly_rate` text,
	`rate_currency` text,
	`effective_from` text,
	`effective_until` text,
	`quota_id` text,
	`earmarked_classes` integer,
	`scheduling_mode` text DEFAULT 'NUMBER_OF_CLASSES' NOT NULL,
	`generation_horizon_weeks` integer,
	`ondemand_no_credits_outcome` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	CONSTRAINT `fk_recurring_schedules_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_recurring_schedules_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_recurring_schedules_subject_id_class_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `class_subjects`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_recurring_schedules_timezone_id_timezones_id_fk` FOREIGN KEY (`timezone_id`) REFERENCES `timezones`(`id`),
	CONSTRAINT `fk_recurring_schedules_quota_id_quotas_id_fk` FOREIGN KEY (`quota_id`) REFERENCES `quotas`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `subject_resources` (
	`id` text PRIMARY KEY,
	`subject_id` text NOT NULL,
	`learning_resource_id` text NOT NULL,
	`resource_type` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_subject_resources_subject_id_class_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `class_subjects`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_subject_resources_learning_resource_id_learning_resources_id_fk` FOREIGN KEY (`learning_resource_id`) REFERENCES `learning_resources`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `complaint_responses` (
	`id` text PRIMARY KEY,
	`complaint_id` text NOT NULL,
	`responder_user_id` text,
	`body` text NOT NULL,
	`email_sent` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_complaint_responses_complaint_id_complaints_id_fk` FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_complaint_responses_responder_user_id_users_id_fk` FOREIGN KEY (`responder_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `complaints` (
	`id` text PRIMARY KEY,
	`parent_id` text NOT NULL,
	`student_id` text,
	`category` text NOT NULL,
	`submitter_email` text NOT NULL,
	`body` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	CONSTRAINT `fk_complaints_parent_id_parents_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_complaints_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `learning_resources` (
	`id` text PRIMARY KEY,
	`display_name` text NOT NULL,
	`file_path` text NOT NULL,
	`uploaded_by_user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`deleted_at` integer,
	CONSTRAINT `fk_learning_resources_uploaded_by_user_id_users_id_fk` FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `notification_deliveries` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`device_token_id` text,
	`channel` text NOT NULL,
	`event_type` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`title` text,
	`body` text,
	`provider_message_id` text,
	`failure_reason` text,
	`webhook_payload` text,
	`metadata` text,
	`sent_at` integer,
	`delivered_at` integer,
	`opened_at` integer,
	`failed_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_notification_deliveries_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_notification_deliveries_device_token_id_user_device_tokens_id_fk` FOREIGN KEY (`device_token_id`) REFERENCES `user_device_tokens`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `suggestions` (
	`id` text PRIMARY KEY,
	`parent_id` text NOT NULL,
	`submitter_name` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`duplicate_of_id` text,
	`admin_response` text,
	`reviewed_by_user_id` text,
	`reviewed_at` integer,
	`email_sent_at` integer,
	`created_at` integer NOT NULL,
	`deleted_at` integer,
	CONSTRAINT `fk_suggestions_parent_id_parents_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_suggestions_duplicate_of_id_suggestions_id_fk` FOREIGN KEY (`duplicate_of_id`) REFERENCES `suggestions`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_suggestions_reviewed_by_user_id_users_id_fk` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `user_device_tokens` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`platform` text NOT NULL,
	`device_name` text,
	`is_active` integer DEFAULT true NOT NULL,
	`last_used_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_user_device_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user_notification_preferences` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`channel` text NOT NULL,
	`event_type` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_user_notification_preferences_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `cron_heartbeats` (
	`id` text PRIMARY KEY,
	`run_id` text NOT NULL,
	`worker_id` text NOT NULL,
	`last_beat_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`progress` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_cron_heartbeats_run_id_cron_runs_id_fk` FOREIGN KEY (`run_id`) REFERENCES `cron_runs`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `cron_runs` (
	`id` text PRIMARY KEY,
	`schedule_id` text NOT NULL,
	`job_kind` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`trigger_source` text NOT NULL,
	`payload` text,
	`attempt` integer DEFAULT 1 NOT NULL,
	`started_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`completed_at` integer,
	`duration_ms` integer,
	`error_message` text,
	`error_stack` text,
	`worker_id` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_cron_runs_schedule_id_cron_schedules_id_fk` FOREIGN KEY (`schedule_id`) REFERENCES `cron_schedules`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `cron_schedules` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`description` text,
	`cron_expression` text NOT NULL,
	`job_kind` text NOT NULL,
	`payload` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`next_run_at` integer,
	`last_run_at` integer,
	`concurrency_policy` text DEFAULT 'ALLOW' NOT NULL,
	`max_retries` integer DEFAULT 3 NOT NULL,
	`retry_backoff_seconds` integer DEFAULT 60 NOT NULL,
	`timeout_seconds` integer DEFAULT 300 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`created_by_user_id` text NOT NULL,
	`updated_by_user_id` text,
	CONSTRAINT `fk_cron_schedules_created_by_user_id_users_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_cron_schedules_updated_by_user_id_users_id_fk` FOREIGN KEY (`updated_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `class_meeting_configs` (
	`id` text PRIMARY KEY,
	`class_instance_id` text,
	`recurring_schedule_id` text,
	`provider_id` text NOT NULL,
	`label` text,
	`is_default` integer DEFAULT false NOT NULL,
	`details` text NOT NULL,
	`encrypted_secret` text,
	`provider_metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_class_meeting_configs_class_instance_id_class_instances_id_fk` FOREIGN KEY (`class_instance_id`) REFERENCES `class_instances`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_class_meeting_configs_recurring_schedule_id_recurring_schedules_id_fk` FOREIGN KEY (`recurring_schedule_id`) REFERENCES `recurring_schedules`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_class_meeting_configs_provider_id_meeting_providers_id_fk` FOREIGN KEY (`provider_id`) REFERENCES `meeting_providers`(`id`) ON DELETE RESTRICT,
	CONSTRAINT "class_meeting_configs_scope_chk" CHECK((
        ("class_instance_id" IS NOT NULL AND "recurring_schedule_id" IS NULL)
        OR ("class_instance_id" IS NULL AND "recurring_schedule_id" IS NOT NULL)
      ))
);
--> statement-breakpoint
CREATE TABLE `meeting_provider_tokens` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`provider_slug` text NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text,
	`expires_at` integer,
	`scopes` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_meeting_provider_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `meeting_providers` (
	`id` text PRIMARY KEY,
	`slug` text NOT NULL UNIQUE,
	`provider_kind` text DEFAULT 'manual' NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`instructions` text,
	`url_allowlist` text NOT NULL,
	`url_example` text,
	`logo_url` text,
	`field_schema` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_meeting_configs` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`label` text,
	`is_default` integer DEFAULT false NOT NULL,
	`details` text NOT NULL,
	`encrypted_secret` text,
	`provider_metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_user_meeting_configs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_user_meeting_configs_provider_id_meeting_providers_id_fk` FOREIGN KEY (`provider_id`) REFERENCES `meeting_providers`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `parents` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`status` text NOT NULL,
	`nationality` text,
	`address` text,
	`facebook` text,
	`whatsapp` text,
	`twitter` text,
	`invoice_type` text,
	`fee_amount` text,
	`currency` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_parents_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `group_permissions` (
	`group_id` text NOT NULL,
	`permission_id` text NOT NULL,
	CONSTRAINT `group_permissions_pk` PRIMARY KEY(`group_id`, `permission_id`),
	CONSTRAINT `fk_group_permissions_group_id_permission_groups_id_fk` FOREIGN KEY (`group_id`) REFERENCES `permission_groups`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_group_permissions_permission_id_permissions_id_fk` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `permission_groups` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`description` text,
	`is_system` integer DEFAULT false NOT NULL,
	`slug` text NOT NULL UNIQUE,
	`created_by_user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_permission_groups_created_by_user_id_users_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` text PRIMARY KEY,
	`key` text NOT NULL,
	`resource` text NOT NULL,
	`action` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`is_system` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_permission_groups` (
	`user_id` text NOT NULL,
	`group_id` text NOT NULL,
	`assigned_at` integer NOT NULL,
	`assigned_by_user_id` text,
	CONSTRAINT `user_permission_groups_pk` PRIMARY KEY(`user_id`, `group_id`),
	CONSTRAINT `fk_user_permission_groups_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_user_permission_groups_group_id_permission_groups_id_fk` FOREIGN KEY (`group_id`) REFERENCES `permission_groups`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_user_permission_groups_assigned_by_user_id_users_id_fk` FOREIGN KEY (`assigned_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `user_permission_overrides` (
	`user_id` text NOT NULL,
	`permission_id` text NOT NULL,
	`state` text NOT NULL,
	`assigned_by_user_id` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `user_permission_overrides_pk` PRIMARY KEY(`user_id`, `permission_id`),
	CONSTRAINT `fk_user_permission_overrides_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_user_permission_overrides_permission_id_permissions_id_fk` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_user_permission_overrides_assigned_by_user_id_users_id_fk` FOREIGN KEY (`assigned_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `rate_limit_cache` (
	`key` text PRIMARY KEY,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session_cache` (
	`key` text PRIMARY KEY,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`key` text PRIMARY KEY,
	`value` text NOT NULL,
	`data_type` text DEFAULT 'string' NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`updated_by_user_id` text,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_system_settings_updated_by_user_id_users_id_fk` FOREIGN KEY (`updated_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `timezones` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`iana_id` text NOT NULL UNIQUE,
	`base_offset_minutes` integer NOT NULL,
	`is_dst_supported` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_content` (
	`id` text PRIMARY KEY,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`content_type` text DEFAULT 'page' NOT NULL,
	`is_published` integer DEFAULT true NOT NULL,
	`updated_by_user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_site_content_updated_by_user_id_users_id_fk` FOREIGN KEY (`updated_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `class_instance_files` (
	`id` text PRIMARY KEY,
	`file_id` text NOT NULL,
	`class_instance_id` text NOT NULL,
	`usage_type` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_class_instance_files_file_id_storage_file_id_fk` FOREIGN KEY (`file_id`) REFERENCES `storage_file`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_class_instance_files_class_instance_id_class_instances_id_fk` FOREIGN KEY (`class_instance_id`) REFERENCES `class_instances`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `complaint_files` (
	`id` text PRIMARY KEY,
	`file_id` text NOT NULL,
	`complaint_id` text NOT NULL,
	`usage_type` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_complaint_files_file_id_storage_file_id_fk` FOREIGN KEY (`file_id`) REFERENCES `storage_file`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_complaint_files_complaint_id_complaints_id_fk` FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `invoice_files` (
	`id` text PRIMARY KEY,
	`file_id` text NOT NULL,
	`invoice_id` text NOT NULL,
	`usage_type` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_invoice_files_file_id_storage_file_id_fk` FOREIGN KEY (`file_id`) REFERENCES `storage_file`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_invoice_files_invoice_id_invoices_id_fk` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `learning_resource_files` (
	`id` text PRIMARY KEY,
	`file_id` text NOT NULL,
	`learning_resource_id` text NOT NULL,
	`usage_type` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_learning_resource_files_file_id_storage_file_id_fk` FOREIGN KEY (`file_id`) REFERENCES `storage_file`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_learning_resource_files_learning_resource_id_learning_resources_id_fk` FOREIGN KEY (`learning_resource_id`) REFERENCES `learning_resources`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `parent_files` (
	`id` text PRIMARY KEY,
	`file_id` text NOT NULL,
	`parent_id` text NOT NULL,
	`usage_type` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_parent_files_file_id_storage_file_id_fk` FOREIGN KEY (`file_id`) REFERENCES `storage_file`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_parent_files_parent_id_parents_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `recurring_schedule_files` (
	`id` text PRIMARY KEY,
	`file_id` text NOT NULL,
	`recurring_schedule_id` text NOT NULL,
	`usage_type` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_recurring_schedule_files_file_id_storage_file_id_fk` FOREIGN KEY (`file_id`) REFERENCES `storage_file`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_recurring_schedule_files_recurring_schedule_id_recurring_schedules_id_fk` FOREIGN KEY (`recurring_schedule_id`) REFERENCES `recurring_schedules`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `signed_url` (
	`id` text PRIMARY KEY,
	`file_path` text NOT NULL,
	`content_type` text NOT NULL,
	`file_size` blob NOT NULL,
	`content_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`used` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `staff_profile_files` (
	`id` text PRIMARY KEY,
	`file_id` text NOT NULL,
	`staff_profile_id` text NOT NULL,
	`usage_type` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_staff_profile_files_file_id_storage_file_id_fk` FOREIGN KEY (`file_id`) REFERENCES `storage_file`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_staff_profile_files_staff_profile_id_staff_profiles_id_fk` FOREIGN KEY (`staff_profile_id`) REFERENCES `staff_profiles`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `storage_directory` (
	`id` text PRIMARY KEY,
	`path` text NOT NULL UNIQUE,
	`allow_uploads` integer DEFAULT true NOT NULL,
	`allow_delete` integer DEFAULT true NOT NULL,
	`allow_move` integer DEFAULT true NOT NULL,
	`allow_create_sub_dirs` integer DEFAULT true NOT NULL,
	`allow_delete_files` integer DEFAULT true NOT NULL,
	`allow_move_files` integer DEFAULT true NOT NULL,
	`is_protected` integer DEFAULT false NOT NULL,
	`protect_children` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `storage_file` (
	`id` text PRIMARY KEY,
	`path` text NOT NULL UNIQUE,
	`is_protected` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `student_files` (
	`id` text PRIMARY KEY,
	`file_id` text NOT NULL,
	`student_id` text NOT NULL,
	`usage_type` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_student_files_file_id_storage_file_id_fk` FOREIGN KEY (`file_id`) REFERENCES `storage_file`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_student_files_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `teacher_files` (
	`id` text PRIMARY KEY,
	`file_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`usage_type` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_teacher_files_file_id_storage_file_id_fk` FOREIGN KEY (`file_id`) REFERENCES `storage_file`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_teacher_files_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user_files` (
	`id` text PRIMARY KEY,
	`file_id` text NOT NULL,
	`user_id` text NOT NULL,
	`usage_type` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_user_files_file_id_storage_file_id_fk` FOREIGN KEY (`file_id`) REFERENCES `storage_file`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_user_files_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `student_progress` (
	`id` text PRIMARY KEY,
	`student_id` text NOT NULL,
	`class_instance_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`topics_covered` text NOT NULL,
	`homework_assigned` text,
	`notes` text,
	`parent_visible` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_student_progress_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_student_progress_class_instance_id_class_instances_id_fk` FOREIGN KEY (`class_instance_id`) REFERENCES `class_instances`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_student_progress_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `student_status_history` (
	`id` text PRIMARY KEY,
	`student_id` text NOT NULL,
	`old_status` text,
	`new_status` text NOT NULL,
	`changed_by_user_id` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_student_status_history_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_student_status_history_changed_by_user_id_users_id_fk` FOREIGN KEY (`changed_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY,
	`parent_id` text,
	`user_id` text NOT NULL,
	`primary_teacher_id` text,
	`name` text NOT NULL,
	`avatar_url` text,
	`date_of_birth` integer,
	`gender` text,
	`language` text,
	`timezone_override` text,
	`status` text NOT NULL,
	`classes_total` integer DEFAULT 0 NOT NULL,
	`classes_remaining` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`hours_per_week` text DEFAULT '0' NOT NULL,
	`idempotency_key` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_students_parent_id_parents_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_students_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_students_primary_teacher_id_teachers_id_fk` FOREIGN KEY (`primary_teacher_id`) REFERENCES `teachers`(`id`) ON DELETE SET NULL,
	CONSTRAINT "students_classes_remaining_chk" CHECK("classes_remaining" >= 0),
	CONSTRAINT "students_classes_total_chk" CHECK("classes_total" >= 0)
);
--> statement-breakpoint
CREATE TABLE `teacher_assignments` (
	`id` text PRIMARY KEY,
	`student_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`assigned_at` integer NOT NULL,
	`assigned_by_user_id` text,
	`ended_at` integer,
	CONSTRAINT `fk_teacher_assignments_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_teacher_assignments_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_teacher_assignments_assigned_by_user_id_users_id_fk` FOREIGN KEY (`assigned_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `staff_profiles` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`hourly_rate` text,
	`rate_currency` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_staff_profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `teacher_availability_windows` (
	`id` text PRIMARY KEY,
	`teacher_id` text NOT NULL,
	`day_of_week` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`timezone_id` integer,
	`timezone` text NOT NULL,
	`utc_offset_snapshot` integer,
	`effective_from` text,
	`effective_until` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_teacher_availability_windows_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_teacher_availability_windows_timezone_id_timezones_id_fk` FOREIGN KEY (`timezone_id`) REFERENCES `timezones`(`id`)
);
--> statement-breakpoint
CREATE TABLE `teacher_recurring_unavailability` (
	`id` text PRIMARY KEY,
	`teacher_id` text NOT NULL,
	`day_of_week` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`timezone_id` integer,
	`timezone` text NOT NULL,
	`utc_offset_snapshot` integer,
	`effective_from` text,
	`effective_until` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`reason` text,
	CONSTRAINT `fk_teacher_recurring_unavailability_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_teacher_recurring_unavailability_timezone_id_timezones_id_fk` FOREIGN KEY (`timezone_id`) REFERENCES `timezones`(`id`)
);
--> statement-breakpoint
CREATE TABLE `teacher_vacation_requests` (
	`id` text PRIMARY KEY,
	`teacher_id` text NOT NULL,
	`requested_by_user_id` text NOT NULL,
	`start_at` integer NOT NULL,
	`end_at` integer NOT NULL,
	`timezone_id` integer,
	`timezone` text NOT NULL,
	`utc_offset_snapshot` integer,
	`reason` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`processed_at` integer,
	`processed_by_user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_teacher_vacation_requests_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_teacher_vacation_requests_requested_by_user_id_users_id_fk` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_teacher_vacation_requests_timezone_id_timezones_id_fk` FOREIGN KEY (`timezone_id`) REFERENCES `timezones`(`id`),
	CONSTRAINT `fk_teacher_vacation_requests_processed_by_user_id_users_id_fk` FOREIGN KEY (`processed_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `teacher_dues` (
	`id` text PRIMARY KEY,
	`teacher_id` text NOT NULL,
	`class_instance_id` text NOT NULL,
	`student_id` text NOT NULL,
	`hours` text NOT NULL,
	`amount` text NOT NULL,
	`currency` text NOT NULL,
	`rate_source` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`approved_by_user_id` text NOT NULL,
	`approved_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`teacher_payment_id` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_teacher_dues_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_teacher_dues_class_instance_id_class_instances_id_fk` FOREIGN KEY (`class_instance_id`) REFERENCES `class_instances`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_teacher_dues_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_teacher_dues_approved_by_user_id_users_id_fk` FOREIGN KEY (`approved_by_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_teacher_dues_teacher_payment_id_teacher_payments_id_fk` FOREIGN KEY (`teacher_payment_id`) REFERENCES `teacher_payments`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `teacher_important_notes` (
	`id` text PRIMARY KEY,
	`teacher_id` text,
	`title` text NOT NULL,
	`body` text,
	`is_published` integer DEFAULT false NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`starts_at` integer,
	`expires_at` integer,
	`created_by_user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`deleted_at` integer,
	CONSTRAINT `fk_teacher_important_notes_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_teacher_important_notes_created_by_user_id_users_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `teacher_payments` (
	`id` text PRIMARY KEY,
	`teacher_id` text NOT NULL,
	`user_payment_method_id` text,
	`payment_method_type` text NOT NULL,
	`payment_method_snapshot` text NOT NULL,
	`amount` text NOT NULL,
	`currency` text NOT NULL,
	`payment_date` integer NOT NULL,
	`is_test_payment` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_teacher_payments_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_teacher_payments_user_payment_method_id_user_payment_methods_id_fk` FOREIGN KEY (`user_payment_method_id`) REFERENCES `user_payment_methods`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `teachers` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`nationality` text,
	`national_id` text,
	`phone` text,
	`date_of_birth` text,
	`gender` text,
	`address` text,
	`qualifications` text,
	`country_code` text,
	`hourly_rate` text,
	`rate_currency` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_teachers_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `auth_rate_limits` (
	`id` text PRIMARY KEY,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`email` text,
	`attempts` integer DEFAULT 1 NOT NULL,
	`locked_until` integer
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` text PRIMARY KEY,
	`created_at` integer NOT NULL,
	`email` text NOT NULL,
	`hashed_token` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session_config` (
	`id` text PRIMARY KEY,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`role_name` text NOT NULL UNIQUE,
	`ttl_seconds` integer DEFAULT 604800 NOT NULL,
	`max_concurrent_sessions` integer DEFAULT 5 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session_metadata` (
	`id` text PRIMARY KEY,
	`created_at` integer NOT NULL,
	`last_activity_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`session_id` text NOT NULL,
	`user_id` text NOT NULL,
	`device_type` text,
	`device_name` text,
	`ip_address` text,
	`user_agent` text,
	CONSTRAINT `fk_session_metadata_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`hashed_id` text PRIMARY KEY,
	`user_id` text,
	`ip_address` text,
	`user_agent` text,
	`payload` text NOT NULL,
	`last_activity` blob NOT NULL,
	CONSTRAINT `fk_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`name` text NOT NULL,
	`email` text NOT NULL UNIQUE,
	`email_verified_at` integer,
	`password` text NOT NULL,
	`remember_token_hash` text,
	`avatar_file_path` text,
	`avatar_url` text,
	`phone` text,
	`status` text DEFAULT 'ACTIVATED' NOT NULL,
	`is_super_admin` integer DEFAULT false NOT NULL,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`display_currency` text,
	`last_login_at` integer
);
--> statement-breakpoint
CREATE TABLE `whatsapp_accounts` (
	`id` text PRIMARY KEY,
	`waba_id` text NOT NULL,
	`phone_number_id` text NOT NULL UNIQUE,
	`display_name` text,
	`display_phone_number` text,
	`quality_rating` text,
	`portfolio_messaging_limit_tier` text,
	`throughput_level` text,
	`max_phone_numbers_per_business` text,
	`encrypted_access_token` text NOT NULL,
	`encrypted_two_step_pin` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`last_webhook_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `appearance_settings_updated_by_user_id_idx` ON `appearance_settings` (`updated_by_user_id`);--> statement-breakpoint
CREATE INDEX `appearance_settings_updated_at_idx` ON `appearance_settings` (`updated_at`);--> statement-breakpoint
CREATE INDEX `admin_audit_logs_actor_idx` ON `admin_audit_logs` (`actor_user_id`);--> statement-breakpoint
CREATE INDEX `admin_audit_logs_target_idx` ON `admin_audit_logs` (`target_user_id`);--> statement-breakpoint
CREATE INDEX `admin_audit_logs_action_idx` ON `admin_audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `admin_audit_logs_created_at_idx` ON `admin_audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `admin_audit_logs_ip_address_idx` ON `admin_audit_logs` (`ip_address`);--> statement-breakpoint
CREATE INDEX `audit_logs_actor_user_id_idx` ON `audit_logs` (`actor_user_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_entity_type_idx` ON `audit_logs` (`entity_type`);--> statement-breakpoint
CREATE INDEX `audit_logs_entity_id_idx` ON `audit_logs` (`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_entity_type_id_idx` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_action_idx` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `audit_logs_created_at_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_actor_type_idx` ON `audit_logs` (`actor_type`);--> statement-breakpoint
CREATE INDEX `audit_logs_entity_type_entity_id_created_at_idx` ON `audit_logs` (`entity_type`,`entity_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_actor_user_id_created_at_idx` ON `audit_logs` (`actor_user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_action_created_at_idx` ON `audit_logs` (`action`,`created_at`);--> statement-breakpoint
CREATE INDEX `impersonation_sessions_actor_idx` ON `impersonation_sessions` (`actor_user_id`);--> statement-breakpoint
CREATE INDEX `impersonation_sessions_target_idx` ON `impersonation_sessions` (`target_user_id`);--> statement-breakpoint
CREATE INDEX `impersonation_sessions_session_idx` ON `impersonation_sessions` (`session_id`);--> statement-breakpoint
CREATE INDEX `impersonation_sessions_active_actor_idx` ON `impersonation_sessions` (`actor_user_id`,`is_active`);--> statement-breakpoint
CREATE INDEX `impersonation_sessions_started_at_idx` ON `impersonation_sessions` (`started_at`);--> statement-breakpoint
CREATE INDEX `impersonation_sessions_ended_at_idx` ON `impersonation_sessions` (`ended_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `impersonation_sessions_one_active_per_actor` ON `impersonation_sessions` (`actor_user_id`) WHERE "impersonation_sessions"."is_active" = true;--> statement-breakpoint
CREATE INDEX `currency_exchange_audit_from_to_idx` ON `currency_exchange_audit_logs` (`from_currency`,`to_currency`);--> statement-breakpoint
CREATE INDEX `currency_exchange_audit_logs_created_at_idx` ON `currency_exchange_audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `currency_exchange_audit_logs_changed_by_user_id_idx` ON `currency_exchange_audit_logs` (`changed_by_user_id`);--> statement-breakpoint
CREATE INDEX `currency_exchange_rates_from_to_idx` ON `currency_exchange_rates` (`from_currency`,`to_currency`);--> statement-breakpoint
CREATE UNIQUE INDEX `currency_exchange_rates_effective_unique_idx` ON `currency_exchange_rates` (`from_currency`,`to_currency`,`effective_date`);--> statement-breakpoint
CREATE INDEX `currency_exchange_rates_effective_date_idx` ON `currency_exchange_rates` (`effective_date`);--> statement-breakpoint
CREATE INDEX `currency_exchange_rates_created_at_idx` ON `currency_exchange_rates` (`created_at`);--> statement-breakpoint
CREATE INDEX `currency_hedges_currency_idx` ON `currency_hedges` (`currency`);--> statement-breakpoint
CREATE INDEX `currency_hedges_hedge_type_idx` ON `currency_hedges` (`hedge_type`);--> statement-breakpoint
CREATE INDEX `currency_hedges_created_at_idx` ON `currency_hedges` (`created_at`);--> statement-breakpoint
CREATE INDEX `invoices_parent_id_idx` ON `invoices` (`parent_id`);--> statement-breakpoint
CREATE INDEX `invoices_student_id_idx` ON `invoices` (`student_id`);--> statement-breakpoint
CREATE INDEX `invoices_status_due_date_idx` ON `invoices` (`status`,`due_date`);--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_idempotency_key_unique_idx` ON `invoices` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `invoices_due_date_idx` ON `invoices` (`due_date`);--> statement-breakpoint
CREATE INDEX `invoices_paid_date_idx` ON `invoices` (`paid_date`);--> statement-breakpoint
CREATE INDEX `invoices_created_by_user_id_idx` ON `invoices` (`created_by_user_id`);--> statement-breakpoint
CREATE INDEX `invoices_email_sent_at_idx` ON `invoices` (`email_sent_at`);--> statement-breakpoint
CREATE INDEX `payments_invoice_id_idx` ON `payments` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `payments_transaction_id_idx` ON `payments` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `payments_user_payment_method_id_idx` ON `payments` (`user_payment_method_id`);--> statement-breakpoint
CREATE INDEX `payments_payment_method_type_idx` ON `payments` (`payment_method_type`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_idempotency_key_unique_idx` ON `payments` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `payments_payment_date_idx` ON `payments` (`payment_date`);--> statement-breakpoint
CREATE INDEX `payments_created_at_idx` ON `payments` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `credit_transactions_idempotency_key_unique_idx` ON `credit_transactions` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `credit_transactions_student_id_idx` ON `credit_transactions` (`student_id`);--> statement-breakpoint
CREATE INDEX `credit_transactions_reason_idx` ON `credit_transactions` (`reason`);--> statement-breakpoint
CREATE INDEX `credit_transactions_class_instance_id_idx` ON `credit_transactions` (`class_instance_id`);--> statement-breakpoint
CREATE INDEX `credit_transactions_created_at_idx` ON `credit_transactions` (`created_at`);--> statement-breakpoint
CREATE INDEX `credit_transactions_source_payment_id_idx` ON `credit_transactions` (`source_payment_id`);--> statement-breakpoint
CREATE INDEX `credit_transactions_credited_by_user_id_idx` ON `credit_transactions` (`credited_by_user_id`);--> statement-breakpoint
CREATE INDEX `supported_currencies_is_active_idx` ON `supported_currencies` (`is_active`);--> statement-breakpoint
CREATE INDEX `supported_currencies_country_code_idx` ON `supported_currencies` (`country_code`);--> statement-breakpoint
CREATE INDEX `supported_currencies_sort_order_idx` ON `supported_currencies` (`sort_order`);--> statement-breakpoint
CREATE INDEX `supported_currencies_created_at_idx` ON `supported_currencies` (`created_at`);--> statement-breakpoint
CREATE INDEX `fx_sync_runs_status_idx` ON `fx_sync_runs` (`status`);--> statement-breakpoint
CREATE INDEX `fx_sync_runs_provider_started_idx` ON `fx_sync_runs` (`provider`,`started_at`);--> statement-breakpoint
CREATE INDEX `fx_sync_runs_triggered_by_idx` ON `fx_sync_runs` (`triggered_by_user_id`);--> statement-breakpoint
CREATE INDEX `fx_sync_runs_started_at_idx` ON `fx_sync_runs` (`started_at`);--> statement-breakpoint
CREATE INDEX `fx_sync_runs_finished_at_idx` ON `fx_sync_runs` (`finished_at`);--> statement-breakpoint
CREATE INDEX `fx_sync_runs_trigger_type_idx` ON `fx_sync_runs` (`trigger_type`);--> statement-breakpoint
CREATE INDEX `fx_sync_runs_created_at_idx` ON `fx_sync_runs` (`created_at`);--> statement-breakpoint
CREATE INDEX `invoice_payment_submissions_invoice_id_idx` ON `invoice_payment_submissions` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `invoice_payment_submissions_status_idx` ON `invoice_payment_submissions` (`status`);--> statement-breakpoint
CREATE INDEX `invoice_payment_submissions_file_id_idx` ON `invoice_payment_submissions` (`file_id`);--> statement-breakpoint
CREATE INDEX `invoice_payment_submissions_submitted_by_user_id_idx` ON `invoice_payment_submissions` (`submitted_by_user_id`);--> statement-breakpoint
CREATE INDEX `invoice_payment_submissions_reviewed_by_user_id_idx` ON `invoice_payment_submissions` (`reviewed_by_user_id`);--> statement-breakpoint
CREATE INDEX `invoice_payment_submissions_submitted_at_idx` ON `invoice_payment_submissions` (`submitted_at`);--> statement-breakpoint
CREATE INDEX `invoice_payment_submissions_reviewed_at_idx` ON `invoice_payment_submissions` (`reviewed_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `quota_ledger_idempotency_key_unique_idx` ON `quota_ledger` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `quota_ledger_quota_id_created_at_idx` ON `quota_ledger` (`quota_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `quota_ledger_student_id_idx` ON `quota_ledger` (`student_id`);--> statement-breakpoint
CREATE INDEX `quota_ledger_class_instance_id_idx` ON `quota_ledger` (`class_instance_id`);--> statement-breakpoint
CREATE INDEX `quota_ledger_recurring_schedule_id_idx` ON `quota_ledger` (`recurring_schedule_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `quotas_idempotency_key_unique_idx` ON `quotas` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `quotas_student_id_idx` ON `quotas` (`student_id`);--> statement-breakpoint
CREATE INDEX `quotas_student_status_remaining_idx` ON `quotas` (`student_id`,`status`,`remaining`) WHERE deleted_at IS NULL AND status = 'ACTIVE' AND remaining > 0;--> statement-breakpoint
CREATE INDEX `quotas_valid_until_idx` ON `quotas` (`valid_until`) WHERE deleted_at IS NULL AND status = 'ACTIVE';--> statement-breakpoint
CREATE INDEX `quotas_admin_list_idx` ON `quotas` (`student_id`,`status`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `supported_mobile_wallets_country_code_idx` ON `supported_mobile_wallets` (`country_code`);--> statement-breakpoint
CREATE INDEX `supported_mobile_wallets_is_active_idx` ON `supported_mobile_wallets` (`is_active`);--> statement-breakpoint
CREATE INDEX `supported_mobile_wallets_currency_code_idx` ON `supported_mobile_wallets` (`currency_code`);--> statement-breakpoint
CREATE INDEX `supported_mobile_wallets_phone_region_idx` ON `supported_mobile_wallets` (`phone_region`);--> statement-breakpoint
CREATE INDEX `supported_mobile_wallets_supported_directions_idx` ON `supported_mobile_wallets` (`supported_directions`);--> statement-breakpoint
CREATE INDEX `supported_mobile_wallets_created_at_idx` ON `supported_mobile_wallets` (`created_at`);--> statement-breakpoint
CREATE INDEX `supported_online_accounts_identifier_kind_idx` ON `supported_online_accounts` (`identifier_kind`);--> statement-breakpoint
CREATE INDEX `supported_online_accounts_supported_directions_idx` ON `supported_online_accounts` (`supported_directions`);--> statement-breakpoint
CREATE INDEX `supported_online_accounts_is_active_idx` ON `supported_online_accounts` (`is_active`);--> statement-breakpoint
CREATE INDEX `supported_online_accounts_created_at_idx` ON `supported_online_accounts` (`created_at`);--> statement-breakpoint
CREATE INDEX `supported_payment_links_is_active_idx` ON `supported_payment_links` (`is_active`);--> statement-breakpoint
CREATE INDEX `supported_payment_links_supported_directions_idx` ON `supported_payment_links` (`supported_directions`);--> statement-breakpoint
CREATE INDEX `supported_payment_links_created_at_idx` ON `supported_payment_links` (`created_at`);--> statement-breakpoint
CREATE INDEX `user_payment_methods_user_id_idx` ON `user_payment_methods` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_payment_methods_type_idx` ON `user_payment_methods` (`type`);--> statement-breakpoint
CREATE INDEX `user_payment_methods_verified_at_idx` ON `user_payment_methods` (`verified_at`);--> statement-breakpoint
CREATE INDEX `user_payment_methods_verified_by_user_id_idx` ON `user_payment_methods` (`verified_by_user_id`);--> statement-breakpoint
CREATE INDEX `user_payment_methods_created_at_idx` ON `user_payment_methods` (`created_at`);--> statement-breakpoint
CREATE INDEX `user_payment_methods_direction_idx` ON `user_payment_methods` (`direction`);--> statement-breakpoint
CREATE INDEX `user_payment_methods_is_default_idx` ON `user_payment_methods` (`is_default`);--> statement-breakpoint
CREATE INDEX `user_payment_methods_user_id_is_default_idx` ON `user_payment_methods` (`user_id`,`is_default`);--> statement-breakpoint
CREATE INDEX `user_payment_methods_user_id_direction_idx` ON `user_payment_methods` (`user_id`,`direction`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_payment_methods_payin_default_idx` ON `user_payment_methods` (`user_id`) WHERE "user_payment_methods"."is_default" = true AND "user_payment_methods"."direction" IN ('PAYIN', 'BOTH');--> statement-breakpoint
CREATE UNIQUE INDEX `user_payment_methods_payout_default_idx` ON `user_payment_methods` (`user_id`) WHERE "user_payment_methods"."is_default" = true AND "user_payment_methods"."direction" IN ('PAYOUT', 'BOTH');--> statement-breakpoint
CREATE INDEX `books_deleted_at_idx` ON `books` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `books_availability_status_idx` ON `books` (`availability_status`);--> statement-breakpoint
CREATE INDEX `books_created_at_idx` ON `books` (`created_at`);--> statement-breakpoint
CREATE INDEX `books_name_idx` ON `books` (`name`);--> statement-breakpoint
CREATE INDEX `class_categories_slug_idx` ON `class_categories` (`slug`);--> statement-breakpoint
CREATE INDEX `class_categories_deleted_at_idx` ON `class_categories` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `class_subjects_category_id_idx` ON `class_subjects` (`category_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `class_subjects_slug_idx` ON `class_subjects` (`slug`);--> statement-breakpoint
CREATE INDEX `class_subjects_deleted_at_idx` ON `class_subjects` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `class_communications_group_class_id_idx` ON `class_communications` (`group_class_id`);--> statement-breakpoint
CREATE INDEX `class_communications_type_idx` ON `class_communications` (`type`);--> statement-breakpoint
CREATE INDEX `class_communications_is_active_idx` ON `class_communications` (`is_active`);--> statement-breakpoint
CREATE INDEX `class_communications_is_delivered_idx` ON `class_communications` (`is_delivered`);--> statement-breakpoint
CREATE INDEX `class_communications_notification_delivery_id_idx` ON `class_communications` (`notification_delivery_id`);--> statement-breakpoint
CREATE INDEX `class_communications_class_status_event_id_idx` ON `class_communications` (`class_status_event_id`);--> statement-breakpoint
CREATE INDEX `class_communications_timestamp_idx` ON `class_communications` (`timestamp`);--> statement-breakpoint
CREATE INDEX `class_communications_created_at_idx` ON `class_communications` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `group_class_enrollments_unique_idx` ON `group_class_enrollments` (`group_class_id`,`student_id`);--> statement-breakpoint
CREATE INDEX `group_class_enrollments_group_class_id_idx` ON `group_class_enrollments` (`group_class_id`);--> statement-breakpoint
CREATE INDEX `group_class_enrollments_student_id_idx` ON `group_class_enrollments` (`student_id`);--> statement-breakpoint
CREATE INDEX `group_class_enrollments_attendance_status_idx` ON `group_class_enrollments` (`attendance_status`);--> statement-breakpoint
CREATE INDEX `group_class_enrollments_created_at_idx` ON `group_class_enrollments` (`created_at`);--> statement-breakpoint
CREATE INDEX `group_classes_class_instance_id_idx` ON `group_classes` (`class_instance_id`);--> statement-breakpoint
CREATE INDEX `group_classes_status_idx` ON `group_classes` (`status`);--> statement-breakpoint
CREATE INDEX `group_classes_created_at_idx` ON `group_classes` (`created_at`);--> statement-breakpoint
CREATE INDEX `group_classes_audit_logged_at_idx` ON `group_classes` (`audit_logged_at`);--> statement-breakpoint
CREATE INDEX `group_classes_class_type_idx` ON `group_classes` (`class_type`);--> statement-breakpoint
CREATE INDEX `group_classes_original_date_idx` ON `group_classes` (`original_date`);--> statement-breakpoint
CREATE INDEX `group_classes_rescheduled_date_idx` ON `group_classes` (`rescheduled_date`);--> statement-breakpoint
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
CREATE INDEX `class_instance_performance_created_at_idx` ON `class_instance_performance` (`created_at`);--> statement-breakpoint
CREATE INDEX `class_instance_performance_updated_at_idx` ON `class_instance_performance` (`updated_at`);--> statement-breakpoint
CREATE INDEX `class_instances_scheduled_start_at_idx` ON `class_instances` (`scheduled_start_at`);--> statement-breakpoint
CREATE INDEX `class_instances_teacher_scheduled_idx` ON `class_instances` (`teacher_id`,`scheduled_start_at`);--> statement-breakpoint
CREATE INDEX `class_instances_student_scheduled_idx` ON `class_instances` (`student_id`,`scheduled_start_at`);--> statement-breakpoint
CREATE INDEX `class_instances_original_class_id_idx` ON `class_instances` (`original_class_id`);--> statement-breakpoint
CREATE INDEX `class_instances_subject_id_idx` ON `class_instances` (`subject_id`);--> statement-breakpoint
CREATE INDEX `class_instances_class_type_idx` ON `class_instances` (`class_type`);--> statement-breakpoint
CREATE INDEX `class_instances_outcome_idx` ON `class_instances` (`outcome`);--> statement-breakpoint
CREATE UNIQUE INDEX `class_instances_idempotency_key_unique_idx` ON `class_instances` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `class_instances_execution_state_idx` ON `class_instances` (`execution_state`);--> statement-breakpoint
CREATE INDEX `class_instances_ondemand_status_idx` ON `class_instances` (`ondemand_status`);--> statement-breakpoint
CREATE INDEX `class_instances_frozen_idx` ON `class_instances` (`is_frozen`) WHERE "class_instances"."is_frozen" = true;--> statement-breakpoint
CREATE INDEX `class_instances_rescheduled_idx` ON `class_instances` (`is_rescheduled`) WHERE "class_instances"."is_rescheduled" = true;--> statement-breakpoint
CREATE INDEX `class_instances_recurring_schedule_id_idx` ON `class_instances` (`recurring_schedule_id`);--> statement-breakpoint
CREATE INDEX `class_instances_user_meeting_config_id_idx` ON `class_instances` (`user_meeting_config_id`);--> statement-breakpoint
CREATE INDEX `class_instances_meeting_provider_id_idx` ON `class_instances` (`meeting_provider_id`);--> statement-breakpoint
CREATE INDEX `class_instances_activated_by_user_id_idx` ON `class_instances` (`activated_by_user_id`);--> statement-breakpoint
CREATE INDEX `class_instances_force_activated_by_user_id_idx` ON `class_instances` (`force_activated_by_user_id`);--> statement-breakpoint
CREATE INDEX `class_instances_booking_timezone_id_idx` ON `class_instances` (`booking_timezone_id`);--> statement-breakpoint
CREATE INDEX `class_instances_created_at_idx` ON `class_instances` (`created_at`);--> statement-breakpoint
CREATE INDEX `class_instances_updated_at_idx` ON `class_instances` (`updated_at`);--> statement-breakpoint
CREATE INDEX `class_instances_actual_start_at_idx` ON `class_instances` (`actual_start_at`);--> statement-breakpoint
CREATE INDEX `class_instances_actual_end_at_idx` ON `class_instances` (`actual_end_at`);--> statement-breakpoint
CREATE INDEX `class_instances_activated_at_idx` ON `class_instances` (`activated_at`);--> statement-breakpoint
CREATE INDEX `class_instances_quota_deducted_idx` ON `class_instances` (`quota_deducted`);--> statement-breakpoint
CREATE INDEX `class_instances_payroll_credited_idx` ON `class_instances` (`payroll_credited`);--> statement-breakpoint
CREATE INDEX `class_instances_is_rate_overridden_idx` ON `class_instances` (`is_rate_overridden`);--> statement-breakpoint
CREATE INDEX `class_instances_rate_source_idx` ON `class_instances` (`rate_source`);--> statement-breakpoint
CREATE INDEX `class_instances_deleted_at_idx` ON `class_instances` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `class_instances_teacher_state_start_idx` ON `class_instances` (`teacher_id`,`execution_state`,`scheduled_start_at`);--> statement-breakpoint
CREATE INDEX `class_instances_student_state_start_idx` ON `class_instances` (`student_id`,`execution_state`,`scheduled_start_at`);--> statement-breakpoint
CREATE INDEX `class_instances_state_start_idx` ON `class_instances` (`execution_state`,`scheduled_start_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `class_instances_original_class_uniq_idx` ON `class_instances` (`original_class_id`) WHERE "class_instances"."original_class_id" IS NOT NULL AND "class_instances"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX `class_status_events_class_instance_id_idx` ON `class_status_events` (`class_instance_id`);--> statement-breakpoint
CREATE INDEX `class_status_events_instance_created_idx` ON `class_status_events` (`class_instance_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `class_status_events_event_type_idx` ON `class_status_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `class_status_events_actor_user_id_idx` ON `class_status_events` (`actor_user_id`);--> statement-breakpoint
CREATE INDEX `dst_migration_entries_run_id_idx` ON `dst_migration_entries` (`run_id`);--> statement-breakpoint
CREATE INDEX `dst_migration_entries_recurring_schedule_id_idx` ON `dst_migration_entries` (`recurring_schedule_id`);--> statement-breakpoint
CREATE INDEX `dst_migration_entries_result_idx` ON `dst_migration_entries` (`result`);--> statement-breakpoint
CREATE INDEX `dst_migration_runs_created_at_idx` ON `dst_migration_runs` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `leave_quota_teacher_period_idx` ON `leave_quota_usage` (`teacher_id`,`period_year`,`period_month`) WHERE "leave_quota_usage"."teacher_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `leave_quota_student_period_idx` ON `leave_quota_usage` (`student_id`,`period_year`,`period_month`) WHERE "leave_quota_usage"."student_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `leave_quota_usage_period_year_period_month_idx` ON `leave_quota_usage` (`period_year`,`period_month`);--> statement-breakpoint
CREATE INDEX `leave_requests_class_instance_id_idx` ON `leave_requests` (`class_instance_id`);--> statement-breakpoint
CREATE INDEX `leave_requests_requested_by_user_id_idx` ON `leave_requests` (`requested_by_user_id`);--> statement-breakpoint
CREATE INDEX `leave_requests_processed_by_user_id_idx` ON `leave_requests` (`processed_by_user_id`);--> statement-breakpoint
CREATE INDEX `leave_requests_status_idx` ON `leave_requests` (`status`);--> statement-breakpoint
CREATE INDEX `leave_requests_requester_type_idx` ON `leave_requests` (`requester_type`);--> statement-breakpoint
CREATE INDEX `leave_requests_created_at_idx` ON `leave_requests` (`created_at`);--> statement-breakpoint
CREATE INDEX `leave_requests_processed_at_idx` ON `leave_requests` (`processed_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `recurring_schedule_days_schedule_day_idx` ON `recurring_schedule_days` (`recurring_schedule_id`,`day_of_week`);--> statement-breakpoint
CREATE INDEX `recurring_schedule_days_recurring_schedule_id_idx` ON `recurring_schedule_days` (`recurring_schedule_id`);--> statement-breakpoint
CREATE INDEX `recurring_schedules_student_id_idx` ON `recurring_schedules` (`student_id`);--> statement-breakpoint
CREATE INDEX `recurring_schedules_teacher_id_idx` ON `recurring_schedules` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `recurring_schedules_timezone_id_idx` ON `recurring_schedules` (`timezone_id`);--> statement-breakpoint
CREATE INDEX `recurring_schedules_subject_id_idx` ON `recurring_schedules` (`subject_id`);--> statement-breakpoint
CREATE INDEX `recurring_schedules_quota_id_idx` ON `recurring_schedules` (`quota_id`);--> statement-breakpoint
CREATE INDEX `recurring_schedules_deleted_at_idx` ON `recurring_schedules` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `recurring_schedules_effective_from_idx` ON `recurring_schedules` (`effective_from`);--> statement-breakpoint
CREATE INDEX `recurring_schedules_effective_until_idx` ON `recurring_schedules` (`effective_until`);--> statement-breakpoint
CREATE INDEX `recurring_schedules_created_at_idx` ON `recurring_schedules` (`created_at`);--> statement-breakpoint
CREATE INDEX `recurring_schedules_updated_at_idx` ON `recurring_schedules` (`updated_at`);--> statement-breakpoint
CREATE INDEX `recurring_schedules_teacher_id_deleted_at_idx` ON `recurring_schedules` (`teacher_id`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `recurring_schedules_student_id_deleted_at_idx` ON `recurring_schedules` (`student_id`,`deleted_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `subject_resources_subject_id_learning_resource_id_idx` ON `subject_resources` (`subject_id`,`learning_resource_id`);--> statement-breakpoint
CREATE INDEX `complaint_responses_complaint_id_idx` ON `complaint_responses` (`complaint_id`);--> statement-breakpoint
CREATE INDEX `complaint_responses_responder_user_id_idx` ON `complaint_responses` (`responder_user_id`);--> statement-breakpoint
CREATE INDEX `complaint_responses_created_at_idx` ON `complaint_responses` (`created_at`);--> statement-breakpoint
CREATE INDEX `complaint_responses_email_sent_idx` ON `complaint_responses` (`email_sent`);--> statement-breakpoint
CREATE INDEX `complaints_status_idx` ON `complaints` (`status`);--> statement-breakpoint
CREATE INDEX `complaints_parent_id_idx` ON `complaints` (`parent_id`);--> statement-breakpoint
CREATE INDEX `complaints_student_id_idx` ON `complaints` (`student_id`);--> statement-breakpoint
CREATE INDEX `complaints_category_idx` ON `complaints` (`category`);--> statement-breakpoint
CREATE INDEX `complaints_created_at_idx` ON `complaints` (`created_at`);--> statement-breakpoint
CREATE INDEX `complaints_updated_at_idx` ON `complaints` (`updated_at`);--> statement-breakpoint
CREATE INDEX `learning_resources_deleted_at_idx` ON `learning_resources` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `learning_resources_uploaded_by_user_id_idx` ON `learning_resources` (`uploaded_by_user_id`);--> statement-breakpoint
CREATE INDEX `learning_resources_created_at_idx` ON `learning_resources` (`created_at`);--> statement-breakpoint
CREATE INDEX `learning_resources_display_name_idx` ON `learning_resources` (`display_name`);--> statement-breakpoint
CREATE INDEX `notification_deliveries_user_id_idx` ON `notification_deliveries` (`user_id`);--> statement-breakpoint
CREATE INDEX `notification_deliveries_status_idx` ON `notification_deliveries` (`status`);--> statement-breakpoint
CREATE INDEX `notification_deliveries_event_type_idx` ON `notification_deliveries` (`event_type`);--> statement-breakpoint
CREATE INDEX `notification_deliveries_channel_idx` ON `notification_deliveries` (`channel`);--> statement-breakpoint
CREATE INDEX `notification_deliveries_created_at_idx` ON `notification_deliveries` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `notification_deliveries_provider_message_id_unique` ON `notification_deliveries` (`provider_message_id`) WHERE "notification_deliveries"."provider_message_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `notification_deliveries_device_token_id_idx` ON `notification_deliveries` (`device_token_id`);--> statement-breakpoint
CREATE INDEX `notification_deliveries_sent_at_idx` ON `notification_deliveries` (`sent_at`);--> statement-breakpoint
CREATE INDEX `notification_deliveries_delivered_at_idx` ON `notification_deliveries` (`delivered_at`);--> statement-breakpoint
CREATE INDEX `notification_deliveries_failed_at_idx` ON `notification_deliveries` (`failed_at`);--> statement-breakpoint
CREATE INDEX `notification_deliveries_opened_at_idx` ON `notification_deliveries` (`opened_at`);--> statement-breakpoint
CREATE INDEX `notification_deliveries_user_id_status_created_at_idx` ON `notification_deliveries` (`user_id`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `notification_deliveries_status_created_at_idx` ON `notification_deliveries` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `suggestions_parent_id_idx` ON `suggestions` (`parent_id`);--> statement-breakpoint
CREATE INDEX `suggestions_status_idx` ON `suggestions` (`status`);--> statement-breakpoint
CREATE INDEX `suggestions_duplicate_of_id_idx` ON `suggestions` (`duplicate_of_id`);--> statement-breakpoint
CREATE INDEX `suggestions_reviewed_by_user_id_idx` ON `suggestions` (`reviewed_by_user_id`);--> statement-breakpoint
CREATE INDEX `suggestions_deleted_at_idx` ON `suggestions` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `suggestions_active_created_at_idx` ON `suggestions` (`created_at`) WHERE "suggestions"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX `suggestions_created_at_idx` ON `suggestions` (`created_at`);--> statement-breakpoint
CREATE INDEX `suggestions_reviewed_at_idx` ON `suggestions` (`reviewed_at`);--> statement-breakpoint
CREATE INDEX `suggestions_email_sent_at_idx` ON `suggestions` (`email_sent_at`);--> statement-breakpoint
CREATE INDEX `user_device_tokens_user_id_idx` ON `user_device_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_device_tokens_is_active_idx` ON `user_device_tokens` (`is_active`);--> statement-breakpoint
CREATE INDEX `user_device_tokens_last_used_at_idx` ON `user_device_tokens` (`last_used_at`);--> statement-breakpoint
CREATE INDEX `user_device_tokens_user_id_is_active_idx` ON `user_device_tokens` (`user_id`,`is_active`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_device_tokens_token_unique_idx` ON `user_device_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `user_notification_preferences_user_id_idx` ON `user_notification_preferences` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_notification_preferences_channel_idx` ON `user_notification_preferences` (`channel`);--> statement-breakpoint
CREATE INDEX `user_notification_preferences_event_type_idx` ON `user_notification_preferences` (`event_type`);--> statement-breakpoint
CREATE INDEX `user_notification_preferences_enabled_idx` ON `user_notification_preferences` (`enabled`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_notification_preferences_unique_idx` ON `user_notification_preferences` (`user_id`,`channel`,`event_type`);--> statement-breakpoint
CREATE INDEX `cron_heartbeats_run_id_last_beat_at_idx` ON `cron_heartbeats` (`run_id`,`last_beat_at`);--> statement-breakpoint
CREATE INDEX `cron_runs_schedule_id_status_started_at_idx` ON `cron_runs` (`schedule_id`,`status`,`started_at`);--> statement-breakpoint
CREATE INDEX `cron_runs_status_started_at_idx` ON `cron_runs` (`status`,`started_at`);--> statement-breakpoint
CREATE INDEX `cron_runs_worker_id_status_idx` ON `cron_runs` (`worker_id`,`status`);--> statement-breakpoint
CREATE INDEX `cron_schedules_status_next_run_at_idx` ON `cron_schedules` (`status`,`next_run_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `cron_schedules_name_unique_idx` ON `cron_schedules` (`name`) WHERE "cron_schedules"."status" IN ('ACTIVE', 'PAUSED');--> statement-breakpoint
CREATE INDEX `cron_schedules_job_kind_idx` ON `cron_schedules` (`job_kind`);--> statement-breakpoint
CREATE INDEX `class_meeting_configs_class_instance_id_idx` ON `class_meeting_configs` (`class_instance_id`);--> statement-breakpoint
CREATE INDEX `class_meeting_configs_recurring_schedule_id_idx` ON `class_meeting_configs` (`recurring_schedule_id`);--> statement-breakpoint
CREATE INDEX `class_meeting_configs_is_default_idx` ON `class_meeting_configs` (`is_default`);--> statement-breakpoint
CREATE INDEX `class_meeting_configs_provider_id_idx` ON `class_meeting_configs` (`provider_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `class_meeting_configs_one_default_per_instance_idx` ON `class_meeting_configs` (`class_instance_id`) WHERE "class_meeting_configs"."is_default" = true AND "class_meeting_configs"."class_instance_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `class_meeting_configs_one_default_per_recurring_idx` ON `class_meeting_configs` (`recurring_schedule_id`) WHERE "class_meeting_configs"."is_default" = true AND "class_meeting_configs"."recurring_schedule_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `meeting_provider_tokens_user_provider_idx` ON `meeting_provider_tokens` (`user_id`,`provider_slug`);--> statement-breakpoint
CREATE INDEX `meeting_provider_tokens_user_id_idx` ON `meeting_provider_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `meeting_provider_tokens_provider_slug_idx` ON `meeting_provider_tokens` (`provider_slug`);--> statement-breakpoint
CREATE INDEX `meeting_provider_tokens_expires_at_idx` ON `meeting_provider_tokens` (`expires_at`);--> statement-breakpoint
CREATE INDEX `meeting_providers_is_active_idx` ON `meeting_providers` (`is_active`);--> statement-breakpoint
CREATE INDEX `meeting_providers_provider_kind_idx` ON `meeting_providers` (`provider_kind`);--> statement-breakpoint
CREATE INDEX `meeting_providers_created_at_idx` ON `meeting_providers` (`created_at`);--> statement-breakpoint
CREATE INDEX `meeting_providers_updated_at_idx` ON `meeting_providers` (`updated_at`);--> statement-breakpoint
CREATE INDEX `user_meeting_configs_user_id_idx` ON `user_meeting_configs` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_meeting_configs_is_default_idx` ON `user_meeting_configs` (`is_default`);--> statement-breakpoint
CREATE INDEX `user_meeting_configs_user_id_is_default_idx` ON `user_meeting_configs` (`user_id`,`is_default`);--> statement-breakpoint
CREATE INDEX `user_meeting_configs_provider_id_idx` ON `user_meeting_configs` (`provider_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_meeting_configs_one_default_per_user_idx` ON `user_meeting_configs` (`user_id`) WHERE "user_meeting_configs"."is_default" = true;--> statement-breakpoint
CREATE INDEX `parents_user_id_idx` ON `parents` (`user_id`);--> statement-breakpoint
CREATE INDEX `parents_status_idx` ON `parents` (`status`);--> statement-breakpoint
CREATE INDEX `parents_created_at_idx` ON `parents` (`created_at`);--> statement-breakpoint
CREATE INDEX `parents_updated_at_idx` ON `parents` (`updated_at`);--> statement-breakpoint
CREATE INDEX `parents_invoice_type_idx` ON `parents` (`invoice_type`);--> statement-breakpoint
CREATE INDEX `parents_currency_idx` ON `parents` (`currency`);--> statement-breakpoint
CREATE INDEX `group_permissions_group_id_idx` ON `group_permissions` (`group_id`);--> statement-breakpoint
CREATE INDEX `group_permissions_permission_id_idx` ON `group_permissions` (`permission_id`);--> statement-breakpoint
CREATE INDEX `permission_groups_is_system_idx` ON `permission_groups` (`is_system`);--> statement-breakpoint
CREATE INDEX `permission_groups_created_by_user_id_idx` ON `permission_groups` (`created_by_user_id`);--> statement-breakpoint
CREATE INDEX `permission_groups_created_at_idx` ON `permission_groups` (`created_at`);--> statement-breakpoint
CREATE INDEX `permission_groups_updated_at_idx` ON `permission_groups` (`updated_at`);--> statement-breakpoint
CREATE INDEX `permissions_key_idx` ON `permissions` (`key`);--> statement-breakpoint
CREATE INDEX `permissions_resource_idx` ON `permissions` (`resource`);--> statement-breakpoint
CREATE INDEX `permissions_action_idx` ON `permissions` (`action`);--> statement-breakpoint
CREATE INDEX `permissions_is_system_idx` ON `permissions` (`is_system`);--> statement-breakpoint
CREATE INDEX `user_permission_groups_user_id_idx` ON `user_permission_groups` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_permission_groups_assigned_at_idx` ON `user_permission_groups` (`assigned_at`);--> statement-breakpoint
CREATE INDEX `user_permission_groups_assigned_by_user_id_idx` ON `user_permission_groups` (`assigned_by_user_id`);--> statement-breakpoint
CREATE INDEX `user_permission_overrides_user_id_idx` ON `user_permission_overrides` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_permission_overrides_state_idx` ON `user_permission_overrides` (`state`);--> statement-breakpoint
CREATE INDEX `user_permission_overrides_assigned_by_user_id_idx` ON `user_permission_overrides` (`assigned_by_user_id`);--> statement-breakpoint
CREATE INDEX `user_permission_overrides_created_at_idx` ON `user_permission_overrides` (`created_at`);--> statement-breakpoint
CREATE INDEX `rate_limit_cache_expires_at_idx` ON `rate_limit_cache` (`expires_at`);--> statement-breakpoint
CREATE INDEX `rate_limit_cache_value_idx` ON `rate_limit_cache` (`value`);--> statement-breakpoint
CREATE INDEX `session_cache_expires_at_idx` ON `session_cache` (`expires_at`);--> statement-breakpoint
CREATE INDEX `session_cache_value_idx` ON `session_cache` (`value`);--> statement-breakpoint
CREATE INDEX `system_settings_category_idx` ON `system_settings` (`category`);--> statement-breakpoint
CREATE INDEX `system_settings_updated_by_user_id_idx` ON `system_settings` (`updated_by_user_id`);--> statement-breakpoint
CREATE INDEX `system_settings_updated_at_idx` ON `system_settings` (`updated_at`);--> statement-breakpoint
CREATE INDEX `system_settings_data_type_idx` ON `system_settings` (`data_type`);--> statement-breakpoint
CREATE INDEX `timezones_is_dst_supported_idx` ON `timezones` (`is_dst_supported`);--> statement-breakpoint
CREATE INDEX `timezones_base_offset_minutes_idx` ON `timezones` (`base_offset_minutes`);--> statement-breakpoint
CREATE INDEX `site_content_slug_idx` ON `site_content` (`slug`);--> statement-breakpoint
CREATE INDEX `site_content_type_idx` ON `site_content` (`content_type`);--> statement-breakpoint
CREATE INDEX `site_content_updated_by_user_id_idx` ON `site_content` (`updated_by_user_id`);--> statement-breakpoint
CREATE INDEX `site_content_created_at_idx` ON `site_content` (`created_at`);--> statement-breakpoint
CREATE INDEX `site_content_updated_at_idx` ON `site_content` (`updated_at`);--> statement-breakpoint
CREATE INDEX `site_content_is_published_content_type_idx` ON `site_content` (`is_published`,`content_type`);--> statement-breakpoint
CREATE INDEX `class_instance_files_file_id_idx` ON `class_instance_files` (`file_id`);--> statement-breakpoint
CREATE INDEX `class_instance_files_instance_id_idx` ON `class_instance_files` (`class_instance_id`);--> statement-breakpoint
CREATE INDEX `complaint_files_file_id_idx` ON `complaint_files` (`file_id`);--> statement-breakpoint
CREATE INDEX `complaint_files_complaint_id_idx` ON `complaint_files` (`complaint_id`);--> statement-breakpoint
CREATE INDEX `invoice_files_file_id_idx` ON `invoice_files` (`file_id`);--> statement-breakpoint
CREATE INDEX `invoice_files_invoice_id_idx` ON `invoice_files` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `learning_resource_files_file_id_idx` ON `learning_resource_files` (`file_id`);--> statement-breakpoint
CREATE INDEX `learning_resource_files_res_id_idx` ON `learning_resource_files` (`learning_resource_id`);--> statement-breakpoint
CREATE INDEX `parent_files_file_id_idx` ON `parent_files` (`file_id`);--> statement-breakpoint
CREATE INDEX `parent_files_parent_id_idx` ON `parent_files` (`parent_id`);--> statement-breakpoint
CREATE INDEX `recurring_schedule_files_file_id_idx` ON `recurring_schedule_files` (`file_id`);--> statement-breakpoint
CREATE INDEX `recurring_schedule_files_sched_id_idx` ON `recurring_schedule_files` (`recurring_schedule_id`);--> statement-breakpoint
CREATE INDEX `signed_url_expires_at_idx` ON `signed_url` (`expires_at`);--> statement-breakpoint
CREATE INDEX `signed_url_used_expires_idx` ON `signed_url` (`used`,`expires_at`);--> statement-breakpoint
CREATE INDEX `signed_url_created_at_idx` ON `signed_url` (`created_at`);--> statement-breakpoint
CREATE INDEX `signed_url_file_path_idx` ON `signed_url` (`file_path`);--> statement-breakpoint
CREATE INDEX `signed_url_content_hash_idx` ON `signed_url` (`content_hash`);--> statement-breakpoint
CREATE INDEX `staff_profile_files_file_id_idx` ON `staff_profile_files` (`file_id`);--> statement-breakpoint
CREATE INDEX `staff_profile_files_staff_id_idx` ON `staff_profile_files` (`staff_profile_id`);--> statement-breakpoint
CREATE INDEX `storage_directories_is_protected_idx` ON `storage_directory` (`is_protected`);--> statement-breakpoint
CREATE INDEX `storage_directories_allow_uploads_idx` ON `storage_directory` (`allow_uploads`);--> statement-breakpoint
CREATE INDEX `storage_files_is_protected_idx` ON `storage_file` (`is_protected`);--> statement-breakpoint
CREATE INDEX `student_files_file_id_idx` ON `student_files` (`file_id`);--> statement-breakpoint
CREATE INDEX `student_files_student_id_idx` ON `student_files` (`student_id`);--> statement-breakpoint
CREATE INDEX `teacher_files_file_id_idx` ON `teacher_files` (`file_id`);--> statement-breakpoint
CREATE INDEX `teacher_files_teacher_id_idx` ON `teacher_files` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `user_files_file_id_idx` ON `user_files` (`file_id`);--> statement-breakpoint
CREATE INDEX `user_files_user_id_idx` ON `user_files` (`user_id`);--> statement-breakpoint
CREATE INDEX `student_progress_student_id_idx` ON `student_progress` (`student_id`);--> statement-breakpoint
CREATE INDEX `student_progress_class_instance_id_idx` ON `student_progress` (`class_instance_id`);--> statement-breakpoint
CREATE INDEX `student_progress_teacher_id_idx` ON `student_progress` (`teacher_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `student_progress_student_class_uniq_idx` ON `student_progress` (`student_id`,`class_instance_id`);--> statement-breakpoint
CREATE INDEX `student_progress_parent_visible_idx` ON `student_progress` (`parent_visible`);--> statement-breakpoint
CREATE INDEX `student_progress_created_at_idx` ON `student_progress` (`created_at`);--> statement-breakpoint
CREATE INDEX `student_status_history_student_id_idx` ON `student_status_history` (`student_id`);--> statement-breakpoint
CREATE INDEX `student_status_history_changed_by_user_id_idx` ON `student_status_history` (`changed_by_user_id`);--> statement-breakpoint
CREATE INDEX `students_parent_id_idx` ON `students` (`parent_id`);--> statement-breakpoint
CREATE INDEX `students_user_id_idx` ON `students` (`user_id`);--> statement-breakpoint
CREATE INDEX `students_primary_teacher_id_idx` ON `students` (`primary_teacher_id`);--> statement-breakpoint
CREATE INDEX `students_status_idx` ON `students` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `students_idempotency_key_unique_idx` ON `students` (`idempotency_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `students_user_id_unique_idx` ON `students` (`user_id`);--> statement-breakpoint
CREATE INDEX `students_pagination_idx` ON `students` (`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `idx_students_filter_mobile` ON `students` (`status`,`primary_teacher_id`,`date_of_birth`);--> statement-breakpoint
CREATE INDEX `idx_students_parent_status` ON `students` (`parent_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_students_status_created` ON `students` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `students_language_idx` ON `students` (`language`);--> statement-breakpoint
CREATE INDEX `students_date_of_birth_idx` ON `students` (`date_of_birth`);--> statement-breakpoint
CREATE INDEX `students_updated_at_idx` ON `students` (`updated_at`);--> statement-breakpoint
CREATE INDEX `students_primary_teacher_id_status_idx` ON `students` (`primary_teacher_id`,`status`);--> statement-breakpoint
CREATE INDEX `teacher_assignments_student_id_idx` ON `teacher_assignments` (`student_id`);--> statement-breakpoint
CREATE INDEX `teacher_assignments_teacher_id_idx` ON `teacher_assignments` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `teacher_assignments_ended_at_idx` ON `teacher_assignments` (`ended_at`);--> statement-breakpoint
CREATE INDEX `teacher_assignments_assigned_by_user_id_idx` ON `teacher_assignments` (`assigned_by_user_id`);--> statement-breakpoint
CREATE INDEX `staff_profiles_user_id_idx` ON `staff_profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `staff_profiles_created_at_idx` ON `staff_profiles` (`created_at`);--> statement-breakpoint
CREATE INDEX `staff_profiles_updated_at_idx` ON `staff_profiles` (`updated_at`);--> statement-breakpoint
CREATE INDEX `staff_profiles_rate_currency_idx` ON `staff_profiles` (`rate_currency`);--> statement-breakpoint
CREATE INDEX `teacher_availability_windows_teacher_id_idx` ON `teacher_availability_windows` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `teacher_availability_windows_teacher_day_idx` ON `teacher_availability_windows` (`teacher_id`,`day_of_week`);--> statement-breakpoint
CREATE INDEX `teacher_recurring_unavailability_teacher_id_idx` ON `teacher_recurring_unavailability` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `teacher_recurring_unavailability_teacher_day_idx` ON `teacher_recurring_unavailability` (`teacher_id`,`day_of_week`);--> statement-breakpoint
CREATE INDEX `teacher_vacation_requests_teacher_id_idx` ON `teacher_vacation_requests` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `teacher_vacation_requests_status_idx` ON `teacher_vacation_requests` (`status`);--> statement-breakpoint
CREATE INDEX `teacher_vacation_requests_start_at_idx` ON `teacher_vacation_requests` (`start_at`);--> statement-breakpoint
CREATE INDEX `teacher_vacation_requests_end_at_idx` ON `teacher_vacation_requests` (`end_at`);--> statement-breakpoint
CREATE INDEX `teacher_vacation_requests_requested_by_user_id_idx` ON `teacher_vacation_requests` (`requested_by_user_id`);--> statement-breakpoint
CREATE INDEX `teacher_vacation_requests_processed_by_user_id_idx` ON `teacher_vacation_requests` (`processed_by_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `teacher_dues_class_instance_id_unique_idx` ON `teacher_dues` (`class_instance_id`);--> statement-breakpoint
CREATE INDEX `teacher_dues_teacher_id_idx` ON `teacher_dues` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `teacher_dues_status_idx` ON `teacher_dues` (`status`);--> statement-breakpoint
CREATE INDEX `teacher_dues_approved_at_idx` ON `teacher_dues` (`approved_at`);--> statement-breakpoint
CREATE INDEX `teacher_dues_student_id_idx` ON `teacher_dues` (`student_id`);--> statement-breakpoint
CREATE INDEX `teacher_dues_teacher_payment_id_idx` ON `teacher_dues` (`teacher_payment_id`);--> statement-breakpoint
CREATE INDEX `teacher_dues_approved_by_user_id_idx` ON `teacher_dues` (`approved_by_user_id`);--> statement-breakpoint
CREATE INDEX `teacher_dues_currency_idx` ON `teacher_dues` (`currency`);--> statement-breakpoint
CREATE INDEX `teacher_dues_rate_source_idx` ON `teacher_dues` (`rate_source`);--> statement-breakpoint
CREATE INDEX `teacher_important_notes_teacher_id_idx` ON `teacher_important_notes` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `teacher_important_notes_is_published_idx` ON `teacher_important_notes` (`is_published`);--> statement-breakpoint
CREATE INDEX `teacher_important_notes_deleted_at_idx` ON `teacher_important_notes` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `teacher_important_notes_created_by_user_id_idx` ON `teacher_important_notes` (`created_by_user_id`);--> statement-breakpoint
CREATE INDEX `teacher_payments_teacher_id_idx` ON `teacher_payments` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `teacher_payments_user_payment_method_id_idx` ON `teacher_payments` (`user_payment_method_id`);--> statement-breakpoint
CREATE INDEX `teacher_payments_payment_date_idx` ON `teacher_payments` (`payment_date`);--> statement-breakpoint
CREATE INDEX `teacher_payments_payment_method_type_idx` ON `teacher_payments` (`payment_method_type`);--> statement-breakpoint
CREATE INDEX `teacher_payments_is_test_payment_idx` ON `teacher_payments` (`is_test_payment`);--> statement-breakpoint
CREATE INDEX `teachers_user_id_idx` ON `teachers` (`user_id`);--> statement-breakpoint
CREATE INDEX `teachers_created_at_idx` ON `teachers` (`created_at`);--> statement-breakpoint
CREATE INDEX `teachers_updated_at_idx` ON `teachers` (`updated_at`);--> statement-breakpoint
CREATE INDEX `teachers_nationality_idx` ON `teachers` (`nationality`);--> statement-breakpoint
CREATE INDEX `teachers_country_code_idx` ON `teachers` (`country_code`);--> statement-breakpoint
CREATE INDEX `teachers_gender_idx` ON `teachers` (`gender`);--> statement-breakpoint
CREATE INDEX `teachers_rate_currency_idx` ON `teachers` (`rate_currency`);--> statement-breakpoint
CREATE INDEX `auth_rate_limits_ip_idx` ON `auth_rate_limits` (`ip_address`);--> statement-breakpoint
CREATE INDEX `auth_rate_limits_email_idx` ON `auth_rate_limits` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `auth_rate_limits_ip_email_unique_idx` ON `auth_rate_limits` (`ip_address`,`email`);--> statement-breakpoint
CREATE INDEX `password_reset_tokens_email_idx` ON `password_reset_tokens` (`email`);--> statement-breakpoint
CREATE INDEX `password_reset_tokens_expires_at_idx` ON `password_reset_tokens` (`expires_at`);--> statement-breakpoint
CREATE INDEX `password_reset_tokens_token_idx` ON `password_reset_tokens` (`hashed_token`);--> statement-breakpoint
CREATE INDEX `session_metadata_user_id_idx` ON `session_metadata` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_metadata_expires_at_idx` ON `session_metadata` (`expires_at`);--> statement-breakpoint
CREATE INDEX `session_metadata_device_type_idx` ON `session_metadata` (`device_type`);--> statement-breakpoint
CREATE INDEX `session_metadata_session_id_idx` ON `session_metadata` (`session_id`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_index` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_last_activity_index` ON `sessions` (`last_activity`);--> statement-breakpoint
CREATE INDEX `users_status_idx` ON `users` (`status`);--> statement-breakpoint
CREATE INDEX `users_last_login_at_idx` ON `users` (`last_login_at`);--> statement-breakpoint
CREATE INDEX `users_created_at_idx` ON `users` (`created_at`);--> statement-breakpoint
CREATE INDEX `users_updated_at_idx` ON `users` (`updated_at`);--> statement-breakpoint
CREATE INDEX `users_deleted_at_idx` ON `users` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `users_display_currency_idx` ON `users` (`display_currency`);--> statement-breakpoint
CREATE INDEX `users_timezone_idx` ON `users` (`timezone`);--> statement-breakpoint
CREATE INDEX `users_is_super_admin_idx` ON `users` (`is_super_admin`);--> statement-breakpoint
CREATE INDEX `users_phone_idx` ON `users` (`phone`);--> statement-breakpoint
CREATE INDEX `users_name_idx` ON `users` (`name`);--> statement-breakpoint
CREATE INDEX `users_status_deleted_at_idx` ON `users` (`status`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `users_status_created_at_idx` ON `users` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `whatsapp_accounts_waba_id_idx` ON `whatsapp_accounts` (`waba_id`);--> statement-breakpoint
CREATE INDEX `whatsapp_accounts_is_active_idx` ON `whatsapp_accounts` (`is_active`);--> statement-breakpoint
CREATE INDEX `whatsapp_accounts_active_created_at_idx` ON `whatsapp_accounts` (`is_active`,`created_at`);