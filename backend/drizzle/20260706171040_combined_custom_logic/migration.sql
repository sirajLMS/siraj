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


-- Source: 3-system_permissions_and_groups.sql
-- Migration: Seed System Permissions and Groups
-- Auto-generated

-- Story 15: Suggestion Review Workflow — New enum type
DO $$ BEGIN
  CREATE TYPE suggestion_status AS ENUM ('PENDING', 'REVIEWED', 'DUPLICATE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Story 15: Add ON_APP notification channel
ALTER TYPE notification_channel ADD VALUE IF NOT EXISTS 'ON_APP';

-- Story 15: Add new notification event types for suggestions and complaints
ALTER TYPE notification_event_type ADD VALUE IF NOT EXISTS 'NEW_COMPLAINT';
ALTER TYPE notification_event_type ADD VALUE IF NOT EXISTS 'NEW_SUGGESTION';
ALTER TYPE notification_event_type ADD VALUE IF NOT EXISTS 'SUGGESTION_ACKNOWLEDGED';
ALTER TYPE notification_event_type ADD VALUE IF NOT EXISTS 'SUGGESTION_DUPLICATE_MARKED';

-- Story 15: Add new columns to suggestions table
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS status suggestion_status NOT NULL DEFAULT 'PENDING';
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS duplicate_of_id uuid REFERENCES suggestions(id) ON DELETE SET NULL;
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS admin_response text;
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS reviewed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Story 15: Add indexes for new suggestions columns
CREATE INDEX IF NOT EXISTS suggestions_status_idx ON suggestions (status);
CREATE INDEX IF NOT EXISTS suggestions_duplicate_of_id_idx ON suggestions (duplicate_of_id);
CREATE INDEX IF NOT EXISTS suggestions_reviewed_by_user_id_idx ON suggestions (reviewed_by_user_id);
CREATE INDEX IF NOT EXISTS suggestions_deleted_at_idx ON suggestions (deleted_at);

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
        'auth.login',
        'auth',
        'login',
        'Login to system',
        'Authentication',
        true
    ),
    (
        gen_random_uuid (),
        'auth.view_own_profile',
        'auth',
        'view_own_profile',
        'View own profile',
        'Authentication',
        true
    ),
    (
        gen_random_uuid (),
        'dashboard.view',
        'dashboard',
        'view',
        'View dashboard',
        'Dashboard',
        true
    ),
    (
        gen_random_uuid (),
        'dashboard.view_metrics',
        'dashboard',
        'view_metrics',
        'View dashboard metrics',
        'Dashboard',
        true
    ),
    (
        gen_random_uuid (),
        'dashboard.filter_metrics',
        'dashboard',
        'filter_metrics',
        'Filter dashboard metrics',
        'Dashboard',
        true
    ),
    (
        gen_random_uuid (),
        'dashboard.metrics.view_all',
        'dashboard',
        'metrics.view_all',
        'View all dashboard metrics',
        'Dashboard',
        true
    ),
    (
        gen_random_uuid (),
        'dashboard.search',
        'dashboard',
        'search',
        'Global search on admin schedule table',
        'Dashboard',
        true
    ),
    (
        gen_random_uuid (),
        'schedule.view_list',
        'schedule',
        'view_list',
        'View daily schedule list',
        'Scheduling',
        true
    ),
    (
        gen_random_uuid (),
        'schedule.filter_advanced',
        'schedule',
        'filter_advanced',
        'Advanced filtering of schedule',
        'Scheduling',
        true
    ),
    (
        gen_random_uuid (),
        'schedule.view_all',
        'schedule',
        'view_all',
        'View all schedules',
        'Scheduling',
        true
    ),
    (
        gen_random_uuid (),
        'schedule.view_assigned',
        'schedule',
        'view_assigned',
        'View assigned teacher schedule',
        'Scheduling',
        true
    ),
    (
        gen_random_uuid (),
        'schedule.view_family',
        'schedule',
        'view_family',
        'View family student schedule',
        'Scheduling',
        true
    ),
    (
        gen_random_uuid (),
        'schedule.search_availability',
        'schedule',
        'search_availability',
        'Search teacher availability',
        'Scheduling',
        true
    ),
    (
        gen_random_uuid (),
        'schedule.manage_recurring',
        'schedule',
        'manage_recurring',
        'Manage recurring schedules',
        'Scheduling',
        true
    ),
    (
        gen_random_uuid (),
        'schedule.dst_migrate',
        'schedule',
        'dst_migrate',
        'Run DST migration',
        'Scheduling',
        true
    ),
    (
        gen_random_uuid (),
        'schedule.view_timezones',
        'schedule',
        'view_timezones',
        'View multi-timezone schedule columns',
        'Scheduling',
        true
    ),
    (
        gen_random_uuid (),
        'session.view_details',
        'session',
        'view_details',
        'View class details',
        'Scheduling',
        true
    ),
    (
        gen_random_uuid (),
        'session.activate_class',
        'session',
        'activate_class',
        'Activate a class within time window',
        'Scheduling',
        true
    ),
    (
        gen_random_uuid (),
        'session.activate_override',
        'session',
        'activate_override',
        'Bypass time window enforcement to manually activate a class session',
        'Scheduling',
        true
    ),
    (
        gen_random_uuid (),
        'session.update_status.start',
        'session',
        'update_status.start',
        'Transition an activated session to RUNNING state upon student arrival',
        'Scheduling',
        true
    ),
    (
        gen_random_uuid (),
        'session.update_status.absent',
        'session',
        'update_status.absent',
        'Mark student as absent after waiting period and credit teacher payroll',
        'Scheduling',
        true
    ),
    (
        gen_random_uuid (),
        'session.update_status.leave',
        'session',
        'update_status.leave',
        'Process excused cancellation and trigger reschedule workflow',
        'Scheduling',
        true
    ),
    (
        gen_random_uuid (),
        'session.reschedule',
        'session',
        'reschedule',
        'Reschedule a class',
        'Scheduling',
        true
    ),
    (
        gen_random_uuid (),
        'session.reset',
        'session',
        'reset',
        'Destructively clear session data and revert to NOT_ACTIVATED state',
        'Scheduling',
        true
    ),
    (
        gen_random_uuid (),
        'session.override_actions',
        'session',
        'override_actions',
        'Admin override toolbar on class details page',
        'Scheduling',
        true
    ),
    (
        gen_random_uuid (),
        'history.view_calendar',
        'history',
        'view_calendar',
        'View student class history calendar',
        'History',
        true
    ),
    (
        gen_random_uuid (),
        'history.view_details',
        'history',
        'view_details',
        'View session metadata in history modal drill-down',
        'History',
        true
    ),
    (
        gen_random_uuid (),
        'teacher.view_dashboard',
        'teacher',
        'view_dashboard',
        'Access teacher dashboard',
        'Teacher',
        true
    ),
    (
        gen_random_uuid (),
        'teacher.view_students',
        'teacher',
        'view_students',
        'View students assigned to the logged-in teacher',
        'Teacher',
        true
    ),
    (
        gen_random_uuid (),
        'teacher.view_own_profile',
        'teacher',
        'view_own_profile',
        'View own teacher profile and salary (read-only)',
        'Teacher',
        true
    ),
    (
        gen_random_uuid (),
        'system.enforce_time_window',
        'system',
        'enforce_time_window',
        'Validate activation time window',
        'System',
        true
    ),
    (
        gen_random_uuid (),
        'system.enforce_leave_limit',
        'system',
        'enforce_leave_limit',
        'System-level validation gate that enforces teacher leave quota limits per calendar month',
        'System',
        true
    ),
    (
        gen_random_uuid (),
        'teachers.list',
        'teachers',
        'list',
        'List teachers',
        'Teachers',
        true
    ),
    (
        gen_random_uuid (),
        'teachers.create',
        'teachers',
        'create',
        'Create teacher accounts',
        'Teachers',
        true
    ),
    (
        gen_random_uuid (),
        'teachers.edit',
        'teachers',
        'edit',
        'Edit teacher profiles',
        'Teachers',
        true
    ),
    (
        gen_random_uuid (),
        'teachers.manage_schedule',
        'teachers',
        'manage_schedule',
        'Manage teacher schedules',
        'Teachers',
        true
    ),
    (
        gen_random_uuid (),
        'parents.list',
        'parents',
        'list',
        'List parents',
        'Parents',
        true
    ),
    (
        gen_random_uuid (),
        'parents.create',
        'parents',
        'create',
        'Create parent accounts',
        'Parents',
        true
    ),
    (
        gen_random_uuid (),
        'parents.edit',
        'parents',
        'edit',
        'Edit parent profiles',
        'Parents',
        true
    ),
    (
        gen_random_uuid (),
        'students.list',
        'students',
        'list',
        'List students',
        'Students',
        true
    ),
    (
        gen_random_uuid (),
        'students.edit',
        'students',
        'edit',
        'Edit student profiles',
        'Students',
        true
    ),
    (
        gen_random_uuid (),
        'students.change_teacher',
        'students',
        'change_teacher',
        'Reassign student teacher',
        'Students',
        true
    ),
    (
        gen_random_uuid (),
        'students.change_status',
        'students',
        'change_status',
        'Change student status',
        'Students',
        true
    ),
    (
        gen_random_uuid (),
        'students.override_quota',
        'students',
        'override_quota',
        'Override student class quota',
        'Students',
        true
    ),
    (
        gen_random_uuid (),
        'invoices.list',
        'invoices',
        'list',
        'List invoices',
        'Billing',
        true
    ),
    (
        gen_random_uuid (),
        'invoices.delete',
        'invoices',
        'delete',
        'Delete invoices',
        'Billing',
        true
    ),
    (
        gen_random_uuid (),
        'invoices.create',
        'invoices',
        'create',
        'Create invoices',
        'Billing',
        true
    ),
    (
        gen_random_uuid (),
        'invoices.mark_paid',
        'invoices',
        'mark_paid',
        'Mark invoice as paid',
        'Billing',
        true
    ),
    (
        gen_random_uuid (),
        'invoices.edit',
        'invoices',
        'edit',
        'Edit invoices',
        'Billing',
        true
    ),
    (
        gen_random_uuid (),
        'resources.list',
        'resources',
        'list',
        'List learning resources',
        'Resources',
        true
    ),
    (
        gen_random_uuid (),
        'resources.delete',
        'resources',
        'delete',
        'Delete learning resources',
        'Resources',
        true
    ),
    (
        gen_random_uuid (),
        'resources.upload',
        'resources',
        'upload',
        'Upload learning resources',
        'Resources',
        true
    ),
    (
        gen_random_uuid (),
        'reports.generate',
        'reports',
        'generate',
        'Generate reports',
        'Reports',
        true
    ),
    (
        gen_random_uuid (),
        'complaints.list',
        'complaints',
        'list',
        'List complaints',
        'Communications',
        true
    ),
    (
        gen_random_uuid (),
        'complaints.delete',
        'complaints',
        'delete',
        'Delete complaints',
        'Communications',
        true
    ),
    (
        gen_random_uuid (),
        'complaints.respond',
        'complaints',
        'respond',
        'Respond to complaints',
        'Communications',
        true
    ),
    (
        gen_random_uuid (),
        'staff.list',
        'staff',
        'list',
        'List staff accounts',
        'Administration',
        true
    ),
    (
        gen_random_uuid (),
        'staff.create',
        'staff',
        'create',
        'Create staff accounts',
        'Administration',
        true
    ),
    (
        gen_random_uuid (),
        'staff.edit',
        'staff',
        'edit',
        'Edit staff accounts',
        'Administration',
        true
    ),
    (
        gen_random_uuid (),
        'permission_groups.manage',
        'permission_groups',
        'manage',
        'Manage permission groups',
        'Administration',
        true
    ),
    (
        gen_random_uuid (),
        'permission_groups.assign',
        'permission_groups',
        'assign',
        'Assign permission groups to users',
        'Administration',
        true
    ),
    (
        gen_random_uuid (),
        'notification.view_alerts',
        'notification',
        'view_alerts',
        'Access global notifications UI with system alerts',
        'Notifications',
        true
    ),
    (
        gen_random_uuid (),
        'billing.view_unpaid_invoices',
        'billing',
        'view_unpaid_invoices',
        'View accounts with pending or overdue financial balances',
        'Billing',
        true
    ),
    (
        gen_random_uuid (),
        'user.view_profile',
        'user',
        'view_profile',
        'View specific user comprehensive account and billing details',
        'Users',
        true
    ),
    (
        gen_random_uuid (),
        'staff.view_directory',
        'staff',
        'view_directory',
        'Access the global Teachers Directory with summary metrics and data table',
        'Administration',
        true
    ),
    (
        gen_random_uuid (),
        'schedule.view_weekly',
        'schedule',
        'view_weekly',
        'View a specific teacher weekly calendar grid with colored time-blocks',
        'Scheduling',
        true
    ),
    (
        gen_random_uuid (),
        'schedule.view_workload',
        'schedule',
        'view_workload',
        'View aggregated weekly capacity metrics (Weekly hours worked)',
        'Scheduling',
        true
    ),
    (
        gen_random_uuid (),
        'schedule.create_class',
        'schedule',
        'create_class',
        'Access the Add Class workflow and create new recurring scheduled sessions',
        'Scheduling',
        true
    ),
    (
        gen_random_uuid (),
        'schedule.delete_class',
        'schedule',
        'delete_class',
        'Delete a specific recurring class block from a teacher schedule',
        'Scheduling',
        true
    ),
    (
        gen_random_uuid (),
        'schedule.clear_weekly',
        'schedule',
        'clear_weekly',
        'Bulk erase a teacher entire weekly schedule in a single action',
        'Scheduling',
        true
    ),
    (
        gen_random_uuid (),
        'staff.edit_profile',
        'staff',
        'edit_profile',
        'Edit teacher profile including PII, salary, and official details',
        'Administration',
        true
    ),
    (
        gen_random_uuid (),
        'system.bulk_update_dst',
        'system',
        'bulk_update_dst',
        'Execute global DST adjustment algorithm across entire database',
        'System',
        true
    ),
    (
        gen_random_uuid (),
        'parent.view_directory',
        'parent',
        'view_directory',
        'Access global Parents Directory with status metrics and unpaid invoices',
        'Parents',
        true
    ),
    -- Story 8: Parent Profile & Account Lifecycle
    (
        gen_random_uuid (),
        'parent.view_profile',
        'parent',
        'view_profile',
        'Access detailed Parent Profile view with PII, social media links, and fee details',
        'Parents',
        true
    ),
    (
        gen_random_uuid (),
        'parent.view_students',
        'parent',
        'view_students',
        'View students assigned to the logged-in parent',
        'Parents',
        true
    ),
    (
        gen_random_uuid (),
        'parent.view_own_profile',
        'parent',
        'view_own_profile',
        'View own parent profile and social links (read-only)',
        'Parents',
        true
    ),
    (
        gen_random_uuid (),
        'parent.manage_status',
        'parent',
        'manage_status',
        'Suspend or revoke a parent''s access to the LMS by setting account status to DEACTIVATED',
        'Parents',
        true
    ),
    (
        gen_random_uuid (),
        'student.view_associated',
        'student',
        'view_associated',
        'View the aggregated list of students associated with a specific parent, including teacher and quota data',
        'Students',
        true
    ),
    (
        gen_random_uuid (),
        'student.edit_quota',
        'student',
        'edit_quota',
        'Manually override a student''s classesRemaining integer, directly impacting billing cycle triggers',
        'Students',
        true
    ),
    (
        gen_random_uuid (),
        'billing.view_history',
        'billing',
        'view_history',
        'Access the full invoice ledger for a single parent, including paid and unpaid invoices',
        'Billing',
        true
    ),
    (
        gen_random_uuid (),
        'document.manage_parent_docs',
        'document',
        'manage_parent_docs',
        'Attach and view external files (contracts, ID verification) linked to a specific Parent record',
        'Documents',
        true
    ),
    -- Story 9: Invoice Generation & Processing (billing domain)
    (
        gen_random_uuid (),
        'billing.create_invoice',
        'billing',
        'create_invoice',
        'Manually generate a custom invoice outside the automated package renewal cycle',
        'Billing',
        true
    ),
    (
        gen_random_uuid (),
        'billing.update_status_paid',
        'billing',
        'update_status_paid',
        'Manually verify and log the settlement of an outstanding invoice by marking it as Paid',
        'Billing',
        true
    ),
    (
        gen_random_uuid (),
        'billing.delete_invoice',
        'billing',
        'delete_invoice',
        'Destructively remove a financial record from the parent billing ledger',
        'Billing',
        true
    ),
    -- Story 9: Student Metadata & Lifecycle Management
    (
        gen_random_uuid (),
        'student.reassign_teacher',
        'student',
        'reassign_teacher',
        'Dynamically change a student assigned instructor from the parent profile view',
        'Students',
        true
    ),
    (
        gen_random_uuid (),
        'student.manage_status',
        'student',
        'manage_status',
        'Alter a student global enrollment state (Regular, On Leave, Suspended) from parent profile',
        'Students',
        true
    ),
    -- Automated System Synchronization
    (
        gen_random_uuid (),
        'system.sync_notifications',
        'system',
        'sync_notifications',
        'Internal rule that forces the global notification tray to reflect real-time billing changes',
        'System',
        true
    ),
    -- Automated Student Status Enforcement
    (
        gen_random_uuid (),
        'system.enforce_suspended_lock',
        'system',
        'enforce_suspended_lock',
        'Automated rule that locks UI controls on teacher schedule when student is Suspended',
        'System',
        true
    ),
    (
        gen_random_uuid (),
        'system.process_student_leave',
        'system',
        'process_student_leave',
        'Automated workflow that marks future classes as excused and queues rescheduling when student is On Leave',
        'System',
        true
    ),
    -- Story 11: System-Level Resource Access Restriction
    (
        gen_random_uuid (),
        'system.restrict_resource_access',
        'system',
        'restrict_resource_access',
        'Enforce isolation of learning resources storage from unauthorized external access',
        'System',
        true
    ),
    -- Story 12: Custom Reporting and Analytics
    (
        gen_random_uuid (),
        'report.generate_custom',
        'report',
        'generate_custom',
        'Authorizes access to the overarching Reports interface and the dynamic aggregation query engine to evaluate operational parameters.',
        'Reporting',
        true
    ),
    (
        gen_random_uuid (),
        'report.view_financials',
        'report',
        'view_financials',
        'Authorizes the query engine to calculate and render highly sensitive payroll and financial metrics within generated reports.',
        'Reporting',
        true
    ),
    -- Story 14: Complaints, Suggestions, Communication Channels
    (
        gen_random_uuid (),
        'support.submit_complaint',
        'support',
        'submit_complaint',
        'Submit a new complaint from the parent dashboard',
        'Support',
        true
    ),
    (
        gen_random_uuid (),
        'support.view_history',
        'support',
        'view_history',
        'View own complaint submission history as a parent',
        'Support',
        true
    ),
    (
        gen_random_uuid (),
        'communication.submit_suggestion',
        'communication',
        'submit_suggestion',
        'Submit a new suggestion from the parent dashboard',
        'Communication',
        true
    ),
    (
        gen_random_uuid (),
        'system.dispatch_email',
        'system',
        'dispatch_email',
        'Internal permission allowing the system to dispatch outbound email notifications',
        'System',
        true
    ),
    -- Story 15: Suggestion Review Workflow
    (
        gen_random_uuid (),
        'suggestions.list',
        'suggestions',
        'list',
        'List and filter all parent suggestions with review status and duplicate grouping',
        'Communications',
        true
    ),
    (
        gen_random_uuid (),
        'suggestions.review',
        'suggestions',
        'review',
        'Review a suggestion: mark as reviewed with admin response or mark as duplicate of another suggestion',
        'Communications',
        true
    ),
    (
        gen_random_uuid (),
        'suggestions.delete',
        'suggestions',
        'delete',
        'Soft-delete a suggestion record from the system',
        'Communications',
        true
    ) ON CONFLICT (key) DO
