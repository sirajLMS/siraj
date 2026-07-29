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
END $$;--> statement-breakpoint
-- Drop trigger if it exists
DROP TRIGGER IF EXISTS prevent_audit_log_mod_trigger ON audit_logs;--> statement-breakpoint
-- Create trigger to prevent UPDATE and DELETE operations
CREATE TRIGGER prevent_audit_log_mod_trigger
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();--> statement-breakpoint
-- Also create trigger for admin_audit_logs table
DROP TRIGGER IF EXISTS prevent_admin_audit_log_mod_trigger ON admin_audit_logs;--> statement-breakpoint
CREATE TRIGGER prevent_admin_audit_log_mod_trigger
BEFORE UPDATE OR DELETE ON admin_audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();--> statement-breakpoint

