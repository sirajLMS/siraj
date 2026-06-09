-- Remove legacy role-based authorization
ALTER TABLE "user_roles" DROP CONSTRAINT IF EXISTS "user_roles_user_id_users_id_fkey";--> statement-breakpoint
ALTER TABLE "user_roles" DROP CONSTRAINT IF EXISTS "user_roles_role_id_roles_id_fkey";--> statement-breakpoint
DROP TABLE IF EXISTS "user_roles";--> statement-breakpoint
DROP TABLE IF EXISTS "roles";--> statement-breakpoint

-- Remove legacy student table (replaced by parent-linked students)
DROP TABLE IF EXISTS "student";--> statement-breakpoint

-- Normalize sessions columns and add FK
DROP INDEX IF EXISTS "sessions_user_id_index";--> statement-breakpoint
DROP INDEX IF EXISTS "sessions_last_activity_index";--> statement-breakpoint
ALTER TABLE "sessions" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "sessions" RENAME COLUMN "ipAddress" TO "ip_address";--> statement-breakpoint
ALTER TABLE "sessions" RENAME COLUMN "userAgent" TO "user_agent";--> statement-breakpoint
ALTER TABLE "sessions" RENAME COLUMN "lastActivity" TO "last_activity";--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE INDEX "sessions_user_id_index" ON "sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_last_activity_index" ON "sessions" ("last_activity");--> statement-breakpoint

-- Rename password reset tokens table
ALTER TABLE "passwordResetTokens" RENAME TO "password_reset_tokens";--> statement-breakpoint

-- Extend users for permission-based auth
ALTER TABLE "users" ADD COLUMN "avatar_file_path" varchar(1024);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_super_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp(3);--> statement-breakpoint

