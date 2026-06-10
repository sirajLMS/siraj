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
UPDATE students s
SET hours_per_week = COALESCE((
  SELECT SUM(rs.duration_minutes)::numeric / 60.0
  FROM recurring_schedules rs
  JOIN recurring_schedule_days rsd ON rsd.recurring_schedule_id = rs.id
  WHERE rs.student_id = s.id
    AND rs.deleted_at IS NULL
    AND rsd.is_active = true
), 0);

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
CREATE OR REPLACE FUNCTION current_user_id() 
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', true), '')::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

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
-- 1. Create generic trigger function for soft deletes
CREATE OR REPLACE FUNCTION soft_delete_row_trigger_fn() 
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.deleted_at IS NOT NULL THEN
    RETURN OLD; -- Proceed with hard delete
  ELSE
    EXECUTE format('UPDATE %I SET deleted_at = NOW() WHERE id = $1', TG_TABLE_NAME) USING OLD.id;
    RETURN NULL; -- Cancel hard delete
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. users configuration
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_soft_delete_users ON "users";
CREATE TRIGGER trg_soft_delete_users
BEFORE DELETE ON "users"
FOR EACH ROW EXECUTE FUNCTION soft_delete_row_trigger_fn();

DROP POLICY IF EXISTS users_select_policy ON "users";
CREATE POLICY users_select_policy ON "users" FOR SELECT USING (deleted_at IS NULL);
DROP POLICY IF EXISTS users_insert_policy ON "users";
CREATE POLICY users_insert_policy ON "users" FOR INSERT WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS users_update_policy ON "users";
CREATE POLICY users_update_policy ON "users" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS users_delete_policy ON "users";
CREATE POLICY users_delete_policy ON "users" FOR DELETE USING (true);

-- 3. recurring_schedules configuration
ALTER TABLE "recurring_schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recurring_schedules" FORCE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_soft_delete_recurring_schedules ON "recurring_schedules";
CREATE TRIGGER trg_soft_delete_recurring_schedules
BEFORE DELETE ON "recurring_schedules"
FOR EACH ROW EXECUTE FUNCTION soft_delete_row_trigger_fn();

DROP POLICY IF EXISTS recurring_schedules_select_policy ON "recurring_schedules";
CREATE POLICY recurring_schedules_select_policy ON "recurring_schedules" FOR SELECT USING (deleted_at IS NULL);
DROP POLICY IF EXISTS recurring_schedules_insert_policy ON "recurring_schedules";
CREATE POLICY recurring_schedules_insert_policy ON "recurring_schedules" FOR INSERT WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS recurring_schedules_update_policy ON "recurring_schedules";
CREATE POLICY recurring_schedules_update_policy ON "recurring_schedules" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS recurring_schedules_delete_policy ON "recurring_schedules";
CREATE POLICY recurring_schedules_delete_policy ON "recurring_schedules" FOR DELETE USING (true);

-- 4. class_instances configuration
ALTER TABLE "class_instances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "class_instances" FORCE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_soft_delete_class_instances ON "class_instances";
CREATE TRIGGER trg_soft_delete_class_instances
BEFORE DELETE ON "class_instances"
FOR EACH ROW EXECUTE FUNCTION soft_delete_row_trigger_fn();

DROP POLICY IF EXISTS class_instances_select_policy ON "class_instances";
CREATE POLICY class_instances_select_policy ON "class_instances" FOR SELECT USING (deleted_at IS NULL);
DROP POLICY IF EXISTS class_instances_insert_policy ON "class_instances";
CREATE POLICY class_instances_insert_policy ON "class_instances" FOR INSERT WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS class_instances_update_policy ON "class_instances";
CREATE POLICY class_instances_update_policy ON "class_instances" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS class_instances_delete_policy ON "class_instances";
CREATE POLICY class_instances_delete_policy ON "class_instances" FOR DELETE USING (true);

-- 5. complaints configuration
ALTER TABLE "complaints" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "complaints" FORCE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_soft_delete_complaints ON "complaints";
CREATE TRIGGER trg_soft_delete_complaints
BEFORE DELETE ON "complaints"
FOR EACH ROW EXECUTE FUNCTION soft_delete_row_trigger_fn();

