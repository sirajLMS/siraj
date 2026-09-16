# Phase 0 Outcome — Foundation (permission, indexes, no schema changes)

**Feature:** `profit-loss-dashboard`
**Plan:** `.ai/plans/profit-loss-dashboard/`
**Executed:** 2026-09-16
**Tasks:** 0.1, 0.2, 0.3

---

## Summary

Phase 0 is complete. The read-only `ACCOUNTING_PROFITS_VIEW` permission was added to the
backend enum, its system-permission SQL migration was created and applied, the enum unit
tests were extended, and all 8 P&L-query indexes were confirmed present in the schema
(no migration needed). Regression smoke tests across scheduling, payroll, carryover, and
expense services all pass.

---

## Task 0.1 — `ACCOUNTING_PROFITS_VIEW` permission

### Files modified
- `backend/enum/permissions/permission.enum.ts` — added
  `ACCOUNTING_PROFITS_VIEW = "accounting.profits_view"` in the Accounting block
  (after `ACCOUNTING_EXPENSES_MANAGE`), following the existing enum conventions.
  **No `_MANAGE` variant** — the dashboard is read-only (AC-8.3).
- `backend/enum/permissions/permission.enum.test.ts` — added an
  `AppPermission accounting profits view` describe block: key equality, `isAppPermission`
  acceptance, `parseAppPermission` resolution, an explicit "no manage variant exists"
  assertion (`accounting.profits_manage` rejected), and a typo-rejection case
  (`accounting.profits_view_typo`) in the rejection-path block.

### Files created
- `backend/db/migration/50-accounting-profits-permissions.sql` — idempotent SQL:
  `ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'accounting.profits_view'`,
  upsert into `permissions` (is_system = true, EN/AR description, Accounting category),
  grant to `super_admin` + `academy_admin` via `group_permissions` (ON CONFLICT DO NOTHING).
  Follows the exact format of `44-accounting-expenses-permissions.sql` /
  `40-accounting-carryover-permissions.sql`.
- `backend/drizzle/20260915233221_custom_50-accounting-profits-permissions/migration.sql` —
  auto-bundled by `applyCustomMigrations()` during `bun run db migrate` (the repo's
  standard path; the folder was NOT hand-written).
- `backend/drizzle/.custom-migrations.json` — sidecar manifest updated by the auto-bundler.

### Path correction vs. the task list
The task list pointed at `backend/db/seeds/auth/seed-user-permission-overrides.ts` for the
group grant. Per `backend/db/seeds/AGENTS.md` (FORBIDDEN: System permissions — CRITICAL),
`permissions` / `permission_groups` / `group_permissions` rows are owned **exclusively** by
SQL under `backend/db/migration/` + drizzle migrations under `backend/drizzle/`; seeders must
never touch them. The grant was therefore implemented as migration SQL. The "Accounting /
Finance Manager" default group in the task list maps to the existing repo convention: every
prior accounting permission (payroll, reports, carryover, expenses) grants to the
`super_admin` + `academy_admin` slugs, which is what was used.

### Additional wiring (repo-mandated)
`AppPermission` is exposed as a GraphQL enum (`AppPermissionPothosEnum`), so
`bun run generate:gqlSchema && bun codegen` was run. The generated
`frontend/common/graphql/generated/gql/graphql.ts` now contains
`AccountingProfitsView = 'ACCOUNTING_PROFITS_VIEW'` and `schema.graphql` was updated.

### DB verification
`bun run db migrate` → `Applied migration: 20260915233221_custom_50-accounting-profits-permissions`,
exit 0. Direct DB query confirmed: `accounting.profits_view` exists with `is_system = true`
and **2** group grants (`super_admin`, `academy_admin`).

### Quality loop
- `bun run scripts/health/sub-loop.ts backend/enum/permissions/permission.enum.ts --lifecycle codescene` → **exit 0**
- `bun run scripts/health/sub-loop.ts backend/enum/permissions/permission.enum.test.ts --lifecycle codescene` → **exit 0**
- `bun run test/scripts/run-test.ts backend/enum/permissions/permission.enum.test.ts` → **27 pass / 0 fail**

---

## Task 0.2 — Index verification

**Verdict: ALL 8 required indexes exist in the schema → no migration needed.**

