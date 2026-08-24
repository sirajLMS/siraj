-- Extended RLS policies (defense-in-depth, M3 security review).
--
-- Enables restrictive row-level security on financial / PII / audit tables that previously
-- had no RLS. The application layer already enforces authz via GraphQL resolvers and
-- repository methods; these policies catch direct DB access (SQL injection, stolen
-- credentials) by restricting what a non-service role can read.
--
-- Mirrors the `current_user_id()` ownership pattern from permissions_rls_policies.sql:
--   - When `app.current_user_id` is unset (service role / app connection), `current_user_id()`
--     returns NULL (see backend/db/migration/2-functions.sql) → `NOT EXISTS (... = NULL)`
--     evaluates TRUE → all rows visible. This is the service-role bypass: the app's DB
--     connection never sets `app.current_user_id`, so all rows are visible to it.
--   - When `app.current_user_id` is set to a real UUID (direct DB connection as a parent /
--     teacher / staff user), the policy restricts rows to those owned by that user.
--
-- PG-only: SQLite does not support RLS. The migration runner skips these statements on
-- SQLite (RLS is a no-op there); application-layer authz remains authoritative.
--
-- Idempotent: `DROP POLICY IF EXISTS` + `ALTER TABLE ENABLE/FORCE ROW LEVEL SECURITY`
-- are no-ops if already applied.

-- =====================================================================
-- 1. payments
-- =====================================================================
-- Ownership chain: payments.invoice_id → invoices.parent_id → parents.user_id.
-- Non-parent roles (staff/admins + service role via NULL current_user_id()) see all rows.
-- Parents see only payments on invoices they own.
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payments_select_policy ON "payments";
CREATE POLICY payments_select_policy ON "payments"
FOR SELECT
USING (
    NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
    OR invoice_id IN (
        SELECT id FROM invoices
        WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
    )
);

DROP POLICY IF EXISTS payments_insert_policy ON "payments";
CREATE POLICY payments_insert_policy ON "payments"
FOR INSERT
WITH CHECK (
    NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
    OR invoice_id IN (
        SELECT id FROM invoices
        WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
    )
);

DROP POLICY IF EXISTS payments_update_policy ON "payments";
CREATE POLICY payments_update_policy ON "payments"
FOR UPDATE
USING (
    NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
    OR invoice_id IN (
        SELECT id FROM invoices
        WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
    )
)
WITH CHECK (
    NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
    OR invoice_id IN (
        SELECT id FROM invoices
        WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
    )
);

DROP POLICY IF EXISTS payments_delete_policy ON "payments";
CREATE POLICY payments_delete_policy ON "payments"
FOR DELETE
USING (
    NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
    OR invoice_id IN (
        SELECT id FROM invoices
        WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
    )
);

-- =====================================================================
-- 2. quota_ledger
-- =====================================================================
-- Ownership chain: quota_ledger.student_id → students.parent_id → parents.user_id.
ALTER TABLE "quota_ledger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quota_ledger" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quota_ledger_select_policy ON "quota_ledger";
CREATE POLICY quota_ledger_select_policy ON "quota_ledger"
FOR SELECT
USING (
    NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
    OR student_id IN (
        SELECT id FROM students
        WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
    )
);

DROP POLICY IF EXISTS quota_ledger_insert_policy ON "quota_ledger";
CREATE POLICY quota_ledger_insert_policy ON "quota_ledger"
FOR INSERT
WITH CHECK (
    NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
    OR student_id IN (
        SELECT id FROM students
        WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
    )
);

DROP POLICY IF EXISTS quota_ledger_update_policy ON "quota_ledger";
CREATE POLICY quota_ledger_update_policy ON "quota_ledger"
FOR UPDATE
USING (
    NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
    OR student_id IN (
        SELECT id FROM students
        WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
    )
)
WITH CHECK (
    NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
    OR student_id IN (
        SELECT id FROM students
        WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
    )
);

DROP POLICY IF EXISTS quota_ledger_delete_policy ON "quota_ledger";
CREATE POLICY quota_ledger_delete_policy ON "quota_ledger"
FOR DELETE
USING (
    NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
    OR student_id IN (
        SELECT id FROM students
        WHERE parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())
    )
);

-- =====================================================================
-- 3. user_payment_methods
-- =====================================================================
-- Ownership: direct user_id column.
ALTER TABLE "user_payment_methods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_payment_methods" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_payment_methods_select_policy ON "user_payment_methods";
CREATE POLICY user_payment_methods_select_policy ON "user_payment_methods"
FOR SELECT
USING (
    user_id = current_user_id()
    OR NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
);

DROP POLICY IF EXISTS user_payment_methods_insert_policy ON "user_payment_methods";
CREATE POLICY user_payment_methods_insert_policy ON "user_payment_methods"
FOR INSERT
WITH CHECK (
    user_id = current_user_id()
    OR NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
);

DROP POLICY IF EXISTS user_payment_methods_update_policy ON "user_payment_methods";
CREATE POLICY user_payment_methods_update_policy ON "user_payment_methods"
FOR UPDATE
USING (
    user_id = current_user_id()
    OR NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
)
WITH CHECK (
    user_id = current_user_id()
    OR NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
);

