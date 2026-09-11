CREATE TABLE `package_plans` (
	`id` text PRIMARY KEY,
	`codename` text NOT NULL,
	`display_name` text NOT NULL,
	`description` text,
	`credit_hours` text NOT NULL,
	`price_amount` text NOT NULL,
	`currency` text NOT NULL,
	`validity_months` integer,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`metadata` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`deleted_at` integer,
	CONSTRAINT "package_plans_credit_hours_positive_chk" CHECK("credit_hours" > 0),
	CONSTRAINT "package_plans_price_amount_positive_chk" CHECK("price_amount" > 0),
	CONSTRAINT "package_plans_sort_order_non_negative_chk" CHECK("sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY,
	`teacher_id` text,
	`teacher_name` text,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`expense_value` text NOT NULL,
	`expense_currency` text NOT NULL,
	`payment_date` text NOT NULL,
	`expense_date` text NOT NULL,
	`note` text,
	`source_entity` text,
	`source_entity_id` text,
	`created_by_user_id` text NOT NULL,
	`deleted_at` integer,
	`deleted_by_user_id` text,
	`deleted_reason` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_expenses_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_expenses_created_by_user_id_users_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_expenses_deleted_by_user_id_users_id_fk` FOREIGN KEY (`deleted_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `carryover_balance_items` (
	`id` text PRIMARY KEY,
	`carryover_id` text NOT NULL,
	`class_instance_id` text NOT NULL,
	`original_amount` text NOT NULL,
	`original_currency` text NOT NULL,
	`original_status` text NOT NULL,
	`original_partial_percentage` integer,
	`converted_amount` text,
	`converted_currency` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_carryover_balance_items_carryover_id_carryover_balances_id_fk` FOREIGN KEY (`carryover_id`) REFERENCES `carryover_balances`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_carryover_balance_items_class_instance_id_class_instances_id_fk` FOREIGN KEY (`class_instance_id`) REFERENCES `class_instances`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `carryover_balances` (
	`id` text PRIMARY KEY,
	`teacher_id` text NOT NULL,
	`students_count` integer,
	`students_text` text,
	`total_duration` text,
	`payable` text NOT NULL,
	`teacher_currency` text NOT NULL,
	`paid` text DEFAULT '0' NOT NULL,
	`from_date` text,
	`to_date` text,
	`payment_date` text,
	`is_disabled_teacher` integer DEFAULT false NOT NULL,
	`is_paid` integer DEFAULT false NOT NULL,
	`expense_id` text,
	`note` text,
	`created_by_user_id` text NOT NULL,
	`paid_by_user_id` text,
	`paid_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_carryover_balances_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_carryover_balances_created_by_user_id_users_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_carryover_balances_paid_by_user_id_users_id_fk` FOREIGN KEY (`paid_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `whatsapp_configs` (
	`id` text PRIMARY KEY,
	`app_id` text,
	`app_secret` text,
	`verify_token` text,
	`phone_number_id` text,
	`waba_id` text,
	`access_token` text,
	`es_config_id` text,
	`updated_by_user_id` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_whatsapp_configs_updated_by_user_id_users_id_fk` FOREIGN KEY (`updated_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `whatsapp_contacts` (
	`id` text PRIMARY KEY,
	`account_id` text NOT NULL,
	`phone_number` text,
	`user_id` text,
	`username` text,
	`full_name` text,
	`first_name` text,
	`removed_at` integer,
	`last_action_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_whatsapp_contacts_account_id_whatsapp_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `whatsapp_accounts`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `whatsapp_conversations` (
	`id` text PRIMARY KEY,
	`account_id` text NOT NULL,
	`wa_id` text,
	`user_id` text,
	`username` text,
	`display_name` text,
	`last_message_at` integer,
	`last_message_preview` text,
	`last_inbound_message_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`deleted_at` integer,
	CONSTRAINT `fk_whatsapp_conversations_account_id_whatsapp_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `whatsapp_accounts`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `whatsapp_messages` (
	`id` text PRIMARY KEY,
	`conversation_id` text NOT NULL,
	`account_id` text NOT NULL,
	`wamid` text NOT NULL,
	`direction` text NOT NULL,
	`type` text NOT NULL,
	`content` text NOT NULL,
	`status` text,
	`media_placeholder` integer DEFAULT false NOT NULL,
	`media_id` text,
	`media_mime` text,
	`media_sha256` text,
	`phase` integer,
	`chunk_order` integer,
	`sent_at` integer,
	`edited_at` integer,
	`revoked_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_whatsapp_messages_conversation_id_whatsapp_conversations_id_fk` FOREIGN KEY (`conversation_id`) REFERENCES `whatsapp_conversations`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_whatsapp_messages_account_id_whatsapp_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `whatsapp_accounts`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `whatsapp_sync_requests` (
	`id` text PRIMARY KEY,
	`account_id` text NOT NULL,
	`sync_type` text NOT NULL,
	`request_id` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`requested_at` integer,
	`completed_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_whatsapp_sync_requests_account_id_whatsapp_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `whatsapp_accounts`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `whatsapp_test_recipients` (
	`id` text PRIMARY KEY,
	`account_id` text NOT NULL,
	`phone_number` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`last_checked_at` integer,
	`last_error_code` text,
	`note` text,
	`created_by_user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT `fk_whatsapp_test_recipients_account_id_whatsapp_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `whatsapp_accounts`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_whatsapp_test_recipients_created_by_user_id_users_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_webhook_events` (
	`id` text PRIMARY KEY,
	`account_id` text,
	`field` text NOT NULL,
	`payload` text NOT NULL,
	`payload_hash` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`received_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`processed_at` integer,
	CONSTRAINT `fk_whatsapp_webhook_events_account_id_whatsapp_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `whatsapp_accounts`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `invoices` ADD `credit_hours` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `package_plan_id` text REFERENCES package_plans(id) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `payment_gateway` text DEFAULT 'NONE' NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `credit_hours` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `is_paid_status_on` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `payment_note` text;--> statement-breakpoint
ALTER TABLE `credit_transactions` ADD `change_amount_hours` text;--> statement-breakpoint
ALTER TABLE `credit_transactions` ADD `adjustment_type` text DEFAULT 'ADD' NOT NULL;--> statement-breakpoint
ALTER TABLE `credit_transactions` ADD `carryover_teacher_id` text REFERENCES teachers(id) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE `credit_transactions` ADD `carryover_from_date` text;--> statement-breakpoint
ALTER TABLE `credit_transactions` ADD `carryover_to_date` text;--> statement-breakpoint
ALTER TABLE `credit_transactions` ADD `carryover_payment_date` text;--> statement-breakpoint
ALTER TABLE `credit_transactions` ADD `internal_notes` text;--> statement-breakpoint
ALTER TABLE `class_instances` ADD `billed_unit` text;--> statement-breakpoint
ALTER TABLE `class_instances` ADD `calculated_duration` integer;--> statement-breakpoint
ALTER TABLE `class_instances` ADD `teacher_paid_amount` text;--> statement-breakpoint
ALTER TABLE `class_instances` ADD `teacher_paid_currency` text;--> statement-breakpoint
ALTER TABLE `class_instances` ADD `calculation_status` text DEFAULT 'NOT_CALCULATED' NOT NULL;--> statement-breakpoint
ALTER TABLE `class_instances` ADD `is_partial_percentage` integer;--> statement-breakpoint
ALTER TABLE `class_instances` ADD `payroll_note` text;--> statement-breakpoint
ALTER TABLE `class_instances` ADD `payroll_calculated_at` integer;--> statement-breakpoint
ALTER TABLE `class_instances` ADD `payroll_calculated_by` text REFERENCES users(id) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE `class_instances` ADD `carryover_balance_id` text REFERENCES carryover_balances(id) ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE `leave_requests` ADD `request_type` text;--> statement-breakpoint
ALTER TABLE `leave_requests` ADD `proposed_start_at` integer;--> statement-breakpoint
ALTER TABLE `students` ADD `credit_hours_total` text DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `credit_hours_remaining` text DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `whatsapp_accounts` ADD `meta_status` text;--> statement-breakpoint
ALTER TABLE `whatsapp_accounts` ADD `purpose` text DEFAULT 'GENERAL' NOT NULL;--> statement-breakpoint
ALTER TABLE `whatsapp_accounts` ADD `onboarding_mode` text DEFAULT 'CLOUD_API' NOT NULL;--> statement-breakpoint
ALTER TABLE `whatsapp_accounts` ADD `sync_status` text DEFAULT 'NOT_STARTED' NOT NULL;--> statement-breakpoint
ALTER TABLE `whatsapp_accounts` ADD `sync_phase` integer;--> statement-breakpoint
ALTER TABLE `whatsapp_accounts` ADD `sync_progress` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `whatsapp_accounts` ADD `sync_deadline_at` integer;--> statement-breakpoint
ALTER TABLE `whatsapp_accounts` ADD `sync_failure_reason` text;--> statement-breakpoint
ALTER TABLE `whatsapp_accounts` ADD `offboarded_at` integer;--> statement-breakpoint
ALTER TABLE `whatsapp_accounts` ADD `is_test_number` integer DEFAULT false NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_credit_transactions` (
	`id` text PRIMARY KEY,
	`student_id` text NOT NULL,
	`change_amount` integer,
	`change_amount_hours` text,
	`reason` text NOT NULL,
	`source_payment_id` text,
	`class_instance_id` text,
	`notes` text,
	`credited_by_user_id` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`adjustment_type` text DEFAULT 'ADD' NOT NULL,
	`carryover_teacher_id` text,
	`carryover_from_date` text,
	`carryover_to_date` text,
	`carryover_payment_date` text,
	`internal_notes` text,
	CONSTRAINT `fk_credit_transactions_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_credit_transactions_source_payment_id_payments_id_fk` FOREIGN KEY (`source_payment_id`) REFERENCES `payments`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_credit_transactions_class_instance_id_class_instances_id_fk` FOREIGN KEY (`class_instance_id`) REFERENCES `class_instances`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_credit_transactions_credited_by_user_id_users_id_fk` FOREIGN KEY (`credited_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_credit_transactions_carryover_teacher_id_teachers_id_fk` FOREIGN KEY (`carryover_teacher_id`) REFERENCES `teachers`(`id`) ON DELETE SET NULL,
	CONSTRAINT "credit_transactions_change_amount_xor_chk" CHECK((("change_amount" IS NOT NULL AND "change_amount_hours" IS NULL) OR ("change_amount" IS NULL AND "change_amount_hours" IS NOT NULL)))
);
--> statement-breakpoint
INSERT INTO `__new_credit_transactions`(`id`, `student_id`, `change_amount`, `reason`, `source_payment_id`, `class_instance_id`, `notes`, `credited_by_user_id`, `idempotency_key`, `created_at`, `updated_at`) SELECT `id`, `student_id`, `change_amount`, `reason`, `source_payment_id`, `class_instance_id`, `notes`, `credited_by_user_id`, `idempotency_key`, `created_at`, `updated_at` FROM `credit_transactions`;--> statement-breakpoint
DROP TABLE `credit_transactions`;--> statement-breakpoint
ALTER TABLE `__new_credit_transactions` RENAME TO `credit_transactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_class_instances` (
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
	`billed_unit` text,
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
	`calculated_duration` integer,
	`teacher_paid_amount` text,
	`teacher_paid_currency` text,
	`calculation_status` text DEFAULT 'NOT_CALCULATED' NOT NULL,
	`is_partial_percentage` integer,
	`payroll_note` text,
	`payroll_calculated_at` integer,
	`payroll_calculated_by` text,
	`carryover_balance_id` text,
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
	CONSTRAINT `fk_class_instances_payroll_calculated_by_users_id_fk` FOREIGN KEY (`payroll_calculated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_class_instances_carryover_balance_id_carryover_balances_id_fk` FOREIGN KEY (`carryover_balance_id`) REFERENCES `carryover_balances`(`id`) ON DELETE SET NULL,
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
	CONSTRAINT "class_instances_rescheduled_no_complete_chk" CHECK("is_rescheduled" = false OR ("execution_state" != 'COMPLETED' OR "outcome" != 'TAKEN')),
	CONSTRAINT "class_instances_partial_percentage_chk" CHECK(
        ("calculation_status" != 'PARTIALLY' OR "is_partial_percentage" IS NOT NULL) AND
        ("calculation_status" = 'PARTIALLY' OR "is_partial_percentage" IS NULL) AND
        ("is_partial_percentage" IS NULL OR ("is_partial_percentage" >= 0 AND "is_partial_percentage" <= 100))
      ),
	CONSTRAINT "class_instances_calculated_status_amount_chk" CHECK(
        ("calculation_status" != 'REFUND' OR "teacher_paid_amount" = '0') AND
        ("calculation_status" != 'CALCULATED' OR "calculated_duration" IS NOT NULL)
      )
);
--> statement-breakpoint
INSERT INTO `__new_class_instances`(`id`, `student_id`, `teacher_id`, `subject_id`, `recurring_schedule_id`, `original_class_id`, `scheduled_start_at`, `scheduled_end_at`, `booking_timezone_id`, `booking_timezone`, `booking_utc_offset`, `duration_minutes`, `class_type`, `outcome`, `execution_state`, `is_rescheduled`, `is_frozen`, `meeting_join_url`, `user_meeting_config_id`, `meeting_provider_id`, `meeting_config_snapshot`, `activated_at`, `activated_by_user_id`, `force_activated`, `force_activated_by_user_id`, `actual_start_at`, `actual_end_at`, `quota_deducted`, `scheduling_mode`, `ondemand_status`, `payroll_credited`, `rate_amount`, `rate_currency`, `is_rate_overridden`, `rate_source`, `remarks`, `admin_notes`, `idempotency_key`, `created_at`, `updated_at`, `deleted_at`) SELECT `id`, `student_id`, `teacher_id`, `subject_id`, `recurring_schedule_id`, `original_class_id`, `scheduled_start_at`, `scheduled_end_at`, `booking_timezone_id`, `booking_timezone`, `booking_utc_offset`, `duration_minutes`, `class_type`, `outcome`, `execution_state`, `is_rescheduled`, `is_frozen`, `meeting_join_url`, `user_meeting_config_id`, `meeting_provider_id`, `meeting_config_snapshot`, `activated_at`, `activated_by_user_id`, `force_activated`, `force_activated_by_user_id`, `actual_start_at`, `actual_end_at`, `quota_deducted`, `scheduling_mode`, `ondemand_status`, `payroll_credited`, `rate_amount`, `rate_currency`, `is_rate_overridden`, `rate_source`, `remarks`, `admin_notes`, `idempotency_key`, `created_at`, `updated_at`, `deleted_at` FROM `class_instances`;--> statement-breakpoint
DROP TABLE `class_instances`;--> statement-breakpoint
ALTER TABLE `__new_class_instances` RENAME TO `class_instances`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_students` (
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
	`credit_hours_total` text DEFAULT '0.00' NOT NULL,
	`credit_hours_remaining` text DEFAULT '0.00' NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`hours_per_week` text DEFAULT '0' NOT NULL,
	`idempotency_key` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_students_parent_id_parents_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_students_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_students_primary_teacher_id_teachers_id_fk` FOREIGN KEY (`primary_teacher_id`) REFERENCES `teachers`(`id`) ON DELETE SET NULL,
	CONSTRAINT "students_classes_remaining_chk" CHECK("classes_remaining" >= 0),
	CONSTRAINT "students_classes_total_chk" CHECK("classes_total" >= 0),
	CONSTRAINT "students_credit_hours_remaining_chk" CHECK("credit_hours_remaining" >= 0),
	CONSTRAINT "students_credit_hours_total_chk" CHECK("credit_hours_total" >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_students`(`id`, `parent_id`, `user_id`, `primary_teacher_id`, `name`, `avatar_url`, `date_of_birth`, `gender`, `language`, `timezone_override`, `status`, `classes_total`, `classes_remaining`, `version`, `hours_per_week`, `idempotency_key`, `created_at`, `updated_at`) SELECT `id`, `parent_id`, `user_id`, `primary_teacher_id`, `name`, `avatar_url`, `date_of_birth`, `gender`, `language`, `timezone_override`, `status`, `classes_total`, `classes_remaining`, `version`, `hours_per_week`, `idempotency_key`, `created_at`, `updated_at` FROM `students`;--> statement-breakpoint
DROP TABLE `students`;--> statement-breakpoint
ALTER TABLE `__new_students` RENAME TO `students`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_whatsapp_accounts` (
	`id` text PRIMARY KEY,
	`waba_id` text NOT NULL,
	`phone_number_id` text NOT NULL UNIQUE,
	`display_name` text,
	`display_phone_number` text,
	`quality_rating` text,
	`portfolio_messaging_limit_tier` text,
	`throughput_level` text,
	`meta_status` text,
	`max_phone_numbers_per_business` text,
	`purpose` text DEFAULT 'GENERAL' NOT NULL,
	`onboarding_mode` text DEFAULT 'CLOUD_API' NOT NULL,
	`sync_status` text DEFAULT 'NOT_STARTED' NOT NULL,
	`sync_phase` integer,
	`sync_progress` integer DEFAULT 0 NOT NULL,
	`sync_deadline_at` integer,
	`sync_failure_reason` text,
	`offboarded_at` integer,
	`encrypted_access_token` text NOT NULL,
	`encrypted_two_step_pin` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`is_test_number` integer DEFAULT false NOT NULL,
	`last_webhook_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	CONSTRAINT "whatsapp_accounts_sync_progress_range_chk" CHECK("sync_progress" BETWEEN 0 AND 100)
);
--> statement-breakpoint
INSERT INTO `__new_whatsapp_accounts`(`id`, `waba_id`, `phone_number_id`, `display_name`, `display_phone_number`, `quality_rating`, `portfolio_messaging_limit_tier`, `throughput_level`, `max_phone_numbers_per_business`, `encrypted_access_token`, `encrypted_two_step_pin`, `is_active`, `last_webhook_at`, `created_at`, `updated_at`) SELECT `id`, `waba_id`, `phone_number_id`, `display_name`, `display_phone_number`, `quality_rating`, `portfolio_messaging_limit_tier`, `throughput_level`, `max_phone_numbers_per_business`, `encrypted_access_token`, `encrypted_two_step_pin`, `is_active`, `last_webhook_at`, `created_at`, `updated_at` FROM `whatsapp_accounts`;--> statement-breakpoint
DROP TABLE `whatsapp_accounts`;--> statement-breakpoint
ALTER TABLE `__new_whatsapp_accounts` RENAME TO `whatsapp_accounts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `credit_transactions_idempotency_key_unique_idx` ON `credit_transactions` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `credit_transactions_student_id_idx` ON `credit_transactions` (`student_id`);--> statement-breakpoint
CREATE INDEX `credit_transactions_reason_idx` ON `credit_transactions` (`reason`);--> statement-breakpoint
CREATE INDEX `credit_transactions_class_instance_id_idx` ON `credit_transactions` (`class_instance_id`);--> statement-breakpoint
CREATE INDEX `credit_transactions_created_at_idx` ON `credit_transactions` (`created_at`);--> statement-breakpoint
CREATE INDEX `credit_transactions_source_payment_id_idx` ON `credit_transactions` (`source_payment_id`);--> statement-breakpoint
CREATE INDEX `credit_transactions_credited_by_user_id_idx` ON `credit_transactions` (`credited_by_user_id`);--> statement-breakpoint
CREATE INDEX `credit_transactions_student_change_hours_idx` ON `credit_transactions` (`student_id`,`change_amount_hours`);--> statement-breakpoint
CREATE INDEX `credit_transactions_adjustment_type_idx` ON `credit_transactions` (`adjustment_type`);--> statement-breakpoint
CREATE INDEX `credit_transactions_carryover_teacher_id_idx` ON `credit_transactions` (`carryover_teacher_id`);--> statement-breakpoint
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
CREATE INDEX `class_instances_carryover_balance_id_idx` ON `class_instances` (`carryover_balance_id`);--> statement-breakpoint
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
CREATE INDEX `class_instances_calculation_status_idx` ON `class_instances` (`calculation_status`);--> statement-breakpoint
CREATE INDEX `class_instances_teacher_paid_amount_idx` ON `class_instances` (`teacher_paid_amount`);--> statement-breakpoint
CREATE INDEX `class_instances_payroll_calculated_at_idx` ON `class_instances` (`payroll_calculated_at`);--> statement-breakpoint
CREATE INDEX `class_instances_teacher_status_scheduled_idx` ON `class_instances` (`teacher_id`,`calculation_status`,`scheduled_start_at`);--> statement-breakpoint
CREATE INDEX `class_instances_deleted_at_idx` ON `class_instances` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `class_instances_teacher_state_start_idx` ON `class_instances` (`teacher_id`,`execution_state`,`scheduled_start_at`);--> statement-breakpoint
CREATE INDEX `class_instances_student_state_start_idx` ON `class_instances` (`student_id`,`execution_state`,`scheduled_start_at`);--> statement-breakpoint
CREATE INDEX `class_instances_state_start_idx` ON `class_instances` (`execution_state`,`scheduled_start_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `class_instances_original_class_uniq_idx` ON `class_instances` (`original_class_id`) WHERE "class_instances"."original_class_id" IS NOT NULL AND "class_instances"."deleted_at" IS NULL;--> statement-breakpoint
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
CREATE INDEX `whatsapp_accounts_waba_id_idx` ON `whatsapp_accounts` (`waba_id`);--> statement-breakpoint
CREATE INDEX `whatsapp_accounts_is_active_idx` ON `whatsapp_accounts` (`is_active`);--> statement-breakpoint
CREATE INDEX `whatsapp_accounts_active_created_at_idx` ON `whatsapp_accounts` (`is_active`,`created_at`);--> statement-breakpoint
CREATE INDEX `payments_package_plan_id_idx` ON `payments` (`package_plan_id`);--> statement-breakpoint
CREATE INDEX `payments_payment_gateway_idx` ON `payments` (`payment_gateway`);--> statement-breakpoint
CREATE INDEX `payments_is_paid_status_on_idx` ON `payments` (`is_paid_status_on`);--> statement-breakpoint
CREATE UNIQUE INDEX `package_plans_codename_active_unique_idx` ON `package_plans` (`codename`) WHERE "package_plans"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX `package_plans_active_sort_idx` ON `package_plans` (`active`,`sort_order`);--> statement-breakpoint
CREATE INDEX `package_plans_deleted_at_idx` ON `package_plans` (`deleted_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `leave_requests_pending_class_instance_unique_idx` ON `leave_requests` (`class_instance_id`) WHERE status = 'PENDING';--> statement-breakpoint
CREATE INDEX `expenses_teacher_id_idx` ON `expenses` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `expenses_type_idx` ON `expenses` (`type`);--> statement-breakpoint
CREATE INDEX `expenses_payment_date_idx` ON `expenses` (`payment_date`);--> statement-breakpoint
CREATE INDEX `expenses_expense_date_idx` ON `expenses` (`expense_date`);--> statement-breakpoint
CREATE INDEX `expenses_source_entity_idx` ON `expenses` (`source_entity`);--> statement-breakpoint
CREATE INDEX `expenses_source_entity_id_idx` ON `expenses` (`source_entity_id`);--> statement-breakpoint
CREATE INDEX `expenses_created_by_user_id_idx` ON `expenses` (`created_by_user_id`);--> statement-breakpoint
CREATE INDEX `expenses_deleted_at_idx` ON `expenses` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `expenses_type_expense_date_idx` ON `expenses` (`type`,`expense_date`);--> statement-breakpoint
CREATE INDEX `carryover_balance_items_carryover_id_idx` ON `carryover_balance_items` (`carryover_id`);--> statement-breakpoint
CREATE INDEX `carryover_balance_items_class_instance_id_idx` ON `carryover_balance_items` (`class_instance_id`);--> statement-breakpoint
CREATE INDEX `carryover_balances_teacher_id_idx` ON `carryover_balances` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `carryover_balances_is_paid_idx` ON `carryover_balances` (`is_paid`);--> statement-breakpoint
CREATE INDEX `carryover_balances_payment_date_idx` ON `carryover_balances` (`payment_date`);--> statement-breakpoint
CREATE INDEX `carryover_balances_from_to_idx` ON `carryover_balances` (`from_date`,`to_date`);--> statement-breakpoint
CREATE INDEX `carryover_balances_is_disabled_teacher_idx` ON `carryover_balances` (`is_disabled_teacher`);--> statement-breakpoint
CREATE INDEX `carryover_balances_expense_id_idx` ON `carryover_balances` (`expense_id`);--> statement-breakpoint
CREATE INDEX `carryover_balances_created_by_user_id_idx` ON `carryover_balances` (`created_by_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `carryover_balances_expense_id_unique_idx` ON `carryover_balances` (`expense_id`);--> statement-breakpoint
CREATE INDEX `whatsapp_configs_updated_by_user_id_idx` ON `whatsapp_configs` (`updated_by_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `whatsapp_contacts_account_phone_unique` ON `whatsapp_contacts` (`account_id`,`phone_number`) WHERE "whatsapp_contacts"."phone_number" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `whatsapp_contacts_account_user_id_unique` ON `whatsapp_contacts` (`account_id`,`user_id`) WHERE "whatsapp_contacts"."user_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `whatsapp_conversations_account_wa_id_unique` ON `whatsapp_conversations` (`account_id`,`wa_id`) WHERE "whatsapp_conversations"."wa_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `whatsapp_conversations_account_user_id_unique` ON `whatsapp_conversations` (`account_id`,`user_id`) WHERE "whatsapp_conversations"."user_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `whatsapp_conversations_account_last_message_at_idx` ON `whatsapp_conversations` (`account_id`,`last_message_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `whatsapp_messages_wamid_unique` ON `whatsapp_messages` (`wamid`);--> statement-breakpoint
CREATE INDEX `whatsapp_messages_conversation_sent_at_idx` ON `whatsapp_messages` (`conversation_id`,`sent_at`);--> statement-breakpoint
CREATE INDEX `whatsapp_messages_account_sent_at_idx` ON `whatsapp_messages` (`account_id`,`sent_at`);--> statement-breakpoint
CREATE INDEX `whatsapp_messages_account_phase_chunk_idx` ON `whatsapp_messages` (`account_id`,`phase`,`chunk_order`);--> statement-breakpoint
CREATE UNIQUE INDEX `whatsapp_sync_requests_account_type_unique` ON `whatsapp_sync_requests` (`account_id`,`sync_type`);--> statement-breakpoint
CREATE UNIQUE INDEX `whatsapp_test_recipients_account_phone_unique` ON `whatsapp_test_recipients` (`account_id`,`phone_number`);--> statement-breakpoint
CREATE INDEX `whatsapp_test_recipients_account_id_idx` ON `whatsapp_test_recipients` (`account_id`);--> statement-breakpoint
CREATE INDEX `whatsapp_webhook_events_status_received_at_idx` ON `whatsapp_webhook_events` (`status`,`received_at`);