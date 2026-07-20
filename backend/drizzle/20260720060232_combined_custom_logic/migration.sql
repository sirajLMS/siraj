-- Source: 2-functions.sql
CREATE OR REPLACE FUNCTION current_user_id() 
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', true), '')::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;
--> statement-breakpoint


-- Source: 3-system_permissions_and_groups.sql
-- Migration: Seed System Permissions and Groups
-- Auto-generated

-- Story 15: Suggestion Review Workflow — New enum type
DO $$ BEGIN
  CREATE TYPE suggestion_status AS ENUM ('PENDING', 'REVIEWED', 'DUPLICATE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- FX Rate Ingestion: Add new app_permission enum values
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'billing.view_exchange_rates';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'billing.refresh_exchange_rates';
--> statement-breakpoint

-- Story 15: Add ON_APP notification channel
ALTER TYPE notification_channel ADD VALUE IF NOT EXISTS 'ON_APP';
--> statement-breakpoint

-- Story 15: Add new notification event types for suggestions and complaints
ALTER TYPE notification_event_type ADD VALUE IF NOT EXISTS 'NEW_COMPLAINT';
--> statement-breakpoint
ALTER TYPE notification_event_type ADD VALUE IF NOT EXISTS 'NEW_SUGGESTION';
--> statement-breakpoint
ALTER TYPE notification_event_type ADD VALUE IF NOT EXISTS 'SUGGESTION_ACKNOWLEDGED';
--> statement-breakpoint
ALTER TYPE notification_event_type ADD VALUE IF NOT EXISTS 'SUGGESTION_DUPLICATE_MARKED';
--> statement-breakpoint

-- Story 15: Add new columns to suggestions table
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS status suggestion_status NOT NULL DEFAULT 'PENDING';
--> statement-breakpoint
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS duplicate_of_id uuid REFERENCES suggestions(id) ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS admin_response text;
--> statement-breakpoint
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS reviewed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
--> statement-breakpoint
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
--> statement-breakpoint

-- Story 15: Add indexes for new suggestions columns
CREATE INDEX IF NOT EXISTS suggestions_status_idx ON suggestions (status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS suggestions_duplicate_of_id_idx ON suggestions (duplicate_of_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS suggestions_reviewed_by_user_id_idx ON suggestions (reviewed_by_user_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS suggestions_deleted_at_idx ON suggestions (deleted_at);
--> statement-breakpoint

INSERT INTO
    permissions (
        id,
        key,
        resource,
        action,
        description,
        category,
        is_system
    )
VALUES (
        gen_random_uuid (),
        'auth.login'::app_permission,
        'auth',
        'login',
        '{"ar": "Login to system", "en": "Login to system"}'::jsonb,
        '{"ar": "المصادقة", "en": "Authentication"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'auth.view_own_profile'::app_permission,
        'auth',
        'view_own_profile',
        '{"ar": "View own profile", "en": "View own profile"}'::jsonb,
        '{"ar": "المصادقة", "en": "Authentication"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'dashboard.view'::app_permission,
        'dashboard',
        'view',
        '{"ar": "View dashboard", "en": "View dashboard"}'::jsonb,
        '{"ar": "لوحة التحكم", "en": "Dashboard"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'dashboard.view_metrics'::app_permission,
        'dashboard',
        'view_metrics',
        '{"ar": "View dashboard metrics", "en": "View dashboard metrics"}'::jsonb,
        '{"ar": "لوحة التحكم", "en": "Dashboard"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'dashboard.filter_metrics'::app_permission,
        'dashboard',
        'filter_metrics',
        '{"ar": "Filter dashboard metrics", "en": "Filter dashboard metrics"}'::jsonb,
        '{"ar": "لوحة التحكم", "en": "Dashboard"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'dashboard.metrics.view_all'::app_permission,
        'dashboard',
        'metrics.view_all',
        '{"ar": "View all dashboard metrics", "en": "View all dashboard metrics"}'::jsonb,
        '{"ar": "لوحة التحكم", "en": "Dashboard"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'dashboard.search'::app_permission,
        'dashboard',
        'search',
        '{"ar": "Global search on admin schedule table", "en": "Global search on admin schedule table"}'::jsonb,
        '{"ar": "لوحة التحكم", "en": "Dashboard"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.view_list'::app_permission,
        'schedule',
        'view_list',
        '{"ar": "View daily schedule list", "en": "View daily schedule list"}'::jsonb,
        '{"ar": "الجدولة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.filter_advanced'::app_permission,
        'schedule',
        'filter_advanced',
        '{"ar": "Advanced filtering of schedule", "en": "Advanced filtering of schedule"}'::jsonb,
        '{"ar": "الجدولة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.view_all'::app_permission,
        'schedule',
        'view_all',
        '{"ar": "View all schedules", "en": "View all schedules"}'::jsonb,
        '{"ar": "الجدولة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.view_assigned'::app_permission,
        'schedule',
        'view_assigned',
        '{"ar": "View assigned teacher schedule", "en": "View assigned teacher schedule"}'::jsonb,
        '{"ar": "الجدولة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.view_family'::app_permission,
        'schedule',
        'view_family',
        '{"ar": "View family student schedule", "en": "View family student schedule"}'::jsonb,
        '{"ar": "الجدولة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.search_availability'::app_permission,
        'schedule',
        'search_availability',
        '{"ar": "Search teacher availability", "en": "Search teacher availability"}'::jsonb,
        '{"ar": "الجدولة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.manage_recurring'::app_permission,
        'schedule',
        'manage_recurring',
        '{"ar": "Manage recurring schedules", "en": "Manage recurring schedules"}'::jsonb,
        '{"ar": "الجدولة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.dst_migrate'::app_permission,
        'schedule',
        'dst_migrate',
        '{"ar": "Run DST migration", "en": "Run DST migration"}'::jsonb,
        '{"ar": "الجدولة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.view_timezones'::app_permission,
        'schedule',
        'view_timezones',
        '{"ar": "View multi-timezone schedule columns", "en": "View multi-timezone schedule columns"}'::jsonb,
        '{"ar": "الجدولة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'session.view_details'::app_permission,
        'session',
        'view_details',
        '{"ar": "View class details", "en": "View class details"}'::jsonb,
        '{"ar": "الجدولة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'session.activate_class'::app_permission,
        'session',
        'activate_class',
        '{"ar": "Activate a class within time window", "en": "Activate a class within time window"}'::jsonb,
        '{"ar": "الجدولة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'session.activate_override'::app_permission,
        'session',
        'activate_override',
        '{"ar": "Bypass time window enforcement to manually activate a class session", "en": "Bypass time window enforcement to manually activate a class session"}'::jsonb,
        '{"ar": "الجدولة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'session.update_status.start'::app_permission,
        'session',
        'update_status.start',
        '{"ar": "Transition an activated session to RUNNING state upon student arrival", "en": "Transition an activated session to RUNNING state upon student arrival"}'::jsonb,
        '{"ar": "الجدولة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'session.update_status.absent'::app_permission,
        'session',
        'update_status.absent',
        '{"ar": "Mark student as absent after waiting period and credit teacher payroll", "en": "Mark student as absent after waiting period and credit teacher payroll"}'::jsonb,
        '{"ar": "الجدولة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'session.update_status.leave'::app_permission,
        'session',
        'update_status.leave',
        '{"ar": "Process excused cancellation and trigger reschedule workflow", "en": "Process excused cancellation and trigger reschedule workflow"}'::jsonb,
        '{"ar": "الجدولة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'session.reschedule'::app_permission,
        'session',
        'reschedule',
        '{"ar": "Reschedule a class", "en": "Reschedule a class"}'::jsonb,
        '{"ar": "الجدولة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'session.reset'::app_permission,
        'session',
        'reset',
        '{"ar": "Destructively clear session data and revert to NOT_ACTIVATED state", "en": "Destructively clear session data and revert to NOT_ACTIVATED state"}'::jsonb,
        '{"ar": "الجدولة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'session.override_actions'::app_permission,
        'session',
        'override_actions',
        '{"ar": "Admin override toolbar on class details page", "en": "Admin override toolbar on class details page"}'::jsonb,
        '{"ar": "الجدولة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'history.view_calendar'::app_permission,
        'history',
        'view_calendar',
        '{"ar": "View student class history calendar", "en": "View student class history calendar"}'::jsonb,
        '{"ar": "السجل", "en": "History"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'history.view_details'::app_permission,
        'history',
        'view_details',
        '{"ar": "View session metadata in history modal drill-down", "en": "View session metadata in history modal drill-down"}'::jsonb,
        '{"ar": "السجل", "en": "History"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'teacher.view_dashboard'::app_permission,
        'teacher',
        'view_dashboard',
        '{"ar": "Access teacher dashboard", "en": "Access teacher dashboard"}'::jsonb,
        '{"ar": "المعلم", "en": "Teacher"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'teacher.view_students'::app_permission,
        'teacher',
        'view_students',
        '{"ar": "View students assigned to the logged-in teacher", "en": "View students assigned to the logged-in teacher"}'::jsonb,
        '{"ar": "المعلم", "en": "Teacher"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'teacher.view_own_profile'::app_permission,
        'teacher',
        'view_own_profile',
        '{"ar": "View own teacher profile and salary (read-only)", "en": "View own teacher profile and salary (read-only)"}'::jsonb,
        '{"ar": "المعلم", "en": "Teacher"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'system.enforce_time_window'::app_permission,
        'system',
        'enforce_time_window',
        '{"ar": "Validate activation time window", "en": "Validate activation time window"}'::jsonb,
        '{"ar": "النظام", "en": "System"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'system.enforce_leave_limit'::app_permission,
        'system',
        'enforce_leave_limit',
        '{"ar": "System-level validation gate that enforces teacher leave quota limits per calendar month", "en": "System-level validation gate that enforces teacher leave quota limits per calendar month"}'::jsonb,
        '{"ar": "النظام", "en": "System"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'teachers.list'::app_permission,
        'teachers',
        'list',
        '{"ar": "List teachers", "en": "List teachers"}'::jsonb,
        '{"ar": "المعلمون", "en": "Teachers"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'teachers.create'::app_permission,
        'teachers',
        'create',
        '{"ar": "Create teacher accounts", "en": "Create teacher accounts"}'::jsonb,
        '{"ar": "المعلمون", "en": "Teachers"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'teachers.edit'::app_permission,
        'teachers',
        'edit',
        '{"ar": "Edit teacher profiles", "en": "Edit teacher profiles"}'::jsonb,
        '{"ar": "المعلمون", "en": "Teachers"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'teachers.manage_schedule'::app_permission,
        'teachers',
        'manage_schedule',
        '{"ar": "Manage teacher schedules", "en": "Manage teacher schedules"}'::jsonb,
        '{"ar": "المعلمون", "en": "Teachers"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'parents.list'::app_permission,
        'parents',
        'list',
        '{"ar": "List parents", "en": "List parents"}'::jsonb,
        '{"ar": "أولياء الأمور", "en": "Parents"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'parents.create'::app_permission,
        'parents',
        'create',
        '{"ar": "Create parent accounts", "en": "Create parent accounts"}'::jsonb,
        '{"ar": "أولياء الأمور", "en": "Parents"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'parents.edit'::app_permission,
        'parents',
        'edit',
        '{"ar": "Edit parent profiles", "en": "Edit parent profiles"}'::jsonb,
        '{"ar": "أولياء الأمور", "en": "Parents"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'students.list'::app_permission,
        'students',
        'list',
        '{"ar": "List students", "en": "List students"}'::jsonb,
        '{"ar": "الطلاب", "en": "Students"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'students.create'::app_permission,
        'students',
        'create',
        '{"ar": "Create student profiles", "en": "Create student profiles"}'::jsonb,
        '{"ar": "الطلاب", "en": "Students"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'students.edit'::app_permission,
        'students',
        'edit',
        '{"ar": "Edit student profiles", "en": "Edit student profiles"}'::jsonb,
        '{"ar": "الطلاب", "en": "Students"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'students.change_teacher'::app_permission,
        'students',
        'change_teacher',
        '{"ar": "Reassign student teacher", "en": "Reassign student teacher"}'::jsonb,
        '{"ar": "الطلاب", "en": "Students"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'students.change_status'::app_permission,
        'students',
        'change_status',
        '{"ar": "Change student status", "en": "Change student status"}'::jsonb,
        '{"ar": "الطلاب", "en": "Students"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'students.override_quota'::app_permission,
        'students',
        'override_quota',
        '{"ar": "Override student class quota", "en": "Override student class quota"}'::jsonb,
        '{"ar": "الطلاب", "en": "Students"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'invoices.list'::app_permission,
        'invoices',
        'list',
        '{"ar": "List invoices", "en": "List invoices"}'::jsonb,
        '{"ar": "الفوترة", "en": "Billing"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'invoices.delete'::app_permission,
        'invoices',
        'delete',
        '{"ar": "Delete invoices", "en": "Delete invoices"}'::jsonb,
        '{"ar": "الفوترة", "en": "Billing"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'invoices.create'::app_permission,
        'invoices',
        'create',
        '{"ar": "Create invoices", "en": "Create invoices"}'::jsonb,
        '{"ar": "الفوترة", "en": "Billing"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'invoices.mark_paid'::app_permission,
        'invoices',
        'mark_paid',
        '{"ar": "Mark invoice as paid", "en": "Mark invoice as paid"}'::jsonb,
        '{"ar": "الفوترة", "en": "Billing"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'invoices.edit'::app_permission,
        'invoices',
        'edit',
        '{"ar": "Edit invoices", "en": "Edit invoices"}'::jsonb,
        '{"ar": "الفوترة", "en": "Billing"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'resources.list'::app_permission,
        'resources',
        'list',
        '{"ar": "List learning resources", "en": "List learning resources"}'::jsonb,
        '{"ar": "الموارد", "en": "Resources"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'resources.delete'::app_permission,
        'resources',
        'delete',
        '{"ar": "Delete learning resources", "en": "Delete learning resources"}'::jsonb,
        '{"ar": "الموارد", "en": "Resources"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'resources.upload'::app_permission,
        'resources',
        'upload',
        '{"ar": "Upload learning resources", "en": "Upload learning resources"}'::jsonb,
        '{"ar": "الموارد", "en": "Resources"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'reports.generate'::app_permission,
        'reports',
        'generate',
        '{"ar": "Generate reports", "en": "Generate reports"}'::jsonb,
        '{"ar": "التقارير", "en": "Reports"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'complaints.list'::app_permission,
        'complaints',
        'list',
        '{"ar": "List complaints", "en": "List complaints"}'::jsonb,
        '{"ar": "التواصل", "en": "Communications"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'complaints.delete'::app_permission,
        'complaints',
        'delete',
        '{"ar": "Delete complaints", "en": "Delete complaints"}'::jsonb,
        '{"ar": "التواصل", "en": "Communications"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'complaints.respond'::app_permission,
        'complaints',
        'respond',
        '{"ar": "Respond to complaints", "en": "Respond to complaints"}'::jsonb,
        '{"ar": "التواصل", "en": "Communications"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'staff.list'::app_permission,
        'staff',
        'list',
        '{"ar": "List staff accounts", "en": "List staff accounts"}'::jsonb,
        '{"ar": "الإدارة", "en": "Administration"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'staff.create'::app_permission,
        'staff',
        'create',
        '{"ar": "Create staff accounts", "en": "Create staff accounts"}'::jsonb,
        '{"ar": "الإدارة", "en": "Administration"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'staff.edit'::app_permission,
        'staff',
        'edit',
        '{"ar": "Edit staff accounts", "en": "Edit staff accounts"}'::jsonb,
        '{"ar": "الإدارة", "en": "Administration"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'permission_groups.manage'::app_permission,
        'permission_groups',
        'manage',
        '{"ar": "Manage permission groups", "en": "Manage permission groups"}'::jsonb,
        '{"ar": "الإدارة", "en": "Administration"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'permission_groups.assign'::app_permission,
        'permission_groups',
        'assign',
        '{"ar": "Assign permission groups to users", "en": "Assign permission groups to users"}'::jsonb,
        '{"ar": "الإدارة", "en": "Administration"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'notification.view_alerts'::app_permission,
        'notification',
        'view_alerts',
        '{"ar": "Access global notifications UI with system alerts", "en": "Access global notifications UI with system alerts"}'::jsonb,
        '{"ar": "الإشعارات", "en": "Notifications"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'billing.view_unpaid_invoices'::app_permission,
        'billing',
        'view_unpaid_invoices',
        '{"ar": "View accounts with pending or overdue financial balances", "en": "View accounts with pending or overdue financial balances"}'::jsonb,
        '{"ar": "الفوترة", "en": "Billing"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'user.view_profile'::app_permission,
        'user',
        'view_profile',
        '{"ar": "View specific user comprehensive account and billing details", "en": "View specific user comprehensive account and billing details"}'::jsonb,
        '{"ar": "المستخدمون", "en": "Users"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'staff.view_directory'::app_permission,
        'staff',
        'view_directory',
        '{"ar": "Access the global Teachers Directory with summary metrics and data table", "en": "Access the global Teachers Directory with summary metrics and data table"}'::jsonb,
        '{"ar": "الإدارة", "en": "Administration"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.view_weekly'::app_permission,
        'schedule',
        'view_weekly',
        '{"ar": "View a specific teacher weekly calendar grid with colored time-blocks", "en": "View a specific teacher weekly calendar grid with colored time-blocks"}'::jsonb,
        '{"ar": "الجدولة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.view_workload'::app_permission,
        'schedule',
        'view_workload',
        '{"ar": "View aggregated weekly capacity metrics (Weekly hours worked)", "en": "View aggregated weekly capacity metrics (Weekly hours worked)"}'::jsonb,
        '{"ar": "الجدولة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.create_class'::app_permission,
        'schedule',
        'create_class',
        '{"ar": "Access the Add Class workflow and create new recurring scheduled sessions", "en": "Access the Add Class workflow and create new recurring scheduled sessions"}'::jsonb,
        '{"ar": "الجدولة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.delete_class'::app_permission,
        'schedule',
        'delete_class',
        '{"ar": "Delete a specific recurring class block from a teacher schedule", "en": "Delete a specific recurring class block from a teacher schedule"}'::jsonb,
        '{"ar": "الجدولة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'schedule.clear_weekly'::app_permission,
        'schedule',
        'clear_weekly',
        '{"ar": "Bulk erase a teacher entire weekly schedule in a single action", "en": "Bulk erase a teacher entire weekly schedule in a single action"}'::jsonb,
        '{"ar": "الجدولة", "en": "Scheduling"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'staff.edit_profile'::app_permission,
        'staff',
        'edit_profile',
        '{"ar": "Edit teacher profile including PII, salary, and official details", "en": "Edit teacher profile including PII, salary, and official details"}'::jsonb,
        '{"ar": "الإدارة", "en": "Administration"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'system.bulk_update_dst'::app_permission,
        'system',
        'bulk_update_dst',
        '{"ar": "Execute global DST adjustment algorithm across entire database", "en": "Execute global DST adjustment algorithm across entire database"}'::jsonb,
        '{"ar": "النظام", "en": "System"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'parent.view_directory'::app_permission,
        'parent',
        'view_directory',
        '{"ar": "Access global Parents Directory with status metrics and unpaid invoices", "en": "Access global Parents Directory with status metrics and unpaid invoices"}'::jsonb,
        '{"ar": "أولياء الأمور", "en": "Parents"}'::jsonb,
        true
    ),
    -- Story 8: Parent Profile & Account Lifecycle
    (
        gen_random_uuid (),
        'parent.view_profile'::app_permission,
        'parent',
        'view_profile',
        '{"ar": "Access detailed Parent Profile view with PII, social media links, and fee details", "en": "Access detailed Parent Profile view with PII, social media links, and fee details"}'::jsonb,
        '{"ar": "أولياء الأمور", "en": "Parents"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'parent.view_students'::app_permission,
        'parent',
        'view_students',
        '{"ar": "View students assigned to the logged-in parent", "en": "View students assigned to the logged-in parent"}'::jsonb,
        '{"ar": "أولياء الأمور", "en": "Parents"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'parent.view_own_profile'::app_permission,
        'parent',
        'view_own_profile',
        '{"ar": "View own parent profile and social links (read-only)", "en": "View own parent profile and social links (read-only)"}'::jsonb,
        '{"ar": "أولياء الأمور", "en": "Parents"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'parent.manage_status'::app_permission,
        'parent',
        'manage_status',
        '{"ar": "Suspend or revoke a parent''s access to the LMS by setting account status to DEACTIVATED", "en": "Suspend or revoke a parent''s access to the LMS by setting account status to DEACTIVATED"}'::jsonb,
        '{"ar": "أولياء الأمور", "en": "Parents"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'student.view_associated'::app_permission,
        'student',
        'view_associated',
        '{"ar": "View the aggregated list of students associated with a specific parent, including teacher and quota data", "en": "View the aggregated list of students associated with a specific parent, including teacher and quota data"}'::jsonb,
        '{"ar": "الطلاب", "en": "Students"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'student.edit_quota'::app_permission,
        'student',
        'edit_quota',
        '{"ar": "Manually override a student''s classesRemaining integer, directly impacting billing cycle triggers", "en": "Manually override a student''s classesRemaining integer, directly impacting billing cycle triggers"}'::jsonb,
        '{"ar": "الطلاب", "en": "Students"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'billing.view_history'::app_permission,
        'billing',
        'view_history',
        '{"ar": "Access the full invoice ledger for a single parent, including paid and unpaid invoices", "en": "Access the full invoice ledger for a single parent, including paid and unpaid invoices"}'::jsonb,
        '{"ar": "الفوترة", "en": "Billing"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'document.manage_parent_docs'::app_permission,
        'document',
        'manage_parent_docs',
        '{"ar": "Attach and view external files (contracts, ID verification) linked to a specific Parent record", "en": "Attach and view external files (contracts, ID verification) linked to a specific Parent record"}'::jsonb,
        '{"ar": "المستندات", "en": "Documents"}'::jsonb,
        true
    ),
    -- Story 9: Invoice Generation & Processing (billing domain)
    (
        gen_random_uuid (),
        'billing.create_invoice'::app_permission,
        'billing',
        'create_invoice',
        '{"ar": "Manually generate a custom invoice outside the automated package renewal cycle", "en": "Manually generate a custom invoice outside the automated package renewal cycle"}'::jsonb,
        '{"ar": "الفوترة", "en": "Billing"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'billing.update_status_paid'::app_permission,
        'billing',
        'update_status_paid',
        '{"ar": "Manually verify and log the settlement of an outstanding invoice by marking it as Paid", "en": "Manually verify and log the settlement of an outstanding invoice by marking it as Paid"}'::jsonb,
        '{"ar": "الفوترة", "en": "Billing"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'billing.submit_payment_proof'::app_permission,
        'billing',
        'submit_payment_proof',
        '{"ar": "Submit payment proof for an outstanding invoice on the parent account", "en": "Submit payment proof for an outstanding invoice on the parent account"}'::jsonb,
        '{"ar": "الفوترة", "en": "Billing"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'billing.delete_invoice'::app_permission,
        'billing',
        'delete_invoice',
        '{"ar": "Destructively remove a financial record from the parent billing ledger", "en": "Destructively remove a financial record from the parent billing ledger"}'::jsonb,
        '{"ar": "الفوترة", "en": "Billing"}'::jsonb,
        true
    ),
    -- Story 9: Student Metadata & Lifecycle Management
    (
        gen_random_uuid (),
        'student.reassign_teacher'::app_permission,
        'student',
        'reassign_teacher',
        '{"ar": "Dynamically change a student assigned instructor from the parent profile view", "en": "Dynamically change a student assigned instructor from the parent profile view"}'::jsonb,
        '{"ar": "الطلاب", "en": "Students"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'student.manage_status'::app_permission,
        'student',
        'manage_status',
        '{"ar": "Alter a student global enrollment state (Regular, On Leave, Suspended) from parent profile", "en": "Alter a student global enrollment state (Regular, On Leave, Suspended) from parent profile"}'::jsonb,
        '{"ar": "الطلاب", "en": "Students"}'::jsonb,
        true
    ),
    -- Automated System Synchronization
    (
        gen_random_uuid (),
        'system.sync_notifications'::app_permission,
        'system',
        'sync_notifications',
        '{"ar": "Internal rule that forces the global notification tray to reflect real-time billing changes", "en": "Internal rule that forces the global notification tray to reflect real-time billing changes"}'::jsonb,
        '{"ar": "النظام", "en": "System"}'::jsonb,
        true
    ),
    -- Automated Student Status Enforcement
    (
        gen_random_uuid (),
        'system.enforce_suspended_lock'::app_permission,
        'system',
        'enforce_suspended_lock',
        '{"ar": "Automated rule that locks UI controls on teacher schedule when student is Suspended", "en": "Automated rule that locks UI controls on teacher schedule when student is Suspended"}'::jsonb,
        '{"ar": "النظام", "en": "System"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'system.process_student_leave'::app_permission,
        'system',
        'process_student_leave',
        '{"ar": "Automated workflow that marks future classes as excused and queues rescheduling when student is On Leave", "en": "Automated workflow that marks future classes as excused and queues rescheduling when student is On Leave"}'::jsonb,
        '{"ar": "النظام", "en": "System"}'::jsonb,
        true
    ),
    -- Story 11: System-Level Resource Access Restriction
    (
        gen_random_uuid (),
        'system.restrict_resource_access'::app_permission,
        'system',
        'restrict_resource_access',
        '{"ar": "Enforce isolation of learning resources storage from unauthorized external access", "en": "Enforce isolation of learning resources storage from unauthorized external access"}'::jsonb,
        '{"ar": "النظام", "en": "System"}'::jsonb,
        true
    ),
    -- Story 12: Custom Reporting and Analytics
    (
        gen_random_uuid (),
        'report.generate_custom'::app_permission,
        'report',
        'generate_custom',
        '{"ar": "Authorizes access to the overarching Reports interface and the dynamic aggregation query engine to evaluate operational parameters.", "en": "Authorizes access to the overarching Reports interface and the dynamic aggregation query engine to evaluate operational parameters."}'::jsonb,
        '{"ar": "التقارير", "en": "Reporting"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'report.view_financials'::app_permission,
        'report',
        'view_financials',
        '{"ar": "Authorizes the query engine to calculate and render highly sensitive payroll and financial metrics within generated reports.", "en": "Authorizes the query engine to calculate and render highly sensitive payroll and financial metrics within generated reports."}'::jsonb,
        '{"ar": "التقارير", "en": "Reporting"}'::jsonb,
        true
    ),
    -- Story 14: Complaints, Suggestions, Communication Channels
    (
        gen_random_uuid (),
        'support.submit_complaint'::app_permission,
        'support',
        'submit_complaint',
        '{"ar": "Submit a new complaint from the parent dashboard", "en": "Submit a new complaint from the parent dashboard"}'::jsonb,
        '{"ar": "الدعم", "en": "Support"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'support.view_history'::app_permission,
        'support',
        'view_history',
        '{"ar": "View own complaint submission history as a parent", "en": "View own complaint submission history as a parent"}'::jsonb,
        '{"ar": "الدعم", "en": "Support"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'communication.submit_suggestion'::app_permission,
        'communication',
        'submit_suggestion',
        '{"ar": "Submit a new suggestion from the parent dashboard", "en": "Submit a new suggestion from the parent dashboard"}'::jsonb,
        '{"ar": "التواصل", "en": "Communication"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'system.dispatch_email'::app_permission,
        'system',
        'dispatch_email',
        '{"ar": "Internal permission allowing the system to dispatch outbound email notifications", "en": "Internal permission allowing the system to dispatch outbound email notifications"}'::jsonb,
        '{"ar": "النظام", "en": "System"}'::jsonb,
        true
    ),
    -- Story 15: Suggestion Review Workflow
    (
        gen_random_uuid (),
        'suggestions.list'::app_permission,
        'suggestions',
        'list',
        '{"ar": "List and filter all parent suggestions with review status and duplicate grouping", "en": "List and filter all parent suggestions with review status and duplicate grouping"}'::jsonb,
        '{"ar": "التواصل", "en": "Communications"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'suggestions.review'::app_permission,
        'suggestions',
        'review',
        '{"ar": "Review a suggestion: mark as reviewed with admin response or mark as duplicate of another suggestion", "en": "Review a suggestion: mark as reviewed with admin response or mark as duplicate of another suggestion"}'::jsonb,
        '{"ar": "التواصل", "en": "Communications"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'suggestions.delete'::app_permission,
        'suggestions',
        'delete',
        '{"ar": "Soft-delete a suggestion record from the system", "en": "Soft-delete a suggestion record from the system"}'::jsonb,
        '{"ar": "التواصل", "en": "Communications"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'billing.view_exchange_rates'::app_permission,
        'billing',
        'view_exchange_rates',
        '{"ar": "عرض أسعار صرف العملات وآخر حالة مزامنة", "en": "View currency exchange rates and latest sync status"}'::jsonb,
        '{"ar": "الفوترة", "en": "Billing"}'::jsonb,
        true
    ),
    (
        gen_random_uuid (),
        'billing.refresh_exchange_rates'::app_permission,
        'billing',
        'refresh_exchange_rates',
        '{"ar": "تشغيل مزامنة أسعار صرف العملات يدوياً", "en": "Trigger manual currency exchange rate refresh"}'::jsonb,
        '{"ar": "الفوترة", "en": "Billing"}'::jsonb,
        true
    ) ON CONFLICT (key) DO
UPDATE
SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    is_system = EXCLUDED.is_system;
--> statement-breakpoint

INSERT INTO
    permission_groups (
        id,
        name,
        description,
        is_system,
        slug,
        created_at,
        updated_at
    )
VALUES (
        gen_random_uuid (),
        '{"ar": "المشرف الأعلى", "en": "Super Admin"}'::jsonb,
        '{"ar": "وصول كامل للنظام", "en": "Full system access"}'::jsonb,
        true,
        'super_admin',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid (),
        '{"ar": "المسؤول", "en": "Admin"}'::jsonb,
        '{"ar": "إشراف تشغيلي كامل", "en": "Full operational oversight for the sprint"}'::jsonb,
        true,
        'academy_admin',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid (),
        '{"ar": "معلم", "en": "Teacher"}'::jsonb,
        '{"ar": "الصلاحيات الافتراضية لحسابات المعلمين", "en": "Default permissions for teacher accounts"}'::jsonb,
        true,
        'teacher_default',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid (),
        '{"ar": "ولي أمر", "en": "Parent"}'::jsonb,
        '{"ar": "الصلاحيات الافتراضية لحسابات أولياء الأمور", "en": "Default permissions for parent accounts"}'::jsonb,
        true,
        'parent_default',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid (),
        '{"ar": "موظف", "en": "Staff"}'::jsonb,
        '{"ar": "الصلاحيات الافتراضية لحسابات الموظفين", "en": "Default permissions for staff accounts"}'::jsonb,
        true,
        'staff_default',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid (),
        '{"ar": "نظام آلي", "en": "System Automated"}'::jsonb,
        '{"ar": "قواعد النظام الداخلية للتحقق", "en": "Internal system rules for validation"}'::jsonb,
        true,
        'system_automated',
        NOW(),
        NOW()
    ) ON CONFLICT (slug) DO
UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_system = EXCLUDED.is_system,
    updated_at = NOW();
--> statement-breakpoint

DELETE FROM group_permissions
WHERE group_id IN (SELECT id FROM permission_groups WHERE is_system = true)
AND permission_id IN (
    SELECT id FROM permissions WHERE key IN (
        'auth.login',
        'auth.view_own_profile',
        'dashboard.view',
        'dashboard.view_metrics',
        'dashboard.filter_metrics',
        'dashboard.metrics.view_all',
        'dashboard.search',
        'schedule.view_list',
        'schedule.filter_advanced',
        'schedule.view_all',
        'schedule.view_assigned',
        'schedule.view_family',
        'schedule.search_availability',
        'schedule.manage_recurring',
        'schedule.dst_migrate',
        'schedule.view_timezones',
        'schedule.view_weekly',
        'schedule.view_workload',
        'schedule.create_class',
        'schedule.delete_class',
        'schedule.clear_weekly',
        'session.view_details',
        'session.activate_class',
        'session.activate_override',
        'session.update_status.start',
        'session.update_status.absent',
        'session.update_status.leave',
        'session.reschedule',
        'session.reset',
        'session.override_actions',
        'history.view_calendar',
        'history.view_details',
        'teacher.view_dashboard',
        'teacher.view_students',
        'teacher.view_own_profile',
        'system.enforce_time_window',
        'system.enforce_leave_limit',
        'system.bulk_update_dst',
        'system.sync_notifications',
        'system.enforce_suspended_lock',
        'system.process_student_leave',
        'system.restrict_resource_access',
        'system.dispatch_email',
        'teachers.list',
        'teachers.create',
        'teachers.edit',
        'teachers.manage_schedule',
        'parents.list',
        'parents.create',
        'parents.edit',
        'students.list',
        'students.create',
        'students.edit',
        'students.change_teacher',
        'students.change_status',
        'students.override_quota',
        'invoices.list',
        'invoices.delete',
        'invoices.create',
        'invoices.mark_paid',
        'invoices.edit',
        'resources.list',
        'resources.delete',
        'resources.upload',
        'reports.generate',
        'complaints.list',
        'complaints.delete',
        'complaints.respond',
        'staff.list',
        'staff.create',
        'staff.edit',
        'staff.view_directory',
        'staff.edit_profile',
        'permission_groups.manage',
        'permission_groups.assign',
        'notification.view_alerts',
        'billing.view_unpaid_invoices',
        'billing.view_history',
        'billing.create_invoice',
        'billing.update_status_paid',
        'billing.delete_invoice',
        'user.view_profile',
        'parent.view_directory',
        'parent.view_profile',
        'parent.view_students',
        'parent.view_own_profile',
        'parent.manage_status',
        'student.view_associated',
        'student.edit_quota',
        'student.reassign_teacher',
        'student.manage_status',
        'document.manage_parent_docs',
        'report.generate_custom',
        'report.view_financials',
        'support.submit_complaint',
        'support.view_history',
        'communication.submit_suggestion',
        'suggestions.list',
        'suggestions.review',
        'suggestions.delete'
    )
);
--> statement-breakpoint

INSERT INTO
    group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM
    permission_groups g,
    permissions p
WHERE
    g.slug = 'super_admin'
    AND p.key IN (
        'auth.login',
        'auth.view_own_profile',
        'dashboard.view',
        'dashboard.view_metrics',
        'dashboard.filter_metrics',
        'dashboard.metrics.view_all',
        'dashboard.search',
        'schedule.view_list',
        'schedule.filter_advanced',
        'schedule.view_all',
        'schedule.view_assigned',
        'schedule.view_family',
        'schedule.search_availability',
        'schedule.manage_recurring',
        'schedule.dst_migrate',
        'schedule.view_timezones',
        'session.view_details',
        'session.activate_class',
        'session.activate_override',
        'session.update_status.start',
        'session.update_status.absent',
        'session.update_status.leave',
        'session.reschedule',
        'session.reset',
        'session.override_actions',
        'history.view_calendar',
        'history.view_details',
        'teacher.view_dashboard',
        'teacher.view_students',
        'teacher.view_own_profile',
        'system.enforce_time_window',
        'system.enforce_leave_limit',
        'teachers.list',
        'teachers.create',
        'teachers.edit',
        'teachers.manage_schedule',
        'parents.list',
        'parents.create',
        'parents.edit',
        'students.list',
        'students.create',
        'students.edit',
        'students.change_teacher',
        'students.change_status',
        'students.override_quota',
        'invoices.list',
        'invoices.delete',
        'invoices.create',
        'invoices.mark_paid',
        'invoices.edit',
        'resources.list',
        'resources.delete',
        'resources.upload',
        'reports.generate',
        'complaints.list',
        'complaints.delete',
        'complaints.respond',
        'staff.list',
        'staff.create',
        'staff.edit',
        'permission_groups.manage',
        'permission_groups.assign',
        'notification.view_alerts',
        'billing.view_unpaid_invoices',
        'user.view_profile',
        'staff.view_directory',
        'schedule.view_weekly',
        'schedule.view_workload',
        'schedule.create_class',
        'schedule.delete_class',
        'schedule.clear_weekly',
        'staff.edit_profile',
        'system.bulk_update_dst',
        'parent.view_directory',
        'parent.view_profile',
        'parent.view_students',
        'parent.view_own_profile',
        'parent.manage_status',
        'student.view_associated',
        'student.edit_quota',
        'billing.view_history',
        'document.manage_parent_docs',
        'billing.create_invoice',
        'billing.update_status_paid',
        'billing.delete_invoice',
        'student.reassign_teacher',
        'student.manage_status',
        'system.sync_notifications',
        'report.generate_custom',
        'report.view_financials',
        'support.submit_complaint',
        'support.view_history',
        'communication.submit_suggestion',
        'system.dispatch_email',
        'suggestions.list',
        'suggestions.review',
        'suggestions.delete',
        'billing.view_exchange_rates',
        'billing.refresh_exchange_rates'
    );
--> statement-breakpoint

INSERT INTO
    group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM
    permission_groups g,
    permissions p
WHERE
    g.slug = 'academy_admin'
    AND p.key IN (
        'auth.login',
        'auth.view_own_profile',
        'dashboard.view_metrics',
        'dashboard.filter_metrics',
        'dashboard.search',
        'schedule.view_list',
        'schedule.filter_advanced',
        'schedule.view_timezones',
        'history.view_calendar',
        'history.view_details',
        'session.override_actions',
        'session.view_details',
        'session.activate_override',
        'session.reschedule',
        'session.reset',
        'session.update_status.start',
        'session.update_status.absent',
        'session.update_status.leave',
        'notification.view_alerts',
        'billing.view_unpaid_invoices',
        'user.view_profile',
        'schedule.search_availability',
        'staff.view_directory',
        'schedule.view_weekly',
        'schedule.view_workload',
        'schedule.create_class',
        'schedule.delete_class',
        'schedule.clear_weekly',
        'staff.edit_profile',
        'parent.view_directory',
        'parent.view_profile',
        'parent.manage_status',
        'student.view_associated',
        'student.edit_quota',
        'billing.view_history',
        'document.manage_parent_docs',
        'billing.create_invoice',
        'billing.update_status_paid',
        'billing.delete_invoice',
        'student.reassign_teacher',
        'student.manage_status',
        'students.list',
        'students.create',
        'resources.list',
        'resources.upload',
        'resources.delete',
        'report.generate_custom',
        'report.view_financials',
        'teachers.create',
        'parents.create',
        'complaints.list',
        'complaints.delete',
        'complaints.respond',
        'suggestions.list',
        'suggestions.review',
        'billing.view_exchange_rates',
        'billing.refresh_exchange_rates'
    );
--> statement-breakpoint

INSERT INTO
    group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM
    permission_groups g,
    permissions p
WHERE
    g.slug = 'teacher_default'
    AND p.key IN (
        'dashboard.view',
        'session.view_details',
        'schedule.view_assigned',
        'session.activate_class',
        'session.update_status.start',
        'session.update_status.absent',
        'session.update_status.leave',
        'teacher.view_dashboard',
        'teacher.view_students',
        'teacher.view_own_profile',
        'resources.list',
        'schedule.view_weekly',
        'schedule.view_workload'
    );
--> statement-breakpoint

INSERT INTO
    group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM
    permission_groups g,
    permissions p
WHERE
    g.slug = 'parent_default'
    AND p.key IN (
        'dashboard.view',
        'schedule.view_family',
        'session.view_details',
        'session.update_status.leave',
        'support.submit_complaint',
        'support.view_history',
        'communication.submit_suggestion',
        'billing.view_history',
        'billing.submit_payment_proof',
        'parent.view_students',
        'parent.view_own_profile'
    );
--> statement-breakpoint

INSERT INTO
    group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM
    permission_groups g,
    permissions p
WHERE
    g.slug = 'staff_default'
    AND p.key IN (
        'dashboard.view',
        'dashboard.metrics.view_all',
        'schedule.view_all',
        'session.view_details',
        'teachers.list',
        'parents.list',
        'students.list',
        'complaints.list'
    );
--> statement-breakpoint

INSERT INTO
    group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM
    permission_groups g,
    permissions p
WHERE
    g.slug = 'system_automated'
    AND p.key IN (
        'system.enforce_time_window',
        'system.enforce_leave_limit',
        'system.sync_notifications',
        'system.enforce_suspended_lock',
        'system.process_student_leave',
        'system.restrict_resource_access',
        'system.dispatch_email'
    );
--> statement-breakpoint

-- Triggers to protect system permissions and groups from deletion or mutation of is_system
CREATE OR REPLACE FUNCTION protect_system_permissions()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.is_system = true THEN
            RAISE EXCEPTION 'Cannot delete a system permission or group';
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
        IF TG_TABLE_NAME = 'permissions' AND NEW.is_system = true THEN
            RAISE EXCEPTION 'Cannot create system permissions';
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF TG_TABLE_NAME = 'permissions' AND NEW.is_system = true AND (OLD.is_system = false OR OLD.is_system IS NULL) THEN
            RAISE EXCEPTION 'Cannot change is_system to true';
        END IF;

        IF OLD.is_system = true THEN
            IF NEW.is_system = false THEN
                RAISE EXCEPTION 'Cannot change is_system from true to false for system permissions or groups';
            END IF;

            IF TG_TABLE_NAME = 'permissions' THEN
                IF NEW.key IS DISTINCT FROM OLD.key OR 
                   NEW.resource IS DISTINCT FROM OLD.resource OR 
                   NEW.action IS DISTINCT FROM OLD.action THEN
                    RAISE EXCEPTION 'Cannot modify core properties of system permissions; only description and category can be updated';
                END IF;
            ELSIF TG_TABLE_NAME = 'permission_groups' THEN
                IF NEW.slug IS DISTINCT FROM OLD.slug THEN
                    RAISE EXCEPTION 'Cannot modify core properties of system permission groups; only name and description can be updated';
                END IF;
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

DROP TRIGGER IF EXISTS trg_protect_system_permissions ON permissions;
--> statement-breakpoint

CREATE TRIGGER trg_protect_system_permissions
BEFORE INSERT OR UPDATE OR DELETE ON permissions
FOR EACH ROW EXECUTE FUNCTION protect_system_permissions();
--> statement-breakpoint

DROP TRIGGER IF EXISTS trg_protect_system_permission_groups ON permission_groups;
--> statement-breakpoint

CREATE TRIGGER trg_protect_system_permission_groups
BEFORE UPDATE OR DELETE ON permission_groups
FOR EACH ROW EXECUTE FUNCTION protect_system_permissions();
--> statement-breakpoint

-- Source: 30-a-class_instances_rls_policies.sql
-- Class Instance RLS policies for scoping access based on current_user_id()

ALTER TABLE "class_instances" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "class_instances" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint

DROP POLICY IF EXISTS class_instances_access_select_policy ON "class_instances";
--> statement-breakpoint
CREATE POLICY class_instances_access_select_policy ON "class_instances"
AS RESTRICTIVE FOR SELECT
USING (
  deleted_at IS NULL
  AND (
    (NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = current_user_id()) AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
    OR
    (teacher_id = (SELECT id FROM teachers WHERE user_id = current_user_id()))
    OR
    (student_id IN (SELECT id FROM students WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())))
  )
);
--> statement-breakpoint

DROP POLICY IF EXISTS class_instances_access_update_policy ON "class_instances";
--> statement-breakpoint
CREATE POLICY class_instances_access_update_policy ON "class_instances"
AS RESTRICTIVE FOR UPDATE
USING (
  deleted_at IS NULL
  AND (
    (NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = current_user_id()) AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
    OR
    (teacher_id = (SELECT id FROM teachers WHERE user_id = current_user_id()))
    OR
    (student_id IN (SELECT id FROM students WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())))
  )
)
WITH CHECK (
  (deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true'))
  AND (
    (NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = current_user_id()) AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
    OR
    (teacher_id = (SELECT id FROM teachers WHERE user_id = current_user_id()))
    OR
    (student_id IN (SELECT id FROM students WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())))
  )
);
--> statement-breakpoint


-- Source: 30-b-class_instances_state_transition_trigger.sql
-- State Machine transition triggers for class_instances

CREATE OR REPLACE FUNCTION fn_enforce_class_instance_transition()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.execution_state IS DISTINCT FROM NEW.execution_state THEN
        -- COMPLETED can only transition to NOT_ACTIVATED (revert) or remain COMPLETED
        IF OLD.execution_state = 'COMPLETED' AND NEW.execution_state IN ('ACTIVATED', 'RUNNING') THEN
            RAISE EXCEPTION 'Invalid transition: Cannot reactivate a COMPLETED class instance.';
        END IF;

        -- COMPLETED+TAKEN cannot be reset to NOT_ACTIVATED (financial integrity)
        IF OLD.execution_state = 'COMPLETED' AND NEW.execution_state = 'NOT_ACTIVATED' AND OLD.outcome = 'TAKEN' THEN
            RAISE EXCEPTION 'Invalid transition: Cannot reset a COMPLETED instance with TAKEN outcome.';
        END IF;

        -- RUNNING cannot transition to ACTIVATED
        IF OLD.execution_state = 'RUNNING' AND NEW.execution_state = 'ACTIVATED' THEN
            RAISE EXCEPTION 'Invalid transition: Cannot move a RUNNING class instance back to ACTIVATED.';
        END IF;

        -- ACTIVATED can only transition to COMPLETED if outcome is ABSENT or LEAVE
        IF OLD.execution_state = 'ACTIVATED' AND NEW.execution_state = 'COMPLETED' AND NEW.outcome NOT IN ('ABSENT', 'LEAVE') THEN
            RAISE EXCEPTION 'Invalid transition: ACTIVATED instance can only complete with ABSENT or LEAVE outcome.';
        END IF;

        -- NOT_ACTIVATED can only transition to COMPLETED with LEAVE or ABSENT (system auto-miss) outcome
        IF OLD.execution_state = 'NOT_ACTIVATED' AND NEW.execution_state = 'COMPLETED' AND NEW.outcome NOT IN ('LEAVE', 'ABSENT') THEN
            RAISE EXCEPTION 'Invalid transition: NOT_ACTIVATED instance can only complete with LEAVE or ABSENT outcome.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql STABLE;
--> statement-breakpoint

DROP TRIGGER IF EXISTS trg_enforce_class_instance_transition ON class_instances;
--> statement-breakpoint
CREATE TRIGGER trg_enforce_class_instance_transition
BEFORE UPDATE ON class_instances
FOR EACH ROW EXECUTE FUNCTION fn_enforce_class_instance_transition();
--> statement-breakpoint


-- Source: 30-c-class_instances_auto_miss_transition.sql
-- Allow NOT_ACTIVATED instances to complete as ABSENT when the system auto-marks missed classes.

CREATE OR REPLACE FUNCTION fn_enforce_class_instance_transition()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.execution_state IS DISTINCT FROM NEW.execution_state THEN
        -- COMPLETED can only transition to NOT_ACTIVATED (revert) or remain COMPLETED
        IF OLD.execution_state = 'COMPLETED' AND NEW.execution_state IN ('ACTIVATED', 'RUNNING') THEN
            RAISE EXCEPTION 'Invalid transition: Cannot reactivate a COMPLETED class instance.';
        END IF;

        -- COMPLETED+TAKEN cannot be reset to NOT_ACTIVATED (financial integrity)
        IF OLD.execution_state = 'COMPLETED' AND NEW.execution_state = 'NOT_ACTIVATED' AND OLD.outcome = 'TAKEN' THEN
            RAISE EXCEPTION 'Invalid transition: Cannot reset a COMPLETED instance with TAKEN outcome.';
        END IF;

        -- RUNNING cannot transition to ACTIVATED
        IF OLD.execution_state = 'RUNNING' AND NEW.execution_state = 'ACTIVATED' THEN
            RAISE EXCEPTION 'Invalid transition: Cannot move a RUNNING class instance back to ACTIVATED.';
        END IF;

        -- ACTIVATED can only transition to COMPLETED if outcome is ABSENT or LEAVE
        IF OLD.execution_state = 'ACTIVATED' AND NEW.execution_state = 'COMPLETED' AND NEW.outcome NOT IN ('ABSENT', 'LEAVE') THEN
            RAISE EXCEPTION 'Invalid transition: ACTIVATED instance can only complete with ABSENT or LEAVE outcome.';
        END IF;

        -- NOT_ACTIVATED can only transition to COMPLETED with LEAVE or ABSENT (system auto-miss) outcome
        IF OLD.execution_state = 'NOT_ACTIVATED' AND NEW.execution_state = 'COMPLETED' AND NEW.outcome NOT IN ('LEAVE', 'ABSENT') THEN
            RAISE EXCEPTION 'Invalid transition: NOT_ACTIVATED instance can only complete with LEAVE or ABSENT outcome.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql STABLE;
--> statement-breakpoint


-- Source: 4-class_categories_and_subjects.sql
-- Migration 4: Class Categories, Subjects, Subject Resources, Teacher Important Notes
-- Creates 4 new tables, adds subject_id FK to recurring_schedules and class_instances,
-- adds 13 new permissions to app_permission enum.

-- ============================================================
-- 1. CREATE TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS class_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(200) NOT NULL,
  slug varchar(100) NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz(3) NOT NULL DEFAULT NOW(),
  updated_at timestamptz(3) NOT NULL DEFAULT NOW(),
  deleted_at timestamptz(3)
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS class_categories_slug_idx ON class_categories (slug);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS class_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES class_categories(id) ON DELETE RESTRICT,
  name varchar(200) NOT NULL,
  slug varchar(100) NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz(3) NOT NULL DEFAULT NOW(),
  updated_at timestamptz(3) NOT NULL DEFAULT NOW(),
  deleted_at timestamptz(3)
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS class_subjects_category_id_idx ON class_subjects (category_id);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS class_subjects_slug_idx ON class_subjects (slug);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS subject_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES class_subjects(id) ON DELETE CASCADE,
  learning_resource_id uuid NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
  resource_type varchar(50),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz(3) NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS subject_resources_subject_id_learning_resource_id_idx ON subject_resources (subject_id, learning_resource_id);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS teacher_important_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teachers(id) ON DELETE RESTRICT,
  title varchar(300) NOT NULL,
  body text,
  is_published boolean NOT NULL DEFAULT false,
  priority integer NOT NULL DEFAULT 0,
  starts_at timestamptz(3),
  expires_at timestamptz(3),
  created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz(3) NOT NULL DEFAULT NOW(),
  updated_at timestamptz(3) NOT NULL DEFAULT NOW(),
  deleted_at timestamptz(3)
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS teacher_important_notes_teacher_id_idx ON teacher_important_notes (teacher_id);
--> statement-breakpoint

-- ============================================================
-- 2. ALTER TABLE — Add subject_id FK to scheduling tables
-- ============================================================

ALTER TABLE recurring_schedules
  ADD COLUMN IF NOT EXISTS subject_id uuid REFERENCES class_subjects(id) ON DELETE RESTRICT;
--> statement-breakpoint

ALTER TABLE class_instances
  ADD COLUMN IF NOT EXISTS subject_id uuid REFERENCES class_subjects(id) ON DELETE RESTRICT;
--> statement-breakpoint

-- subject_id indexes are created by the drizzle schema migration (same_sphinx);
-- CONCURRENTLY cannot run inside drizzle's transactional migrator.

-- ============================================================
-- 3. ALTER TYPE — Add 13 new permission values to app_permission enum
-- ============================================================

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'subjects.list';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'subjects.create';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'subjects.update';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'subjects.delete';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'categories.list';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'categories.create';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'categories.update';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'categories.delete';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'subjects.view_resources';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'subjects.manage_resources';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'notes.list';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'notes.create';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'notes.update';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'notes.delete';
--> statement-breakpoint


-- Source: 4-fx_exchange_rate_permissions.sql
-- Migration: FX Exchange Rate Permissions (incremental)
-- Adds `billing.view_exchange_rates` and `billing.refresh_exchange_rates` system permissions
-- for existing databases where `3-system_permissions_and_groups.sql` has already run.
-- For clean databases, `3-system_permissions_and_groups.sql` now includes these permissions
-- directly, so this migration is idempotent (ON CONFLICT DO UPDATE / DO NOTHING).

-- Enum values must be added before the trigger-disabled INSERT, and ALTER TYPE ... ADD VALUE
-- cannot run inside a transaction block, so it sits above the DO $$ block.
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'billing.view_exchange_rates';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'billing.refresh_exchange_rates';
--> statement-breakpoint

-- Temporarily disable the system permission trigger to allow INSERT with is_system = true.
-- Uses DO block so the trigger is re-enabled even if INSERT fails.
DO $$
BEGIN
  ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not disable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint

-- ============================================================
-- INSERT INTO permissions — 2 new FX permission keys (idempotent upsert)
-- ============================================================

INSERT INTO permissions (id, key, resource, action, description, category, is_system)
VALUES
  (
    gen_random_uuid(),
    'billing.view_exchange_rates'::app_permission,
    'billing',
    'view_exchange_rates',
    '{"ar": "عرض أسعار صرف العملات وآخر حالة مزامنة", "en": "View currency exchange rates and latest sync status"}'::jsonb,
    '{"ar": "الفوترة", "en": "Billing"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'billing.refresh_exchange_rates'::app_permission,
    'billing',
    'refresh_exchange_rates',
    '{"ar": "تشغيل مزامنة أسعار صرف العملات يدوياً", "en": "Trigger manual currency exchange rate refresh"}'::jsonb,
    '{"ar": "الفوترة", "en": "Billing"}'::jsonb,
    true
  )
ON CONFLICT (key) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_system = EXCLUDED.is_system;
--> statement-breakpoint

-- Re-enable the trigger (guaranteed even if INSERT failed above)
DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint

-- ============================================================
-- Grant permissions to super_admin and academy_admin groups (idempotent)
-- ============================================================

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'super_admin'
  AND p.key IN (
    'billing.view_exchange_rates',
    'billing.refresh_exchange_rates'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'academy_admin'
  AND p.key IN (
    'billing.view_exchange_rates',
    'billing.refresh_exchange_rates'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint


-- Source: 4a-class_categories_and_subjects_seed.sql
-- Migration 4-seed: Seed data for class categories, subjects, permissions, and settings
-- MUST run AFTER 4-class_categories_and_subjects.sql in a separate transaction.
-- The app_permission enum values must be committed before this runs.

-- Temporarily disable the system permission trigger to allow INSERT with is_system = true
-- Uses DO block to ensure trigger is re-enabled even if INSERT fails
DO $$
BEGIN
  ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not disable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint

-- ============================================================
-- 1. INSERT INTO permissions — 13 new permission keys
-- ============================================================

INSERT INTO permissions (id, key, resource, action, description, category, is_system)
VALUES
  (gen_random_uuid(), 'subjects.list'::app_permission, 'subjects', 'list', '{"ar": "List class subjects", "en": "List class subjects"}'::jsonb, '{"ar": "Subjects", "en": "Subjects"}'::jsonb, true),
  (gen_random_uuid(), 'subjects.create'::app_permission, 'subjects', 'create', '{"ar": "Create class subjects", "en": "Create class subjects"}'::jsonb, '{"ar": "Subjects", "en": "Subjects"}'::jsonb, true),
  (gen_random_uuid(), 'subjects.update'::app_permission, 'subjects', 'update', '{"ar": "Update class subjects", "en": "Update class subjects"}'::jsonb, '{"ar": "Subjects", "en": "Subjects"}'::jsonb, true),
  (gen_random_uuid(), 'subjects.delete'::app_permission, 'subjects', 'delete', '{"ar": "Delete class subjects", "en": "Delete class subjects"}'::jsonb, '{"ar": "Subjects", "en": "Subjects"}'::jsonb, true),
  (gen_random_uuid(), 'categories.list'::app_permission, 'categories', 'list', '{"ar": "List class categories", "en": "List class categories"}'::jsonb, '{"ar": "Categories", "en": "Categories"}'::jsonb, true),
  (gen_random_uuid(), 'categories.create'::app_permission, 'categories', 'create', '{"ar": "Create class categories", "en": "Create class categories"}'::jsonb, '{"ar": "Categories", "en": "Categories"}'::jsonb, true),
  (gen_random_uuid(), 'categories.update'::app_permission, 'categories', 'update', '{"ar": "Update class categories", "en": "Update class categories"}'::jsonb, '{"ar": "Categories", "en": "Categories"}'::jsonb, true),
  (gen_random_uuid(), 'categories.delete'::app_permission, 'categories', 'delete', '{"ar": "Delete class categories", "en": "Delete class categories"}'::jsonb, '{"ar": "Categories", "en": "Categories"}'::jsonb, true),
  (gen_random_uuid(), 'subjects.view_resources'::app_permission, 'subjects', 'view_resources', '{"ar": "View subject resources", "en": "View subject resources"}'::jsonb, '{"ar": "Subjects", "en": "Subjects"}'::jsonb, true),
  (gen_random_uuid(), 'subjects.manage_resources'::app_permission, 'subjects', 'manage_resources', '{"ar": "Attach and detach subject resources", "en": "Attach and detach subject resources"}'::jsonb, '{"ar": "Subjects", "en": "Subjects"}'::jsonb, true),
  (gen_random_uuid(), 'notes.list'::app_permission, 'notes', 'list', '{"ar": "List teacher important notes", "en": "List teacher important notes"}'::jsonb, '{"ar": "Notes", "en": "Notes"}'::jsonb, true),
  (gen_random_uuid(), 'notes.create'::app_permission, 'notes', 'create', '{"ar": "Create teacher important notes", "en": "Create teacher important notes"}'::jsonb, '{"ar": "Notes", "en": "Notes"}'::jsonb, true),
  (gen_random_uuid(), 'notes.update'::app_permission, 'notes', 'update', '{"ar": "Update teacher important notes", "en": "Update teacher important notes"}'::jsonb, '{"ar": "Notes", "en": "Notes"}'::jsonb, true),
  (gen_random_uuid(), 'notes.delete'::app_permission, 'notes', 'delete', '{"ar": "Delete teacher important notes", "en": "Delete teacher important notes"}'::jsonb, '{"ar": "Notes", "en": "Notes"}'::jsonb, true)
ON CONFLICT (key) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_system = EXCLUDED.is_system;
--> statement-breakpoint

-- Re-enable the trigger (guaranteed even if INSERT fails above)
DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint

-- ============================================================
-- 2. INSERT INTO group_permissions — assign to super_admin + academy_admin
-- ============================================================

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE g.slug = 'super_admin'
  AND p.key IN (
    'subjects.list',
    'subjects.create',
    'subjects.update',
    'subjects.delete',
    'categories.list',
    'categories.create',
    'categories.update',
    'categories.delete',
    'subjects.view_resources',
    'subjects.manage_resources',
    'notes.list',
    'notes.create',
    'notes.update',
    'notes.delete'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE g.slug = 'academy_admin'
  AND p.key IN (
    'subjects.list',
    'subjects.create',
    'subjects.update',
    'subjects.delete',
    'categories.list',
    'categories.create',
    'categories.update',
    'categories.delete',
    'subjects.view_resources',
    'subjects.manage_resources',
    'notes.list',
    'notes.create',
    'notes.update',
    'notes.delete'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

-- ============================================================
-- 3. INSERT default categories and subjects
-- ============================================================

INSERT INTO class_categories (name, slug, description, is_active, sort_order)
VALUES
  ('Quran', 'quran', 'Quran recitation and memorization studies', true, 1),
  ('Arabic Language', 'arabic-language', 'Arabic language and grammar studies', true, 2),
  ('Islamic Studies', 'islamic-studies', 'Islamic studies including fiqh, aqidah, and seerah', true, 3)
ON CONFLICT (slug) DO NOTHING;
--> statement-breakpoint

INSERT INTO class_subjects (category_id, name, slug, description, is_active, sort_order)
SELECT cat.id, 'Quran Recitation', 'quran-recitation', 'Quran recitation practice and tajweed', true, 1
FROM class_categories cat WHERE cat.slug = 'quran'
ON CONFLICT (slug) DO NOTHING;
--> statement-breakpoint

INSERT INTO class_subjects (category_id, name, slug, description, is_active, sort_order)
SELECT cat.id, 'Quran Memorization', 'quran-memorization', 'Hifz — Quran memorization and review', true, 2
FROM class_categories cat WHERE cat.slug = 'quran'
ON CONFLICT (slug) DO NOTHING;
--> statement-breakpoint

INSERT INTO class_subjects (category_id, name, slug, description, is_active, sort_order)
SELECT cat.id, 'Arabic Grammar', 'arabic-grammar', 'Nahw and Sarf — Arabic grammar foundations', true, 1
FROM class_categories cat WHERE cat.slug = 'arabic-language'
ON CONFLICT (slug) DO NOTHING;
--> statement-breakpoint

INSERT INTO class_subjects (category_id, name, slug, description, is_active, sort_order)
SELECT cat.id, 'Arabic Conversation', 'arabic-conversation', 'Arabic speaking and conversation practice', true, 2
FROM class_categories cat WHERE cat.slug = 'arabic-language'
ON CONFLICT (slug) DO NOTHING;
--> statement-breakpoint

INSERT INTO class_subjects (category_id, name, slug, description, is_active, sort_order)
SELECT cat.id, 'Fiqh', 'fiqh', 'Islamic jurisprudence and rulings', true, 1
FROM class_categories cat WHERE cat.slug = 'islamic-studies'
ON CONFLICT (slug) DO NOTHING;
--> statement-breakpoint

INSERT INTO class_subjects (category_id, name, slug, description, is_active, sort_order)
SELECT cat.id, 'Aqidah', 'aqidah', 'Islamic creed and theology', true, 2
FROM class_categories cat WHERE cat.slug = 'islamic-studies'
ON CONFLICT (slug) DO NOTHING;
--> statement-breakpoint

INSERT INTO class_subjects (category_id, name, slug, description, is_active, sort_order)
SELECT cat.id, 'Seerah', 'seerah', 'Prophetic biography and life of the Prophet', true, 3
FROM class_categories cat WHERE cat.slug = 'islamic-studies'
ON CONFLICT (slug) DO NOTHING;
--> statement-breakpoint


-- Source: 4b-teacher_support_contact_setting.sql
-- Migration 4b: Teacher Support Contact System Setting
-- Inserts the teacher_support_contact_staff_profile_id setting into system_settings.

INSERT INTO system_settings (key, value, data_type, description, category, updated_at)
VALUES (
  'teacher_support_contact_staff_profile_id',
  '',
  'string',
  'Staff profile ID of the teacher support coordinator displayed on the teacher schedule page',
  'Scheduling',
  NOW()
)
ON CONFLICT (key) DO UPDATE SET
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  updated_at = NOW();
--> statement-breakpoint


-- Source: 5-billing_fx_admin_permissions.sql
-- Migration: Billing FX Admin Permissions (incremental)
-- Adds billing.manage_fx_provider, billing.override_exchange_rates, billing.manage_currency_hedges

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'billing.manage_fx_provider';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'billing.override_exchange_rates';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'billing.manage_currency_hedges';
--> statement-breakpoint

DO $$
BEGIN
  ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not disable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint

INSERT INTO permissions (id, key, resource, action, description, category, is_system)
VALUES
  (
    gen_random_uuid(),
    'billing.manage_fx_provider'::app_permission,
    'billing',
    'manage_fx_provider',
    '{"ar": "إدارة مزود أسعار صرف العملات", "en": "Manage FX rate provider configuration"}'::jsonb,
    '{"ar": "الفوترة", "en": "Billing"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'billing.override_exchange_rates'::app_permission,
    'billing',
    'override_exchange_rates',
    '{"ar": "تجاوز أسعار صرف العملات يدوياً", "en": "Manually override currency exchange rates"}'::jsonb,
    '{"ar": "الفوترة", "en": "Billing"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'billing.manage_currency_hedges'::app_permission,
    'billing',
    'manage_currency_hedges',
    '{"ar": "إدارة تحوطات العملات", "en": "Manage currency hedge positions"}'::jsonb,
    '{"ar": "الفوترة", "en": "Billing"}'::jsonb,
    true
  )
ON CONFLICT (key) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_system = EXCLUDED.is_system;
--> statement-breakpoint

DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'super_admin'
  AND p.key IN (
    'billing.manage_fx_provider',
    'billing.override_exchange_rates',
    'billing.manage_currency_hedges'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'academy_admin'
  AND p.key IN (
    'billing.manage_fx_provider',
    'billing.override_exchange_rates',
    'billing.manage_currency_hedges'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint


-- Source: 6-lms-permissions-and-groups.sql
-- Migration: LMS permissions + supervisor_default / student_default groups
-- Ported from seed-lms-permissions.ts — system permissions must live in migrations, not seeds.

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'lesson_reports.submit';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'lesson_reports.review';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'lesson_reports.approve';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'lesson_reports.reject';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'supervisor.view_dashboard';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.view_own_dashboard';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'credits.manage';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'teacher_dues.view';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'teacher_dues.mark_paid';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'monthly_reports.view';
--> statement-breakpoint

-- Temporarily disable the system permission trigger to allow INSERT with is_system = true
DO $$
BEGIN
  ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not disable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint

INSERT INTO permissions (id, key, resource, action, description, category, is_system)
VALUES
  (
    gen_random_uuid(),
    'lesson_reports.submit'::app_permission,
    'lesson_reports',
    'submit',
    '{"ar": "إرسال تقرير حصة لحصة مكتملة", "en": "Submit a lesson report for a completed class instance"}'::jsonb,
    '{"ar": "تقارير الحصص", "en": "Lesson Reports"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'lesson_reports.review'::app_permission,
    'lesson_reports',
    'review',
    '{"ar": "مراجعة تقارير الحصص المعلقة", "en": "Review pending lesson reports"}'::jsonb,
    '{"ar": "تقارير الحصص", "en": "Lesson Reports"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'lesson_reports.approve'::app_permission,
    'lesson_reports',
    'approve',
    '{"ar": "الموافقة على تقرير حصة معلق", "en": "Approve a pending lesson report"}'::jsonb,
    '{"ar": "تقارير الحصص", "en": "Lesson Reports"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'lesson_reports.reject'::app_permission,
    'lesson_reports',
    'reject',
    '{"ar": "رفض تقرير حصة معلق مع ذكر السبب", "en": "Reject a pending lesson report with a reason"}'::jsonb,
    '{"ar": "تقارير الحصص", "en": "Lesson Reports"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'supervisor.view_dashboard'::app_permission,
    'supervisor',
    'view_dashboard',
    '{"ar": "الوصول إلى لوحة المشرف", "en": "Access the supervisor dashboard"}'::jsonb,
    '{"ar": "المشرف", "en": "Supervisor"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.view_own_dashboard'::app_permission,
    'student',
    'view_own_dashboard',
    '{"ar": "عرض لوحة الطالب الخاصة", "en": "View the students own dashboard"}'::jsonb,
    '{"ar": "الطالب", "en": "Student"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'credits.manage'::app_permission,
    'credits',
    'manage',
    '{"ar": "إدارة رصيد ساعات الطالب (مشتريات / تعديلات)", "en": "Manage student credit ledger entries (purchases / adjustments)"}'::jsonb,
    '{"ar": "الرصيد", "en": "Credits"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'teacher_dues.view'::app_permission,
    'teacher_dues',
    'view',
    '{"ar": "عرض مستحقات المعلم والتقارير الشهرية", "en": "View teacher dues ledger and monthly reports"}'::jsonb,
    '{"ar": "مستحقات المعلمين", "en": "Teacher Dues"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'teacher_dues.mark_paid'::app_permission,
    'teacher_dues',
    'mark_paid',
    '{"ar": "تعليم مستحقات المعلمين كمدفوعة (مفردة أو دفعة)", "en": "Mark teacher dues entries as paid (single or bulk)"}'::jsonb,
    '{"ar": "مستحقات المعلمين", "en": "Teacher Dues"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'monthly_reports.view'::app_permission,
    'monthly_reports',
    'view',
    '{"ar": "عرض التقارير التشغيلية والمالية الشهرية", "en": "View monthly operational and financial reports"}'::jsonb,
    '{"ar": "التقارير", "en": "Reports"}'::jsonb,
    true
  )
ON CONFLICT (key) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_system = EXCLUDED.is_system;
--> statement-breakpoint

DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint


INSERT INTO permission_groups (id, name, description, is_system, slug, created_at, updated_at)
VALUES
  (
    gen_random_uuid(),
    '{"ar": "مشرف", "en": "Supervisor"}'::jsonb,
    '{"ar": "صلاحيات افتراضية لحسابات المشرفين (سير العمل LMS)", "en": "Default permissions for supervisor accounts (LMS workflow)"}'::jsonb,
    true,
    'supervisor_default',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    '{"ar": "طالب", "en": "Student"}'::jsonb,
    '{"ar": "صلاحيات افتراضية لحسابات الطلاب (سير العمل LMS)", "en": "Default permissions for student accounts (LMS workflow)"}'::jsonb,
    true,
    'student_default',
    NOW(),
    NOW()
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_system = EXCLUDED.is_system,
  updated_at = NOW();
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'super_admin'
  AND p.key IN (
    'lesson_reports.submit',
    'lesson_reports.review',
    'lesson_reports.approve',
    'lesson_reports.reject',
    'supervisor.view_dashboard',
    'student.view_own_dashboard',
    'credits.manage',
    'teacher_dues.view',
    'teacher_dues.mark_paid',
    'monthly_reports.view'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'academy_admin'
  AND p.key IN (
    'lesson_reports.submit',
    'lesson_reports.review',
    'lesson_reports.approve',
    'lesson_reports.reject',
    'supervisor.view_dashboard',
    'student.view_own_dashboard',
    'credits.manage',
    'teacher_dues.view',
    'teacher_dues.mark_paid',
    'monthly_reports.view'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint


-- Ensure dashboard.view_metrics is never on supervisor_default (portal routing)
DELETE FROM group_permissions
WHERE group_id = (SELECT id FROM permission_groups WHERE slug = 'supervisor_default')
  AND permission_id = (SELECT id FROM permissions WHERE key = 'dashboard.view_metrics'::app_permission);
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'supervisor_default'
  AND p.key IN (
    'lesson_reports.review',
    'lesson_reports.approve',
    'lesson_reports.reject',
    'supervisor.view_dashboard',
    'monthly_reports.view',
    'teacher_dues.view',
    'teacher_dues.mark_paid',
    'auth.view_own_profile',
    'dashboard.view',
    'schedule.view_list',
    'schedule.view_assigned',
    'session.view_details',
    'history.view_calendar',
    'history.view_details',
    'teachers.list',
    'students.list',
    'complaints.list',
    'complaints.respond',
    'notification.view_alerts',
    'user.view_profile',
    'teacher.view_profile'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'teacher_default'
  AND p.key IN (
    'lesson_reports.submit'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'student_default'
  AND p.key IN (
    'student.view_own_dashboard',
    'auth.view_own_profile',
    'schedule.view_assigned',
    'session.view_details',
    'history.view_calendar',
    'history.view_details',
    'student.student_identity.edit_own',
    'student.student_parent.edit_own',
    'notification.view_alerts'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint



-- Source: 6a-profile-field-permissions.sql
-- Migration: Profile field-group permissions
-- Ported from seed-profile-field-permissions.ts
-- Also grants student_default VIEW_OWN and supervisor_default STAFF_VIEW_OWN.

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'teacher.view_profile';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.core_identity.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.core_identity.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.core_identity.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.core_identity.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.core_contact.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.core_contact.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.core_contact.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.core_contact.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_professional.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_professional.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_professional.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_professional.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_identity.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_identity.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_identity.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_identity.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_social.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_social.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_social.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_social.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_identity.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_identity.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_identity.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_identity.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_billing.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_billing.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_billing.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_billing.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_account.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_account.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_account.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_account.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_students.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_students.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_students.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.parent_students.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_students.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_students.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_students.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.teacher_students.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.staff_role.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.staff_role.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.staff_role.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.staff_role.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.staff_permissions.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.staff_permissions.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.staff_permissions.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.staff_permissions.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.payment_methods.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.payment_methods.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.payment_methods.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.payment_methods.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.meeting_configs.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.meeting_configs.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.meeting_configs.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'profile.meeting_configs.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_identity.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_identity.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_identity.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_identity.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_academic.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_academic.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_academic.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_academic.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_teacher.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_teacher.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_teacher.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_teacher.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_parent.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_parent.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_parent.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_parent.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_schedule.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_schedule.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_schedule.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_schedule.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_history.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_history.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_history.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_history.edit_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_quota_edit.view_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_quota_edit.view_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_quota_edit.edit_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'student.student_quota_edit.edit_other';
--> statement-breakpoint

-- Temporarily disable the system permission trigger to allow INSERT with is_system = true
DO $$
BEGIN
  ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not disable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint

INSERT INTO permissions (id, key, resource, action, description, category, is_system)
VALUES
  (
    gen_random_uuid(),
    'teacher.view_profile'::app_permission,
    'teacher',
    'view_profile',
    '{"ar": "عرض ملفات المعلمين (مستخدمون آخرون)", "en": "View teacher profiles (other users)"}'::jsonb,
    '{"ar": "الملف الشخصي", "en": "Profile"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.core_identity.view_own'::app_permission,
    'profile',
    'core_identity.view_own',
    '{"ar": "عرض core identity الخاص", "en": "View own core identity"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.core_identity.view_other'::app_permission,
    'profile',
    'core_identity.view_other',
    '{"ar": "عرض core identity للآخرين", "en": "View other users core identity"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.core_identity.edit_own'::app_permission,
    'profile',
    'core_identity.edit_own',
    '{"ar": "تعديل core identity الخاص", "en": "Edit own core identity"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.core_identity.edit_other'::app_permission,
    'profile',
    'core_identity.edit_other',
    '{"ar": "تعديل core identity للآخرين", "en": "Edit other users core identity"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.core_contact.view_own'::app_permission,
    'profile',
    'core_contact.view_own',
    '{"ar": "عرض core contact الخاص", "en": "View own core contact"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.core_contact.view_other'::app_permission,
    'profile',
    'core_contact.view_other',
    '{"ar": "عرض core contact للآخرين", "en": "View other users core contact"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.core_contact.edit_own'::app_permission,
    'profile',
    'core_contact.edit_own',
    '{"ar": "تعديل core contact الخاص", "en": "Edit own core contact"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.core_contact.edit_other'::app_permission,
    'profile',
    'core_contact.edit_other',
    '{"ar": "تعديل core contact للآخرين", "en": "Edit other users core contact"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.teacher_professional.view_own'::app_permission,
    'profile',
    'teacher_professional.view_own',
    '{"ar": "عرض teacher professional الخاص", "en": "View own teacher professional"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.teacher_professional.view_other'::app_permission,
    'profile',
    'teacher_professional.view_other',
    '{"ar": "عرض teacher professional للآخرين", "en": "View other users teacher professional"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.teacher_professional.edit_own'::app_permission,
    'profile',
    'teacher_professional.edit_own',
    '{"ar": "تعديل teacher professional الخاص", "en": "Edit own teacher professional"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.teacher_professional.edit_other'::app_permission,
    'profile',
    'teacher_professional.edit_other',
    '{"ar": "تعديل teacher professional للآخرين", "en": "Edit other users teacher professional"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.teacher_identity.view_own'::app_permission,
    'profile',
    'teacher_identity.view_own',
    '{"ar": "عرض teacher identity الخاص", "en": "View own teacher identity"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.teacher_identity.view_other'::app_permission,
    'profile',
    'teacher_identity.view_other',
    '{"ar": "عرض teacher identity للآخرين", "en": "View other users teacher identity"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.teacher_identity.edit_own'::app_permission,
    'profile',
    'teacher_identity.edit_own',
    '{"ar": "تعديل teacher identity الخاص", "en": "Edit own teacher identity"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.teacher_identity.edit_other'::app_permission,
    'profile',
    'teacher_identity.edit_other',
    '{"ar": "تعديل teacher identity للآخرين", "en": "Edit other users teacher identity"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_social.view_own'::app_permission,
    'profile',
    'parent_social.view_own',
    '{"ar": "عرض parent social الخاص", "en": "View own parent social"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_social.view_other'::app_permission,
    'profile',
    'parent_social.view_other',
    '{"ar": "عرض parent social للآخرين", "en": "View other users parent social"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_social.edit_own'::app_permission,
    'profile',
    'parent_social.edit_own',
    '{"ar": "تعديل parent social الخاص", "en": "Edit own parent social"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_social.edit_other'::app_permission,
    'profile',
    'parent_social.edit_other',
    '{"ar": "تعديل parent social للآخرين", "en": "Edit other users parent social"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_identity.view_own'::app_permission,
    'profile',
    'parent_identity.view_own',
    '{"ar": "عرض parent identity الخاص", "en": "View own parent identity"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_identity.view_other'::app_permission,
    'profile',
    'parent_identity.view_other',
    '{"ar": "عرض parent identity للآخرين", "en": "View other users parent identity"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_identity.edit_own'::app_permission,
    'profile',
    'parent_identity.edit_own',
    '{"ar": "تعديل parent identity الخاص", "en": "Edit own parent identity"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_identity.edit_other'::app_permission,
    'profile',
    'parent_identity.edit_other',
    '{"ar": "تعديل parent identity للآخرين", "en": "Edit other users parent identity"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_billing.view_own'::app_permission,
    'profile',
    'parent_billing.view_own',
    '{"ar": "عرض parent billing الخاص", "en": "View own parent billing"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_billing.view_other'::app_permission,
    'profile',
    'parent_billing.view_other',
    '{"ar": "عرض parent billing للآخرين", "en": "View other users parent billing"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_billing.edit_own'::app_permission,
    'profile',
    'parent_billing.edit_own',
    '{"ar": "تعديل parent billing الخاص", "en": "Edit own parent billing"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_billing.edit_other'::app_permission,
    'profile',
    'parent_billing.edit_other',
    '{"ar": "تعديل parent billing للآخرين", "en": "Edit other users parent billing"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_account.view_own'::app_permission,
    'profile',
    'parent_account.view_own',
    '{"ar": "عرض parent account الخاص", "en": "View own parent account"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_account.view_other'::app_permission,
    'profile',
    'parent_account.view_other',
    '{"ar": "عرض parent account للآخرين", "en": "View other users parent account"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_account.edit_own'::app_permission,
    'profile',
    'parent_account.edit_own',
    '{"ar": "تعديل parent account الخاص", "en": "Edit own parent account"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_account.edit_other'::app_permission,
    'profile',
    'parent_account.edit_other',
    '{"ar": "تعديل parent account للآخرين", "en": "Edit other users parent account"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_students.view_own'::app_permission,
    'profile',
    'parent_students.view_own',
    '{"ar": "عرض parent students الخاص", "en": "View own parent students"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_students.view_other'::app_permission,
    'profile',
    'parent_students.view_other',
    '{"ar": "عرض parent students للآخرين", "en": "View other users parent students"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_students.edit_own'::app_permission,
    'profile',
    'parent_students.edit_own',
    '{"ar": "تعديل parent students الخاص", "en": "Edit own parent students"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.parent_students.edit_other'::app_permission,
    'profile',
    'parent_students.edit_other',
    '{"ar": "تعديل parent students للآخرين", "en": "Edit other users parent students"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.teacher_students.view_own'::app_permission,
    'profile',
    'teacher_students.view_own',
    '{"ar": "عرض teacher students الخاص", "en": "View own teacher students"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.teacher_students.view_other'::app_permission,
    'profile',
    'teacher_students.view_other',
    '{"ar": "عرض teacher students للآخرين", "en": "View other users teacher students"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.teacher_students.edit_own'::app_permission,
    'profile',
    'teacher_students.edit_own',
    '{"ar": "تعديل teacher students الخاص", "en": "Edit own teacher students"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.teacher_students.edit_other'::app_permission,
    'profile',
    'teacher_students.edit_other',
    '{"ar": "تعديل teacher students للآخرين", "en": "Edit other users teacher students"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.staff_role.view_own'::app_permission,
    'profile',
    'staff_role.view_own',
    '{"ar": "عرض staff role الخاص", "en": "View own staff role"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.staff_role.view_other'::app_permission,
    'profile',
    'staff_role.view_other',
    '{"ar": "عرض staff role للآخرين", "en": "View other users staff role"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.staff_role.edit_own'::app_permission,
    'profile',
    'staff_role.edit_own',
    '{"ar": "تعديل staff role الخاص", "en": "Edit own staff role"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.staff_role.edit_other'::app_permission,
    'profile',
    'staff_role.edit_other',
    '{"ar": "تعديل staff role للآخرين", "en": "Edit other users staff role"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.staff_permissions.view_own'::app_permission,
    'profile',
    'staff_permissions.view_own',
    '{"ar": "عرض staff permissions الخاص", "en": "View own staff permissions"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.staff_permissions.view_other'::app_permission,
    'profile',
    'staff_permissions.view_other',
    '{"ar": "عرض staff permissions للآخرين", "en": "View other users staff permissions"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.staff_permissions.edit_own'::app_permission,
    'profile',
    'staff_permissions.edit_own',
    '{"ar": "تعديل staff permissions الخاص", "en": "Edit own staff permissions"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.staff_permissions.edit_other'::app_permission,
    'profile',
    'staff_permissions.edit_other',
    '{"ar": "تعديل staff permissions للآخرين", "en": "Edit other users staff permissions"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.payment_methods.view_own'::app_permission,
    'profile',
    'payment_methods.view_own',
    '{"ar": "عرض payment methods الخاص", "en": "View own payment methods"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.payment_methods.view_other'::app_permission,
    'profile',
    'payment_methods.view_other',
    '{"ar": "عرض payment methods للآخرين", "en": "View other users payment methods"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.payment_methods.edit_own'::app_permission,
    'profile',
    'payment_methods.edit_own',
    '{"ar": "تعديل payment methods الخاص", "en": "Edit own payment methods"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.payment_methods.edit_other'::app_permission,
    'profile',
    'payment_methods.edit_other',
    '{"ar": "تعديل payment methods للآخرين", "en": "Edit other users payment methods"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.meeting_configs.view_own'::app_permission,
    'profile',
    'meeting_configs.view_own',
    '{"ar": "عرض meeting configs الخاص", "en": "View own meeting configs"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.meeting_configs.view_other'::app_permission,
    'profile',
    'meeting_configs.view_other',
    '{"ar": "عرض meeting configs للآخرين", "en": "View other users meeting configs"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.meeting_configs.edit_own'::app_permission,
    'profile',
    'meeting_configs.edit_own',
    '{"ar": "تعديل meeting configs الخاص", "en": "Edit own meeting configs"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'profile.meeting_configs.edit_other'::app_permission,
    'profile',
    'meeting_configs.edit_other',
    '{"ar": "تعديل meeting configs للآخرين", "en": "Edit other users meeting configs"}'::jsonb,
    '{"ar": "حقول الملف الشخصي", "en": "Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_identity.view_own'::app_permission,
    'student',
    'student_identity.view_own',
    '{"ar": "عرض student identity للطالب المرتبط", "en": "View own student student identity"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_identity.view_other'::app_permission,
    'student',
    'student_identity.view_other',
    '{"ar": "عرض student identity لأي طالب", "en": "View any student student identity"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_identity.edit_own'::app_permission,
    'student',
    'student_identity.edit_own',
    '{"ar": "تعديل student identity للطالب المرتبط", "en": "Edit own student student identity"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_identity.edit_other'::app_permission,
    'student',
    'student_identity.edit_other',
    '{"ar": "تعديل student identity لأي طالب", "en": "Edit any student student identity"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_academic.view_own'::app_permission,
    'student',
    'student_academic.view_own',
    '{"ar": "عرض student academic للطالب المرتبط", "en": "View own student student academic"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_academic.view_other'::app_permission,
    'student',
    'student_academic.view_other',
    '{"ar": "عرض student academic لأي طالب", "en": "View any student student academic"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_academic.edit_own'::app_permission,
    'student',
    'student_academic.edit_own',
    '{"ar": "تعديل student academic للطالب المرتبط", "en": "Edit own student student academic"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_academic.edit_other'::app_permission,
    'student',
    'student_academic.edit_other',
    '{"ar": "تعديل student academic لأي طالب", "en": "Edit any student student academic"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_teacher.view_own'::app_permission,
    'student',
    'student_teacher.view_own',
    '{"ar": "عرض student teacher للطالب المرتبط", "en": "View own student student teacher"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_teacher.view_other'::app_permission,
    'student',
    'student_teacher.view_other',
    '{"ar": "عرض student teacher لأي طالب", "en": "View any student student teacher"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_teacher.edit_own'::app_permission,
    'student',
    'student_teacher.edit_own',
    '{"ar": "تعديل student teacher للطالب المرتبط", "en": "Edit own student student teacher"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_teacher.edit_other'::app_permission,
    'student',
    'student_teacher.edit_other',
    '{"ar": "تعديل student teacher لأي طالب", "en": "Edit any student student teacher"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_parent.view_own'::app_permission,
    'student',
    'student_parent.view_own',
    '{"ar": "عرض student parent للطالب المرتبط", "en": "View own student student parent"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_parent.view_other'::app_permission,
    'student',
    'student_parent.view_other',
    '{"ar": "عرض student parent لأي طالب", "en": "View any student student parent"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_parent.edit_own'::app_permission,
    'student',
    'student_parent.edit_own',
    '{"ar": "تعديل student parent للطالب المرتبط", "en": "Edit own student student parent"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_parent.edit_other'::app_permission,
    'student',
    'student_parent.edit_other',
    '{"ar": "تعديل student parent لأي طالب", "en": "Edit any student student parent"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_schedule.view_own'::app_permission,
    'student',
    'student_schedule.view_own',
    '{"ar": "عرض student schedule للطالب المرتبط", "en": "View own student student schedule"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_schedule.view_other'::app_permission,
    'student',
    'student_schedule.view_other',
    '{"ar": "عرض student schedule لأي طالب", "en": "View any student student schedule"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_schedule.edit_own'::app_permission,
    'student',
    'student_schedule.edit_own',
    '{"ar": "تعديل student schedule للطالب المرتبط", "en": "Edit own student student schedule"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_schedule.edit_other'::app_permission,
    'student',
    'student_schedule.edit_other',
    '{"ar": "تعديل student schedule لأي طالب", "en": "Edit any student student schedule"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_history.view_own'::app_permission,
    'student',
    'student_history.view_own',
    '{"ar": "عرض student history للطالب المرتبط", "en": "View own student student history"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_history.view_other'::app_permission,
    'student',
    'student_history.view_other',
    '{"ar": "عرض student history لأي طالب", "en": "View any student student history"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_history.edit_own'::app_permission,
    'student',
    'student_history.edit_own',
    '{"ar": "تعديل student history للطالب المرتبط", "en": "Edit own student student history"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_history.edit_other'::app_permission,
    'student',
    'student_history.edit_other',
    '{"ar": "تعديل student history لأي طالب", "en": "Edit any student student history"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_quota_edit.view_own'::app_permission,
    'student',
    'student_quota_edit.view_own',
    '{"ar": "عرض student quota edit للطالب المرتبط", "en": "View own student student quota edit"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_quota_edit.view_other'::app_permission,
    'student',
    'student_quota_edit.view_other',
    '{"ar": "عرض student quota edit لأي طالب", "en": "View any student student quota edit"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_quota_edit.edit_own'::app_permission,
    'student',
    'student_quota_edit.edit_own',
    '{"ar": "تعديل student quota edit للطالب المرتبط", "en": "Edit own student student quota edit"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'student.student_quota_edit.edit_other'::app_permission,
    'student',
    'student_quota_edit.edit_other',
    '{"ar": "تعديل student quota edit لأي طالب", "en": "Edit any student student quota edit"}'::jsonb,
    '{"ar": "حقول ملف الطالب", "en": "Student Profile Fields"}'::jsonb,
    true
  )
ON CONFLICT (key) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_system = EXCLUDED.is_system;
--> statement-breakpoint

DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint


INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'super_admin'
  AND p.key IN (
    'teacher.view_profile',
    'profile.core_identity.view_own',
    'profile.core_identity.view_other',
    'profile.core_identity.edit_own',
    'profile.core_identity.edit_other',
    'profile.core_contact.view_own',
    'profile.core_contact.view_other',
    'profile.core_contact.edit_own',
    'profile.core_contact.edit_other',
    'profile.teacher_professional.view_own',
    'profile.teacher_professional.view_other',
    'profile.teacher_professional.edit_own',
    'profile.teacher_professional.edit_other',
    'profile.teacher_identity.view_own',
    'profile.teacher_identity.view_other',
    'profile.teacher_identity.edit_own',
    'profile.teacher_identity.edit_other',
    'profile.parent_social.view_own',
    'profile.parent_social.view_other',
    'profile.parent_social.edit_own',
    'profile.parent_social.edit_other',
    'profile.parent_identity.view_own',
    'profile.parent_identity.view_other',
    'profile.parent_identity.edit_own',
    'profile.parent_identity.edit_other',
    'profile.parent_billing.view_own',
    'profile.parent_billing.view_other',
    'profile.parent_billing.edit_own',
    'profile.parent_billing.edit_other',
    'profile.parent_account.view_own',
    'profile.parent_account.view_other',
    'profile.parent_account.edit_own',
    'profile.parent_account.edit_other',
    'profile.parent_students.view_own',
    'profile.parent_students.view_other',
    'profile.parent_students.edit_own',
    'profile.parent_students.edit_other',
    'profile.teacher_students.view_own',
    'profile.teacher_students.view_other',
    'profile.teacher_students.edit_own',
    'profile.teacher_students.edit_other',
    'profile.staff_role.view_own',
    'profile.staff_role.view_other',
    'profile.staff_role.edit_own',
    'profile.staff_role.edit_other',
    'profile.staff_permissions.view_own',
    'profile.staff_permissions.view_other',
    'profile.staff_permissions.edit_own',
    'profile.staff_permissions.edit_other',
    'profile.payment_methods.view_own',
    'profile.payment_methods.view_other',
    'profile.payment_methods.edit_own',
    'profile.payment_methods.edit_other',
    'profile.meeting_configs.view_own',
    'profile.meeting_configs.view_other',
    'profile.meeting_configs.edit_own',
    'profile.meeting_configs.edit_other',
    'student.student_identity.view_own',
    'student.student_identity.view_other',
    'student.student_identity.edit_own',
    'student.student_identity.edit_other',
    'student.student_academic.view_own',
    'student.student_academic.view_other',
    'student.student_academic.edit_own',
    'student.student_academic.edit_other',
    'student.student_teacher.view_own',
    'student.student_teacher.view_other',
    'student.student_teacher.edit_own',
    'student.student_teacher.edit_other',
    'student.student_parent.view_own',
    'student.student_parent.view_other',
    'student.student_parent.edit_own',
    'student.student_parent.edit_other',
    'student.student_schedule.view_own',
    'student.student_schedule.view_other',
    'student.student_schedule.edit_own',
    'student.student_schedule.edit_other',
    'student.student_history.view_own',
    'student.student_history.view_other',
    'student.student_history.edit_own',
    'student.student_history.edit_other',
    'student.student_quota_edit.view_own',
    'student.student_quota_edit.view_other',
    'student.student_quota_edit.edit_own',
    'student.student_quota_edit.edit_other'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'academy_admin'
  AND p.key IN (
    'profile.core_identity.view_other',
    'profile.core_contact.view_other',
    'profile.teacher_professional.view_other',
    'profile.teacher_identity.view_other',
    'profile.parent_social.view_other',
    'profile.parent_identity.view_other',
    'profile.parent_billing.view_other',
    'profile.parent_account.view_other',
    'profile.parent_students.view_other',
    'profile.teacher_students.view_other',
    'profile.staff_role.view_other',
    'profile.staff_permissions.view_other',
    'profile.payment_methods.view_other',
    'profile.meeting_configs.view_other',
    'profile.core_identity.edit_other',
    'profile.core_contact.edit_other',
    'profile.teacher_professional.edit_other',
    'profile.teacher_identity.edit_other',
    'profile.parent_social.edit_other',
    'profile.parent_identity.edit_other',
    'profile.parent_billing.edit_other',
    'profile.parent_account.edit_other',
    'profile.parent_students.edit_other',
    'profile.teacher_students.edit_other',
    'profile.staff_role.edit_other',
    'profile.staff_permissions.edit_other',
    'profile.payment_methods.edit_other',
    'profile.meeting_configs.edit_other',
    'teacher.view_profile',
    'student.student_identity.view_other',
    'student.student_academic.view_other',
    'student.student_teacher.view_other',
    'student.student_parent.view_other',
    'student.student_schedule.view_other',
    'student.student_history.view_other',
    'student.student_quota_edit.view_other',
    'student.student_identity.edit_other',
    'student.student_academic.edit_other',
    'student.student_teacher.edit_other',
    'student.student_parent.edit_other',
    'student.student_schedule.edit_other',
    'student.student_history.edit_other',
    'student.student_quota_edit.edit_other',
    'profile.payment_methods.view_other',
    'profile.meeting_configs.view_other',
    'profile.payment_methods.edit_other',
    'profile.meeting_configs.edit_other'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'teacher_default'
  AND p.key IN (
    'profile.core_identity.view_own',
    'profile.core_contact.view_own',
    'profile.teacher_professional.view_own',
    'profile.teacher_students.view_own',
    'profile.payment_methods.view_own',
    'profile.meeting_configs.view_own',
    'profile.core_identity.edit_own',
    'profile.core_contact.edit_own',
    'profile.teacher_professional.edit_own',
    'profile.payment_methods.edit_own',
    'profile.meeting_configs.edit_own',
    'profile.core_identity.view_other',
    'profile.core_contact.view_other',
    'profile.teacher_professional.view_other',
    'profile.teacher_identity.view_other',
    'profile.teacher_students.view_other',
    'teacher.view_profile',
    'student.student_identity.view_own',
    'student.student_academic.view_own',
    'student.student_teacher.view_own',
    'student.student_schedule.view_own',
    'student.student_history.view_own'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'parent_default'
  AND p.key IN (
    'profile.core_identity.view_own',
    'profile.core_contact.view_own',
    'profile.parent_social.view_own',
    'profile.parent_students.view_own',
    'profile.payment_methods.view_own',
    'profile.meeting_configs.view_own',
    'profile.core_identity.edit_own',
    'profile.core_contact.edit_own',
    'profile.parent_social.edit_own',
    'profile.payment_methods.edit_own',
    'profile.meeting_configs.edit_own',
    'profile.core_identity.view_other',
    'profile.core_contact.view_other',
    'profile.parent_social.view_other',
    'profile.parent_identity.view_other',
    'profile.parent_billing.view_other',
    'profile.parent_account.view_other',
    'profile.parent_students.view_other',
    'profile.payment_methods.view_other',
    'profile.meeting_configs.view_other',
    'student.student_identity.view_own',
    'student.student_academic.view_own',
    'student.student_teacher.view_own',
    'student.student_schedule.view_own',
    'student.student_history.view_own',
    'student.student_quota_edit.edit_own'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'staff_default'
  AND p.key IN (
    'profile.core_identity.view_own',
    'profile.core_contact.view_own',
    'profile.staff_role.view_own',
    'profile.core_identity.view_other',
    'profile.core_contact.view_other',
    'profile.staff_role.view_other',
    'profile.staff_permissions.view_other',
    'profile.staff_role.edit_other',
    'profile.staff_permissions.edit_other'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'student_default'
  AND p.key IN (
    'student.student_identity.view_own',
    'student.student_academic.view_own',
    'student.student_teacher.view_own',
    'student.student_schedule.view_own',
    'student.student_history.view_own'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'supervisor_default'
  AND p.key IN (
    'profile.core_identity.view_own',
    'profile.core_contact.view_own',
    'profile.staff_role.view_own',
    'profile.core_identity.view_other',
    'profile.core_contact.view_other',
    'profile.teacher_professional.view_other',
    'profile.teacher_identity.view_other',
    'profile.parent_social.view_other',
    'profile.parent_identity.view_other',
    'profile.parent_billing.view_other',
    'profile.parent_account.view_other',
    'profile.parent_students.view_other',
    'profile.teacher_students.view_other',
    'profile.staff_role.view_other',
    'profile.staff_permissions.view_other',
    'profile.payment_methods.view_other',
    'profile.meeting_configs.view_other',
    'student.student_identity.view_other',
    'student.student_academic.view_other',
    'student.student_teacher.view_other',
    'student.student_parent.view_other',
    'student.student_schedule.view_other',
    'student.student_history.view_other',
    'student.student_quota_edit.view_other'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

-- LMS portal also grants identity/parent edit_own (permission rows created above)
INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'student_default'
  AND p.key IN (
    'student.student_identity.edit_own',
    'student.student_parent.edit_own'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint


-- Source: 6b-meeting-permissions.sql
-- Migration: Meeting permissions
-- Ported from seed-meeting-permissions.ts

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'meeting_providers.manage_catalog';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'meeting_configs.manage_own';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'meeting_configs.manage_other';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'meeting_configs.manage_class';
--> statement-breakpoint

-- Temporarily disable the system permission trigger to allow INSERT with is_system = true
DO $$
BEGIN
  ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not disable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint

INSERT INTO permissions (id, key, resource, action, description, category, is_system)
VALUES
  (
    gen_random_uuid(),
    'meeting_providers.manage_catalog'::app_permission,
    'meeting_providers',
    'manage_catalog',
    '{"ar": "إدارة كتالوج مزودي الاجتماعات", "en": "Manage meeting provider catalog entries"}'::jsonb,
    '{"ar": "الاجتماعات", "en": "Meeting"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'meeting_configs.manage_own'::app_permission,
    'meeting_configs',
    'manage_own',
    '{"ar": "إدارة إعدادات الاجتماعات الخاصة", "en": "Manage own online meeting configurations"}'::jsonb,
    '{"ar": "الاجتماعات", "en": "Meeting"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'meeting_configs.manage_other'::app_permission,
    'meeting_configs',
    'manage_other',
    '{"ar": "إدارة إعدادات اجتماعات المستخدمين الآخرين", "en": "Manage other users online meeting configurations"}'::jsonb,
    '{"ar": "الاجتماعات", "en": "Meeting"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'meeting_configs.manage_class'::app_permission,
    'meeting_configs',
    'manage_class',
    '{"ar": "إدارة إعدادات الاجتماعات على مستوى الحصة", "en": "Manage class-scoped online meeting configurations"}'::jsonb,
    '{"ar": "الاجتماعات", "en": "Meeting"}'::jsonb,
    true
  )
ON CONFLICT (key) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_system = EXCLUDED.is_system;
--> statement-breakpoint

DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint


INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'super_admin'
  AND p.key IN (
    'meeting_providers.manage_catalog',
    'meeting_configs.manage_own',
    'meeting_configs.manage_other',
    'meeting_configs.manage_class'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'academy_admin'
  AND p.key IN (
    'meeting_providers.manage_catalog',
    'meeting_configs.manage_own',
    'meeting_configs.manage_other',
    'meeting_configs.manage_class'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'teacher_default'
  AND p.key IN (
    'meeting_configs.manage_own'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'parent_default'
  AND p.key IN (
    'meeting_configs.manage_own'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint



-- Source: 6c-payment-method-permissions.sql
-- Migration: Payment method permissions
-- Ported from seed-payment-method-permissions.ts

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'payment_methods.manage_catalogs';
--> statement-breakpoint
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'payment_methods.verify_bank_transfer';
--> statement-breakpoint

-- Temporarily disable the system permission trigger to allow INSERT with is_system = true
DO $$
BEGIN
  ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not disable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint

INSERT INTO permissions (id, key, resource, action, description, category, is_system)
VALUES
  (
    gen_random_uuid(),
    'payment_methods.manage_catalogs'::app_permission,
    'payment_methods',
    'manage_catalogs',
    '{"ar": "إدارة كتالوج طرق الدفع (المحافظ، الروابط، الحسابات الإلكترونية)", "en": "Manage payment method catalog entries (wallets, links, online accounts)"}'::jsonb,
    '{"ar": "طرق الدفع", "en": "Payment Methods"}'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'payment_methods.verify_bank_transfer'::app_permission,
    'payment_methods',
    'verify_bank_transfer',
    '{"ar": "التحقق من طرق التحويل البنكي بعد المراجعة اليدوية", "en": "Verify bank transfer payment methods after manual review"}'::jsonb,
    '{"ar": "طرق الدفع", "en": "Payment Methods"}'::jsonb,
    true
  )
ON CONFLICT (key) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_system = EXCLUDED.is_system;
--> statement-breakpoint

DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint


INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'super_admin'
  AND p.key IN (
    'payment_methods.manage_catalogs',
    'payment_methods.verify_bank_transfer'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g, permissions p
WHERE
  g.slug = 'academy_admin'
  AND p.key IN (
    'payment_methods.manage_catalogs',
    'payment_methods.verify_bank_transfer'
  )
ON CONFLICT DO NOTHING;
--> statement-breakpoint



-- Source: add_test_custom_alt_permission.sql
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'test.custom_alt';
--> statement-breakpoint


-- Source: audit_log_immutability_trigger.sql
-- Trigger to prevent modifications to audit_logs table (immutability enforcement)
-- This ensures audit logs cannot be tampered with for compliance requirements

-- Create trigger function if it doesn't exist for audit_logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'prevent_audit_log_modification'
    ) THEN
        CREATE FUNCTION prevent_audit_log_modification() RETURNS trigger AS $func$
        BEGIN
            RAISE EXCEPTION 'Modifying or deleting audit logs is forbidden';
        END;
        $func$ LANGUAGE plpgsql;
    END IF;
END $$;
--> statement-breakpoint

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS prevent_audit_log_mod_trigger ON audit_logs;
--> statement-breakpoint

-- Create trigger to prevent UPDATE and DELETE operations
CREATE TRIGGER prevent_audit_log_mod_trigger
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();
--> statement-breakpoint

-- Also create trigger for admin_audit_logs table
DROP TRIGGER IF EXISTS prevent_admin_audit_log_mod_trigger ON admin_audit_logs;
--> statement-breakpoint

CREATE TRIGGER prevent_admin_audit_log_mod_trigger
BEFORE UPDATE OR DELETE ON admin_audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();
--> statement-breakpoint


-- Source: auth_rate_limiting.sql
-- Function to record and check auth rate limits
CREATE OR REPLACE FUNCTION check_and_record_auth_attempt(
    p_ip_address INET,
    p_email VARCHAR(255),
    p_max_attempts INTEGER DEFAULT 5,
    p_lockout_minutes INTEGER DEFAULT 15
) 
RETURNS TABLE (
    attempts INTEGER,
    locked_until TIMESTAMP WITH TIME ZONE,
    is_locked BOOLEAN
) AS $$
DECLARE
    v_attempts INTEGER;
    v_locked_until TIMESTAMP WITH TIME ZONE;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Upsert the rate limit record
    INSERT INTO auth_rate_limits (ip_address, email, attempts, locked_until, created_at, updated_at)
    VALUES (
        p_ip_address, 
        p_email, 
        1, 
        CASE WHEN 1 >= p_max_attempts THEN v_now + (p_lockout_minutes || ' minutes')::interval ELSE NULL END,
        v_now, 
        v_now
    )
    ON CONFLICT (ip_address, email) DO UPDATE
    SET 
        attempts = auth_rate_limits.attempts + 1,
        updated_at = v_now,
        locked_until = CASE 
            WHEN auth_rate_limits.attempts + 1 >= p_max_attempts THEN v_now + (p_lockout_minutes || ' minutes')::interval
            ELSE auth_rate_limits.locked_until
        END
    RETURNING auth_rate_limits.attempts, auth_rate_limits.locked_until INTO v_attempts, v_locked_until;

    RETURN QUERY SELECT v_attempts, v_locked_until, (v_locked_until IS NOT NULL AND v_locked_until > v_now);
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

-- Function to reset auth attempts on success
CREATE OR REPLACE FUNCTION reset_auth_attempts(
    p_ip_address INET,
    p_email VARCHAR(255)
) 
RETURNS VOID AS $$
BEGIN
    DELETE FROM auth_rate_limits 
    WHERE ip_address = p_ip_address AND email = p_email;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

-- Function for cleanup of expired tokens and cache
-- NOTE: Full security cleanup including new cache tables is handled in cache_split.sql
CREATE OR REPLACE FUNCTION cleanup_expired_security_data() 
RETURNS VOID AS $$
BEGIN
    -- Cleanup expired auth rate limits (either explicitly locked until past, or old inactive attempts)
    DELETE FROM auth_rate_limits 
    WHERE (locked_until IS NOT NULL AND locked_until < NOW())
       OR (locked_until IS NULL AND updated_at < NOW() - INTERVAL '24 hours');
    
    -- Cleanup expired password reset tokens
    DELETE FROM password_reset_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint



-- Source: books_rls_policies.sql
-- 7. books configuration
ALTER TABLE "books" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "books" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint

DROP POLICY IF EXISTS books_select_policy ON "books";
--> statement-breakpoint
CREATE POLICY books_select_policy ON "books" FOR SELECT USING (deleted_at IS NULL);
--> statement-breakpoint
DROP POLICY IF EXISTS books_insert_policy ON "books";
--> statement-breakpoint
CREATE POLICY books_insert_policy ON "books" FOR INSERT WITH CHECK (deleted_at IS NULL);
--> statement-breakpoint
DROP POLICY IF EXISTS books_update_policy ON "books";
--> statement-breakpoint
CREATE POLICY books_update_policy ON "books" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);
--> statement-breakpoint
DROP POLICY IF EXISTS books_soft_delete_policy ON "books";
--> statement-breakpoint
DROP POLICY IF EXISTS books_delete_policy ON "books";
--> statement-breakpoint
CREATE POLICY books_delete_policy ON "books" FOR DELETE USING (false);
--> statement-breakpoint


-- Source: cache_split.sql
-- Ensure rate_limit_cache is UNLOGGED
-- This is done via ALTER because Drizzle doesn't support UNLOGGED in schema yet
ALTER TABLE IF EXISTS rate_limit_cache SET UNLOGGED;
--> statement-breakpoint

-- Update cleanup function to include the new table and maintain security hygiene
CREATE OR REPLACE FUNCTION cleanup_expired_security_data() 
RETURNS VOID AS $$
BEGIN
    -- Cleanup expired auth rate limits
    DELETE FROM auth_rate_limits 
    WHERE (locked_until IS NOT NULL AND locked_until < NOW())
       OR (locked_until IS NULL AND updated_at < NOW() - INTERVAL '24 hours');
    
    -- Cleanup expired password reset tokens
    DELETE FROM password_reset_tokens WHERE expires_at < NOW();
    
    -- Cleanup expired rate limit cache entries (UNLOGGED)
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'rate_limit_cache') THEN
        DELETE FROM rate_limit_cache WHERE expires_at < NOW();
    END IF;

    -- Cleanup expired session cache entries (LOGGED)
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'session_cache') THEN
        DELETE FROM session_cache WHERE expires_at < NOW();
    END IF;

    -- Legacy cleanup for the old 'cache' table if it still exists
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'cache') THEN
        DELETE FROM cache WHERE expires_at < NOW();
    END IF;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint


-- Source: exclude_jerusalem_timezone.sql
-- Remap legacy Asia/Jerusalem values to Palestine (Asia/Hebron) and reject Jerusalem going forward.

UPDATE users SET timezone = 'Asia/Hebron' WHERE timezone = 'Asia/Jerusalem';
--> statement-breakpoint
UPDATE students SET timezone_override = 'Asia/Hebron' WHERE timezone_override = 'Asia/Jerusalem';
--> statement-breakpoint
UPDATE recurring_schedules SET timezone = 'Asia/Hebron' WHERE timezone = 'Asia/Jerusalem';
--> statement-breakpoint
UPDATE teacher_availability_windows SET timezone = 'Asia/Hebron' WHERE timezone = 'Asia/Jerusalem';
--> statement-breakpoint
UPDATE teacher_recurring_unavailability SET timezone = 'Asia/Hebron' WHERE timezone = 'Asia/Jerusalem';
--> statement-breakpoint
UPDATE teacher_vacation_requests SET timezone = 'Asia/Hebron' WHERE timezone = 'Asia/Jerusalem';
--> statement-breakpoint
UPDATE class_instances SET booking_timezone = 'Asia/Hebron' WHERE booking_timezone = 'Asia/Jerusalem';
--> statement-breakpoint
DELETE FROM timezones WHERE iana_id = 'Asia/Jerusalem';
--> statement-breakpoint

CREATE OR REPLACE FUNCTION is_valid_timezone(tz TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF tz = 'Asia/Jerusalem' THEN
        RETURN FALSE;
    END IF;
    RETURN EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = tz);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
--> statement-breakpoint


-- Source: hours_per_week_recalculation.sql
-- 1. Helper function to update student's hours_per_week
CREATE OR REPLACE FUNCTION update_student_hours_per_week(student_id_val UUID)
RETURNS VOID AS $$
DECLARE
  calculated_hours NUMERIC(5,2);
BEGIN
  SELECT COALESCE(SUM(rs.duration_minutes), 0)::numeric / 60.0
  INTO calculated_hours
  FROM recurring_schedules rs
  JOIN recurring_schedule_days rsd ON rsd.recurring_schedule_id = rs.id
  WHERE rs.student_id = student_id_val
    AND rs.deleted_at IS NULL
    AND rsd.is_active = true;

  UPDATE students
  SET hours_per_week = calculated_hours,
      updated_at = NOW()
  WHERE id = student_id_val;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

-- 2. Trigger function for recurring_schedules changes
CREATE OR REPLACE FUNCTION trg_fn_recurring_schedules_hours_recalc()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_student_hours_per_week(NEW.student_id);
    IF TG_OP = 'UPDATE' AND OLD.student_id <> NEW.student_id THEN
      PERFORM update_student_hours_per_week(OLD.student_id);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_student_hours_per_week(OLD.student_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

-- 3. Trigger function for recurring_schedule_days changes
CREATE OR REPLACE FUNCTION trg_fn_recurring_schedule_days_hours_recalc()
RETURNS TRIGGER AS $$
DECLARE
  target_schedule_id UUID;
  target_student_id UUID;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    target_schedule_id := NEW.recurring_schedule_id;
  ELSIF TG_OP = 'DELETE' THEN
    target_schedule_id := OLD.recurring_schedule_id;
  END IF;

  SELECT student_id INTO target_student_id
  FROM recurring_schedules
  WHERE id = target_schedule_id;

  IF target_student_id IS NOT NULL THEN
    PERFORM update_student_hours_per_week(target_student_id);
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.recurring_schedule_id <> NEW.recurring_schedule_id THEN
    SELECT student_id INTO target_student_id
    FROM recurring_schedules
    WHERE id = OLD.recurring_schedule_id;
    
    IF target_student_id IS NOT NULL THEN
      PERFORM update_student_hours_per_week(target_student_id);
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

-- 4. Create Triggers
DROP TRIGGER IF EXISTS trg_recalc_hours_recurring_schedules ON recurring_schedules;
--> statement-breakpoint
CREATE TRIGGER trg_recalc_hours_recurring_schedules
AFTER INSERT OR UPDATE OR DELETE ON recurring_schedules
FOR EACH ROW EXECUTE FUNCTION trg_fn_recurring_schedules_hours_recalc();
--> statement-breakpoint

DROP TRIGGER IF EXISTS trg_recalc_hours_recurring_schedule_days ON recurring_schedule_days;
--> statement-breakpoint
CREATE TRIGGER trg_recalc_hours_recurring_schedule_days
AFTER INSERT OR UPDATE OR DELETE ON recurring_schedule_days
FOR EACH ROW EXECUTE FUNCTION trg_fn_recurring_schedule_days_hours_recalc();
--> statement-breakpoint

-- 5. One-time recalculation for existing students
-- DEPLOY SAFETY: This one-time backfill UPDATE runs across ALL students in a single statement.
-- For production deployments with large student tables (1000+ rows), consider splitting into
-- batched updates of 500 rows at a time:
--   UPDATE students s SET hours_per_week = ...
--   WHERE s.id IN (SELECT id FROM students ORDER BY id LIMIT 500 OFFSET 0);
-- Repeat with increasing OFFSET until no rows remain.
UPDATE students s
SET hours_per_week = COALESCE((
  SELECT SUM(rs.duration_minutes)::numeric / 60.0
  FROM recurring_schedules rs
  JOIN recurring_schedule_days rsd ON rsd.recurring_schedule_id = rs.id
  WHERE rs.student_id = s.id
    AND rs.deleted_at IS NULL
    AND rsd.is_active = true
), 0);
--> statement-breakpoint

-- Source: impersonation_sessions.sql
-- Impersonation session tracking for super-admin "view as user" feature
CREATE TABLE IF NOT EXISTS impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  session_id VARCHAR(255) NOT NULL,
  reason TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS impersonation_sessions_actor_idx ON impersonation_sessions(actor_user_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS impersonation_sessions_target_idx ON impersonation_sessions(target_user_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS impersonation_sessions_session_idx ON impersonation_sessions(session_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS impersonation_sessions_active_actor_idx ON impersonation_sessions(actor_user_id, is_active);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS impersonation_sessions_one_active_per_actor
  ON impersonation_sessions(actor_user_id)
  WHERE is_active = true;
--> statement-breakpoint


-- Source: leave_quota_limits_trigger.sql
CREATE OR REPLACE FUNCTION enforce_leave_quota_limits()
RETURNS TRIGGER AS $$
DECLARE
    v_max_leaves INTEGER;
    v_setting_key TEXT;
BEGIN
    -- Determine whether this is for teacher or student
    IF NEW.teacher_id IS NOT NULL THEN
        v_setting_key := 'teacher_max_leaves';
    ELSE
        v_setting_key := 'student_max_leaves';
    END IF;

    -- Fetch the limit from system_settings, defaulting to 2 if not found
    SELECT COALESCE(value::INTEGER, 2)
    INTO v_max_leaves
    FROM system_settings
    WHERE key = v_setting_key;

    IF v_max_leaves IS NULL THEN
        v_max_leaves := 2;
    END IF;

    -- Enforce the limit
    IF NEW.used_count > v_max_leaves THEN
        RAISE EXCEPTION 'Leave quota exceeded. Maximum allowed leaves is %', v_max_leaves;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

DROP TRIGGER IF EXISTS trg_enforce_leave_quota_limits ON leave_quota_usage;
--> statement-breakpoint
CREATE TRIGGER trg_enforce_leave_quota_limits
BEFORE INSERT OR UPDATE ON leave_quota_usage
FOR EACH ROW EXECUTE FUNCTION enforce_leave_quota_limits();
--> statement-breakpoint


-- Source: permissions_rls_policies.sql
ALTER TABLE "students" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "students" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint

DROP POLICY IF EXISTS students_select_policy ON "students";
--> statement-breakpoint
CREATE POLICY students_select_policy ON "students"
FOR SELECT
USING (
    NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
    OR
    parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
);
--> statement-breakpoint

DROP POLICY IF EXISTS students_insert_policy ON "students";
--> statement-breakpoint
CREATE POLICY students_insert_policy ON "students"
FOR INSERT
WITH CHECK (
    NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
    OR
    parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
);
--> statement-breakpoint

DROP POLICY IF EXISTS students_update_policy ON "students";
--> statement-breakpoint
CREATE POLICY students_update_policy ON "students"
FOR UPDATE
USING (
    NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
    OR
    parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
)
WITH CHECK (
    NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
    OR
    parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
);
--> statement-breakpoint

DROP POLICY IF EXISTS students_delete_policy ON "students";
--> statement-breakpoint
CREATE POLICY students_delete_policy ON "students"
FOR DELETE
USING (
    NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
    OR
    parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
);
--> statement-breakpoint


-- Source: profile_permissions.sql
-- Profile module permissions

-- Temporarily disable the system permission trigger to allow INSERT with is_system = true
DO $$
BEGIN
  ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not disable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint


INSERT INTO permissions (id, key, resource, action, description, category, is_system)
SELECT gen_random_uuid(), v.key::app_permission, v.resource, v.action, v.description::jsonb, v.category::jsonb, true
FROM (VALUES
    (
      'auth.edit_own_profile',
      'auth',
      'edit_own_profile',
      '{"ar": "تعديل حقول الملف الشخصي الأساسية", "en": "Edit own core profile fields"}',
      '{"ar": "المصادقة", "en": "Authentication"}'
    ),
    (
      'teacher.edit_own_profile',
      'teacher',
      'edit_own_profile',
      '{"ar": "تعديل حقول ملف المعلم الشخصي", "en": "Edit own teacher profile fields"}',
      '{"ar": "إدارة المعلمين", "en": "Teacher Management"}'
    ),
    (
      'parent.edit_own_profile',
      'parent',
      'edit_own_profile',
      '{"ar": "تعديل حقول ملف ولي الأمر الشخصي", "en": "Edit own parent profile fields"}',
      '{"ar": "إدارة أولياء الأمور", "en": "Parent Management"}'
    ),
    (
      'user.edit_profile',
      'user',
      'edit_profile',
      '{"ar": "تعديل حقول ملف مستخدم آخر", "en": "Edit another user core profile fields"}',
      '{"ar": "إدارة الموظفين", "en": "Staff Management"}'
    )
) AS v(key, resource, action, description, category)
WHERE NOT EXISTS (SELECT 1 FROM permissions p WHERE p.key = v.key::app_permission);
--> statement-breakpoint

DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
END $$;
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN (
    'auth.view_own_profile',
    'auth.edit_own_profile',
    'teacher.edit_own_profile',
    'parent.edit_own_profile',
    'user.view_profile',
    'user.edit_profile'
)
WHERE g.slug = 'super_admin'
  AND NOT EXISTS (
    SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id
  );
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN (
    'auth.view_own_profile',
    'auth.edit_own_profile',
    'user.view_profile',
    'user.edit_profile'
)
WHERE g.slug = 'academy_admin'
  AND NOT EXISTS (
    SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id
  );
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN (
    'auth.view_own_profile',
    'auth.edit_own_profile',
    'teacher.edit_own_profile'
)
WHERE g.slug = 'teacher_default'
  AND NOT EXISTS (
    SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id
  );
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN (
    'auth.view_own_profile',
    'auth.edit_own_profile',
    'parent.edit_own_profile'
)
WHERE g.slug = 'parent_default'
  AND NOT EXISTS (
    SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id
  );
--> statement-breakpoint

INSERT INTO group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.key IN (
    'auth.view_own_profile',
    'auth.edit_own_profile'
)
WHERE g.slug = 'staff_default'
  AND NOT EXISTS (
    SELECT 1 FROM group_permissions gp WHERE gp.group_id = g.id AND gp.permission_id = p.id
  );
--> statement-breakpoint


-- Source: soft_delete_rls_policies.sql
-- Soft-delete RLS policies (application-layer enforcement via SoftDeleteRepository).
-- Hard DELETE is blocked for RLS roles; soft deletes use UPDATE deleted_at through the repository
-- with session variable app.soft_delete = 'true'.

-- 1. users configuration
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint

DROP POLICY IF EXISTS users_select_policy ON "users";
--> statement-breakpoint
CREATE POLICY users_select_policy ON "users" FOR SELECT USING (deleted_at IS NULL);
--> statement-breakpoint
DROP POLICY IF EXISTS users_insert_policy ON "users";
--> statement-breakpoint
CREATE POLICY users_insert_policy ON "users" FOR INSERT WITH CHECK (deleted_at IS NULL);
--> statement-breakpoint
DROP POLICY IF EXISTS users_update_policy ON "users";
--> statement-breakpoint
CREATE POLICY users_update_policy ON "users" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);
--> statement-breakpoint
DROP POLICY IF EXISTS users_soft_delete_policy ON "users";
--> statement-breakpoint
DROP POLICY IF EXISTS users_delete_policy ON "users";
--> statement-breakpoint
CREATE POLICY users_delete_policy ON "users" FOR DELETE USING (false);
--> statement-breakpoint

-- 2. recurring_schedules configuration
ALTER TABLE "recurring_schedules" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "recurring_schedules" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint

DROP POLICY IF EXISTS recurring_schedules_select_policy ON "recurring_schedules";
--> statement-breakpoint
CREATE POLICY recurring_schedules_select_policy ON "recurring_schedules" FOR SELECT USING (deleted_at IS NULL);
--> statement-breakpoint
DROP POLICY IF EXISTS recurring_schedules_insert_policy ON "recurring_schedules";
--> statement-breakpoint
CREATE POLICY recurring_schedules_insert_policy ON "recurring_schedules" FOR INSERT WITH CHECK (deleted_at IS NULL);
--> statement-breakpoint
DROP POLICY IF EXISTS recurring_schedules_update_policy ON "recurring_schedules";
--> statement-breakpoint
CREATE POLICY recurring_schedules_update_policy ON "recurring_schedules" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);
--> statement-breakpoint
DROP POLICY IF EXISTS recurring_schedules_soft_delete_policy ON "recurring_schedules";
--> statement-breakpoint
DROP POLICY IF EXISTS recurring_schedules_delete_policy ON "recurring_schedules";
--> statement-breakpoint
CREATE POLICY recurring_schedules_delete_policy ON "recurring_schedules" FOR DELETE USING (false);
--> statement-breakpoint

-- 3. class_instances configuration
ALTER TABLE "class_instances" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "class_instances" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint

DROP POLICY IF EXISTS class_instances_select_policy ON "class_instances";
--> statement-breakpoint
CREATE POLICY class_instances_select_policy ON "class_instances" FOR SELECT USING (deleted_at IS NULL);
--> statement-breakpoint
DROP POLICY IF EXISTS class_instances_insert_policy ON "class_instances";
--> statement-breakpoint
CREATE POLICY class_instances_insert_policy ON "class_instances" FOR INSERT WITH CHECK (deleted_at IS NULL);
--> statement-breakpoint
DROP POLICY IF EXISTS class_instances_update_policy ON "class_instances";
--> statement-breakpoint
CREATE POLICY class_instances_update_policy ON "class_instances" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);
--> statement-breakpoint
DROP POLICY IF EXISTS class_instances_soft_delete_policy ON "class_instances";
--> statement-breakpoint
DROP POLICY IF EXISTS class_instances_delete_policy ON "class_instances";
--> statement-breakpoint
CREATE POLICY class_instances_delete_policy ON "class_instances" FOR DELETE USING (false);
--> statement-breakpoint

-- 4. complaints configuration
ALTER TABLE "complaints" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "complaints" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint

DROP POLICY IF EXISTS complaints_select_policy ON "complaints";
--> statement-breakpoint
CREATE POLICY complaints_select_policy ON "complaints" FOR SELECT USING (deleted_at IS NULL);
--> statement-breakpoint
DROP POLICY IF EXISTS complaints_insert_policy ON "complaints";
--> statement-breakpoint
CREATE POLICY complaints_insert_policy ON "complaints" FOR INSERT WITH CHECK (deleted_at IS NULL);
--> statement-breakpoint
DROP POLICY IF EXISTS complaints_update_policy ON "complaints";
--> statement-breakpoint
CREATE POLICY complaints_update_policy ON "complaints" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);
--> statement-breakpoint
DROP POLICY IF EXISTS complaints_soft_delete_policy ON "complaints";
--> statement-breakpoint
DROP POLICY IF EXISTS complaints_delete_policy ON "complaints";
--> statement-breakpoint
CREATE POLICY complaints_delete_policy ON "complaints" FOR DELETE USING (false);
--> statement-breakpoint

-- 5. learning_resources configuration
ALTER TABLE "learning_resources" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "learning_resources" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint

DROP POLICY IF EXISTS learning_resources_select_policy ON "learning_resources";
--> statement-breakpoint
CREATE POLICY learning_resources_select_policy ON "learning_resources" FOR SELECT USING (deleted_at IS NULL);
--> statement-breakpoint
DROP POLICY IF EXISTS learning_resources_insert_policy ON "learning_resources";
--> statement-breakpoint
CREATE POLICY learning_resources_insert_policy ON "learning_resources" FOR INSERT WITH CHECK (deleted_at IS NULL);
--> statement-breakpoint
DROP POLICY IF EXISTS learning_resources_update_policy ON "learning_resources";
--> statement-breakpoint
CREATE POLICY learning_resources_update_policy ON "learning_resources" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);
--> statement-breakpoint
DROP POLICY IF EXISTS learning_resources_soft_delete_policy ON "learning_resources";
--> statement-breakpoint
DROP POLICY IF EXISTS learning_resources_delete_policy ON "learning_resources";
--> statement-breakpoint
CREATE POLICY learning_resources_delete_policy ON "learning_resources" FOR DELETE USING (false);
--> statement-breakpoint

-- 6. invoices configuration
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "invoices" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint

DROP POLICY IF EXISTS invoices_select_policy ON "invoices";
--> statement-breakpoint
CREATE POLICY invoices_select_policy ON "invoices" FOR SELECT USING (deleted_at IS NULL);
--> statement-breakpoint
DROP POLICY IF EXISTS invoices_insert_policy ON "invoices";
--> statement-breakpoint
CREATE POLICY invoices_insert_policy ON "invoices" FOR INSERT WITH CHECK (deleted_at IS NULL);
--> statement-breakpoint
DROP POLICY IF EXISTS invoices_update_policy ON "invoices";
--> statement-breakpoint
CREATE POLICY invoices_update_policy ON "invoices" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);
--> statement-breakpoint
DROP POLICY IF EXISTS invoices_soft_delete_policy ON "invoices";
--> statement-breakpoint
DROP POLICY IF EXISTS invoices_delete_policy ON "invoices";
--> statement-breakpoint
CREATE POLICY invoices_delete_policy ON "invoices" FOR DELETE USING (false);
--> statement-breakpoint


-- Source: student_created_at_immutability.sql
-- Migration: Enforce immutability of students.created_at
--
-- Issue #25: Pagination cursors use (created_at, id) as composite keyset cursor.
-- If created_at were ever updated, existing cursors would silently skip or
-- duplicate rows. This trigger prevents that at the database level, making
-- the pagination invariant unconditionally safe.

CREATE OR REPLACE FUNCTION prevent_student_created_at_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION
      'students.created_at is immutable and cannot be changed after insert. '
      'Attempted to change created_at from % to % for student id=%',
      OLD.created_at, NEW.created_at, OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

DROP TRIGGER IF EXISTS trg_prevent_student_created_at_update ON students;
--> statement-breakpoint

CREATE TRIGGER trg_prevent_student_created_at_update
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION prevent_student_created_at_update();
--> statement-breakpoint


-- Source: student_progress_rls.sql
-- Enable RLS on the table
ALTER TABLE "student_progress" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "student_progress" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint

-- Drop policies if they exist for idempotency
DROP POLICY IF EXISTS student_progress_teacher_policy ON "student_progress";
--> statement-breakpoint
DROP POLICY IF EXISTS student_progress_parent_policy ON "student_progress";
--> statement-breakpoint

-- 1. Teacher Policy: Allows teachers to manage progress for students they teach
-- A teacher can manage a progress record if they are the one who logged it
CREATE POLICY student_progress_teacher_policy ON "student_progress"
FOR ALL
USING (
    teacher_id IN (SELECT id FROM teachers WHERE user_id = current_user_id())
)
WITH CHECK (
    teacher_id IN (SELECT id FROM teachers WHERE user_id = current_user_id())
);
--> statement-breakpoint

-- 2. Parent Policy: Allows parents to view progress for their children if parent_visible is true
-- current_user_id() is defined in permissions_rls_policies.sql
CREATE POLICY student_progress_parent_policy ON "student_progress"
FOR SELECT
USING (
    parent_visible = true 
    AND 
    student_id IN (
        SELECT s.id 
        FROM students s 
        JOIN parents p ON s.parent_id = p.id 
        WHERE p.user_id = current_user_id()
    )
);
--> statement-breakpoint


-- Source: student_status_transition_trigger.sql
-- Function to enforce student status transitions
CREATE OR REPLACE FUNCTION fn_enforce_student_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Only for UPDATE: Enforcement of state machine
    IF OLD.status IS DISTINCT FROM NEW.status THEN-- Transitions from ON_TRIAL
        IF OLD.status = 'ON_TRIAL' AND NEW.status NOT IN ('REGULAR', 'DEACTIVATED') THEN
            RAISE EXCEPTION 'Invalid status transition: % to %', OLD.status, NEW.status;
        END IF;

        -- Transitions from REGULAR
        IF OLD.status = 'REGULAR' AND NEW.status NOT IN ('SUSPENDED', 'ON_LEAVE', 'DEACTIVATED') THEN
            RAISE EXCEPTION 'Invalid status transition: % to %', OLD.status, NEW.status;
        END IF;

        -- Transitions from SUSPENDED
        IF OLD.status = 'SUSPENDED' AND NEW.status NOT IN ('REGULAR', 'DEACTIVATED') THEN
            RAISE EXCEPTION 'Invalid status transition: % to %', OLD.status, NEW.status;
        END IF;

        -- Transitions from ON_LEAVE
        IF OLD.status = 'ON_LEAVE' AND NEW.status NOT IN ('REGULAR', 'DEACTIVATED') THEN
            RAISE EXCEPTION 'Invalid status transition: % to %', OLD.status, NEW.status;
        END IF;

        -- Transitions from DEACTIVATED
        IF OLD.status = 'DEACTIVATED' AND NEW.status NOT IN ('REGULAR') THEN
            RAISE EXCEPTION 'Invalid status transition: % to %', OLD.status, NEW.status;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

-- Function to log student status history
CREATE OR REPLACE FUNCTION fn_log_student_status_history()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID;
BEGIN
    -- Capture the current actor from session settings if available
    v_actor_id := current_user_id();

    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO student_status_history (
            student_id,
            old_status,
            new_status,
            changed_by_user_id,
            created_at
        ) VALUES (
            NEW.id,
            CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
            NEW.status,
            v_actor_id,
            clock_timestamp()
        );
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

-- Drop triggers if they exist to ensure idempotency
DROP TRIGGER IF EXISTS trg_enforce_student_status_transition ON students;
--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_log_student_status_history ON students;
--> statement-breakpoint

-- Create Enforcement Trigger (BEFORE UPDATE)
CREATE TRIGGER trg_enforce_student_status_transition
BEFORE UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION fn_enforce_student_status_transition();
--> statement-breakpoint

-- Create Logging Trigger (AFTER INSERT OR UPDATE)
CREATE TRIGGER trg_log_student_status_history
AFTER INSERT OR UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION fn_log_student_status_history();
--> statement-breakpoint


-- Source: timezone_dst_logic.sql
-- 1. Helper function to calculate UTC offset in minutes for a given timestamp and timezone IANA ID
CREATE OR REPLACE FUNCTION get_utc_offset_mins(ts TIMESTAMP WITH TIME ZONE, tz TEXT)
RETURNS INTEGER AS $$
BEGIN
    IF tz IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN EXTRACT(EPOCH FROM (ts AT TIME ZONE tz - ts AT TIME ZONE 'UTC')) / 60;
END;
$$ LANGUAGE plpgsql STABLE;
--> statement-breakpoint

-- 2. Function to adjust a timestamp if a DST shift is detected
CREATE OR REPLACE FUNCTION adjust_for_dst(ts TIMESTAMP WITH TIME ZONE, tz TEXT, original_offset_mins INTEGER)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    current_offset_mins INTEGER;
    shift_mins INTEGER;
BEGIN
    IF tz IS NULL OR original_offset_mins IS NULL THEN
        RETURN ts;
    END IF;

    -- Calculate the current offset at the target timestamp in the target timezone
    current_offset_mins := get_utc_offset_mins(ts, tz);
    
    -- Calculate shift (e.g., if original was +120 and current is +180, shift is -60 to keep local time same)
    shift_mins := original_offset_mins - current_offset_mins;
    
    IF shift_mins = 0 THEN
        RETURN ts;
    END IF;

    -- Apply shift to the UTC timestamp to preserve the intended local time
    RETURN ts + (shift_mins || ' minutes')::INTERVAL;
END;
$$ LANGUAGE plpgsql STABLE;
--> statement-breakpoint

-- 3. Main job to auto-adjust future bookings for DST changes
CREATE OR REPLACE FUNCTION auto_adjust_dst_bookings()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- Update scheduled_start_at and scheduled_end_at for future classes where a DST drift is detected
    -- DEPLOY SAFETY: This UPDATE touches all future class instances with DST drift in a single
    -- statement, holding row locks for the duration. For databases with many future class instances,
    -- consider refactoring to process in batches of 500 using a cursor loop:
    --   LOOP
    --     UPDATE class_instances ... WHERE id IN (SELECT id FROM affected_classes LIMIT 500) RETURNING 1;
    --     EXIT WHEN NOT FOUND;
    --   END LOOP;
    WITH affected_classes AS (
        SELECT 
            id,
            adjust_for_dst(scheduled_start_at, booking_timezone, booking_utc_offset) as new_start,
            adjust_for_dst(scheduled_end_at, booking_timezone, booking_utc_offset) as new_end
        FROM class_instances
        WHERE 
            booking_timezone IS NOT NULL 
            AND booking_utc_offset IS NOT NULL
            AND scheduled_start_at > NOW()
            AND scheduled_start_at != adjust_for_dst(scheduled_start_at, booking_timezone, booking_utc_offset)
            AND deleted_at IS NULL
    )
    UPDATE class_instances ci
    SET 
        scheduled_start_at = ac.new_start,
        scheduled_end_at = ac.new_end,
        -- Update the snapshot to the new offset for the new period
        booking_utc_offset = get_utc_offset_mins(ac.new_start, ci.booking_timezone),
        updated_at = NOW()
    FROM affected_classes ac
    WHERE ci.id = ac.id;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

-- 4. Trigger to automatically snapshot timezone and offset on class creation if not provided
CREATE OR REPLACE FUNCTION trg_snapshot_booking_timezone()
RETURNS TRIGGER AS $$
DECLARE
    teacher_tz TEXT;
BEGIN
    -- Only snapshot if not already provided (e.g., by app layer)
    IF NEW.booking_timezone IS NULL THEN
        SELECT u.timezone INTO teacher_tz
        FROM teachers t
        INNER JOIN users u ON u.id = t.user_id
        WHERE t.id = NEW.teacher_id;
        NEW.booking_timezone := teacher_tz;
    END IF;

    IF NEW.booking_utc_offset IS NULL AND NEW.booking_timezone IS NOT NULL THEN
        NEW.booking_utc_offset := get_utc_offset_mins(NEW.scheduled_start_at, NEW.booking_timezone);
    END IF;

    -- Also try to link timezone_id if it's missing
    IF NEW.booking_timezone_id IS NULL AND NEW.booking_timezone IS NOT NULL THEN
        SELECT id INTO NEW.booking_timezone_id FROM timezones WHERE iana_id = NEW.booking_timezone;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

DROP TRIGGER IF EXISTS trg_class_instances_timezone_snapshot ON class_instances;
--> statement-breakpoint
CREATE TRIGGER trg_class_instances_timezone_snapshot
BEFORE INSERT ON class_instances
FOR EACH ROW EXECUTE FUNCTION trg_snapshot_booking_timezone();
--> statement-breakpoint

-- 5. Trigger for recurring_schedules to snapshot UTC offset
CREATE OR REPLACE FUNCTION trg_snapshot_recurring_schedule_timezone()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.utc_offset_snapshot IS NULL AND NEW.timezone IS NOT NULL THEN
        NEW.utc_offset_snapshot := get_utc_offset_mins(NOW(), NEW.timezone);
    END IF;

    IF NEW.timezone_id IS NULL AND NEW.timezone IS NOT NULL THEN
        SELECT id INTO NEW.timezone_id FROM timezones WHERE iana_id = NEW.timezone;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

DROP TRIGGER IF EXISTS trg_recurring_schedules_timezone_snapshot ON recurring_schedules;
--> statement-breakpoint
CREATE TRIGGER trg_recurring_schedules_timezone_snapshot
BEFORE INSERT OR UPDATE ON recurring_schedules
FOR EACH ROW EXECUTE FUNCTION trg_snapshot_recurring_schedule_timezone();
--> statement-breakpoint


-- Source: user_notification_preferences.sql
-- Enable RLS on the table
ALTER TABLE "user_notification_preferences" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "user_notification_preferences" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint

-- Drop policy if exists for idempotency
DROP POLICY IF EXISTS notification_preferences_access_policy ON "user_notification_preferences";
--> statement-breakpoint

-- Create policy: Users can only manage their own preferences
-- current_user_id() is defined in permissions_rls_policies.sql
CREATE POLICY notification_preferences_access_policy ON "user_notification_preferences"
FOR ALL
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());
--> statement-breakpoint

-- Enable RLS on device token and delivery tracking tables
ALTER TABLE "user_device_tokens" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "user_device_tokens" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint

ALTER TABLE "notification_deliveries" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "notification_deliveries" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint

-- Drop policies if they exist for idempotency
DROP POLICY IF EXISTS user_device_tokens_access_policy ON "user_device_tokens";
--> statement-breakpoint
DROP POLICY IF EXISTS notification_deliveries_access_policy ON "notification_deliveries";
--> statement-breakpoint

-- Users can only manage their own device tokens
CREATE POLICY user_device_tokens_access_policy ON "user_device_tokens"
FOR ALL
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());
--> statement-breakpoint

-- Users can only view their own notification deliveries
CREATE POLICY notification_deliveries_access_policy ON "notification_deliveries"
FOR ALL
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());
--> statement-breakpoint


