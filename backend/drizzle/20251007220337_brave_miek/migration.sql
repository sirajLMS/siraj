-- Custom SQL migration file, put your code below! --

-- Enable the pg_trgm extension for faster LIKE/ILIKE searches
-- Drizzle doesn't create extensions automatically, so we need to do it manually
CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- Audit Log Immutability Trigger
-- bun drizzle-kit generate --custom --name=audit_log_immutability_trigger
--------------------------------------------------------------------------

-- CREATE OR REPLACE FUNCTION prevent_audit_modification() RETURNS trigger AS $$
-- BEGIN
--     RAISE EXCEPTION 'Modifying or deleting audit logs is forbidden';
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER prevent_audit_mod_trigger
-- BEFORE UPDATE OR DELETE ON admin_audit_logs
-- FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();