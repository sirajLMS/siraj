-- Migration: Seed System Permissions and Groups
-- Auto-generated

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
WHERE
    group_id IN (
        SELECT id
        FROM permission_groups
        WHERE
            is_system = true
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
        'system.sync_notifications'
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
        'resources.upload'
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
        'complaints.list'
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
        'system.restrict_resource_access'
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