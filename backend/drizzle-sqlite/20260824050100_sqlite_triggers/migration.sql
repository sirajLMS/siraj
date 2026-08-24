-- SQLite Triggers for database integrity and compliance

-- 1. Audit Log Immutability Triggers
CREATE TRIGGER IF NOT EXISTS prevent_audit_log_update_trigger
BEFORE UPDATE ON audit_logs
BEGIN
    SELECT RAISE(ABORT, 'Modifying or deleting audit logs is forbidden');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS prevent_audit_log_delete_trigger
BEFORE DELETE ON audit_logs
BEGIN
    SELECT RAISE(ABORT, 'Modifying or deleting audit logs is forbidden');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS prevent_admin_audit_log_update_trigger
BEFORE UPDATE ON admin_audit_logs
BEGIN
    SELECT RAISE(ABORT, 'Modifying or deleting audit logs is forbidden');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS prevent_admin_audit_log_delete_trigger
BEFORE DELETE ON admin_audit_logs
BEGIN
    SELECT RAISE(ABORT, 'Modifying or deleting audit logs is forbidden');
END;
--> statement-breakpoint

-- 2. Student created_at Immutability Trigger
CREATE TRIGGER IF NOT EXISTS trg_prevent_student_created_at_update
BEFORE UPDATE OF created_at ON students
FOR EACH ROW
WHEN NEW.created_at IS NOT OLD.created_at
BEGIN
  SELECT RAISE(ABORT, 'students.created_at is immutable and cannot be changed after insert.');
END;
--> statement-breakpoint

-- 3. Student Status Transition Trigger
CREATE TRIGGER IF NOT EXISTS trg_enforce_student_status_transition
BEFORE UPDATE OF status ON students
FOR EACH ROW
WHEN OLD.status IS NOT NEW.status
BEGIN
    SELECT CASE
        WHEN OLD.status = 'ON_TRIAL' AND NEW.status NOT IN ('REGULAR', 'DEACTIVATED')
            THEN RAISE(ABORT, 'Invalid status transition')
        WHEN OLD.status = 'REGULAR' AND NEW.status NOT IN ('SUSPENDED', 'ON_LEAVE', 'DEACTIVATED')
            THEN RAISE(ABORT, 'Invalid status transition')
        WHEN OLD.status = 'SUSPENDED' AND NEW.status NOT IN ('REGULAR', 'DEACTIVATED')
            THEN RAISE(ABORT, 'Invalid status transition')
        WHEN OLD.status = 'ON_LEAVE' AND NEW.status NOT IN ('REGULAR', 'DEACTIVATED')
            THEN RAISE(ABORT, 'Invalid status transition')
        WHEN OLD.status = 'DEACTIVATED' AND NEW.status NOT IN ('REGULAR')
            THEN RAISE(ABORT, 'Invalid status transition')
    END;
END;
--> statement-breakpoint

-- 4. Class Instance State Transition Trigger
CREATE TRIGGER IF NOT EXISTS trg_enforce_class_instance_transition
BEFORE UPDATE OF execution_state, outcome ON class_instances
FOR EACH ROW
WHEN OLD.execution_state IS NOT NEW.execution_state
BEGIN
    SELECT CASE
        WHEN OLD.execution_state = 'COMPLETED' AND NEW.execution_state IN ('ACTIVATED', 'RUNNING')
            THEN RAISE(ABORT, 'Invalid transition: Cannot reactivate a COMPLETED class instance.')
        WHEN OLD.execution_state = 'COMPLETED' AND NEW.execution_state = 'NOT_ACTIVATED' AND OLD.outcome = 'TAKEN'
            THEN RAISE(ABORT, 'Invalid transition: Cannot reset a COMPLETED instance with TAKEN outcome.')
        WHEN OLD.execution_state = 'RUNNING' AND NEW.execution_state = 'ACTIVATED'
            THEN RAISE(ABORT, 'Invalid transition: Cannot move a RUNNING class instance back to ACTIVATED.')
        WHEN OLD.execution_state = 'ACTIVATED' AND NEW.execution_state = 'COMPLETED' AND NEW.outcome NOT IN ('ABSENT', 'LEAVE')
            THEN RAISE(ABORT, 'Invalid transition: ACTIVATED instance can only complete with ABSENT or LEAVE outcome.')
        WHEN OLD.execution_state = 'NOT_ACTIVATED' AND NEW.execution_state = 'COMPLETED' AND NEW.outcome NOT IN ('LEAVE', 'ABSENT')
            THEN RAISE(ABORT, 'Invalid transition: NOT_ACTIVATED instance can only complete with LEAVE or ABSENT outcome.')
    END;