UPDATE
SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    is_system = EXCLUDED.is_system;

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
        'Super Admin',
        'Full system access',
        true,
        'super_admin',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid (),
        'Academy Admin',
        'Full operational oversight for the sprint',
        true,
        'academy_admin',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid (),
        'Teacher Default',
        'Default permissions for teacher accounts',
        true,
        'teacher_default',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid (),
        'Parent Default',
        'Default permissions for parent accounts',
        true,
        'parent_default',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid (),
        'Staff Default',
        'Default permissions for staff accounts',
        true,
        'staff_default',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid (),
        'System Automated',
        'Internal system rules for validation',
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
        'suggestions.delete'
    );

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
        'students.list',
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
        'suggestions.review'
    );

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
        'parent.view_students',
        'parent.view_own_profile'
    );

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
                   NEW.action IS DISTINCT FROM OLD.action OR 
                   NEW.category IS DISTINCT FROM OLD.category THEN
                    RAISE EXCEPTION 'Cannot modify core properties of system permissions; only description can be updated';
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

DROP TRIGGER IF EXISTS trg_protect_system_permissions ON permissions;

CREATE TRIGGER trg_protect_system_permissions
BEFORE INSERT OR UPDATE OR DELETE ON permissions
FOR EACH ROW EXECUTE FUNCTION protect_system_permissions();