DROP POLICY IF EXISTS user_payment_methods_delete_policy ON "user_payment_methods";
CREATE POLICY user_payment_methods_delete_policy ON "user_payment_methods"
FOR DELETE
USING (
    user_id = current_user_id()
    OR NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
);

-- =====================================================================
-- 4. meeting_provider_tokens
-- =====================================================================
-- Ownership: direct user_id column. Tokens are per-user OAuth credentials (PII / secret).
ALTER TABLE "meeting_provider_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "meeting_provider_tokens" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS meeting_provider_tokens_select_policy ON "meeting_provider_tokens";
CREATE POLICY meeting_provider_tokens_select_policy ON "meeting_provider_tokens"
FOR SELECT
USING (
    user_id = current_user_id()
    OR NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
);

DROP POLICY IF EXISTS meeting_provider_tokens_insert_policy ON "meeting_provider_tokens";
CREATE POLICY meeting_provider_tokens_insert_policy ON "meeting_provider_tokens"
FOR INSERT
WITH CHECK (
    user_id = current_user_id()
    OR NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
);

DROP POLICY IF EXISTS meeting_provider_tokens_update_policy ON "meeting_provider_tokens";
CREATE POLICY meeting_provider_tokens_update_policy ON "meeting_provider_tokens"
FOR UPDATE
USING (
    user_id = current_user_id()
    OR NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
)
WITH CHECK (
    user_id = current_user_id()
    OR NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
);

DROP POLICY IF EXISTS meeting_provider_tokens_delete_policy ON "meeting_provider_tokens";
CREATE POLICY meeting_provider_tokens_delete_policy ON "meeting_provider_tokens"
FOR DELETE
USING (
    user_id = current_user_id()
    OR NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
);

-- =====================================================================
-- 5. teacher_dues
-- =====================================================================
-- Ownership chain: teacher_dues.teacher_id → teachers.user_id.
-- Non-teacher roles (parents, staff/admins + service role) see all rows.
-- Teachers see only their own dues.
ALTER TABLE "teacher_dues" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "teacher_dues" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS teacher_dues_select_policy ON "teacher_dues";
CREATE POLICY teacher_dues_select_policy ON "teacher_dues"
FOR SELECT
USING (
    NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = current_user_id())
    OR teacher_id IN (
        SELECT id FROM teachers WHERE user_id = current_user_id()
    )
);

DROP POLICY IF EXISTS teacher_dues_insert_policy ON "teacher_dues";
CREATE POLICY teacher_dues_insert_policy ON "teacher_dues"
FOR INSERT
WITH CHECK (
    NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = current_user_id())
    OR teacher_id IN (
        SELECT id FROM teachers WHERE user_id = current_user_id()
    )
);

DROP POLICY IF EXISTS teacher_dues_update_policy ON "teacher_dues";
CREATE POLICY teacher_dues_update_policy ON "teacher_dues"
FOR UPDATE
USING (
    NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = current_user_id())
    OR teacher_id IN (
        SELECT id FROM teachers WHERE user_id = current_user_id()
    )
)
WITH CHECK (
    NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = current_user_id())
    OR teacher_id IN (
        SELECT id FROM teachers WHERE user_id = current_user_id()
    )
);

DROP POLICY IF EXISTS teacher_dues_delete_policy ON "teacher_dues";
CREATE POLICY teacher_dues_delete_policy ON "teacher_dues"
FOR DELETE
USING (
    NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = current_user_id())
    OR teacher_id IN (
        SELECT id FROM teachers WHERE user_id = current_user_id()
    )
);

-- =====================================================================
-- 6. audit_logs (append-only)
-- =====================================================================
-- Ownership: actor_user_id (the user who triggered the action). System actions
-- (actor_type='SYSTEM' / 'CRON' / 'API') have actor_user_id IS NULL and are visible
-- only to non-parent roles (staff/admins + service role via NULL current_user_id()).
--
-- UPDATE/DELETE blocked via USING(false) — defense-in-depth on top of the existing
-- immutability trigger `prevent_audit_log_mod_trigger` (audit_log_immutability_trigger.sql).
-- INSERT is permissive (WITH CHECK true) because audit logs must accept app writes
-- regardless of which user/system action produced them; the immutability trigger
-- enforces append-only semantics post-insert.
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_logs_select_policy ON "audit_logs";
CREATE POLICY audit_logs_select_policy ON "audit_logs"
FOR SELECT
USING (
    actor_user_id = current_user_id()
    OR NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())
);

DROP POLICY IF EXISTS audit_logs_insert_policy ON "audit_logs";
CREATE POLICY audit_logs_insert_policy ON "audit_logs"
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS audit_logs_update_policy ON "audit_logs";
CREATE POLICY audit_logs_update_policy ON "audit_logs"
FOR UPDATE
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS audit_logs_delete_policy ON "audit_logs";
CREATE POLICY audit_logs_delete_policy ON "audit_logs"
FOR DELETE
USING (false);
