-- Custom SQL migration file, put your code below! --

CREATE OR REPLACE FUNCTION prevent_audit_modification() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'Modifying or deleting audit logs is forbidden';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_audit_mod_trigger
BEFORE UPDATE OR DELETE ON admin_audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();