DROP TRIGGER IF EXISTS trg_protect_system_permission_groups ON permission_groups;

CREATE TRIGGER trg_protect_system_permission_groups
BEFORE UPDATE OR DELETE ON permission_groups
FOR EACH ROW EXECUTE FUNCTION protect_system_permissions();

-- Source: 30-a-class_instances_rls_policies.sql
-- Class Instance RLS policies for scoping access based on current_user_id()

ALTER TABLE "class_instances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "class_instances" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS class_instances_access_select_policy ON "class_instances";
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

DROP POLICY IF EXISTS class_instances_access_update_policy ON "class_instances";
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

DROP TRIGGER IF EXISTS trg_enforce_class_instance_transition ON class_instances;
CREATE TRIGGER trg_enforce_class_instance_transition
BEFORE UPDATE ON class_instances
FOR EACH ROW EXECUTE FUNCTION fn_enforce_class_instance_transition();


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

CREATE INDEX IF NOT EXISTS class_categories_slug_idx ON class_categories (slug);

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

CREATE INDEX IF NOT EXISTS class_subjects_category_id_idx ON class_subjects (category_id);
CREATE UNIQUE INDEX IF NOT EXISTS class_subjects_slug_idx ON class_subjects (slug);

CREATE TABLE IF NOT EXISTS subject_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES class_subjects(id) ON DELETE CASCADE,
  learning_resource_id uuid NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
  resource_type varchar(50),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz(3) NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS subject_resources_subject_id_learning_resource_id_idx ON subject_resources (subject_id, learning_resource_id);

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