| Index | Schema location | Status |
|---|---|---|
| `class_instances_scheduled_start_at_idx` | `backend/db/schema/classes/scheduling.ts:248` | ✅ |
| `class_instances_calculation_status_idx` | `backend/db/schema/classes/scheduling.ts:277` | ✅ |
| `class_instances_teacher_status_scheduled_idx` | `backend/db/schema/classes/scheduling.ts:280` | ✅ |
| `expenses_expense_date_idx` | `backend/db/schema/expenses/expenses.ts:63` | ✅ |
| `expenses_type_expense_date_idx` (composite) | `backend/db/schema/expenses/expenses.ts:69` | ✅ |
| `expenses_deleted_at_idx` | `backend/db/schema/expenses/expenses.ts:67` | ✅ |
| `payments_created_at_idx` | `backend/db/schema/billing/billing.ts:134` | ✅ |
| `credit_transactions_class_instance_id_idx` | `backend/db/schema/billing/credit-transactions.ts:74` | ✅ |

No migration file was created for indexes (the only migration created is the Task 0.1
permission SQL).

---

## Task 0.3 — Phase-0 regression smoke

All runs via `~/.bun/bin/bun run test/scripts/run-test.ts <path>` (raw `bun test` is blocked
by the repo's test-runner guard).

| Test file | Result |
|---|---|
| `backend/db/test/repo/scheduling/scheduling.repository.test.ts` | **26 pass / 0 fail** |
| `backend/services/teacher/payroll-calculation.service.test.ts` | **52 pass / 0 fail** |
| `backend/services/teachers/carryover-balance.service.test.ts` | **21 pass / 0 fail** |
| `backend/services/expenses/expense.service.test.ts` | **55 pass / 0 fail** |

Total: **154 pass / 0 fail**.

---

## Baseline comparison (vs `phase0-baseline-outcome.md`)

- **tsgo**: baseline 0 errors. Post-implementation full-repo tsgo reports **53 errors, all in
  `frontend/common/views/dashboard/config/navigationConfig.ts`** — a file being actively
  edited by another concurrent agent (Phase 2 navigation/page-permissions work in this shared
  tree, unstaged alongside other in-flight files). None of the Phase 0 touched files produce
  tsgo errors. This is NOT attributable to Phase 0.
- **ESLint**: pre-existing baseline failure `test/security/multi-account-bola.test.ts:613`
  unchanged; Phase 0 files lint clean via sub-loop.

## Files NOT modified (and why)

- `backend/db/seeds/**` — permission rows/grants are owned by migration SQL
  (seeds/AGENTS.md FORBIDDEN rule); no seeder changes required for this permission.
- `backend/db/schema/**` — read-only plan; all required indexes already exist.
- `frontend/common/types/page-permissions.types.ts`,
  `frontend/common/views/dashboard/config/navigationConfig.ts`,
  `backend/types/billing/index.ts` (profit-loss re-export), statusBadge files,
  `StudentCreditsList.tsx` — actively edited by other concurrent agents (Phase 1/2 work in
  this shared tree); out of Phase 0 scope, left untouched.

## Cross-file dependencies

- **Phase 1+ (other agents, in-flight)**: `frontend/common/types/page-permissions.types.ts`
  needs `accountingProfitsView: [AppPermission.ACCOUNTING_PROFITS_VIEW]` and
  `frontend/common/views/dashboard/config/navigationConfig.ts` needs the route registration
  (implementation.md §6.1/§6.2) — these are Phase 2 items owned by concurrent work already in
  progress in the shared tree. No action required from Phase 0.

## Carry-forward knowledge

- New backend permission workflow: enum file → SQL in `backend/db/migration/NN-*.sql`
  (next number: 50 used; check `ls backend/db/migration | sort` for the highest) →
  `bun run db migrate` auto-bundles it into a drizzle folder under `backend/drizzle/` via
  `applyCustomMigrations()` and applies it. No hand-writing of drizzle folders, no
  `cleanGenerate` (policy-disabled).
- Prior accounting permissions grant to `super_admin` + `academy_admin` slugs; the JSONB
  description/category pattern is `{"ar": "...", "en": "..."}`.
- `bun run db migrate` closes the DB pool afterwards — any subsequent DB access needs a
  fresh connection.
- Regression test file locations: payroll-calculation lives under `backend/services/teacher/`
  (singular), carryover under `backend/services/teachers/` (plural).

## Related Documents

- Baseline: `phase0-baseline-outcome.md`
- Plan: `implementation.md`, `trackable-tasks.md`
