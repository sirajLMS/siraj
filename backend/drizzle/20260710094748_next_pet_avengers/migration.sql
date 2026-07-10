CREATE TYPE "account_status" AS ENUM('ACTIVATED', 'DEACTIVATED');--> statement-breakpoint
CREATE TYPE "app_language" AS ENUM('ar', 'en');--> statement-breakpoint
CREATE TYPE "app_permission" AS ENUM('auth.login', 'auth.view_own_profile', 'auth.edit_own_profile', 'dashboard.view', 'dashboard.view_metrics', 'dashboard.filter_metrics', 'dashboard.metrics.view_all', 'schedule.view_list', 'schedule.filter_advanced', 'schedule.view_all', 'schedule.view_assigned', 'schedule.view_family', 'schedule.search_availability', 'schedule.manage_recurring', 'schedule.dst_migrate', 'session.view_details', 'session.activate_class', 'session.activate_override', 'session.update_status.start', 'session.update_status.absent', 'session.update_status.leave', 'session.reschedule', 'session.reset', 'session.override_actions', 'dashboard.search', 'schedule.view_timezones', 'history.view_calendar', 'history.view_details', 'teacher.view_dashboard', 'teacher.view_students', 'teacher.view_own_profile', 'teacher.edit_own_profile', 'system.enforce_time_window', 'system.enforce_leave_limit', 'teachers.list', 'teachers.create', 'teachers.edit', 'teachers.manage_schedule', 'staff.view_directory', 'schedule.view_weekly', 'schedule.view_workload', 'schedule.create_class', 'parents.list', 'parents.create', 'parents.edit', 'students.list', 'students.create', 'students.edit', 'students.change_teacher', 'students.change_status', 'students.override_quota', 'invoices.list', 'invoices.delete', 'invoices.create', 'invoices.mark_paid', 'invoices.edit', 'resources.list', 'resources.delete', 'resources.upload', 'reports.generate', 'report.generate_custom', 'report.view_financials', 'complaints.list', 'complaints.delete', 'complaints.respond', 'support.submit_complaint', 'support.view_history', 'communication.submit_suggestion', 'system.dispatch_email', 'staff.list', 'staff.create', 'staff.edit', 'permission_groups.manage', 'permission_groups.assign', 'notification.view_alerts', 'billing.view_unpaid_invoices', 'user.view_profile', 'user.edit_profile', 'schedule.delete_class', 'schedule.clear_weekly', 'staff.edit_profile', 'system.bulk_update_dst', 'parent.view_directory', 'parent.view_profile', 'parent.view_students', 'parent.view_own_profile', 'parent.edit_own_profile', 'parent.manage_status', 'student.view_associated', 'student.edit_quota', 'billing.view_history', 'document.manage_parent_docs', 'billing.create_invoice', 'billing.update_status_paid', 'billing.delete_invoice', 'student.reassign_teacher', 'student.manage_status', 'system.sync_notifications', 'system.enforce_suspended_lock', 'system.process_student_leave', 'system.restrict_resource_access', 'suggestions.list', 'suggestions.review', 'suggestions.delete', 'subjects.list', 'subjects.create', 'subjects.update', 'subjects.delete', 'subjects.view_resources', 'subjects.manage_resources', 'categories.list', 'categories.create', 'categories.update', 'categories.delete', 'notes.list', 'notes.create', 'notes.update', 'notes.delete', 'test.system_only', 'test.custom_only', 'test.custom_alt', 'storage.manage', 'billing.view_exchange_rates', 'billing.refresh_exchange_rates');--> statement-breakpoint
CREATE TYPE "availability_status" AS ENUM('AVAILABLE', 'OUT_OF_STOCK');--> statement-breakpoint
CREATE TYPE "class_execution_state" AS ENUM('NOT_ACTIVATED', 'ACTIVATED', 'RUNNING', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "class_outcome" AS ENUM('PENDING', 'TAKEN', 'ABSENT', 'LEAVE');--> statement-breakpoint
CREATE TYPE "class_type" AS ENUM('REGULAR', 'TRIAL', 'ADVANCE');--> statement-breakpoint
CREATE TYPE "complaint_category" AS ENUM('REGARDING_TEACHER', 'REGARDING_SYSTEM', 'OTHER');--> statement-breakpoint
CREATE TYPE "complaint_status" AS ENUM('UNANSWERED', 'ANSWERED');--> statement-breakpoint
CREATE TYPE "country_code" AS ENUM('SA', 'PS', 'YE', 'SY', 'EG', 'KW', 'QA', 'OM', 'BH', 'LB', 'JO', 'IQ', 'LY', 'AE', 'TN', 'DZ', 'MA', 'SD', 'ID', 'MR', 'SO', 'KM', 'DJ', 'ER', 'SS', 'EH', 'AD', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DK', 'DM', 'DO', 'EC', 'EE', 'ES', 'ET', 'FI', 'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM', 'HN', 'HR', 'HT', 'HU', 'IE', 'IM', 'IN', 'IO', 'IR', 'IS', 'IT', 'JE', 'JM', 'JP', 'KE', 'KG', 'KH', 'KI', 'KN', 'KP', 'KR', 'KY', 'KZ', 'LA', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PT', 'PW', 'PY', 'RE', 'RO', 'RS', 'RU', 'RW', 'SB', 'SC', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SR', 'ST', 'SV', 'SX', 'SZ', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TO', 'TR', 'TV', 'TW', 'TZ', 'UA', 'UG', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI', 'VN', 'VU', 'WF', 'WS', 'XK', 'YT', 'ZA', 'ZM', 'ZW');--> statement-breakpoint
CREATE TYPE "currency_code" AS ENUM('EGP', 'SAR', 'AED', 'KWD', 'QAR', 'BHD', 'OMR', 'JOD', 'IQD', 'YER', 'SYP', 'LBP', 'ILS', 'SDG', 'LYD', 'TND', 'DZD', 'MAD', 'MRU', 'SOS', 'DJF', 'KMF', 'TRY', 'USD', 'EUR', 'GBP', 'CHF', 'CNY', 'JPY', 'INR', 'CAD', 'AUD');--> statement-breakpoint
CREATE TYPE "day_of_week" AS ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');--> statement-breakpoint
CREATE TYPE "device_platform" AS ENUM('IOS', 'ANDROID', 'WEB');--> statement-breakpoint
CREATE TYPE "dst_migration_result" AS ENUM('UPDATED', 'CONFLICT', 'UNCHANGED');--> statement-breakpoint
CREATE TYPE "fx_provider" AS ENUM('openexchangerates', 'fixer');--> statement-breakpoint
CREATE TYPE "fx_sync_status" AS ENUM('running', 'success', 'partial', 'failed');--> statement-breakpoint
CREATE TYPE "gender" AS ENUM('MALE', 'FEMALE');--> statement-breakpoint
CREATE TYPE "invoice_status" AS ENUM('UNPAID', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "invoice_type" AS ENUM('PER_CLASSES', 'MONTHLY', 'MANUAL');--> statement-breakpoint
CREATE TYPE "leave_request_status" AS ENUM('PENDING', 'APPROVED', 'RESCHEDULED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "leave_requester_type" AS ENUM('TEACHER', 'PARENT', 'ADMIN');--> statement-breakpoint
CREATE TYPE "notification_channel" AS ENUM('EMAIL', 'SMS', 'PUSH', 'ON_APP');--> statement-breakpoint
CREATE TYPE "notification_delivery_status" AS ENUM('PENDING', 'SENT', 'DELIVERED', 'OPENED', 'FAILED');--> statement-breakpoint
CREATE TYPE "notification_event_type" AS ENUM('CLASS_REMINDER', 'INVOICE_GENERATED', 'COMPLAINT_RESPONSE', 'BANKING_DETAILS_CHANGED', 'NEW_COMPLAINT', 'NEW_SUGGESTION', 'SUGGESTION_ACKNOWLEDGED', 'SUGGESTION_DUPLICATE_MARKED');--> statement-breakpoint
CREATE TYPE "parent_status" AS ENUM('ACTIVATED', 'DEACTIVATED', 'REGULAR', 'ON_LEAVE', 'SUSPENDED', 'ON_TRIAL');--> statement-breakpoint
CREATE TYPE "payment_method" AS ENUM('PAYPAL', 'BANK_ACCOUNT');--> statement-breakpoint
CREATE TYPE "student_status" AS ENUM('REGULAR', 'ON_LEAVE', 'SUSPENDED', 'ON_TRIAL', 'DEACTIVATED');--> statement-breakpoint
CREATE TYPE "suggestion_status" AS ENUM('PENDING', 'REVIEWED', 'DUPLICATE');--> statement-breakpoint
CREATE TYPE "vacation_request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "admin_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"actor_user_id" uuid NOT NULL,
	"target_user_id" uuid,
	"action" varchar(100) NOT NULL,
	"description" text,
	"previous_state" jsonb,
	"new_state" jsonb,
	"ip_address" inet,
	"created_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"actor_user_id" uuid,
	"actor_type" varchar(50) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" varchar(255) NOT NULL,
	"action" varchar(100) NOT NULL,
	"description" text,
	"previous_state" jsonb,
	"new_state" jsonb,
	"changes" jsonb,
	"ip_address" inet,
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "impersonation_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"actor_user_id" uuid NOT NULL,
	"target_user_id" uuid NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"reason" text,
	"started_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp(3) with time zone,
	"ip_address" inet,
	"user_agent" text,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "currency_exchange_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"from_currency" "currency_code" NOT NULL,
	"to_currency" "currency_code" NOT NULL,
	"old_rate" numeric(12,6),
	"new_rate" numeric(12,6) NOT NULL,
	"source" varchar(50) NOT NULL,
	"changed_by_user_id" uuid,
	"created_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "currency_exchange_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"from_currency" "currency_code" NOT NULL,
	"to_currency" "currency_code" NOT NULL,
	"rate" numeric(12,6) NOT NULL,
	"source" varchar(50),
	"provider_response" jsonb,
	"effective_date" timestamp(3) with time zone NOT NULL,
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "currency_hedges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"currency" "currency_code" NOT NULL,
	"amount" numeric(12,2) NOT NULL,
	"hedge_type" varchar(20) NOT NULL,
	"notes" text,
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_coverage_months" (
	"invoice_id" uuid,
	"year" smallint,
	"month" smallint,
	CONSTRAINT "invoice_coverage_months_pkey" PRIMARY KEY("invoice_id","year","month")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"parent_id" uuid NOT NULL,
	"student_id" uuid,
	"issue_date" date NOT NULL,
	"due_date" date NOT NULL,
	"paid_date" date,
	"amount" numeric(12,2) NOT NULL,
	"currency" "currency_code" NOT NULL,
	"status" "invoice_status" NOT NULL,
	"invoice_type" "invoice_type" NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"exchange_rate_snapshot" numeric(12,6),
	"exchange_rate_source" varchar(50),
	"created_by_user_id" uuid,
	"email_sent_at" timestamp(3) with time zone,
	"idempotency_key" varchar(255) NOT NULL,
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	"deleted_at" timestamp(3) with time zone
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"invoice_id" uuid NOT NULL,
	"amount" numeric(12,2) NOT NULL,
	"currency" "currency_code" NOT NULL,
	"payment_date" timestamp(3) with time zone NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"transaction_id" varchar(255),
	"gateway_response" text,
	"refunded_amount" numeric(12,2) DEFAULT '0.00' NOT NULL,
	"exchange_rate_snapshot" numeric(12,6),
	"exchange_rate_source" varchar(50),
	"idempotency_key" varchar(255) NOT NULL,
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fx_sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"provider" "fx_provider" NOT NULL,
	"status" "fx_sync_status" NOT NULL,
	"pairs_written" varchar(10) DEFAULT '0' NOT NULL,
	"pairs_failed" varchar(10) DEFAULT '0' NOT NULL,
	"error_message" varchar(500),
	"provider_response" jsonb,
	"trigger_type" varchar(20) NOT NULL,
	"triggered_by_user_id" uuid,
	"started_at" timestamp(3) with time zone NOT NULL,
	"finished_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"availability_status" "availability_status" NOT NULL,
	"created_at" timestamp(3) with time zone NOT NULL,
	"deleted_at" timestamp(3) with time zone
);
--> statement-breakpoint
CREATE TABLE "class_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(200) NOT NULL,
	"slug" varchar(100) NOT NULL UNIQUE,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp(3) with time zone
);
--> statement-breakpoint
CREATE TABLE "class_subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"category_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(100) NOT NULL UNIQUE,
	"description" text,
	"avatar_url" varchar(1024),
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp(3) with time zone
);
--> statement-breakpoint
CREATE TABLE "class_communications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"group_class_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_delivered" boolean,
	"notification_delivery_id" uuid,
	"class_status_event_id" uuid,
	"timestamp" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_class_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"group_class_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"student_id_number" varchar(50),
	"attendance_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"class_instance_id" uuid NOT NULL,
	"course_name" varchar(255) NOT NULL,
	"teacher_name" varchar(255) NOT NULL,
	"class_type" varchar(50) NOT NULL,
	"original_date" timestamp(3) with time zone,
	"rescheduled_date" timestamp(3) with time zone,
	"time_slot" varchar(100) NOT NULL,
	"status" varchar(50) NOT NULL,
	"audit_remark" text,
	"audit_logged_at" timestamp(3) with time zone NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_instance_performance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"class_instance_id" uuid NOT NULL UNIQUE,
	"engagement_score" integer,
	"assessment_progress" integer,
	"assessment_total" integer,
	"focus_level" varchar(50),
	"session_health" varchar(50),
	"heatmap_data" jsonb,
	"latency_ms" integer,
	"authorization_label" varchar(100),
	"attendance_rate" integer,
	"avg_grade" varchar(10),
	"last_class_days_ago" integer,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"student_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"subject_id" uuid,
	"recurring_schedule_id" uuid,
	"original_class_id" uuid,
	"scheduled_start_at" timestamp(3) with time zone NOT NULL,
	"scheduled_end_at" timestamp(3) with time zone NOT NULL,
	"booking_timezone_id" integer,
	"booking_timezone" varchar(100),
	"booking_utc_offset" integer,
	"duration_minutes" integer NOT NULL,
	"class_type" "class_type" NOT NULL,
	"outcome" "class_outcome" DEFAULT 'PENDING'::"class_outcome" NOT NULL,
	"execution_state" "class_execution_state" DEFAULT 'NOT_ACTIVATED'::"class_execution_state" NOT NULL,
	"is_rescheduled" boolean DEFAULT false NOT NULL,
	"is_frozen" boolean DEFAULT false NOT NULL,
	"zoom_meeting_url" varchar(1024),
	"activated_at" timestamp(3) with time zone,
	"activated_by_user_id" uuid,
	"force_activated" boolean DEFAULT false NOT NULL,
	"force_activated_by_user_id" uuid,
	"actual_start_at" timestamp(3) with time zone,
	"actual_end_at" timestamp(3) with time zone,
	"quota_deducted" boolean DEFAULT false NOT NULL,
	"payroll_credited" boolean DEFAULT false NOT NULL,
	"rate_amount" numeric(12,2),
	"rate_currency" "currency_code",
	"is_rate_overridden" boolean DEFAULT false NOT NULL,
	"remarks" text,
	"admin_notes" text,
	"idempotency_key" varchar(255) NOT NULL,
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	"deleted_at" timestamp(3) with time zone,
	CONSTRAINT "class_instances_state_machine_chk" CHECK (
        ("execution_state" != 'COMPLETED' OR "outcome" != 'PENDING') AND
        ("execution_state" != 'NOT_ACTIVATED' OR "actual_start_at" IS NULL) AND
        ("force_activated" = false OR "force_activated_by_user_id" IS NOT NULL) AND
        ("outcome" != 'TAKEN' OR "actual_start_at" IS NOT NULL) AND
        ("is_rate_overridden" = false OR "rate_amount" IS NOT NULL)
      ),
	CONSTRAINT "class_instances_reschedule_not_self_chk" CHECK ("original_class_id" IS NULL OR "original_class_id" != "id"),
	CONSTRAINT "class_instances_rescheduled_no_quota_chk" CHECK ("is_rescheduled" = false OR "quota_deducted" = false),
	CONSTRAINT "class_instances_rescheduled_no_complete_chk" CHECK ("is_rescheduled" = false OR ("execution_state" != 'COMPLETED' OR "outcome" != 'TAKEN'))
);
--> statement-breakpoint
CREATE TABLE "class_status_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"class_instance_id" uuid NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"from_state" jsonb,
	"to_state" jsonb,
	"description" text,
	"actor_user_id" uuid,
	"created_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dst_migration_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"run_id" uuid NOT NULL,
	"recurring_schedule_id" uuid NOT NULL,
	"result" "dst_migration_result" NOT NULL,
	"conflict_detail" text
);
--> statement-breakpoint
CREATE TABLE "dst_migration_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"run_by_user_id" uuid NOT NULL,
	"offset_minutes" integer NOT NULL,
	"description" varchar(255),
	"created_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_quota_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"teacher_id" uuid,
	"student_id" uuid,
	"period_year" smallint NOT NULL,
	"period_month" smallint NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "leave_quota_usage_teacher_student_xor_chk" CHECK (("teacher_id" IS NOT NULL AND "student_id" IS NULL) OR ("teacher_id" IS NULL AND "student_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"class_instance_id" uuid NOT NULL,
	"requested_by_user_id" uuid NOT NULL,
	"requester_type" "leave_requester_type" NOT NULL,
	"reason" text,
	"status" "leave_request_status" NOT NULL,
	"created_at" timestamp(3) with time zone NOT NULL,
	"processed_at" timestamp(3) with time zone,
	"processed_by_user_id" uuid
);
--> statement-breakpoint
CREATE TABLE "recurring_schedule_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"recurring_schedule_id" uuid NOT NULL,
	"day_of_week" "day_of_week" NOT NULL,
	"start_time" time NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"student_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"subject_id" uuid,
	"avatar_url" varchar(1024),
	"duration_minutes" integer NOT NULL,
	"default_start_time" time NOT NULL,
	"timezone_id" integer,
	"timezone" varchar(100) NOT NULL,
	"utc_offset_snapshot" integer,
	"effective_from" date,
	"effective_until" date,
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	"deleted_at" timestamp(3) with time zone,
	CONSTRAINT "recurring_schedules_timezone_chk" CHECK (is_valid_timezone("timezone"))
);
--> statement-breakpoint
CREATE TABLE "subject_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"subject_id" uuid NOT NULL,
	"learning_resource_id" uuid NOT NULL,
	"resource_type" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "complaint_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"complaint_id" uuid NOT NULL,
	"responder_user_id" uuid,
	"body" text NOT NULL,
	"email_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "complaints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"parent_id" uuid NOT NULL,
	"student_id" uuid,
	"category" "complaint_category" NOT NULL,
	"submitter_email" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"status" "complaint_status" NOT NULL,
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	"deleted_at" timestamp(3) with time zone
);
--> statement-breakpoint
CREATE TABLE "learning_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"display_name" varchar(255) NOT NULL,
	"file_path" varchar(1024) NOT NULL,
	"uploaded_by_user_id" uuid NOT NULL,
	"created_at" timestamp(3) with time zone NOT NULL,
	"deleted_at" timestamp(3) with time zone
);
--> statement-breakpoint
CREATE TABLE "notification_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"device_token_id" uuid,
	"channel" "notification_channel" NOT NULL,
	"event_type" "notification_event_type" NOT NULL,
	"status" "notification_delivery_status" DEFAULT 'PENDING'::"notification_delivery_status" NOT NULL,
	"title" varchar(255),
	"body" text,
	"provider_message_id" varchar(255),
	"failure_reason" text,
	"webhook_payload" jsonb,
	"sent_at" timestamp(3) with time zone,
	"delivered_at" timestamp(3) with time zone,
	"opened_at" timestamp(3) with time zone,
	"failed_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"parent_id" uuid NOT NULL,
	"submitter_name" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"status" "suggestion_status" DEFAULT 'PENDING'::"suggestion_status" NOT NULL,
	"duplicate_of_id" uuid,
	"admin_response" text,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp(3) with time zone,
	"email_sent_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone NOT NULL,
	"deleted_at" timestamp(3) with time zone
);
--> statement-breakpoint
CREATE TABLE "user_device_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"token" varchar(512) NOT NULL,
	"platform" "device_platform" NOT NULL,
	"device_name" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"event_type" "notification_event_type" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL UNIQUE,
	"status" "parent_status" NOT NULL,
	"phone" varchar(50),
	"nationality" "country_code",
	"address" text,
	"facebook" varchar(512),
	"whatsapp" varchar(50),
	"twitter" varchar(255),
	"default_zoom_link" varchar(1024),
	"invoice_type" "invoice_type",
	"fee_amount" numeric(12,2),
	"payment_method" "payment_method",
	"currency" "currency_code",
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_permissions" (
	"group_id" uuid,
	"permission_id" uuid,
	CONSTRAINT "group_permissions_pkey" PRIMARY KEY("group_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "permission_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" jsonb NOT NULL,
	"description" jsonb,
	"is_system" boolean DEFAULT false NOT NULL,
	"slug" varchar(100) NOT NULL UNIQUE,
	"created_by_user_id" uuid,
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"key" "app_permission" NOT NULL UNIQUE,
	"resource" varchar(100) NOT NULL,
	"action" varchar(100) NOT NULL,
	"description" jsonb NOT NULL,
	"category" jsonb NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_permission_groups" (
	"user_id" uuid,
	"group_id" uuid,
	"assigned_at" timestamp(3) with time zone NOT NULL,
	"assigned_by_user_id" uuid,
	CONSTRAINT "user_permission_groups_pkey" PRIMARY KEY("user_id","group_id")
);
--> statement-breakpoint
CREATE TABLE "user_permission_overrides" (
	"user_id" uuid,
	"permission_id" uuid,
	"state" varchar(20) NOT NULL,
	"assigned_by_user_id" uuid,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_permission_overrides_pkey" PRIMARY KEY("user_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "rate_limit_cache" (
	"key" text PRIMARY KEY,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_cache" (
	"key" text PRIMARY KEY,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" varchar(100) PRIMARY KEY,
	"value" text NOT NULL,
	"data_type" varchar(20) DEFAULT 'string' NOT NULL,
	"description" text NOT NULL,
	"category" varchar(100) NOT NULL,
	"updated_by_user_id" uuid,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timezones" (
	"id" serial PRIMARY KEY,
	"iana_id" varchar(100) NOT NULL UNIQUE,
	"base_offset_minutes" integer NOT NULL,
	"is_dst_supported" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slug" varchar(100) NOT NULL UNIQUE,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"content_type" varchar(50) DEFAULT 'page' NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"updated_by_user_id" uuid,
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_instance_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"file_id" uuid NOT NULL,
	"class_instance_id" uuid NOT NULL,
	"usage_type" varchar(100) NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "complaint_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"file_id" uuid NOT NULL,
	"complaint_id" uuid NOT NULL,
	"usage_type" varchar(100) NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"file_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"usage_type" varchar(100) NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_resource_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"file_id" uuid NOT NULL,
	"learning_resource_id" uuid NOT NULL,
	"usage_type" varchar(100) NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parent_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"file_id" uuid NOT NULL,
	"parent_id" uuid NOT NULL,
	"usage_type" varchar(100) NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_schedule_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"file_id" uuid NOT NULL,
	"recurring_schedule_id" uuid NOT NULL,
	"usage_type" varchar(100) NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signed_url" (
	"id" varchar(64) PRIMARY KEY,
	"file_path" varchar(1024) NOT NULL,
	"content_type" varchar(255) NOT NULL,
	"file_size" bigint NOT NULL,
	"content_hash" varchar(128) NOT NULL,
	"expires_at" timestamp(3) with time zone NOT NULL,
	"created_at" timestamp(3) with time zone NOT NULL,
	"used" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_profile_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"file_id" uuid NOT NULL,
	"staff_profile_id" uuid NOT NULL,
	"usage_type" varchar(100) NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storage_directory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"path" varchar(1024) NOT NULL UNIQUE,
	"allow_uploads" boolean DEFAULT true NOT NULL,
	"allow_delete" boolean DEFAULT true NOT NULL,
	"allow_move" boolean DEFAULT true NOT NULL,
	"allow_create_sub_dirs" boolean DEFAULT true NOT NULL,
	"allow_delete_files" boolean DEFAULT true NOT NULL,
	"allow_move_files" boolean DEFAULT true NOT NULL,
	"is_protected" boolean DEFAULT false NOT NULL,
	"protect_children" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storage_file" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"path" text NOT NULL UNIQUE,
	"is_protected" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"file_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"usage_type" varchar(100) NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"file_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"usage_type" varchar(100) NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"file_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"usage_type" varchar(100) NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"student_id" uuid NOT NULL,
	"class_instance_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"topics_covered" text NOT NULL,
	"homework_assigned" text,
	"notes" text,
	"parent_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"student_id" uuid NOT NULL,
	"old_status" "student_status",
	"new_status" "student_status" NOT NULL,
	"changed_by_user_id" uuid,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"parent_id" uuid NOT NULL,
	"primary_teacher_id" uuid,
	"name" varchar(255) NOT NULL,
	"avatar_url" varchar(1024),
	"date_of_birth" timestamp(3) with time zone,
	"gender" "gender",
	"language" "app_language",
	"timezone_override" varchar(100),
	"status" "student_status" NOT NULL,
	"classes_total" integer DEFAULT 0 NOT NULL,
	"classes_remaining" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"hours_per_week" numeric(5,2) DEFAULT '0' NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	CONSTRAINT "students_classes_remaining_chk" CHECK ("classes_remaining" >= 0),
	CONSTRAINT "students_classes_total_chk" CHECK ("classes_total" >= 0),
	CONSTRAINT "students_timezone_override_chk" CHECK ("timezone_override" IS NULL OR is_valid_timezone("timezone_override"))
);
--> statement-breakpoint
CREATE TABLE "teacher_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"student_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"assigned_at" timestamp(3) with time zone NOT NULL,
	"assigned_by_user_id" uuid,
	"ended_at" timestamp(3) with time zone
);
--> statement-breakpoint
CREATE TABLE "staff_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL UNIQUE,
	"phone" varchar(50),
	"status" "account_status" NOT NULL,
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_availability_windows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"teacher_id" uuid NOT NULL,
	"day_of_week" "day_of_week" NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"timezone_id" integer,
	"timezone" varchar(100) NOT NULL,
	"utc_offset_snapshot" integer,
	"effective_from" date,
	"effective_until" date,
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_recurring_unavailability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"teacher_id" uuid NOT NULL,
	"day_of_week" "day_of_week" NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"timezone_id" integer,
	"timezone" varchar(100) NOT NULL,
	"utc_offset_snapshot" integer,
	"effective_from" date,
	"effective_until" date,
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "teacher_vacation_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"teacher_id" uuid NOT NULL,
	"requested_by_user_id" uuid NOT NULL,
	"start_at" timestamp(3) with time zone NOT NULL,
	"end_at" timestamp(3) with time zone NOT NULL,
	"timezone_id" integer,
	"timezone" varchar(100) NOT NULL,
	"utc_offset_snapshot" integer,
	"reason" text,
	"status" "vacation_request_status" DEFAULT 'PENDING'::"vacation_request_status" NOT NULL,
	"processed_at" timestamp(3) with time zone,
	"processed_by_user_id" uuid,
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_banking_details_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"teacher_id" uuid NOT NULL,
	"beneficiary_name" text,
	"bank_name" text,
	"account_number" text,
	"routing_number" text,
	"swift_bic" text,
	"iban" text,
	"valid_from" timestamp(3) with time zone DEFAULT clock_timestamp() NOT NULL,
	"valid_until" timestamp(3) with time zone,
	"verified_at" timestamp(3) with time zone,
	"verified_by_user_id" uuid,
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"teacher_id" uuid NOT NULL,
	"banking_details_history_id" uuid NOT NULL,
	"amount" numeric(12,2) NOT NULL,
	"currency" "currency_code" NOT NULL,
	"payment_date" timestamp(3) with time zone NOT NULL,
	"is_test_payment" boolean DEFAULT false NOT NULL,
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_important_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"teacher_id" uuid,
	"title" varchar(300) NOT NULL,
	"body" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp(3) with time zone,
	"expires_at" timestamp(3) with time zone,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp(3) with time zone
);
--> statement-breakpoint
CREATE TABLE "teachers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL UNIQUE,
	"status" "account_status" NOT NULL,
	"nationality" "country_code",
	"national_id" text,
	"phone" varchar(50),
	"date_of_birth" date,
	"gender" "gender",
	"address" text,
	"qualifications" text,
	"zoom_link" varchar(1024),
	"zoom_username" varchar(255),
	"zoom_password" text,
	"country_code" "country_code",
	"hourly_rate" numeric(12,2),
	"rate_currency" "currency_code",
	"payment_method" "payment_method",
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"ip_address" inet,
	"email" varchar(255),
	"attempts" integer DEFAULT 1 NOT NULL,
	"locked_until" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" varchar(255) NOT NULL,
	"hashed_token" varchar(255) NOT NULL,
	"created_at" timestamp(3) with time zone NOT NULL,
	"expires_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"role_name" varchar(100) NOT NULL UNIQUE,
	"ttl_seconds" integer DEFAULT 604800 NOT NULL,
	"max_concurrent_sessions" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"session_id" varchar(255) NOT NULL UNIQUE,
	"user_id" uuid NOT NULL,
	"device_type" varchar(50),
	"device_name" varchar(255),
	"ip_address" inet,
	"user_agent" text,
	"created_at" timestamp(3) with time zone NOT NULL,
	"last_activity_at" timestamp(3) with time zone NOT NULL,
	"expires_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"hashed_id" varchar(255) PRIMARY KEY,
	"user_id" uuid,
	"ip_address" inet,
	"user_agent" text,
	"payload" text NOT NULL,
	"last_activity" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL UNIQUE,
	"email_verified_at" timestamp(3) with time zone,
	"password" varchar(255) NOT NULL,
	"remember_token_hash" varchar(255),
	"avatar_file_path" varchar(1024),
	"avatar_url" varchar(1024),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_super_admin" boolean DEFAULT false NOT NULL,
	"timezone" varchar(100) DEFAULT 'UTC' NOT NULL,
	"display_currency" "currency_code",
	"last_login_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	"deleted_at" timestamp(3) with time zone,
	CONSTRAINT "users_timezone_chk" CHECK (is_valid_timezone("timezone"))
);
--> statement-breakpoint
CREATE INDEX "admin_audit_logs_actor_idx" ON "admin_audit_logs" ("actor_user_id");--> statement-breakpoint
CREATE INDEX "admin_audit_logs_target_idx" ON "admin_audit_logs" ("target_user_id");--> statement-breakpoint
CREATE INDEX "admin_audit_logs_action_idx" ON "admin_audit_logs" ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs" ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_type_idx" ON "audit_logs" ("entity_type");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_id_idx" ON "audit_logs" ("entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_type_id_idx" ON "audit_logs" ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_type_idx" ON "audit_logs" ("actor_type");--> statement-breakpoint
CREATE INDEX "impersonation_sessions_actor_idx" ON "impersonation_sessions" ("actor_user_id");--> statement-breakpoint
CREATE INDEX "impersonation_sessions_target_idx" ON "impersonation_sessions" ("target_user_id");--> statement-breakpoint
CREATE INDEX "impersonation_sessions_session_idx" ON "impersonation_sessions" ("session_id");--> statement-breakpoint
CREATE INDEX "impersonation_sessions_active_actor_idx" ON "impersonation_sessions" ("actor_user_id","is_active");--> statement-breakpoint
CREATE INDEX "currency_exchange_audit_from_to_idx" ON "currency_exchange_audit_logs" ("from_currency","to_currency");--> statement-breakpoint
CREATE INDEX "currency_exchange_rates_from_to_idx" ON "currency_exchange_rates" ("from_currency","to_currency");--> statement-breakpoint
CREATE UNIQUE INDEX "currency_exchange_rates_effective_unique_idx" ON "currency_exchange_rates" ("from_currency","to_currency","effective_date");--> statement-breakpoint
CREATE INDEX "currency_hedges_currency_idx" ON "currency_hedges" ("currency");--> statement-breakpoint
CREATE INDEX "invoices_parent_id_idx" ON "invoices" ("parent_id");--> statement-breakpoint
CREATE INDEX "invoices_student_id_idx" ON "invoices" ("student_id");--> statement-breakpoint
CREATE INDEX "invoices_status_due_date_idx" ON "invoices" ("status","due_date");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_idempotency_key_unique_idx" ON "invoices" ("idempotency_key");--> statement-breakpoint
CREATE INDEX "payments_invoice_id_idx" ON "payments" ("invoice_id");--> statement-breakpoint
CREATE INDEX "payments_transaction_id_idx" ON "payments" ("transaction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_idempotency_key_unique_idx" ON "payments" ("idempotency_key");--> statement-breakpoint
CREATE INDEX "fx_sync_runs_status_idx" ON "fx_sync_runs" ("status");--> statement-breakpoint
CREATE INDEX "fx_sync_runs_provider_started_idx" ON "fx_sync_runs" ("provider","started_at");--> statement-breakpoint
CREATE INDEX "fx_sync_runs_triggered_by_idx" ON "fx_sync_runs" ("triggered_by_user_id");--> statement-breakpoint
CREATE INDEX "books_deleted_at_idx" ON "books" ("deleted_at");--> statement-breakpoint
CREATE INDEX "class_categories_slug_idx" ON "class_categories" ("slug");--> statement-breakpoint
CREATE INDEX "class_subjects_category_id_idx" ON "class_subjects" ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "class_subjects_slug_idx" ON "class_subjects" ("slug");--> statement-breakpoint
CREATE INDEX "class_communications_group_class_id_idx" ON "class_communications" ("group_class_id");--> statement-breakpoint
CREATE INDEX "class_communications_type_idx" ON "class_communications" ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "group_class_enrollments_unique_idx" ON "group_class_enrollments" ("group_class_id","student_id");--> statement-breakpoint
CREATE INDEX "group_class_enrollments_group_class_id_idx" ON "group_class_enrollments" ("group_class_id");--> statement-breakpoint
CREATE INDEX "group_class_enrollments_student_id_idx" ON "group_class_enrollments" ("student_id");--> statement-breakpoint
CREATE INDEX "group_classes_class_instance_id_idx" ON "group_classes" ("class_instance_id");--> statement-breakpoint
CREATE INDEX "group_classes_status_idx" ON "group_classes" ("status");--> statement-breakpoint
CREATE INDEX "class_instances_scheduled_start_at_idx" ON "class_instances" ("scheduled_start_at");--> statement-breakpoint
CREATE INDEX "class_instances_teacher_scheduled_idx" ON "class_instances" ("teacher_id","scheduled_start_at");--> statement-breakpoint
CREATE INDEX "class_instances_student_scheduled_idx" ON "class_instances" ("student_id","scheduled_start_at");--> statement-breakpoint
CREATE INDEX "class_instances_original_class_id_idx" ON "class_instances" ("original_class_id");--> statement-breakpoint
CREATE INDEX "class_instances_subject_id_idx" ON "class_instances" ("subject_id");--> statement-breakpoint
CREATE INDEX "class_instances_class_type_idx" ON "class_instances" ("class_type");--> statement-breakpoint
CREATE INDEX "class_instances_outcome_idx" ON "class_instances" ("outcome");--> statement-breakpoint
CREATE UNIQUE INDEX "class_instances_idempotency_key_unique_idx" ON "class_instances" ("idempotency_key");--> statement-breakpoint
CREATE INDEX "class_instances_execution_state_idx" ON "class_instances" ("execution_state");--> statement-breakpoint
CREATE INDEX "class_instances_frozen_idx" ON "class_instances" ("is_frozen") WHERE "is_frozen" = true;--> statement-breakpoint
CREATE INDEX "class_instances_rescheduled_idx" ON "class_instances" ("is_rescheduled") WHERE "is_rescheduled" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "class_instances_original_class_uniq_idx" ON "class_instances" ("original_class_id") WHERE "original_class_id" IS NOT NULL AND "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "class_status_events_class_instance_id_idx" ON "class_status_events" ("class_instance_id");--> statement-breakpoint
CREATE INDEX "class_status_events_instance_created_idx" ON "class_status_events" ("class_instance_id","created_at");--> statement-breakpoint
CREATE INDEX "dst_migration_entries_run_id_idx" ON "dst_migration_entries" ("run_id");--> statement-breakpoint
CREATE UNIQUE INDEX "leave_quota_teacher_period_idx" ON "leave_quota_usage" ("teacher_id","period_year","period_month") WHERE "teacher_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "leave_quota_student_period_idx" ON "leave_quota_usage" ("student_id","period_year","period_month") WHERE "student_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "leave_requests_class_instance_id_idx" ON "leave_requests" ("class_instance_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recurring_schedule_days_schedule_day_idx" ON "recurring_schedule_days" ("recurring_schedule_id","day_of_week");--> statement-breakpoint
CREATE INDEX "recurring_schedules_student_id_idx" ON "recurring_schedules" ("student_id");--> statement-breakpoint
CREATE INDEX "recurring_schedules_teacher_id_idx" ON "recurring_schedules" ("teacher_id");--> statement-breakpoint
CREATE INDEX "recurring_schedules_timezone_id_idx" ON "recurring_schedules" ("timezone_id");--> statement-breakpoint
CREATE INDEX "recurring_schedules_subject_id_idx" ON "recurring_schedules" ("subject_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subject_resources_subject_id_learning_resource_id_idx" ON "subject_resources" ("subject_id","learning_resource_id");--> statement-breakpoint
CREATE INDEX "complaint_responses_complaint_id_idx" ON "complaint_responses" ("complaint_id");--> statement-breakpoint
CREATE INDEX "complaints_status_idx" ON "complaints" ("status");--> statement-breakpoint
CREATE INDEX "complaints_parent_id_idx" ON "complaints" ("parent_id");--> statement-breakpoint
CREATE INDEX "learning_resources_deleted_at_idx" ON "learning_resources" ("deleted_at");--> statement-breakpoint
CREATE INDEX "notification_deliveries_user_id_idx" ON "notification_deliveries" ("user_id");--> statement-breakpoint
CREATE INDEX "notification_deliveries_status_idx" ON "notification_deliveries" ("status");--> statement-breakpoint
CREATE INDEX "notification_deliveries_event_type_idx" ON "notification_deliveries" ("event_type");--> statement-breakpoint
CREATE INDEX "notification_deliveries_channel_idx" ON "notification_deliveries" ("channel");--> statement-breakpoint
CREATE INDEX "notification_deliveries_created_at_idx" ON "notification_deliveries" ("created_at");--> statement-breakpoint
CREATE INDEX "notification_deliveries_provider_message_id_idx" ON "notification_deliveries" ("provider_message_id");--> statement-breakpoint
CREATE INDEX "suggestions_parent_id_idx" ON "suggestions" ("parent_id");--> statement-breakpoint
CREATE INDEX "suggestions_status_idx" ON "suggestions" ("status");--> statement-breakpoint
CREATE INDEX "suggestions_duplicate_of_id_idx" ON "suggestions" ("duplicate_of_id");--> statement-breakpoint
CREATE INDEX "suggestions_reviewed_by_user_id_idx" ON "suggestions" ("reviewed_by_user_id");--> statement-breakpoint
CREATE INDEX "suggestions_deleted_at_idx" ON "suggestions" ("deleted_at");--> statement-breakpoint
CREATE INDEX "suggestions_active_created_at_idx" ON "suggestions" ("created_at") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "user_device_tokens_user_id_idx" ON "user_device_tokens" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_device_tokens_token_unique_idx" ON "user_device_tokens" ("token");--> statement-breakpoint
CREATE INDEX "user_notification_preferences_user_id_idx" ON "user_notification_preferences" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_notification_preferences_unique_idx" ON "user_notification_preferences" ("user_id","channel","event_type");--> statement-breakpoint
CREATE INDEX "parents_user_id_idx" ON "parents" ("user_id");--> statement-breakpoint
CREATE INDEX "parents_status_idx" ON "parents" ("status");--> statement-breakpoint
CREATE INDEX "group_permissions_group_id_idx" ON "group_permissions" ("group_id");--> statement-breakpoint
CREATE INDEX "permissions_key_idx" ON "permissions" ("key");--> statement-breakpoint
CREATE INDEX "user_permission_groups_user_id_idx" ON "user_permission_groups" ("user_id");--> statement-breakpoint
CREATE INDEX "user_permission_overrides_user_id_idx" ON "user_permission_overrides" ("user_id");--> statement-breakpoint
CREATE INDEX "rate_limit_cache_expires_at_idx" ON "rate_limit_cache" ("expires_at");--> statement-breakpoint
CREATE INDEX "session_cache_expires_at_idx" ON "session_cache" ("expires_at");--> statement-breakpoint
CREATE INDEX "system_settings_category_idx" ON "system_settings" ("category");--> statement-breakpoint
CREATE INDEX "site_content_slug_idx" ON "site_content" ("slug");--> statement-breakpoint
CREATE INDEX "site_content_type_idx" ON "site_content" ("content_type");--> statement-breakpoint
CREATE INDEX "class_instance_files_file_id_idx" ON "class_instance_files" ("file_id");--> statement-breakpoint
CREATE INDEX "class_instance_files_instance_id_idx" ON "class_instance_files" ("class_instance_id");--> statement-breakpoint
CREATE INDEX "complaint_files_file_id_idx" ON "complaint_files" ("file_id");--> statement-breakpoint
CREATE INDEX "complaint_files_complaint_id_idx" ON "complaint_files" ("complaint_id");--> statement-breakpoint
CREATE INDEX "invoice_files_file_id_idx" ON "invoice_files" ("file_id");--> statement-breakpoint
CREATE INDEX "invoice_files_invoice_id_idx" ON "invoice_files" ("invoice_id");--> statement-breakpoint
CREATE INDEX "learning_resource_files_file_id_idx" ON "learning_resource_files" ("file_id");--> statement-breakpoint
CREATE INDEX "learning_resource_files_res_id_idx" ON "learning_resource_files" ("learning_resource_id");--> statement-breakpoint
CREATE INDEX "parent_files_file_id_idx" ON "parent_files" ("file_id");--> statement-breakpoint
CREATE INDEX "parent_files_parent_id_idx" ON "parent_files" ("parent_id");--> statement-breakpoint
CREATE INDEX "recurring_schedule_files_file_id_idx" ON "recurring_schedule_files" ("file_id");--> statement-breakpoint
CREATE INDEX "recurring_schedule_files_sched_id_idx" ON "recurring_schedule_files" ("recurring_schedule_id");--> statement-breakpoint
CREATE INDEX "signed_url_expires_at_idx" ON "signed_url" ("expires_at");--> statement-breakpoint
CREATE INDEX "signed_url_used_expires_idx" ON "signed_url" ("used","expires_at");--> statement-breakpoint
CREATE INDEX "staff_profile_files_file_id_idx" ON "staff_profile_files" ("file_id");--> statement-breakpoint
CREATE INDEX "staff_profile_files_staff_id_idx" ON "staff_profile_files" ("staff_profile_id");--> statement-breakpoint
CREATE INDEX "student_files_file_id_idx" ON "student_files" ("file_id");--> statement-breakpoint
CREATE INDEX "student_files_student_id_idx" ON "student_files" ("student_id");--> statement-breakpoint
CREATE INDEX "teacher_files_file_id_idx" ON "teacher_files" ("file_id");--> statement-breakpoint
CREATE INDEX "teacher_files_teacher_id_idx" ON "teacher_files" ("teacher_id");--> statement-breakpoint
CREATE INDEX "user_files_file_id_idx" ON "user_files" ("file_id");--> statement-breakpoint
CREATE INDEX "user_files_user_id_idx" ON "user_files" ("user_id");--> statement-breakpoint
CREATE INDEX "student_progress_student_id_idx" ON "student_progress" ("student_id");--> statement-breakpoint
CREATE INDEX "student_progress_class_instance_id_idx" ON "student_progress" ("class_instance_id");--> statement-breakpoint
CREATE INDEX "student_progress_teacher_id_idx" ON "student_progress" ("teacher_id");--> statement-breakpoint
CREATE UNIQUE INDEX "student_progress_student_class_uniq_idx" ON "student_progress" ("student_id","class_instance_id");--> statement-breakpoint
CREATE INDEX "student_status_history_student_id_idx" ON "student_status_history" ("student_id");--> statement-breakpoint
CREATE INDEX "student_status_history_changed_by_user_id_idx" ON "student_status_history" ("changed_by_user_id");--> statement-breakpoint
CREATE INDEX "students_parent_id_idx" ON "students" ("parent_id");--> statement-breakpoint
CREATE INDEX "students_primary_teacher_id_idx" ON "students" ("primary_teacher_id");--> statement-breakpoint
CREATE INDEX "students_status_idx" ON "students" ("status");--> statement-breakpoint
CREATE INDEX "idx_students_name_fts" ON "students" USING gin (to_tsvector('simple', "name"));--> statement-breakpoint
CREATE INDEX "idx_students_name_trgm" ON "students" USING gist ("name" gist_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "students_idempotency_key_unique_idx" ON "students" ("idempotency_key");--> statement-breakpoint
CREATE INDEX "students_pagination_idx" ON "students" ("created_at","id");--> statement-breakpoint
CREATE INDEX "idx_students_filter_mobile" ON "students" ("status","primary_teacher_id","date_of_birth");--> statement-breakpoint
CREATE INDEX "idx_students_parent_status" ON "students" ("parent_id","status");--> statement-breakpoint
CREATE INDEX "idx_students_status_created" ON "students" ("status","created_at");--> statement-breakpoint
CREATE INDEX "teacher_assignments_student_id_idx" ON "teacher_assignments" ("student_id");--> statement-breakpoint
CREATE INDEX "teacher_assignments_teacher_id_idx" ON "teacher_assignments" ("teacher_id");--> statement-breakpoint
CREATE INDEX "staff_profiles_user_id_idx" ON "staff_profiles" ("user_id");--> statement-breakpoint
CREATE INDEX "teacher_availability_windows_teacher_id_idx" ON "teacher_availability_windows" ("teacher_id");--> statement-breakpoint
CREATE INDEX "teacher_availability_windows_teacher_day_idx" ON "teacher_availability_windows" ("teacher_id","day_of_week");--> statement-breakpoint
CREATE INDEX "teacher_recurring_unavailability_teacher_id_idx" ON "teacher_recurring_unavailability" ("teacher_id");--> statement-breakpoint
CREATE INDEX "teacher_recurring_unavailability_teacher_day_idx" ON "teacher_recurring_unavailability" ("teacher_id","day_of_week");--> statement-breakpoint
CREATE INDEX "teacher_vacation_requests_teacher_id_idx" ON "teacher_vacation_requests" ("teacher_id");--> statement-breakpoint
CREATE INDEX "teacher_vacation_requests_status_idx" ON "teacher_vacation_requests" ("status");--> statement-breakpoint
CREATE INDEX "teacher_vacation_requests_start_at_idx" ON "teacher_vacation_requests" ("start_at");--> statement-breakpoint
CREATE INDEX "teacher_banking_details_history_teacher_id_idx" ON "teacher_banking_details_history" ("teacher_id");--> statement-breakpoint
CREATE UNIQUE INDEX "teacher_banking_details_history_active_idx" ON "teacher_banking_details_history" ("teacher_id") WHERE "valid_until" IS NULL;--> statement-breakpoint
CREATE INDEX "teacher_payments_teacher_id_idx" ON "teacher_payments" ("teacher_id");--> statement-breakpoint
CREATE INDEX "teacher_payments_banking_details_history_id_idx" ON "teacher_payments" ("banking_details_history_id");--> statement-breakpoint
CREATE INDEX "teacher_important_notes_teacher_id_idx" ON "teacher_important_notes" ("teacher_id");--> statement-breakpoint
CREATE INDEX "teachers_user_id_idx" ON "teachers" ("user_id");--> statement-breakpoint
CREATE INDEX "teachers_status_idx" ON "teachers" ("status");--> statement-breakpoint
CREATE INDEX "auth_rate_limits_ip_idx" ON "auth_rate_limits" ("ip_address");--> statement-breakpoint
CREATE INDEX "auth_rate_limits_email_idx" ON "auth_rate_limits" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_rate_limits_ip_email_unique_idx" ON "auth_rate_limits" ("ip_address","email");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_email_idx" ON "password_reset_tokens" ("email");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "password_reset_tokens" ("expires_at");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens" ("hashed_token");--> statement-breakpoint
CREATE INDEX "session_metadata_user_id_idx" ON "session_metadata" ("user_id");--> statement-breakpoint
CREATE INDEX "session_metadata_expires_at_idx" ON "session_metadata" ("expires_at");--> statement-breakpoint
CREATE INDEX "session_metadata_device_type_idx" ON "session_metadata" ("device_type");--> statement-breakpoint
CREATE INDEX "session_metadata_session_id_idx" ON "session_metadata" ("session_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_index" ON "sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_last_activity_index" ON "sessions" ("last_activity");--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actor_user_id_users_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_target_user_id_users_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "impersonation_sessions" ADD CONSTRAINT "impersonation_sessions_actor_user_id_users_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "impersonation_sessions" ADD CONSTRAINT "impersonation_sessions_target_user_id_users_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "currency_exchange_audit_logs" ADD CONSTRAINT "currency_exchange_audit_logs_changed_by_user_id_users_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "invoice_coverage_months" ADD CONSTRAINT "invoice_coverage_months_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_parent_id_parents_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_student_id_students_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "fx_sync_runs" ADD CONSTRAINT "fx_sync_runs_triggered_by_user_id_users_id_fkey" FOREIGN KEY ("triggered_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_category_id_class_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "class_categories"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "class_communications" ADD CONSTRAINT "class_communications_group_class_id_group_classes_id_fkey" FOREIGN KEY ("group_class_id") REFERENCES "group_classes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "class_communications" ADD CONSTRAINT "class_communications_PiBewH0pYIt0_fkey" FOREIGN KEY ("notification_delivery_id") REFERENCES "notification_deliveries"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "class_communications" ADD CONSTRAINT "class_communications_NjLYHZgCUCzr_fkey" FOREIGN KEY ("class_status_event_id") REFERENCES "class_status_events"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "group_class_enrollments" ADD CONSTRAINT "group_class_enrollments_group_class_id_group_classes_id_fkey" FOREIGN KEY ("group_class_id") REFERENCES "group_classes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "group_class_enrollments" ADD CONSTRAINT "group_class_enrollments_student_id_students_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "group_classes" ADD CONSTRAINT "group_classes_class_instance_id_class_instances_id_fkey" FOREIGN KEY ("class_instance_id") REFERENCES "class_instances"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "class_instance_performance" ADD CONSTRAINT "class_instance_performance_aA1hiAMGrLBk_fkey" FOREIGN KEY ("class_instance_id") REFERENCES "class_instances"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "class_instances" ADD CONSTRAINT "class_instances_student_id_students_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "class_instances" ADD CONSTRAINT "class_instances_teacher_id_teachers_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "class_instances" ADD CONSTRAINT "class_instances_subject_id_class_subjects_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "class_subjects"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "class_instances" ADD CONSTRAINT "class_instances_PylSk1pBxELI_fkey" FOREIGN KEY ("recurring_schedule_id") REFERENCES "recurring_schedules"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "class_instances" ADD CONSTRAINT "class_instances_original_class_id_class_instances_id_fkey" FOREIGN KEY ("original_class_id") REFERENCES "class_instances"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "class_instances" ADD CONSTRAINT "class_instances_booking_timezone_id_timezones_id_fkey" FOREIGN KEY ("booking_timezone_id") REFERENCES "timezones"("id");--> statement-breakpoint
ALTER TABLE "class_instances" ADD CONSTRAINT "class_instances_activated_by_user_id_users_id_fkey" FOREIGN KEY ("activated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "class_instances" ADD CONSTRAINT "class_instances_force_activated_by_user_id_users_id_fkey" FOREIGN KEY ("force_activated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "class_status_events" ADD CONSTRAINT "class_status_events_class_instance_id_class_instances_id_fkey" FOREIGN KEY ("class_instance_id") REFERENCES "class_instances"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "class_status_events" ADD CONSTRAINT "class_status_events_actor_user_id_users_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "dst_migration_entries" ADD CONSTRAINT "dst_migration_entries_run_id_dst_migration_runs_id_fkey" FOREIGN KEY ("run_id") REFERENCES "dst_migration_runs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dst_migration_entries" ADD CONSTRAINT "dst_migration_entries_dPOpe6uBtrd8_fkey" FOREIGN KEY ("recurring_schedule_id") REFERENCES "recurring_schedules"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "dst_migration_runs" ADD CONSTRAINT "dst_migration_runs_run_by_user_id_users_id_fkey" FOREIGN KEY ("run_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "leave_quota_usage" ADD CONSTRAINT "leave_quota_usage_teacher_id_teachers_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "leave_quota_usage" ADD CONSTRAINT "leave_quota_usage_student_id_students_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_class_instance_id_class_instances_id_fkey" FOREIGN KEY ("class_instance_id") REFERENCES "class_instances"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_requested_by_user_id_users_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_processed_by_user_id_users_id_fkey" FOREIGN KEY ("processed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "recurring_schedule_days" ADD CONSTRAINT "recurring_schedule_days_ok4vhL3oaFBE_fkey" FOREIGN KEY ("recurring_schedule_id") REFERENCES "recurring_schedules"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD CONSTRAINT "recurring_schedules_student_id_students_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD CONSTRAINT "recurring_schedules_teacher_id_teachers_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD CONSTRAINT "recurring_schedules_subject_id_class_subjects_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "class_subjects"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD CONSTRAINT "recurring_schedules_timezone_id_timezones_id_fkey" FOREIGN KEY ("timezone_id") REFERENCES "timezones"("id");--> statement-breakpoint
ALTER TABLE "subject_resources" ADD CONSTRAINT "subject_resources_subject_id_class_subjects_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "class_subjects"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "subject_resources" ADD CONSTRAINT "subject_resources_5NKkB933Dpb5_fkey" FOREIGN KEY ("learning_resource_id") REFERENCES "learning_resources"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "complaint_responses" ADD CONSTRAINT "complaint_responses_complaint_id_complaints_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "complaint_responses" ADD CONSTRAINT "complaint_responses_responder_user_id_users_id_fkey" FOREIGN KEY ("responder_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_parent_id_parents_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_student_id_students_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "learning_resources" ADD CONSTRAINT "learning_resources_uploaded_by_user_id_users_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_wsuupd9kUEsX_fkey" FOREIGN KEY ("device_token_id") REFERENCES "user_device_tokens"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_parent_id_parents_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_reviewed_by_user_id_users_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_duplicate_of_id_fkey" FOREIGN KEY ("duplicate_of_id") REFERENCES "suggestions"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "user_device_tokens" ADD CONSTRAINT "user_device_tokens_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "parents" ADD CONSTRAINT "parents_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "group_permissions" ADD CONSTRAINT "group_permissions_group_id_permission_groups_id_fkey" FOREIGN KEY ("group_id") REFERENCES "permission_groups"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "group_permissions" ADD CONSTRAINT "group_permissions_permission_id_permissions_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "permission_groups" ADD CONSTRAINT "permission_groups_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "user_permission_groups" ADD CONSTRAINT "user_permission_groups_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_permission_groups" ADD CONSTRAINT "user_permission_groups_group_id_permission_groups_id_fkey" FOREIGN KEY ("group_id") REFERENCES "permission_groups"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_permission_groups" ADD CONSTRAINT "user_permission_groups_assigned_by_user_id_users_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_permission_id_permissions_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_assigned_by_user_id_users_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "site_content" ADD CONSTRAINT "site_content_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "class_instance_files" ADD CONSTRAINT "class_instance_files_file_id_storage_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "storage_file"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "class_instance_files" ADD CONSTRAINT "class_instance_files_class_instance_id_class_instances_id_fkey" FOREIGN KEY ("class_instance_id") REFERENCES "class_instances"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "complaint_files" ADD CONSTRAINT "complaint_files_file_id_storage_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "storage_file"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "complaint_files" ADD CONSTRAINT "complaint_files_complaint_id_complaints_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invoice_files" ADD CONSTRAINT "invoice_files_file_id_storage_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "storage_file"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invoice_files" ADD CONSTRAINT "invoice_files_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "learning_resource_files" ADD CONSTRAINT "learning_resource_files_file_id_storage_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "storage_file"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "learning_resource_files" ADD CONSTRAINT "learning_resource_files_i6h6QhQDvKDk_fkey" FOREIGN KEY ("learning_resource_id") REFERENCES "learning_resources"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "parent_files" ADD CONSTRAINT "parent_files_file_id_storage_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "storage_file"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "parent_files" ADD CONSTRAINT "parent_files_parent_id_parents_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recurring_schedule_files" ADD CONSTRAINT "recurring_schedule_files_file_id_storage_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "storage_file"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recurring_schedule_files" ADD CONSTRAINT "recurring_schedule_files_oFa8bm7nPzJm_fkey" FOREIGN KEY ("recurring_schedule_id") REFERENCES "recurring_schedules"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "staff_profile_files" ADD CONSTRAINT "staff_profile_files_file_id_storage_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "storage_file"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "staff_profile_files" ADD CONSTRAINT "staff_profile_files_staff_profile_id_staff_profiles_id_fkey" FOREIGN KEY ("staff_profile_id") REFERENCES "staff_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "student_files" ADD CONSTRAINT "student_files_file_id_storage_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "storage_file"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "student_files" ADD CONSTRAINT "student_files_student_id_students_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "teacher_files" ADD CONSTRAINT "teacher_files_file_id_storage_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "storage_file"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "teacher_files" ADD CONSTRAINT "teacher_files_teacher_id_teachers_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_files" ADD CONSTRAINT "user_files_file_id_storage_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "storage_file"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_files" ADD CONSTRAINT "user_files_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "student_progress" ADD CONSTRAINT "student_progress_student_id_students_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "student_progress" ADD CONSTRAINT "student_progress_class_instance_id_class_instances_id_fkey" FOREIGN KEY ("class_instance_id") REFERENCES "class_instances"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "student_progress" ADD CONSTRAINT "student_progress_teacher_id_teachers_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "student_status_history" ADD CONSTRAINT "student_status_history_student_id_students_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "student_status_history" ADD CONSTRAINT "student_status_history_changed_by_user_id_users_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_parent_id_parents_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_primary_teacher_id_teachers_id_fkey" FOREIGN KEY ("primary_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_student_id_students_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_teacher_id_teachers_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_assigned_by_user_id_users_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "teacher_availability_windows" ADD CONSTRAINT "teacher_availability_windows_teacher_id_teachers_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "teacher_availability_windows" ADD CONSTRAINT "teacher_availability_windows_timezone_id_timezones_id_fkey" FOREIGN KEY ("timezone_id") REFERENCES "timezones"("id");--> statement-breakpoint
ALTER TABLE "teacher_recurring_unavailability" ADD CONSTRAINT "teacher_recurring_unavailability_teacher_id_teachers_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "teacher_recurring_unavailability" ADD CONSTRAINT "teacher_recurring_unavailability_timezone_id_timezones_id_fkey" FOREIGN KEY ("timezone_id") REFERENCES "timezones"("id");--> statement-breakpoint
ALTER TABLE "teacher_vacation_requests" ADD CONSTRAINT "teacher_vacation_requests_teacher_id_teachers_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "teacher_vacation_requests" ADD CONSTRAINT "teacher_vacation_requests_requested_by_user_id_users_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "teacher_vacation_requests" ADD CONSTRAINT "teacher_vacation_requests_timezone_id_timezones_id_fkey" FOREIGN KEY ("timezone_id") REFERENCES "timezones"("id");--> statement-breakpoint
ALTER TABLE "teacher_vacation_requests" ADD CONSTRAINT "teacher_vacation_requests_processed_by_user_id_users_id_fkey" FOREIGN KEY ("processed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "teacher_banking_details_history" ADD CONSTRAINT "teacher_banking_details_history_teacher_id_teachers_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "teacher_banking_details_history" ADD CONSTRAINT "teacher_banking_details_history_M2JKQjWemqEv_fkey" FOREIGN KEY ("verified_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "teacher_payments" ADD CONSTRAINT "teacher_payments_teacher_id_teachers_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "teacher_payments" ADD CONSTRAINT "teacher_payments_5SKCg5lB6byn_fkey" FOREIGN KEY ("banking_details_history_id") REFERENCES "teacher_banking_details_history"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "teacher_important_notes" ADD CONSTRAINT "teacher_important_notes_teacher_id_teachers_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "teacher_important_notes" ADD CONSTRAINT "teacher_important_notes_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "session_metadata" ADD CONSTRAINT "session_metadata_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;