CREATE INDEX IF NOT EXISTS teacher_important_notes_teacher_id_idx ON teacher_important_notes (teacher_id);

-- ============================================================
-- 2. ALTER TABLE — Add subject_id FK to scheduling tables
-- ============================================================

ALTER TABLE recurring_schedules
  ADD COLUMN IF NOT EXISTS subject_id uuid REFERENCES class_subjects(id) ON DELETE RESTRICT;

ALTER TABLE class_instances
  ADD COLUMN IF NOT EXISTS subject_id uuid REFERENCES class_subjects(id) ON DELETE RESTRICT;

-- subject_id indexes are created by the drizzle schema migration (same_sphinx);
-- CONCURRENTLY cannot run inside drizzle's transactional migrator.

-- ============================================================
-- 3. ALTER TYPE — Add 13 new permission values to app_permission enum
-- ============================================================

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'subjects.list';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'subjects.create';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'subjects.update';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'subjects.delete';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'categories.list';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'categories.create';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'categories.update';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'categories.delete';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'subjects.view_resources';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'subjects.manage_resources';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'notes.list';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'notes.create';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'notes.update';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'notes.delete';


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

-- ============================================================
-- 1. INSERT INTO permissions — 13 new permission keys
-- ============================================================

INSERT INTO permissions (id, key, resource, action, description, category, is_system)
VALUES
  (gen_random_uuid(), 'subjects.list', 'subjects', 'list', 'List class subjects', 'Subjects', true),
  (gen_random_uuid(), 'subjects.create', 'subjects', 'create', 'Create class subjects', 'Subjects', true),
  (gen_random_uuid(), 'subjects.update', 'subjects', 'update', 'Update class subjects', 'Subjects', true),
  (gen_random_uuid(), 'subjects.delete', 'subjects', 'delete', 'Delete class subjects', 'Subjects', true),
  (gen_random_uuid(), 'categories.list', 'categories', 'list', 'List class categories', 'Categories', true),
  (gen_random_uuid(), 'categories.create', 'categories', 'create', 'Create class categories', 'Categories', true),
  (gen_random_uuid(), 'categories.update', 'categories', 'update', 'Update class categories', 'Categories', true),
  (gen_random_uuid(), 'categories.delete', 'categories', 'delete', 'Delete class categories', 'Categories', true),
  (gen_random_uuid(), 'subjects.view_resources', 'subjects', 'view_resources', 'View subject resources', 'Subjects', true),
  (gen_random_uuid(), 'subjects.manage_resources', 'subjects', 'manage_resources', 'Attach and detach subject resources', 'Subjects', true),
  (gen_random_uuid(), 'notes.list', 'notes', 'list', 'List teacher important notes', 'Notes', true),
  (gen_random_uuid(), 'notes.create', 'notes', 'create', 'Create teacher important notes', 'Notes', true),
  (gen_random_uuid(), 'notes.update', 'notes', 'update', 'Update teacher important notes', 'Notes', true),
  (gen_random_uuid(), 'notes.delete', 'notes', 'delete', 'Delete teacher important notes', 'Notes', true)