-- New enums
CREATE TYPE "account_status" AS ENUM('ACTIVATED', 'DEACTIVATED');--> statement-breakpoint
CREATE TYPE "parent_status" AS ENUM('ACTIVATED', 'DEACTIVATED', 'REGULAR', 'ON_LEAVE', 'SUSPENDED', 'ON_TRIAL');--> statement-breakpoint
CREATE TYPE "student_status" AS ENUM('REGULAR', 'ON_LEAVE', 'SUSPENDED', 'ON_TRIAL', 'DEACTIVATED');--> statement-breakpoint
CREATE TYPE "class_type" AS ENUM('REGULAR', 'TRIAL', 'ADVANCE');--> statement-breakpoint
CREATE TYPE "class_outcome" AS ENUM('PENDING', 'TAKEN', 'ABSENT', 'LEAVE');--> statement-breakpoint
CREATE TYPE "class_execution_state" AS ENUM('NOT_ACTIVATED', 'ACTIVATED', 'RUNNING', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "invoice_status" AS ENUM('UNPAID', 'PAID');--> statement-breakpoint
CREATE TYPE "invoice_type" AS ENUM('PER_CLASSES');--> statement-breakpoint
CREATE TYPE "payment_method" AS ENUM('PAYPAL', 'BANK_ACCOUNT');--> statement-breakpoint
CREATE TYPE "complaint_category" AS ENUM('REGARDING_TEACHER', 'REGARDING_SYSTEM', 'OTHER');--> statement-breakpoint
CREATE TYPE "complaint_status" AS ENUM('UNANSWERED', 'ANSWERED');--> statement-breakpoint
CREATE TYPE "leave_request_status" AS ENUM('PENDING', 'APPROVED', 'RESCHEDULED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "leave_requester_type" AS ENUM('TEACHER', 'PARENT', 'ADMIN');--> statement-breakpoint
CREATE TYPE "day_of_week" AS ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');--> statement-breakpoint
CREATE TYPE "dst_migration_result" AS ENUM('UPDATED', 'CONFLICT', 'UNCHANGED');--> statement-breakpoint

-- Permission system
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY,
	"key" varchar(255) NOT NULL UNIQUE,
	"resource" varchar(100) NOT NULL,
	"action" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(100) NOT NULL,
	"is_system" boolean DEFAULT true NOT NULL
);--> statement-breakpoint
CREATE INDEX "permissions_key_idx" ON "permissions" ("key");--> statement-breakpoint
CREATE TABLE "permission_groups" (
	"id" serial PRIMARY KEY,
	"name" varchar(255) NOT NULL UNIQUE,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"slug" varchar(100) NOT NULL UNIQUE,
	"created_by_user_id" integer,
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);--> statement-breakpoint
CREATE TABLE "group_permissions" (
	"group_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	CONSTRAINT "group_permissions_pkey" PRIMARY KEY("group_id","permission_id")
);--> statement-breakpoint
CREATE TABLE "user_permission_groups" (
	"user_id" integer NOT NULL,
	"group_id" integer NOT NULL,
	"assigned_at" timestamp(3) NOT NULL,
	"assigned_by_user_id" integer,
	CONSTRAINT "user_permission_groups_pkey" PRIMARY KEY("user_id","group_id")
);--> statement-breakpoint
ALTER TABLE "permission_groups" ADD CONSTRAINT "permission_groups_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "group_permissions" ADD CONSTRAINT "group_permissions_group_id_permission_groups_id_fkey" FOREIGN KEY ("group_id") REFERENCES "permission_groups"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "group_permissions" ADD CONSTRAINT "group_permissions_permission_id_permissions_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_permission_groups" ADD CONSTRAINT "user_permission_groups_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_permission_groups" ADD CONSTRAINT "user_permission_groups_group_id_permission_groups_id_fkey" FOREIGN KEY ("group_id") REFERENCES "permission_groups"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_permission_groups" ADD CONSTRAINT "user_permission_groups_assigned_by_user_id_users_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
CREATE INDEX "group_permissions_group_id_idx" ON "group_permissions" ("group_id");--> statement-breakpoint
CREATE INDEX "user_permission_groups_user_id_idx" ON "user_permission_groups" ("user_id");--> statement-breakpoint

-- Business profiles
CREATE TABLE "teachers" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL UNIQUE,
	"status" "account_status" NOT NULL,
	"nationality" "country_code",
	"national_id" varchar(100),
	"phone" varchar(50),
	"age" integer,
	"gender" "gender",
	"address" text,
	"qualifications" text,
	"skype_id" varchar(255),
	"zoom_link" varchar(1024),
	"zoom_username" varchar(255),
	"zoom_password" varchar(255),
	"country_code" "country_code",
	"timezone" varchar(100) NOT NULL,
	"salary_amount" numeric(12, 2),
	"salary_currency" varchar(10),
	"beneficiary_name" varchar(255),
	"bank_name" varchar(255),
	"account_number" varchar(100),
	"routing_number" varchar(100),
	"swift_bic" varchar(50),
	"iban" varchar(50),
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);--> statement-breakpoint
CREATE TABLE "parents" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL UNIQUE,
	"status" "parent_status" NOT NULL,
	"phone" varchar(50),
	"nationality" "country_code",
	"address" text,
	"facebook" varchar(512),
	"whatsapp" varchar(50),
	"twitter" varchar(255),
	"skype" varchar(255),
	"default_zoom_link" varchar(1024),
	"invoice_type" "invoice_type",
	"fee_amount" numeric(12, 2),
	"payment_method" "payment_method",
	"currency" varchar(10),
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);--> statement-breakpoint
CREATE TABLE "staff_profiles" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL UNIQUE,
	"phone" varchar(50),
	"skype_id" varchar(255),
	"status" "account_status" NOT NULL,
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "parents" ADD CONSTRAINT "parents_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE INDEX "teachers_user_id_idx" ON "teachers" ("user_id");--> statement-breakpoint
CREATE INDEX "teachers_status_idx" ON "teachers" ("status");--> statement-breakpoint
CREATE INDEX "parents_user_id_idx" ON "parents" ("user_id");--> statement-breakpoint
CREATE INDEX "parents_status_idx" ON "parents" ("status");--> statement-breakpoint
CREATE INDEX "staff_profiles_user_id_idx" ON "staff_profiles" ("user_id");--> statement-breakpoint

