-- Source: soft_delete_rls_policies.sql
-- Soft-delete RLS policies (application-layer enforcement via SoftDeleteRepository).
-- Hard DELETE is blocked for RLS roles; soft deletes use UPDATE deleted_at through the repository
-- with session variable app.soft_delete = 'true'.

-- 1. users configuration
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS users_select_policy ON "users";--> statement-breakpoint
CREATE POLICY users_select_policy ON "users" FOR SELECT USING (deleted_at IS NULL);--> statement-breakpoint
DROP POLICY IF EXISTS users_insert_policy ON "users";--> statement-breakpoint
CREATE POLICY users_insert_policy ON "users" FOR INSERT WITH CHECK (deleted_at IS NULL);--> statement-breakpoint
DROP POLICY IF EXISTS users_update_policy ON "users";--> statement-breakpoint
CREATE POLICY users_update_policy ON "users" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);--> statement-breakpoint
DROP POLICY IF EXISTS users_soft_delete_policy ON "users";--> statement-breakpoint
DROP POLICY IF EXISTS users_delete_policy ON "users";--> statement-breakpoint
CREATE POLICY users_delete_policy ON "users" FOR DELETE USING (false);--> statement-breakpoint
-- 2. recurring_schedules configuration
ALTER TABLE "recurring_schedules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "recurring_schedules" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS recurring_schedules_select_policy ON "recurring_schedules";--> statement-breakpoint
CREATE POLICY recurring_schedules_select_policy ON "recurring_schedules" FOR SELECT USING (deleted_at IS NULL);--> statement-breakpoint
DROP POLICY IF EXISTS recurring_schedules_insert_policy ON "recurring_schedules";--> statement-breakpoint
CREATE POLICY recurring_schedules_insert_policy ON "recurring_schedules" FOR INSERT WITH CHECK (deleted_at IS NULL);--> statement-breakpoint
DROP POLICY IF EXISTS recurring_schedules_update_policy ON "recurring_schedules";--> statement-breakpoint
CREATE POLICY recurring_schedules_update_policy ON "recurring_schedules" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);--> statement-breakpoint
DROP POLICY IF EXISTS recurring_schedules_soft_delete_policy ON "recurring_schedules";--> statement-breakpoint
DROP POLICY IF EXISTS recurring_schedules_delete_policy ON "recurring_schedules";--> statement-breakpoint
CREATE POLICY recurring_schedules_delete_policy ON "recurring_schedules" FOR DELETE USING (false);--> statement-breakpoint
-- 3. class_instances configuration
ALTER TABLE "class_instances" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "class_instances" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS class_instances_select_policy ON "class_instances";--> statement-breakpoint
CREATE POLICY class_instances_select_policy ON "class_instances" FOR SELECT USING (deleted_at IS NULL);--> statement-breakpoint
DROP POLICY IF EXISTS class_instances_insert_policy ON "class_instances";--> statement-breakpoint
CREATE POLICY class_instances_insert_policy ON "class_instances" FOR INSERT WITH CHECK (deleted_at IS NULL);--> statement-breakpoint
DROP POLICY IF EXISTS class_instances_update_policy ON "class_instances";--> statement-breakpoint
CREATE POLICY class_instances_update_policy ON "class_instances" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);--> statement-breakpoint
DROP POLICY IF EXISTS class_instances_soft_delete_policy ON "class_instances";--> statement-breakpoint
DROP POLICY IF EXISTS class_instances_delete_policy ON "class_instances";--> statement-breakpoint
CREATE POLICY class_instances_delete_policy ON "class_instances" FOR DELETE USING (false);--> statement-breakpoint
-- 4. complaints configuration
ALTER TABLE "complaints" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "complaints" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS complaints_select_policy ON "complaints";--> statement-breakpoint
CREATE POLICY complaints_select_policy ON "complaints" FOR SELECT USING (deleted_at IS NULL);--> statement-breakpoint
DROP POLICY IF EXISTS complaints_insert_policy ON "complaints";--> statement-breakpoint
CREATE POLICY complaints_insert_policy ON "complaints" FOR INSERT WITH CHECK (deleted_at IS NULL);--> statement-breakpoint
DROP POLICY IF EXISTS complaints_update_policy ON "complaints";--> statement-breakpoint
CREATE POLICY complaints_update_policy ON "complaints" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);--> statement-breakpoint
DROP POLICY IF EXISTS complaints_soft_delete_policy ON "complaints";--> statement-breakpoint
DROP POLICY IF EXISTS complaints_delete_policy ON "complaints";--> statement-breakpoint
CREATE POLICY complaints_delete_policy ON "complaints" FOR DELETE USING (false);--> statement-breakpoint
-- 5. learning_resources configuration
ALTER TABLE "learning_resources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "learning_resources" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS learning_resources_select_policy ON "learning_resources";--> statement-breakpoint
CREATE POLICY learning_resources_select_policy ON "learning_resources" FOR SELECT USING (deleted_at IS NULL);--> statement-breakpoint
DROP POLICY IF EXISTS learning_resources_insert_policy ON "learning_resources";--> statement-breakpoint
CREATE POLICY learning_resources_insert_policy ON "learning_resources" FOR INSERT WITH CHECK (deleted_at IS NULL);--> statement-breakpoint
DROP POLICY IF EXISTS learning_resources_update_policy ON "learning_resources";--> statement-breakpoint
CREATE POLICY learning_resources_update_policy ON "learning_resources" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);--> statement-breakpoint
DROP POLICY IF EXISTS learning_resources_soft_delete_policy ON "learning_resources";--> statement-breakpoint
DROP POLICY IF EXISTS learning_resources_delete_policy ON "learning_resources";--> statement-breakpoint
CREATE POLICY learning_resources_delete_policy ON "learning_resources" FOR DELETE USING (false);--> statement-breakpoint
-- 6. invoices configuration
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "invoices" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS invoices_select_policy ON "invoices";--> statement-breakpoint
CREATE POLICY invoices_select_policy ON "invoices" FOR SELECT USING (deleted_at IS NULL);--> statement-breakpoint
DROP POLICY IF EXISTS invoices_insert_policy ON "invoices";--> statement-breakpoint
CREATE POLICY invoices_insert_policy ON "invoices" FOR INSERT WITH CHECK (deleted_at IS NULL);--> statement-breakpoint
DROP POLICY IF EXISTS invoices_update_policy ON "invoices";--> statement-breakpoint
CREATE POLICY invoices_update_policy ON "invoices" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);--> statement-breakpoint
DROP POLICY IF EXISTS invoices_soft_delete_policy ON "invoices";--> statement-breakpoint
DROP POLICY IF EXISTS invoices_delete_policy ON "invoices";--> statement-breakpoint
CREATE POLICY invoices_delete_policy ON "invoices" FOR DELETE USING (false);--> statement-breakpoint