ON CONFLICT (key) DO UPDATE SET
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_system = EXCLUDED.is_system;

-- Re-enable the trigger (guaranteed even if INSERT fails above)
DO $$
BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not re-enable trigger: %', SQLERRM;
END $$;

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

-- ============================================================
-- 3. INSERT default categories and subjects
-- ============================================================

INSERT INTO class_categories (name, slug, description, is_active, sort_order)
VALUES
  ('Quran', 'quran', 'Quran recitation and memorization studies', true, 1),
  ('Arabic Language', 'arabic-language', 'Arabic language and grammar studies', true, 2),
  ('Islamic Studies', 'islamic-studies', 'Islamic studies including fiqh, aqidah, and seerah', true, 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO class_subjects (category_id, name, slug, description, is_active, sort_order)
SELECT cat.id, 'Quran Recitation', 'quran-recitation', 'Quran recitation practice and tajweed', true, 1
FROM class_categories cat WHERE cat.slug = 'quran'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO class_subjects (category_id, name, slug, description, is_active, sort_order)
SELECT cat.id, 'Quran Memorization', 'quran-memorization', 'Hifz — Quran memorization and review', true, 2
FROM class_categories cat WHERE cat.slug = 'quran'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO class_subjects (category_id, name, slug, description, is_active, sort_order)
SELECT cat.id, 'Arabic Grammar', 'arabic-grammar', 'Nahw and Sarf — Arabic grammar foundations', true, 1
FROM class_categories cat WHERE cat.slug = 'arabic-language'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO class_subjects (category_id, name, slug, description, is_active, sort_order)
SELECT cat.id, 'Arabic Conversation', 'arabic-conversation', 'Arabic speaking and conversation practice', true, 2
FROM class_categories cat WHERE cat.slug = 'arabic-language'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO class_subjects (category_id, name, slug, description, is_active, sort_order)
SELECT cat.id, 'Fiqh', 'fiqh', 'Islamic jurisprudence and rulings', true, 1
FROM class_categories cat WHERE cat.slug = 'islamic-studies'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO class_subjects (category_id, name, slug, description, is_active, sort_order)
SELECT cat.id, 'Aqidah', 'aqidah', 'Islamic creed and theology', true, 2
FROM class_categories cat WHERE cat.slug = 'islamic-studies'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO class_subjects (category_id, name, slug, description, is_active, sort_order)
SELECT cat.id, 'Seerah', 'seerah', 'Prophetic biography and life of the Prophet', true, 3
FROM class_categories cat WHERE cat.slug = 'islamic-studies'
ON CONFLICT (slug) DO NOTHING;


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


-- Source: add_test_custom_alt_permission.sql
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'test.custom_alt';


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

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS prevent_audit_log_mod_trigger ON audit_logs;

-- Create trigger to prevent UPDATE and DELETE operations
CREATE TRIGGER prevent_audit_log_mod_trigger
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

-- Also create trigger for admin_audit_logs table
DROP TRIGGER IF EXISTS prevent_admin_audit_log_mod_trigger ON admin_audit_logs;

CREATE TRIGGER prevent_admin_audit_log_mod_trigger
BEFORE UPDATE OR DELETE ON admin_audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();


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



-- Source: books_rls_policies.sql
-- 7. books configuration
ALTER TABLE "books" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "books" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS books_select_policy ON "books";
CREATE POLICY books_select_policy ON "books" FOR SELECT USING (deleted_at IS NULL);
DROP POLICY IF EXISTS books_insert_policy ON "books";
CREATE POLICY books_insert_policy ON "books" FOR INSERT WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS books_update_policy ON "books";
CREATE POLICY books_update_policy ON "books" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);
DROP POLICY IF EXISTS books_soft_delete_policy ON "books";
DROP POLICY IF EXISTS books_delete_policy ON "books";
CREATE POLICY books_delete_policy ON "books" FOR DELETE USING (false);