DROP POLICY IF EXISTS complaints_select_policy ON "complaints";
CREATE POLICY complaints_select_policy ON "complaints" FOR SELECT USING (deleted_at IS NULL);
DROP POLICY IF EXISTS complaints_insert_policy ON "complaints";
CREATE POLICY complaints_insert_policy ON "complaints" FOR INSERT WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS complaints_update_policy ON "complaints";
CREATE POLICY complaints_update_policy ON "complaints" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS complaints_delete_policy ON "complaints";
CREATE POLICY complaints_delete_policy ON "complaints" FOR DELETE USING (true);

-- 6. learning_resources configuration
ALTER TABLE "learning_resources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning_resources" FORCE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_soft_delete_learning_resources ON "learning_resources";
CREATE TRIGGER trg_soft_delete_learning_resources
BEFORE DELETE ON "learning_resources"
FOR EACH ROW EXECUTE FUNCTION soft_delete_row_trigger_fn();

DROP POLICY IF EXISTS learning_resources_select_policy ON "learning_resources";
CREATE POLICY learning_resources_select_policy ON "learning_resources" FOR SELECT USING (deleted_at IS NULL);
DROP POLICY IF EXISTS learning_resources_insert_policy ON "learning_resources";
CREATE POLICY learning_resources_insert_policy ON "learning_resources" FOR INSERT WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS learning_resources_update_policy ON "learning_resources";
CREATE POLICY learning_resources_update_policy ON "learning_resources" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS learning_resources_delete_policy ON "learning_resources";
CREATE POLICY learning_resources_delete_policy ON "learning_resources" FOR DELETE USING (true);

-- 7. invoices configuration
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" FORCE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_soft_delete_invoices ON "invoices";
CREATE TRIGGER trg_soft_delete_invoices
BEFORE DELETE ON "invoices"
FOR EACH ROW EXECUTE FUNCTION soft_delete_row_trigger_fn();

DROP POLICY IF EXISTS invoices_select_policy ON "invoices";
CREATE POLICY invoices_select_policy ON "invoices" FOR SELECT USING (deleted_at IS NULL);
DROP POLICY IF EXISTS invoices_insert_policy ON "invoices";
CREATE POLICY invoices_insert_policy ON "invoices" FOR INSERT WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS invoices_update_policy ON "invoices";
CREATE POLICY invoices_update_policy ON "invoices" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS invoices_delete_policy ON "invoices";
CREATE POLICY invoices_delete_policy ON "invoices" FOR DELETE USING (true);


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
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- GRADUATED is a terminal state
        IF OLD.status = 'GRADUATED' THEN
            RAISE EXCEPTION 'Cannot change status of a GRADUATED student.';
        END IF;

        -- Transitions from ON_TRIAL
        IF OLD.status = 'ON_TRIAL' AND NEW.status NOT IN ('REGULAR', 'DEACTIVATED') THEN
            RAISE EXCEPTION 'Invalid status transition: % to %', OLD.status, NEW.status;
        END IF;

        -- Transitions from REGULAR
        IF OLD.status = 'REGULAR' AND NEW.status NOT IN ('SUSPENDED', 'ON_LEAVE', 'DEACTIVATED', 'GRADUATED') THEN
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


-- Source: teacher_banking_history_trigger.sql
CREATE OR REPLACE FUNCTION enforce_teacher_banking_immutability()
RETURNS TRIGGER AS $$
BEGIN
    -- Do not allow modifying historically closed records
    IF OLD.valid_until IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot modify historical banking records';
    END IF;

    -- Do not allow modifying banking fields of an active record
    IF OLD.beneficiary_name IS DISTINCT FROM NEW.beneficiary_name OR
       OLD.bank_name IS DISTINCT FROM NEW.bank_name OR
       OLD.account_number IS DISTINCT FROM NEW.account_number OR
       OLD.routing_number IS DISTINCT FROM NEW.routing_number OR
       OLD.swift_bic IS DISTINCT FROM NEW.swift_bic OR
       OLD.iban IS DISTINCT FROM NEW.iban THEN
        RAISE EXCEPTION 'Cannot modify banking fields directly. Close the current record and insert a new one.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_teacher_banking_immutability ON teacher_banking_details_history;
CREATE TRIGGER trg_enforce_teacher_banking_immutability
BEFORE UPDATE ON teacher_banking_details_history
FOR EACH ROW EXECUTE FUNCTION enforce_teacher_banking_immutability();


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


