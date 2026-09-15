-- Source: 49-rls-guc-fail-closed.sql
-- Fail-closed hardening for the current_user_id() ownership policies.
--
-- The staff fallback branch in the policies below evaluated TRUE for any connection
-- whose `app.current_user_id` GUC is unset: current_user_id() returns NULL when the
-- setting is absent (see 2-functions.sql), so `NOT EXISTS (... WHERE user_id = NULL)`
-- evaluated TRUE and a direct DB connection or SQL-injected statement could read every
-- row of these tables without any scoping. This migration recreates the same policies
-- in place (same policy names, idempotent DROP POLICY IF EXISTS + CREATE POLICY) with
-- the fallback branch additionally requiring `current_user_id() IS NOT NULL`:
--   - GUC set to a parent  -> own rows only (unchanged).
--   - GUC set to a teacher -> own rows (unchanged).
--   - GUC set to a non-teacher/non-parent staff user -> all rows (unchanged).
--   - GUC unset -> ZERO rows on every table below (previously: all rows).
-- The teacher/parent ownership branches already compare against NULL safely and need
-- no additional guard.
--
-- OPERATIONAL PREREQUISITE: connections subject to RLS that never set the GUC are
-- denied all rows by these policies once applied. Dev/test connections run as the
-- `postgres` superuser (RLS bypassed, unaffected). Production roles (e.g. Neon) must
-- either be granted BYPASSRLS or the application must set `app.current_user_id` on
-- every access (see withCurrentUser in backend/db/repo/shared/with-current-user.ts)
-- BEFORE applying this migration.