-- Source: cache_split.sql
-- Ensure rate_limit_cache is UNLOGGED
-- This is done via ALTER because Drizzle doesn't support UNLOGGED in schema yet
ALTER TABLE IF EXISTS rate_limit_cache SET UNLOGGED;

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

-- 4. Create Triggers
DROP TRIGGER IF EXISTS trg_recalc_hours_recurring_schedules ON recurring_schedules;
CREATE TRIGGER trg_recalc_hours_recurring_schedules
AFTER INSERT OR UPDATE OR DELETE ON recurring_schedules
FOR EACH ROW EXECUTE FUNCTION trg_fn_recurring_schedules_hours_recalc();

DROP TRIGGER IF EXISTS trg_recalc_hours_recurring_schedule_days ON recurring_schedule_days;
CREATE TRIGGER trg_recalc_hours_recurring_schedule_days
AFTER INSERT OR UPDATE OR DELETE ON recurring_schedule_days
FOR EACH ROW EXECUTE FUNCTION trg_fn_recurring_schedule_days_hours_recalc();

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

CREATE INDEX IF NOT EXISTS impersonation_sessions_actor_idx ON impersonation_sessions(actor_user_id);
CREATE INDEX IF NOT EXISTS impersonation_sessions_target_idx ON impersonation_sessions(target_user_id);
CREATE INDEX IF NOT EXISTS impersonation_sessions_session_idx ON impersonation_sessions(session_id);
CREATE INDEX IF NOT EXISTS impersonation_sessions_active_actor_idx ON impersonation_sessions(actor_user_id, is_active);