END;
--> statement-breakpoint

-- 5. Leave Quota Limits Trigger
DROP TRIGGER IF EXISTS trg_enforce_leave_quota_limits_insert;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS trg_enforce_leave_quota_limits_insert
BEFORE INSERT ON leave_quota_usage
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN NEW.used_count > COALESCE(
            (SELECT CAST(value AS INTEGER) FROM system_settings WHERE key = CASE WHEN NEW.teacher_id IS NOT NULL THEN 'teacher_max_leaves' ELSE 'student_max_leaves' END),
            2
        ) THEN RAISE(ABORT, 'Leave quota exceeded. Maximum allowed leaves is exceeded')
    END;
END;
--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_enforce_leave_quota_limits_update;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS trg_enforce_leave_quota_limits_update
BEFORE UPDATE OF used_count, teacher_id, student_id ON leave_quota_usage
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN NEW.used_count > COALESCE(
            (SELECT CAST(value AS INTEGER) FROM system_settings WHERE key = CASE WHEN NEW.teacher_id IS NOT NULL THEN 'teacher_max_leaves' ELSE 'student_max_leaves' END),
            2
        ) THEN RAISE(ABORT, 'Leave quota exceeded. Maximum allowed leaves is exceeded')
    END;
END;

-- 5. System Permission Protection Triggers
-- Mirrors PG's protect_system_permissions() function (3-system_permissions_and_groups.sql).
-- System permissions are bootstrapped in migration 20260824050000_system_bootstrap_data
-- (before this trigger exists), so the INSERT guard only blocks runtime app/test inserts.

CREATE TRIGGER IF NOT EXISTS trg_protect_system_permissions_insert
BEFORE INSERT ON permissions
FOR EACH ROW
WHEN NEW.is_system = 1
BEGIN
    SELECT RAISE(ABORT, 'Cannot create system permissions');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS trg_protect_system_permissions_update
BEFORE UPDATE ON permissions
FOR EACH ROW
WHEN NEW.is_system = 1 OR OLD.is_system = 1
BEGIN
    SELECT CASE
        WHEN NEW.is_system = 1 AND OLD.is_system = 0 THEN RAISE(ABORT, 'Cannot change is_system to true')
        WHEN OLD.is_system = 1 AND NEW.is_system = 0 THEN RAISE(ABORT, 'Cannot change is_system from true to false for system permissions or groups')
        WHEN OLD.is_system = 1 AND (NEW.key IS NOT OLD.key OR NEW.resource IS NOT OLD.resource OR NEW.action IS NOT OLD.action) THEN RAISE(ABORT, 'Cannot modify core properties of system permissions; only description and category can be updated')
    END;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS trg_protect_system_permissions_delete
BEFORE DELETE ON permissions
FOR EACH ROW
WHEN OLD.is_system = 1
BEGIN
    SELECT RAISE(ABORT, 'Cannot delete a system permission or group');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS trg_protect_system_permission_groups_update
BEFORE UPDATE ON permission_groups
FOR EACH ROW
WHEN NEW.is_system = 1 OR OLD.is_system = 1
BEGIN
    SELECT CASE
        WHEN NEW.is_system = 1 AND OLD.is_system = 0 THEN RAISE(ABORT, 'Cannot change is_system to true')
        WHEN OLD.is_system = 1 AND NEW.is_system = 0 THEN RAISE(ABORT, 'Cannot change is_system from true to false for system permissions or groups')
        WHEN OLD.is_system = 1 AND NEW.slug IS NOT OLD.slug THEN RAISE(ABORT, 'Cannot modify core properties of system permission groups; only name and description can be updated')
    END;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS trg_protect_system_permission_groups_delete
BEFORE DELETE ON permission_groups
FOR EACH ROW
WHEN OLD.is_system = 1
BEGIN
    SELECT RAISE(ABORT, 'Cannot delete a system permission or group');
END;
