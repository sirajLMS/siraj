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