CREATE UNIQUE INDEX IF NOT EXISTS impersonation_sessions_one_active_per_actor
  ON impersonation_sessions(actor_user_id)
  WHERE is_active = true;


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

DROP TRIGGER IF EXISTS trg_enforce_leave_quota_limits ON leave_quota_usage;
CREATE TRIGGER trg_enforce_leave_quota_limits
BEFORE INSERT OR UPDATE ON leave_quota_usage
FOR EACH ROW EXECUTE FUNCTION enforce_leave_quota_limits();


-- Source: permissions_rls_policies.sql
ALTER TABLE "students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "students" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS students_select_policy ON "students";
CREATE POLICY students_select_policy ON "students"
FOR SELECT
USING (
    NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
    OR
    parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
);

DROP POLICY IF EXISTS students_insert_policy ON "students";
CREATE POLICY students_insert_policy ON "students"
FOR INSERT
WITH CHECK (
    NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
    OR
    parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
);

DROP POLICY IF EXISTS students_update_policy ON "students";
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

DROP POLICY IF EXISTS students_delete_policy ON "students";
CREATE POLICY students_delete_policy ON "students"
FOR DELETE
USING (
    NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
    OR
    parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
);


-- Source: soft_delete_rls_policies.sql
-- Soft-delete RLS policies (application-layer enforcement via SoftDeleteRepository).
-- Hard DELETE is blocked for RLS roles; soft deletes use UPDATE deleted_at through the repository
-- with session variable app.soft_delete = 'true'.

-- 1. users configuration
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_policy ON "users";
CREATE POLICY users_select_policy ON "users" FOR SELECT USING (deleted_at IS NULL);
DROP POLICY IF EXISTS users_insert_policy ON "users";
CREATE POLICY users_insert_policy ON "users" FOR INSERT WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS users_update_policy ON "users";
CREATE POLICY users_update_policy ON "users" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);
DROP POLICY IF EXISTS users_soft_delete_policy ON "users";
DROP POLICY IF EXISTS users_delete_policy ON "users";
CREATE POLICY users_delete_policy ON "users" FOR DELETE USING (false);

-- 2. recurring_schedules configuration
ALTER TABLE "recurring_schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recurring_schedules" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recurring_schedules_select_policy ON "recurring_schedules";
CREATE POLICY recurring_schedules_select_policy ON "recurring_schedules" FOR SELECT USING (deleted_at IS NULL);
DROP POLICY IF EXISTS recurring_schedules_insert_policy ON "recurring_schedules";
CREATE POLICY recurring_schedules_insert_policy ON "recurring_schedules" FOR INSERT WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS recurring_schedules_update_policy ON "recurring_schedules";
CREATE POLICY recurring_schedules_update_policy ON "recurring_schedules" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);
DROP POLICY IF EXISTS recurring_schedules_soft_delete_policy ON "recurring_schedules";
DROP POLICY IF EXISTS recurring_schedules_delete_policy ON "recurring_schedules";
CREATE POLICY recurring_schedules_delete_policy ON "recurring_schedules" FOR DELETE USING (false);

-- 3. class_instances configuration
ALTER TABLE "class_instances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "class_instances" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS class_instances_select_policy ON "class_instances";
CREATE POLICY class_instances_select_policy ON "class_instances" FOR SELECT USING (deleted_at IS NULL);
DROP POLICY IF EXISTS class_instances_insert_policy ON "class_instances";
CREATE POLICY class_instances_insert_policy ON "class_instances" FOR INSERT WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS class_instances_update_policy ON "class_instances";
CREATE POLICY class_instances_update_policy ON "class_instances" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);
DROP POLICY IF EXISTS class_instances_soft_delete_policy ON "class_instances";
DROP POLICY IF EXISTS class_instances_delete_policy ON "class_instances";
CREATE POLICY class_instances_delete_policy ON "class_instances" FOR DELETE USING (false);

-- 4. complaints configuration
ALTER TABLE "complaints" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "complaints" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS complaints_select_policy ON "complaints";
CREATE POLICY complaints_select_policy ON "complaints" FOR SELECT USING (deleted_at IS NULL);
DROP POLICY IF EXISTS complaints_insert_policy ON "complaints";
CREATE POLICY complaints_insert_policy ON "complaints" FOR INSERT WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS complaints_update_policy ON "complaints";
CREATE POLICY complaints_update_policy ON "complaints" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);
DROP POLICY IF EXISTS complaints_soft_delete_policy ON "complaints";
DROP POLICY IF EXISTS complaints_delete_policy ON "complaints";
CREATE POLICY complaints_delete_policy ON "complaints" FOR DELETE USING (false);

-- 5. learning_resources configuration
ALTER TABLE "learning_resources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning_resources" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS learning_resources_select_policy ON "learning_resources";
CREATE POLICY learning_resources_select_policy ON "learning_resources" FOR SELECT USING (deleted_at IS NULL);
DROP POLICY IF EXISTS learning_resources_insert_policy ON "learning_resources";
CREATE POLICY learning_resources_insert_policy ON "learning_resources" FOR INSERT WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS learning_resources_update_policy ON "learning_resources";
CREATE POLICY learning_resources_update_policy ON "learning_resources" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);
DROP POLICY IF EXISTS learning_resources_soft_delete_policy ON "learning_resources";
DROP POLICY IF EXISTS learning_resources_delete_policy ON "learning_resources";
CREATE POLICY learning_resources_delete_policy ON "learning_resources" FOR DELETE USING (false);

