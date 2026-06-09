-- 1. Clean up any pre-existing orphaned file_usage records
DELETE FROM "file_usage" fu
WHERE NOT EXISTS (
  SELECT 1 FROM (
    SELECT id, 'users' as tbl FROM "users" UNION ALL
    SELECT id, 'teachers' as tbl FROM "teachers" UNION ALL
    SELECT id, 'students' as tbl FROM "students" UNION ALL
    SELECT id, 'parents' as tbl FROM "parents" UNION ALL
    SELECT id, 'invoices' as tbl FROM "invoices" UNION ALL
    SELECT id, 'complaints' as tbl FROM "complaints" UNION ALL
    SELECT id, 'learning_resources' as tbl FROM "learning_resources" UNION ALL
    SELECT id, 'staff_profiles' as tbl FROM "staff_profiles" UNION ALL
    SELECT id, 'recurring_schedules' as tbl FROM "recurring_schedules" UNION ALL
    SELECT id, 'class_instances' as tbl FROM "class_instances"
  ) ref_tables
  WHERE ref_tables.id = fu.reference_id AND ref_tables.tbl = fu.reference_table
);

-- 2. Create the validation trigger function for inserts/updates
CREATE OR REPLACE FUNCTION validate_file_usage_reference() 
RETURNS TRIGGER AS $$
DECLARE
  ref_exists BOOLEAN;
BEGIN
  CASE NEW.reference_table
    WHEN 'users' THEN
      SELECT EXISTS(SELECT 1 FROM "users" WHERE id = NEW.reference_id) INTO ref_exists;
    WHEN 'teachers' THEN
      SELECT EXISTS(SELECT 1 FROM "teachers" WHERE id = NEW.reference_id) INTO ref_exists;
    WHEN 'students' THEN
      SELECT EXISTS(SELECT 1 FROM "students" WHERE id = NEW.reference_id) INTO ref_exists;
    WHEN 'parents' THEN
      SELECT EXISTS(SELECT 1 FROM "parents" WHERE id = NEW.reference_id) INTO ref_exists;
    WHEN 'invoices' THEN
      SELECT EXISTS(SELECT 1 FROM "invoices" WHERE id = NEW.reference_id) INTO ref_exists;
    WHEN 'complaints' THEN
      SELECT EXISTS(SELECT 1 FROM "complaints" WHERE id = NEW.reference_id) INTO ref_exists;
    WHEN 'learning_resources' THEN
      SELECT EXISTS(SELECT 1 FROM "learning_resources" WHERE id = NEW.reference_id) INTO ref_exists;
    WHEN 'staff_profiles' THEN
      SELECT EXISTS(SELECT 1 FROM "staff_profiles" WHERE id = NEW.reference_id) INTO ref_exists;
    WHEN 'recurring_schedules' THEN
      SELECT EXISTS(SELECT 1 FROM "recurring_schedules" WHERE id = NEW.reference_id) INTO ref_exists;
    WHEN 'class_instances' THEN
      SELECT EXISTS(SELECT 1 FROM "class_instances" WHERE id = NEW.reference_id) INTO ref_exists;
    ELSE
      RAISE EXCEPTION 'Invalid reference table: %', NEW.reference_table;
  END CASE;

  IF NOT ref_exists THEN
    RAISE EXCEPTION 'Reference ID % does not exist in table %', NEW.reference_id, NEW.reference_table;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the cascade delete trigger function
CREATE OR REPLACE FUNCTION cascade_delete_file_usages() 
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM "file_usage" 
  WHERE reference_id = OLD.id AND reference_table = TG_TABLE_NAME;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach validation trigger to file_usage
CREATE TRIGGER trg_validate_file_usage
BEFORE INSERT OR UPDATE ON "file_usage"
FOR EACH ROW EXECUTE FUNCTION validate_file_usage_reference();

-- 5. Attach cascade delete triggers to parent tables
CREATE TRIGGER trg_cascade_file_usage_users
AFTER DELETE ON "users"
FOR EACH ROW EXECUTE FUNCTION cascade_delete_file_usages();

CREATE TRIGGER trg_cascade_file_usage_teachers
AFTER DELETE ON "teachers"
FOR EACH ROW EXECUTE FUNCTION cascade_delete_file_usages();

CREATE TRIGGER trg_cascade_file_usage_students
AFTER DELETE ON "students"
FOR EACH ROW EXECUTE FUNCTION cascade_delete_file_usages();

CREATE TRIGGER trg_cascade_file_usage_parents
AFTER DELETE ON "parents"
FOR EACH ROW EXECUTE FUNCTION cascade_delete_file_usages();

CREATE TRIGGER trg_cascade_file_usage_invoices
AFTER DELETE ON "invoices"
FOR EACH ROW EXECUTE FUNCTION cascade_delete_file_usages();

CREATE TRIGGER trg_cascade_file_usage_complaints
AFTER DELETE ON "complaints"
FOR EACH ROW EXECUTE FUNCTION cascade_delete_file_usages();

CREATE TRIGGER trg_cascade_file_usage_learning_resources
AFTER DELETE ON "learning_resources"
FOR EACH ROW EXECUTE FUNCTION cascade_delete_file_usages();

CREATE TRIGGER trg_cascade_file_usage_staff_profiles
AFTER DELETE ON "staff_profiles"
FOR EACH ROW EXECUTE FUNCTION cascade_delete_file_usages();

CREATE TRIGGER trg_cascade_file_usage_recurring_schedules
AFTER DELETE ON "recurring_schedules"
FOR EACH ROW EXECUTE FUNCTION cascade_delete_file_usages();

CREATE TRIGGER trg_cascade_file_usage_class_instances
AFTER DELETE ON "class_instances"
FOR EACH ROW EXECUTE FUNCTION cascade_delete_file_usages();