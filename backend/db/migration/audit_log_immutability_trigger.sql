-- Trigger to prevent modifications to audit_logs tables (immutability enforcement)
-- This ensures audit logs cannot be tampered with for compliance requirements.
--
-- Concurrency-safe maintenance escape hatch: a transaction may opt in to
-- maintenance mode via a TRANSACTION-LOCAL GUC:
--   SELECT set_config('app.audit_log_maintenance', 'on', true);
-- letting it (and only it) UPDATE/DELETE audit rows — fixture cleanup, GDPR
-- erasure, retention pruning. The flag is transaction-scoped (set_config with
-- is_local => true), so it cannot leak across connections or transactions:
-- concurrent sessions and production traffic keep full enforcement, with no
-- global DDL locking (ALTER TABLE ... DISABLE TRIGGER takes an ACCESS
-- EXCLUSIVE lock and races with a concurrent re-ENABLE — two cleanups running
-- at once can corrupt each other's window).

-- Idempotently (re)create the trigger function. CREATE OR REPLACE propagates
-- body changes to the existing triggers (both audit tables reference it).
CREATE OR REPLACE FUNCTION prevent_audit_log_modification() RETURNS trigger AS $func$
BEGIN
    IF current_setting('app.audit_log_maintenance', true) = 'on' THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        END IF;
        RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Modifying or deleting audit logs is forbidden';
END;
$func$ LANGUAGE plpgsql;

-- Recreate triggers to prevent UPDATE and DELETE operations
DROP TRIGGER IF EXISTS prevent_audit_log_mod_trigger ON audit_logs;

CREATE TRIGGER prevent_audit_log_mod_trigger
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

-- Also create trigger for admin_audit_logs table
DROP TRIGGER IF EXISTS prevent_admin_audit_log_mod_trigger ON admin_audit_logs;

CREATE TRIGGER prevent_admin_audit_log_mod_trigger
BEFORE UPDATE OR DELETE ON admin_audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();