-- 6. invoices configuration
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invoices_select_policy ON "invoices";
CREATE POLICY invoices_select_policy ON "invoices" FOR SELECT USING (deleted_at IS NULL);
DROP POLICY IF EXISTS invoices_insert_policy ON "invoices";
CREATE POLICY invoices_insert_policy ON "invoices" FOR INSERT WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS invoices_update_policy ON "invoices";
CREATE POLICY invoices_update_policy ON "invoices" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);
DROP POLICY IF EXISTS invoices_soft_delete_policy ON "invoices";
DROP POLICY IF EXISTS invoices_delete_policy ON "invoices";
CREATE POLICY invoices_delete_policy ON "invoices" FOR DELETE USING (false);


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

DROP TRIGGER IF EXISTS trg_prevent_student_created_at_update ON students;

CREATE TRIGGER trg_prevent_student_created_at_update
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION prevent_student_created_at_update();


-- Source: student_progress_rls.sql
-- Enable RLS on the table
ALTER TABLE "student_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "student_progress" FORCE ROW LEVEL SECURITY;

-- Drop policies if they exist for idempotency
DROP POLICY IF EXISTS student_progress_teacher_policy ON "student_progress";
DROP POLICY IF EXISTS student_progress_parent_policy ON "student_progress";

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

-- Drop triggers if they exist to ensure idempotency
DROP TRIGGER IF EXISTS trg_enforce_student_status_transition ON students;
DROP TRIGGER IF EXISTS trg_log_student_status_history ON students;

-- Create Enforcement Trigger (BEFORE UPDATE)
CREATE TRIGGER trg_enforce_student_status_transition
BEFORE UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION fn_enforce_student_status_transition();

-- Create Logging Trigger (AFTER INSERT OR UPDATE)
CREATE TRIGGER trg_log_student_status_history
AFTER INSERT OR UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION fn_log_student_status_history();


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

-- 4. Trigger to automatically snapshot timezone and offset on class creation if not provided
CREATE OR REPLACE FUNCTION trg_snapshot_booking_timezone()
RETURNS TRIGGER AS $$
DECLARE
    teacher_tz TEXT;
BEGIN
    -- Only snapshot if not already provided (e.g., by app layer)
    IF NEW.booking_timezone IS NULL THEN
        SELECT timezone INTO teacher_tz FROM teachers WHERE id = NEW.teacher_id;
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

DROP TRIGGER IF EXISTS trg_class_instances_timezone_snapshot ON class_instances;
CREATE TRIGGER trg_class_instances_timezone_snapshot
BEFORE INSERT ON class_instances
FOR EACH ROW EXECUTE FUNCTION trg_snapshot_booking_timezone();

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

DROP TRIGGER IF EXISTS trg_recurring_schedules_timezone_snapshot ON recurring_schedules;
CREATE TRIGGER trg_recurring_schedules_timezone_snapshot
BEFORE INSERT OR UPDATE ON recurring_schedules
FOR EACH ROW EXECUTE FUNCTION trg_snapshot_recurring_schedule_timezone();

-- 6. Trigger for teachers to link timezone_id
CREATE OR REPLACE FUNCTION trg_teachers_timezone_id_sync()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.timezone IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.timezone IS NULL OR NEW.timezone != OLD.timezone) THEN
        SELECT id INTO NEW.timezone_id FROM timezones WHERE iana_id = NEW.timezone;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_teachers_timezone_id_sync ON teachers;
CREATE TRIGGER trg_teachers_timezone_id_sync
BEFORE INSERT OR UPDATE ON teachers
FOR EACH ROW EXECUTE FUNCTION trg_teachers_timezone_id_sync();


-- Source: user_notification_preferences.sql
-- Enable RLS on the table
ALTER TABLE "user_notification_preferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_notification_preferences" FORCE ROW LEVEL SECURITY;

-- Drop policy if exists for idempotency
DROP POLICY IF EXISTS notification_preferences_access_policy ON "user_notification_preferences";

-- Create policy: Users can only manage their own preferences
-- current_user_id() is defined in permissions_rls_policies.sql
CREATE POLICY notification_preferences_access_policy ON "user_notification_preferences"
FOR ALL
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());

-- Enable RLS on device token and delivery tracking tables
ALTER TABLE "user_device_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_device_tokens" FORCE ROW LEVEL SECURITY;

ALTER TABLE "notification_deliveries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notification_deliveries" FORCE ROW LEVEL SECURITY;

-- Drop policies if they exist for idempotency
DROP POLICY IF EXISTS user_device_tokens_access_policy ON "user_device_tokens";
DROP POLICY IF EXISTS notification_deliveries_access_policy ON "notification_deliveries";

-- Users can only manage their own device tokens
CREATE POLICY user_device_tokens_access_policy ON "user_device_tokens"
FOR ALL
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());

-- Users can only view their own notification deliveries
CREATE POLICY notification_deliveries_access_policy ON "notification_deliveries"
FOR ALL
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());