-- =====================================================================
-- 1. class_instances (mirrors 30-a-class_instances_rls_policies.sql)
-- =====================================================================
DROP POLICY IF EXISTS class_instances_access_select_policy ON "class_instances";--> statement-breakpoint
CREATE POLICY class_instances_access_select_policy ON "class_instances"
AS RESTRICTIVE FOR SELECT
USING (
  deleted_at IS NULL
  AND (
    (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = current_user_id()) AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
    OR
    (teacher_id = (SELECT id FROM teachers WHERE user_id = current_user_id()))
    OR
    (student_id IN (SELECT id FROM students WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())))
  )
);--> statement-breakpoint
DROP POLICY IF EXISTS class_instances_access_update_policy ON "class_instances";--> statement-breakpoint
CREATE POLICY class_instances_access_update_policy ON "class_instances"
AS RESTRICTIVE FOR UPDATE
USING (
  deleted_at IS NULL
  AND (
    (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = current_user_id()) AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
    OR
    (teacher_id = (SELECT id FROM teachers WHERE user_id = current_user_id()))
    OR
    (student_id IN (SELECT id FROM students WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())))
  )
)
WITH CHECK (
  (deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true'))
  AND (
    (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = current_user_id()) AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
    OR
    (teacher_id = (SELECT id FROM teachers WHERE user_id = current_user_id()))
    OR
    (student_id IN (SELECT id FROM students WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())))
  )
);--> statement-breakpoint
-- =====================================================================
-- 2. students (mirrors permissions_rls_policies.sql)
-- =====================================================================
DROP POLICY IF EXISTS students_select_policy ON "students";--> statement-breakpoint
CREATE POLICY students_select_policy ON "students"
FOR SELECT
USING (
    (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
    OR
    parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
);--> statement-breakpoint
DROP POLICY IF EXISTS students_insert_policy ON "students";--> statement-breakpoint
CREATE POLICY students_insert_policy ON "students"
FOR INSERT
WITH CHECK (
    (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
    OR
    parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
);--> statement-breakpoint
DROP POLICY IF EXISTS students_update_policy ON "students";--> statement-breakpoint
CREATE POLICY students_update_policy ON "students"
FOR UPDATE
USING (
    (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
    OR
    parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
)
WITH CHECK (
    (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
    OR
    parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
);--> statement-breakpoint
DROP POLICY IF EXISTS students_delete_policy ON "students";--> statement-breakpoint
CREATE POLICY students_delete_policy ON "students"
FOR DELETE
USING (
    (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
    OR
    parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
);--> statement-breakpoint
-- =====================================================================
-- 3. payments (mirrors extended_rls_policies.sql)
-- =====================================================================
-- Ownership chain: payments.invoice_id -> invoices.parent_id -> parents.user_id.
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payments" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS payments_select_policy ON "payments";--> statement-breakpoint
CREATE POLICY payments_select_policy ON "payments"
FOR SELECT
USING (
    (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
    OR invoice_id IN (
        SELECT id FROM invoices
        WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
    )
);--> statement-breakpoint
DROP POLICY IF EXISTS payments_insert_policy ON "payments";--> statement-breakpoint
CREATE POLICY payments_insert_policy ON "payments"
FOR INSERT
WITH CHECK (
    (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
    OR invoice_id IN (
        SELECT id FROM invoices
        WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
    )
);--> statement-breakpoint
DROP POLICY IF EXISTS payments_update_policy ON "payments";--> statement-breakpoint
CREATE POLICY payments_update_policy ON "payments"
FOR UPDATE
USING (
    (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
    OR invoice_id IN (
        SELECT id FROM invoices
        WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
    )
)
WITH CHECK (
    (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
    OR invoice_id IN (
        SELECT id FROM invoices
        WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
    )
);--> statement-breakpoint
DROP POLICY IF EXISTS payments_delete_policy ON "payments";--> statement-breakpoint
CREATE POLICY payments_delete_policy ON "payments"
FOR DELETE
USING (
    (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
    OR invoice_id IN (
        SELECT id FROM invoices
        WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
    )
);--> statement-breakpoint
-- =====================================================================
-- 4. quota_ledger (mirrors extended_rls_policies.sql)
-- =====================================================================
ALTER TABLE "quota_ledger" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "quota_ledger" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS quota_ledger_select_policy ON "quota_ledger";--> statement-breakpoint
CREATE POLICY quota_ledger_select_policy ON "quota_ledger"
FOR SELECT
USING (
    (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
    OR student_id IN (
        SELECT id FROM students
        WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
    )
);--> statement-breakpoint
DROP POLICY IF EXISTS quota_ledger_insert_policy ON "quota_ledger";--> statement-breakpoint
CREATE POLICY quota_ledger_insert_policy ON "quota_ledger"
FOR INSERT
WITH CHECK (
    (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
    OR student_id IN (
        SELECT id FROM students
        WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
    )
);--> statement-breakpoint
DROP POLICY IF EXISTS quota_ledger_update_policy ON "quota_ledger";--> statement-breakpoint
CREATE POLICY quota_ledger_update_policy ON "quota_ledger"
FOR UPDATE
USING (
    (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
    OR student_id IN (
        SELECT id FROM students
        WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
    )
)
WITH CHECK (
    (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
    OR student_id IN (
        SELECT id FROM students
        WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
    )
);--> statement-breakpoint
DROP POLICY IF EXISTS quota_ledger_delete_policy ON "quota_ledger";--> statement-breakpoint
CREATE POLICY quota_ledger_delete_policy ON "quota_ledger"
FOR DELETE
USING (
    (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
    OR student_id IN (
        SELECT id FROM students
        WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
    )
);--> statement-breakpoint
-- =====================================================================
-- 5. user_payment_methods (mirrors extended_rls_policies.sql)
-- =====================================================================
ALTER TABLE "user_payment_methods" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_payment_methods" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS user_payment_methods_select_policy ON "user_payment_methods";--> statement-breakpoint
CREATE POLICY user_payment_methods_select_policy ON "user_payment_methods"
FOR SELECT
USING (
    user_id = current_user_id()
    OR (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
);--> statement-breakpoint
DROP POLICY IF EXISTS user_payment_methods_insert_policy ON "user_payment_methods";--> statement-breakpoint
CREATE POLICY user_payment_methods_insert_policy ON "user_payment_methods"
FOR INSERT
WITH CHECK (
    user_id = current_user_id()
    OR (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
);--> statement-breakpoint
DROP POLICY IF EXISTS user_payment_methods_update_policy ON "user_payment_methods";--> statement-breakpoint
CREATE POLICY user_payment_methods_update_policy ON "user_payment_methods"
FOR UPDATE
USING (
    user_id = current_user_id()
    OR (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
)
WITH CHECK (
    user_id = current_user_id()
    OR (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
);--> statement-breakpoint
DROP POLICY IF EXISTS user_payment_methods_delete_policy ON "user_payment_methods";--> statement-breakpoint
CREATE POLICY user_payment_methods_delete_policy ON "user_payment_methods"
FOR DELETE
USING (
    user_id = current_user_id()
    OR (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
);--> statement-breakpoint
-- =====================================================================
-- 6. meeting_provider_tokens (mirrors extended_rls_policies.sql)
-- =====================================================================
ALTER TABLE "meeting_provider_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "meeting_provider_tokens" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS meeting_provider_tokens_select_policy ON "meeting_provider_tokens";--> statement-breakpoint
CREATE POLICY meeting_provider_tokens_select_policy ON "meeting_provider_tokens"
FOR SELECT
USING (
    user_id = current_user_id()
    OR (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
);--> statement-breakpoint
DROP POLICY IF EXISTS meeting_provider_tokens_insert_policy ON "meeting_provider_tokens";--> statement-breakpoint
CREATE POLICY meeting_provider_tokens_insert_policy ON "meeting_provider_tokens"
FOR INSERT
WITH CHECK (
    user_id = current_user_id()
    OR (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
);--> statement-breakpoint
DROP POLICY IF EXISTS meeting_provider_tokens_update_policy ON "meeting_provider_tokens";--> statement-breakpoint
CREATE POLICY meeting_provider_tokens_update_policy ON "meeting_provider_tokens"
FOR UPDATE
USING (
    user_id = current_user_id()
    OR (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
)
WITH CHECK (
    user_id = current_user_id()
    OR (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
);--> statement-breakpoint
DROP POLICY IF EXISTS meeting_provider_tokens_delete_policy ON "meeting_provider_tokens";--> statement-breakpoint
CREATE POLICY meeting_provider_tokens_delete_policy ON "meeting_provider_tokens"
FOR DELETE
USING (
    user_id = current_user_id()
    OR (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
);--> statement-breakpoint
-- =====================================================================
-- 7. teacher_dues (mirrors extended_rls_policies.sql)
-- =====================================================================
-- Ownership chain: teacher_dues.teacher_id -> teachers.user_id.
ALTER TABLE "teacher_dues" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "teacher_dues" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS teacher_dues_select_policy ON "teacher_dues";--> statement-breakpoint
CREATE POLICY teacher_dues_select_policy ON "teacher_dues"
FOR SELECT
USING (
    (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = current_user_id()))
    OR teacher_id IN (
        SELECT id FROM teachers WHERE user_id = current_user_id()
    )
);--> statement-breakpoint
DROP POLICY IF EXISTS teacher_dues_insert_policy ON "teacher_dues";--> statement-breakpoint
CREATE POLICY teacher_dues_insert_policy ON "teacher_dues"
FOR INSERT
WITH CHECK (
    (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = current_user_id()))
    OR teacher_id IN (
        SELECT id FROM teachers WHERE user_id = current_user_id()
    )
);--> statement-breakpoint
DROP POLICY IF EXISTS teacher_dues_update_policy ON "teacher_dues";--> statement-breakpoint
CREATE POLICY teacher_dues_update_policy ON "teacher_dues"
FOR UPDATE
USING (
    (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = current_user_id()))
    OR teacher_id IN (
        SELECT id FROM teachers WHERE user_id = current_user_id()
    )
)
WITH CHECK (
    (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = current_user_id()))
    OR teacher_id IN (
        SELECT id FROM teachers WHERE user_id = current_user_id()
    )
);--> statement-breakpoint
DROP POLICY IF EXISTS teacher_dues_delete_policy ON "teacher_dues";--> statement-breakpoint
CREATE POLICY teacher_dues_delete_policy ON "teacher_dues"
FOR DELETE
USING (
    (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = current_user_id()))
    OR teacher_id IN (
        SELECT id FROM teachers WHERE user_id = current_user_id()
    )
);--> statement-breakpoint
-- =====================================================================
-- 8. audit_logs (mirrors extended_rls_policies.sql, append-only)
-- =====================================================================
-- INSERT stays permissive (WITH CHECK true) and UPDATE/DELETE stay blocked via
-- USING(false); only the SELECT fallback is made fail-closed.
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS audit_logs_select_policy ON "audit_logs";--> statement-breakpoint
CREATE POLICY audit_logs_select_policy ON "audit_logs"
FOR SELECT
USING (
    actor_user_id = current_user_id()
    OR (current_user_id() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()))
);--> statement-breakpoint