-- Students (parent-linked, no user account)
CREATE TABLE "students" (
	"id" serial PRIMARY KEY,
	"parent_id" integer NOT NULL,
	"primary_teacher_id" integer,
	"name" varchar(255) NOT NULL,
	"date_of_birth" timestamp(3),
	"gender" "gender",
	"language" "app_language",
	"status" "student_status" NOT NULL,
	"classes_total" integer DEFAULT 0 NOT NULL,
	"classes_remaining" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_parent_id_parents_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_primary_teacher_id_teachers_id_fkey" FOREIGN KEY ("primary_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL;--> statement-breakpoint
CREATE INDEX "students_parent_id_idx" ON "students" ("parent_id");--> statement-breakpoint
CREATE INDEX "students_primary_teacher_id_idx" ON "students" ("primary_teacher_id");--> statement-breakpoint
CREATE INDEX "students_status_idx" ON "students" ("status");--> statement-breakpoint
CREATE INDEX "idx_students_name_fts" ON "students" USING gin (to_tsvector('simple', "name"));--> statement-breakpoint
CREATE INDEX "idx_students_name_trgm" ON "students" USING gist ("name" gist_trgm_ops);--> statement-breakpoint

-- Scheduling
CREATE TABLE "recurring_schedules" (
	"id" serial PRIMARY KEY,
	"student_id" integer NOT NULL,
	"teacher_id" integer NOT NULL,
	"duration_minutes" integer NOT NULL,
	"default_start_time" time NOT NULL,
	"timezone" varchar(100) NOT NULL,
	"effective_from" date,
	"effective_until" date,
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);--> statement-breakpoint
CREATE TABLE "recurring_schedule_days" (
	"id" serial PRIMARY KEY,
	"recurring_schedule_id" integer NOT NULL,
	"day_of_week" smallint NOT NULL,
	"start_time" time NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);--> statement-breakpoint
CREATE TABLE "class_instances" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"student_id" integer NOT NULL,
	"teacher_id" integer NOT NULL,
	"recurring_schedule_id" integer,
	"original_class_id" bigint,
	"scheduled_start_at" timestamp(3) with time zone NOT NULL,
	"scheduled_end_at" timestamp(3) with time zone NOT NULL,
	"duration_minutes" integer NOT NULL,
	"class_type" "class_type" NOT NULL,
	"outcome" "class_outcome" DEFAULT 'PENDING' NOT NULL,
	"execution_state" "class_execution_state" DEFAULT 'NOT_ACTIVATED' NOT NULL,
	"is_rescheduled" boolean DEFAULT false NOT NULL,
	"is_frozen" boolean DEFAULT false NOT NULL,
	"activated_at" timestamp(3) with time zone,
	"activated_by_user_id" integer,
	"force_activated" boolean DEFAULT false NOT NULL,
	"force_activated_by_user_id" integer,
	"actual_start_at" timestamp(3) with time zone,
	"actual_end_at" timestamp(3) with time zone,
	"remarks" text,
	"admin_notes" text,
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);--> statement-breakpoint
CREATE TABLE "class_status_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"class_instance_id" bigint NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"from_state" jsonb,
	"to_state" jsonb,
	"description" text,
	"actor_user_id" integer,
	"created_at" timestamp(3) NOT NULL
);--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" serial PRIMARY KEY,
	"class_instance_id" bigint NOT NULL,
	"requested_by_user_id" integer NOT NULL,
	"requester_type" "leave_requester_type" NOT NULL,
	"status" "leave_request_status" NOT NULL,
	"created_at" timestamp(3) NOT NULL,
	"processed_at" timestamp(3),
	"processed_by_user_id" integer
);--> statement-breakpoint
CREATE TABLE "leave_quota_usage" (
	"id" serial PRIMARY KEY,
	"teacher_id" integer,
	"student_id" integer,
	"period_year" smallint NOT NULL,
	"period_month" smallint NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"max_allowed" integer DEFAULT 2 NOT NULL
);--> statement-breakpoint
CREATE TABLE "dst_migration_runs" (
	"id" serial PRIMARY KEY,
	"run_by_user_id" integer NOT NULL,
	"offset_minutes" integer NOT NULL,
	"created_at" timestamp(3) NOT NULL
);--> statement-breakpoint
CREATE TABLE "dst_migration_entries" (
	"id" serial PRIMARY KEY,
	"run_id" integer NOT NULL,
	"class_instance_id" bigint NOT NULL,
	"result" "dst_migration_result" NOT NULL,
	"conflict_detail" text
);--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD CONSTRAINT "recurring_schedules_student_id_students_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD CONSTRAINT "recurring_schedules_teacher_id_teachers_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recurring_schedule_days" ADD CONSTRAINT "recurring_schedule_days_recurring_schedule_id_recurring_schedules_id_fkey" FOREIGN KEY ("recurring_schedule_id") REFERENCES "recurring_schedules"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "class_instances" ADD CONSTRAINT "class_instances_student_id_students_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "class_instances" ADD CONSTRAINT "class_instances_teacher_id_teachers_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "class_instances" ADD CONSTRAINT "class_instances_recurring_schedule_id_recurring_schedules_id_fkey" FOREIGN KEY ("recurring_schedule_id") REFERENCES "recurring_schedules"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "class_instances" ADD CONSTRAINT "class_instances_activated_by_user_id_users_id_fkey" FOREIGN KEY ("activated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "class_instances" ADD CONSTRAINT "class_instances_force_activated_by_user_id_users_id_fkey" FOREIGN KEY ("force_activated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "class_status_events" ADD CONSTRAINT "class_status_events_class_instance_id_class_instances_id_fkey" FOREIGN KEY ("class_instance_id") REFERENCES "class_instances"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "class_status_events" ADD CONSTRAINT "class_status_events_actor_user_id_users_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_class_instance_id_class_instances_id_fkey" FOREIGN KEY ("class_instance_id") REFERENCES "class_instances"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_requested_by_user_id_users_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_processed_by_user_id_users_id_fkey" FOREIGN KEY ("processed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "leave_quota_usage" ADD CONSTRAINT "leave_quota_usage_teacher_id_teachers_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "leave_quota_usage" ADD CONSTRAINT "leave_quota_usage_student_id_students_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dst_migration_runs" ADD CONSTRAINT "dst_migration_runs_run_by_user_id_users_id_fkey" FOREIGN KEY ("run_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dst_migration_entries" ADD CONSTRAINT "dst_migration_entries_run_id_dst_migration_runs_id_fkey" FOREIGN KEY ("run_id") REFERENCES "dst_migration_runs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dst_migration_entries" ADD CONSTRAINT "dst_migration_entries_class_instance_id_class_instances_id_fkey" FOREIGN KEY ("class_instance_id") REFERENCES "class_instances"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE UNIQUE INDEX "recurring_schedule_days_schedule_day_idx" ON "recurring_schedule_days" ("recurring_schedule_id","day_of_week");--> statement-breakpoint
CREATE INDEX "recurring_schedules_student_id_idx" ON "recurring_schedules" ("student_id");--> statement-breakpoint
CREATE INDEX "recurring_schedules_teacher_id_idx" ON "recurring_schedules" ("teacher_id");--> statement-breakpoint
CREATE INDEX "class_instances_scheduled_start_at_idx" ON "class_instances" ("scheduled_start_at");--> statement-breakpoint
CREATE INDEX "class_instances_teacher_scheduled_idx" ON "class_instances" ("teacher_id","scheduled_start_at");--> statement-breakpoint
CREATE INDEX "class_instances_student_scheduled_idx" ON "class_instances" ("student_id","scheduled_start_at");--> statement-breakpoint
CREATE INDEX "class_instances_metrics_idx" ON "class_instances" ("execution_state","outcome","is_frozen","is_rescheduled","class_type");--> statement-breakpoint
CREATE INDEX "class_status_events_class_instance_id_idx" ON "class_status_events" ("class_instance_id");--> statement-breakpoint
CREATE INDEX "leave_requests_class_instance_id_idx" ON "leave_requests" ("class_instance_id");--> statement-breakpoint
CREATE UNIQUE INDEX "leave_quota_teacher_period_idx" ON "leave_quota_usage" ("teacher_id","period_year","period_month") WHERE "teacher_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "leave_quota_student_period_idx" ON "leave_quota_usage" ("student_id","period_year","period_month") WHERE "student_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "dst_migration_entries_run_id_idx" ON "dst_migration_entries" ("run_id");--> statement-breakpoint

-- Billing
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY,
	"parent_id" integer NOT NULL,
	"issue_date" date NOT NULL,
	"due_date" date NOT NULL,
	"paid_date" date,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(10) NOT NULL,
	"status" "invoice_status" NOT NULL,
	"invoice_type" "invoice_type" NOT NULL,
	"created_by_user_id" integer,
	"email_sent_at" timestamp(3) with time zone,
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);--> statement-breakpoint
CREATE TABLE "invoice_coverage_months" (
	"invoice_id" integer NOT NULL,
	"year" smallint NOT NULL,
	"month" smallint NOT NULL,
	CONSTRAINT "invoice_coverage_months_pkey" PRIMARY KEY("invoice_id","year","month")
);--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_parent_id_parents_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "invoice_coverage_months" ADD CONSTRAINT "invoice_coverage_months_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE INDEX "invoices_parent_id_idx" ON "invoices" ("parent_id");--> statement-breakpoint
CREATE INDEX "invoices_status_due_date_idx" ON "invoices" ("status","due_date");--> statement-breakpoint

-- Communications and resources
CREATE TABLE "complaints" (
	"id" serial PRIMARY KEY,
	"parent_id" integer NOT NULL,
	"student_id" integer,
	"category" "complaint_category" NOT NULL,
	"submitter_email" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"status" "complaint_status" NOT NULL,
	"admin_response" text,
	"responded_by_user_id" integer,
	"responded_at" timestamp(3),
	"response_email_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);--> statement-breakpoint
CREATE TABLE "suggestions" (
	"id" serial PRIMARY KEY,
	"parent_id" integer NOT NULL,
	"submitter_name" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"email_sent_at" timestamp(3),
	"created_at" timestamp(3) NOT NULL
);--> statement-breakpoint
CREATE TABLE "learning_resources" (
	"id" serial PRIMARY KEY,
	"display_name" varchar(255) NOT NULL,
	"file_path" varchar(1024) NOT NULL,
	"uploaded_by_user_id" integer NOT NULL,
	"created_at" timestamp(3) NOT NULL,
	"deleted_at" timestamp(3)
);--> statement-breakpoint
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_parent_id_parents_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_student_id_students_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_responded_by_user_id_users_id_fkey" FOREIGN KEY ("responded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_parent_id_parents_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "learning_resources" ADD CONSTRAINT "learning_resources_uploaded_by_user_id_users_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE INDEX "complaints_status_idx" ON "complaints" ("status");--> statement-breakpoint
CREATE INDEX "complaints_parent_id_idx" ON "complaints" ("parent_id");--> statement-breakpoint
CREATE INDEX "suggestions_parent_id_idx" ON "suggestions" ("parent_id");--> statement-breakpoint
CREATE INDEX "learning_resources_deleted_at_idx" ON "learning_resources" ("deleted_at");
