# Plan Review — R2 (Software Engineering Quality)

- **Review Date**: 2026-08-12
- **Reviewer**: SE-review sub-agent (general-purpose)
- **Plan Path**: `/home/z/my-project/siraj-clone/.ai/plans/student-credit-hours-system/`
- **Files Reviewed**: `specs.md` (465 → 482 lines), `implementation.md` (981 → 1186 lines), `trackable-tasks.md` (373 → 395 lines)
- **Outcome**: ✅ All SE issues fixed in-place across all three plan files. No new design changes — fixes strictly enforce verified codebase patterns.

---

## 1. Methodology

Each of the 10 SE review dimensions was verified against the live codebase at `/home/z/my-project/siraj-clone/`. Key files inspected for pattern verification:

| File | Verification Purpose |
|------|----------------------|
| `backend/db/schema/__shared__/dialectAwareBuilder.ts` | Confirms `uuidColumn("id")` already applies `.defaultRandom().primaryKey()`; `textColumn(name)` accepts NO options; `numericColumn(name, { precision, scale })` is the correct helper for decimals; `checkConstraint(name, pgSql, sqliteSql)` is the dialect-aware CHECK helper (NOT raw `check` from `drizzle-orm`) |
| `backend/db/schema/students/students.ts` lines 51, 94-105 | Confirms `id: uuidColumn("id")` (no chained `.defaultRandom().primaryKey()`) and `checkConstraint("name", pgSql, sqliteSql)` pattern for non-negative CHECK |
| `backend/db/schema/billing/billing.ts` lines 28-32, 80-82 | Confirms FK columns use `uuidDefaultColumn(name).references(...)` (NOT `uuidColumn`) |
| `backend/db/schema/billing/credit-transactions.ts` line 25 | Confirms `changeAmount: integerColumn("change_amount").notNull()` — plan correctly relaxes to nullable |
| `backend/db/repo/billing/credit.repository.ts` lines 30, 61, 78, 86-108 | Confirms repo pattern: `queryDb(tx)` for reads, `tx.insert(...).returning()` for writes, `ReadExecutor = DBTransaction \| typeof db` type alias |
| `backend/db/repo/students/student.repository.ts` lines 318-401 | Confirms `adjustClassesQuota` private helper: acquires `acquireStudentLock`, atomic SQL increment, version bump, `expectedVersion` check — pattern that `addCreditHours`/`deductCreditHours` MUST mirror |
| `backend/db/repo/billing/billing.repository.ts` lines 33-55, 447-470 | Confirms `acquireInvoiceLock(tx, invoiceId)` via `acquireAdvisoryLock(tx, \`invoice_\${invoiceId}\`)` — pattern that `togglePaidStatus` MUST mirror |
| `backend/services/billing/credit.service.ts` lines 19-26, 102-146, 240-306 | Confirms `deriveBookingIdempotencyKey` SHA-256 pattern; `recordPurchaseIfMissing` return-existing-on-dup pattern (vs. `recordPurchase` throw-on-dup); `deductForBooking` pre-check + `runIdempotentBookingLedgerOp` shared helper |
| `backend/services/billing/billing-management.service.ts` lines 32-48, 246-268 | Confirms local `requirePermission` helper using `PermissionsService.hasPermission` + `finalizePaymentStatusChangeWithDispatch` post-commit dispatch pattern |
| `backend/services/system/system-settings.service.ts` lines 355-366 | Confirms `getSettingByKey(key, tx?)` accepts optional tx — pattern for `accounting_paid_toggle_auto_flips_invoice` read INSIDE the tx |
| `backend/graphql/pothos/billing/credit.pothos.ts` | Confirms Pothos layer contains OBJECT TYPES ONLY — no queries/mutations mixed in |
| `backend/graphql/query/billing/credit.query.ts` lines 12-54 | Confirms `gqlSchemaBuilder.queryField("name", t => t.field({ ... }))` SINGULAR form + `authScopes: { loggedIn: true }` + `requireAuth(ctx)` + manual `PermissionsService.hasPermission` check |
| `backend/graphql/mutation/billing/credit.mutation.ts` lines 7-37 | Confirms `gqlSchemaBuilder.mutationField("name", ...)` SINGULAR form + same defense-in-depth auth pattern + returns entity (NOT `Boolean`) |

---

## 2. SE Issues Found & Fixed

### 2.1 Schema Layer — 6 Critical Fixes

| # | Issue | Fix | Affected Files |
|---|-------|-----|----------------|
| S1 | `id: uuidColumn("id").defaultRandom().primaryKey()` — redundant AND wrong (helper already applies both; the return type does NOT expose these methods) | `id: uuidColumn("id")` (matches existing `package_plans.id`, `students.id`, `invoices.id`, `payments.id` pattern) | `implementation.md` §1.1, `trackable-tasks.md` 1.1 |
| S2 | `textColumn("credit_hours", { precision: 12, scale: 2 })` — `textColumn` signature accepts ONLY `name`; passing options is a TypeScript error | `numericColumn(name, { precision: 12, scale: 2 })` — the dialect-aware helper that produces `numeric(p,s)` on PG (returned as `string`) and stores as `text` on SQLite for precision preservation (mirrors existing `students.hoursPerWeek` pattern) | `implementation.md` §1.1, 1.2, 1.3, 1.4; `trackable-tasks.md` 1.1-1.4 |
| S3 | `import { check, sql } from "drizzle-orm"` + `check("name", sql\`...\`)` — `check` from `drizzle-orm` is PG-only and silently no-ops on SQLite (verified via `grep` — zero existing usages in `backend/db/schema/`) | `import { sql } from "drizzle-orm"` + `import { checkConstraint } from "@/backend/db/schema/__shared__/dialectAwareBuilder"` + `checkConstraint(name, pgSql, sqliteSql)` — dialect-aware helper (matches existing `quotas.ts`, `students.ts`, `scheduling.ts` pattern) | `implementation.md` §1.1, 1.2, 1.4; `trackable-tasks.md` 1.1, 1.2, 1.4 |
| S4 | `packagePlanId: uuidColumn("package_plan_id").references(...)` — `uuidColumn` is PK-only (applies `.defaultRandom().primaryKey()`); FK columns must use `uuidDefaultColumn` (matches existing `payments.invoiceId`, `invoices.parentId` pattern) | `uuidDefaultColumn("package_plan_id").references(() => packagePlans.id, { onDelete: "set null" })` | `implementation.md` §1.3, `trackable-tasks.md` 1.3 |
| S5 | `timestampColumn(name, { withTimezone: true, precision: 3 })` — `timestampColumn` helper already applies `{ withTimezone: true, precision: 3 }` internally (see `dialectAwareBuilder.ts` line 133) | `timestampColumn(name)` (no options) — matches existing `students.createdAt` pattern | `implementation.md` §1.1 |
| S6 | `billedUnit` column added with no v1 writers — risk of removal by future agents who see "unused" code | Added **R2 SE NOTE — Dead Code in v1**: column is intentional scaffolding for Plan 6 (`student.billingMode` discriminator); the paired `CreditService.deductHoursForBooking` / `refundHoursOnCancel` are unit-tested but no production caller exists until Plan 6 lands | `implementation.md` §1.5, `specs.md` Open Questions, `specs.md` Cross-Plan Dependencies, `trackable-tasks.md` 1.5 |

### 2.2 Service Layer — 8 Critical Fixes

| # | Issue | Fix | Affected Files |
|---|-------|-----|----------------|
| SV1 | `AccountingPaymentService.recordPayment` lacked advisory lock on student balance — two concurrent `recordPayment` calls with DIFFERENT idempotency keys (admin changes `paymentDate` by 1 sec) would race on `students.creditHoursRemaining` bump (atomic SQL increment mitigates but ledger shows two simultaneous purchases against a momentarily-stale balance) | Added `acquireAdvisoryLock(tx, \`student_\${studentId}\`)` INSIDE the tx BEFORE any balance-affecting op (mirrors existing `acquireStudentLock` in `student.repository.ts` line 325). Atomic SQL increment remains as defense-in-depth. New EC-13 documents the race + fix. | `implementation.md` §3.3 (AccountingPaymentService), `specs.md` EC-13, `trackable-tasks.md` 3.3 |
| SV2 | `AccountingPaymentService.togglePaidStatus` lacked advisory lock on invoice — concurrent toggles on payments of the SAME invoice would race on the invoice `status` field (last-write-wins, losing one toggle) | Added `acquireAdvisoryLock(tx, \`invoice_\${invoiceId}\`)` BEFORE reading the invoice (mirrors `BillingRepository.acquireInvoiceLock` at `billing.repository.ts` line 33-35). New EC-14 documents the race + fix. | `implementation.md` §3.3, `specs.md` EC-14, `trackable-tasks.md` 3.3 |
| SV3 | `AccountingPaymentService.update` (creditHours change) lacked advisory lock on student balance — same race as SV1 but for edits | Added `acquireAdvisoryLock(tx, \`student_\${studentId}\`)` for the creditHours-change path. New EC-15 + EC-16 document the race + cross-path interactions. | `implementation.md` §3.3, `specs.md` EC-15 + EC-16, `trackable-tasks.md` 3.3 |
| SV4 | `togglePaidStatus` + `update` lacked `expectedInvoiceVersion` for optimistic lock — concurrent edits could silently overwrite | Added `expectedInvoiceVersion?: number` to `AccountingPaymentTogglePaidInput` + `AccountingPaymentUpdateInput`; required when `isPaidStatusOn` or `creditHours` is set; service checks `version` mismatch → throws `ConflictError(tErrors.billing.invoiceVersionMismatch)` (mirrors `BillingRepository.updateInvoiceStatus` line 464-470) | `implementation.md` §2.2 (types) + §3.3 (service), `trackable-tasks.md` 2.2 + 3.3 |
| SV5 | `recordPayment` idempotency behavior ambiguous — `recordPurchase` THROWS `ConflictError` on duplicate, but spec US-2.1 AC#4 says RETURN existing row | Clarified: `recordPayment` follows `recordPurchaseIfMissing` return-existing-on-dup pattern (NOT `recordPurchase` throw-on-dup pattern). Idempotency check is INSIDE the tx (eliminates TOCTOU race — matches `recordPurchaseIfMissing` at `credit.service.ts` line 117). Raw Postgres 23505 unique violations also caught at tx boundary and resolved to existing row. New EC-1 documents the divergence. | `implementation.md` §3.3, `specs.md` EC-1, `trackable-tasks.md` 3.3 |
| SV6 | `StudentRepository.deductCreditHours` was specified as throwing generic `INSUFFICIENT_HOURS` — codebase requires typed `ConflictError` with payload for i18n | Specified `ConflictError(tErrors.credit.insufficientHours({ studentId, remaining, required }))` — pre-check INSIDE the tx after `acquireStudentLock`, BEFORE the SQL decrement. DB CHECK `students_credit_hours_remaining_non_negative_chk` is safety net only. Matches existing `CreditService.deductForBooking` pre-check at `credit.service.ts` line 250-252. | `implementation.md` §3 (StudentRepository edit), `specs.md` EC-4 + EC-19, `trackable-tasks.md` 2.8 + 3.2 |
| SV7 | `CreditService.recordHourPurchase` / `deductHoursForBooking` / `refundHoursOnCancel` were specified to mirror `recordPurchase` (which calls `requirePermission` + wraps in `db.transaction`) — but they're internal helpers called from `AccountingPaymentService.recordPayment`'s tx | Clarified: these are internal helpers that (a) take `tx: DBTransaction` as positional param (caller owns the tx), (b) do NOT call `requirePermission` (caller's permission check covers them), (c) do NOT wrap in `db.transaction` (caller owns the tx). Mirrors existing `deductForBooking` / `refundOnCancel` signature at `credit.service.ts` line 240-306. | `implementation.md` §3.2, `trackable-tasks.md` 3.2 |
| SV8 | `accounting_paid_toggle_auto_flips_invoice` system setting read pattern was unspecified — risk of read outside the tx (stale setting) | Specified: read INSIDE the tx via `SystemSettingsService.getSettingByKey(key, tx)` (verified at `system-settings.service.ts` line 364 — accepts optional tx) | `implementation.md` §3.3, `trackable-tasks.md` 3.3 |

### 2.3 GraphQL Layer — 3 Critical Fixes

| # | Issue | Fix | Affected Files |
|---|-------|-----|----------------|
| G1 | Plan §5 prescribed putting types + queries + mutations ALL in one `accounting.pothos.ts` file — INCONSISTENT with codebase which separates them into 3 files (verified: `backend/graphql/pothos/billing/credit.pothos.ts` for types, `backend/graphql/query/billing/credit.query.ts` for queries, `backend/graphql/mutation/billing/credit.mutation.ts` for mutations) | Split into 3 files: (a) `backend/graphql/pothos/billing/accounting.pothos.ts` for object + input types only, (b) `backend/graphql/query/billing/accounting.query.ts` for queries via `gqlSchemaBuilder.queryField("name", t => t.field({ ... }))` SINGULAR form, (c) `backend/graphql/mutation/billing/accounting.mutation.ts` for mutations via `gqlSchemaBuilder.mutationField("name", t => t.field({ ... }))` SINGULAR form. Plus new `__shared__/packagePlanFieldHelpers.ts` for shared field map (mirrors existing `creditFieldHelpers.ts` + `paymentFieldHelpers.ts`). | `implementation.md` §5 (rewritten into 4 sub-sections 5.1-5.4), `trackable-tasks.md` 4.1-4.7 (rewritten) |
| G2 | Plan said resolvers use `authScopes: { loggedIn: true }` + manual `PermissionsService.hasPermission` check — task brief said the same. But plan §5 also mentioned `authScopes: { permission: AppPermission.XXX }` as alternative — INCONSISTENT. Verified: `authScopes: { permission: ... }` is ONLY used in `permission-management.pothos.ts`, NOT in billing. | Mandated: `authScopes: { loggedIn: true }` + `await requireAuth(ctx)` + manual `PermissionsService.hasPermission(actorUserId, AppPermission.XXX)` check inside resolver (throw `Error(tErrors.insufficientPermissions)` if missing) + service-layer `requirePermission` (defense in depth). Matches `credit.mutation.ts` lines 17-34 EXACTLY. | `implementation.md` §5, `trackable-tasks.md` 4.3 + 4.4 |
| G3 | Plan implied mutations might return `Boolean` (existing `assignPermissionGroupToUser` does) — but billing pattern returns the created/updated entity | Mandated: every mutation returns the entity (`PackagePlan!` / `AccountingPayment!`), NOT `Boolean`. Matches existing `recordCreditPurchase` mutation returning `CreditPurchaseResultPothosObject` | `implementation.md` §5.3, `trackable-tasks.md` 4.4 + 4.10 |

### 2.4 Test Coverage — 3 Critical Fixes

| # | Issue | Fix | Affected Files |
|---|-------|-----|----------------|
| T1 | Test 10.4 used generic `INSUFFICIENT_HOURS` string — codebase requires typed `ConflictError` with payload | Specified exact error class + payload: `ConflictError(tErrors.credit.insufficientHours({ studentId, remaining, required }))`. Added assertion to verify the typed payload, not just the error class. | `implementation.md` §9 (Phase 9 tests), `trackable-tasks.md` 10.3 + 10.4 |
| T2 | Missing tests for: (a) `update` with `paymentNote`-only change (no ADJUSTMENT row); (b) `update` with `paymentGateway`-only change; (c) optimistic-lock version mismatch; (d) IDOR scoping on `getStudentBalance` + `listPaginated`; (e) `recordPayment` with archived plan mid-tx; (f) `togglePaidStatus` with `auto_flips_invoice=false`; (g) fractional `hours=0.5` deduction; (h) `hours=0` rejection | Added 18+ test cases to Phase 10.4 covering all the above. Tests use `runInRollback` wrapper; never `expect().rejects.toThrow()` inside `runInRollback` per `backend/db/test/AGENTS.md`. | `implementation.md` §9, `trackable-tasks.md` 10.3 + 10.4 |
| T3 | No test for advisory lock acquisition (the concurrency fixes SV1-SV3) | Added tests that verify the locks are acquired by running concurrent ops (one ON, one OFF) on payments of the same invoice; second waits for first to commit. Matches existing test patterns in `credit-workflow.test.ts`. | `implementation.md` §9, `trackable-tasks.md` 10.4 |

### 2.5 Edge Cases — 7 New ECs Added

| # | Scenario | Fix |
|---|----------|-----|
| EC-13 | Concurrent `recordPayment` with DIFFERENT idempotency keys for same student (admin changes `paymentDate` by 1 sec) | Advisory lock `student_${studentId}` serializes balance mutations per student; atomic SQL increment is defense-in-depth |
| EC-14 | Concurrent `togglePaidStatus` on different payments of the SAME invoice | Advisory lock `invoice_${invoiceId}` serializes invoice status mutations per invoice (mirrors `BillingRepository.acquireInvoiceLock`) |
| EC-15 | Concurrent `update` (creditHours change) on two payments of the SAME student | Advisory lock `student_${studentId}` (same as EC-13) |
| EC-16 | Cross-path: `recordPayment` + `update` creditHours concurrent for same student | Same `student_${studentId}` lock serializes both paths |
| EC-17 | `recordPayment` with future `paymentDate` | Allowed (matches existing `invoices.issueDate` semantics) |
| EC-18 | `recordPayment` with null `packagePlanId` (ad-hoc payment without plan) | Allowed; idempotency key uses `""` for null plan (deterministic) |
| EC-19 | `creditHoursRemaining = "0.00"` and `deductCreditHours(0.01)` called | Pre-check fails → `ConflictError`; DB CHECK is safety net |

Plus clarification notes added to existing EC-1, EC-2, EC-3, EC-4, EC-5, EC-6, EC-8, EC-9, EC-10 specifying the exact error class + payload.

### 2.6 Cross-Plan Dependencies — New Section Added

Added **Cross-Plan Dependencies (Plans 1-7 ecosystem)** section to `specs.md` documenting:
- Plan 1 (this) → unblocks Plans 2, 3, 6, 7
- Plan 2 (Quota extension) depends on Plan 1 §1.4 + §1.2; Plan 1 leaves a post-commit hook for Plan 2 to wire up the quota bridge
- Plan 3 (PDF receipts) depends on Plan 1 invoices/payments schema; Plan 1 emits placeholder `ACCOUNTING_PAYMENT_RECORDED` notification event for Plan 3 to attach PDF
- Plan 4 (multi-currency) is a non-trivial breaking change to `students.creditHoursRemaining` semantics — coordinate with Plan 6 (billingMode)
- Plan 6 (`student.billingMode`) depends on Plan 1 §1.5 (`billedUnit` column) + §3.2 (`CreditService.deductHoursForBooking`); Plan 1's hour-extension methods are dead code in v1 until Plan 6 lands
- Plan 7 (payment gateway integrations) depends on Plan 1 `paymentGateway` enum + `transactionId` column + `recordPayment` service; Plan 7 webhook handlers will call `recordPayment` with `isPaidStatusOn=true` on gateway confirmation

---

## 3. Files Modified

| File | Lines Before | Lines After | Net Change | Notes |
|------|-------------|-------------|------------|-------|
| `specs.md` | 465 | 482 | +17 | Added Cross-Plan Dependencies section; expanded Open Questions with R2 SE warnings; expanded ECs (7 new + 9 clarified) |
| `implementation.md` | 981 | 1186 | +205 | Rewrote §1.1-1.5 schema with correct helpers + R2 SE pattern notes; rewrote §2.2 types with `expectedInvoiceVersion` + new `TogglePaidInput`; rewrote §3.2 CreditService hour-extension with `tx` param + no `requirePermission` + pre-check pattern; rewrote §3.3 AccountingPaymentService with advisory locks + idempotency clarification + error class mandates; rewrote §3 (StudentRepository) with full `addCreditHours` / `deductCreditHours` / `getCreditHourBalance` implementations; rewrote §5 GraphQL layer into 3-file split (5.1-5.4) with full code skeletons; expanded §9 test list from 6 → 18+ test cases |
| `trackable-tasks.md` | 373 | 395 | +22 | Updated tasks 1.1-1.5 with R2 SE pattern mandates + grep verification commands; updated 2.2 + 2.5-2.8 with correct helpers + lock acquisitions; updated 3.1-3.3 with idempotency behavior + advisory lock mandates; expanded 3.6 Quality Loop critical checks from 3 → 6; rewrote 4.1-4.7 GraphQL tasks into 3-file split with singular `queryField`/`mutationField` pattern; expanded 10.1-10.4 test tasks with typed error assertions + IDOR + concurrency tests |

---

## 4. SE Issue Categories Addressed

| Category | Issues Found | Issues Fixed | Notes |
|----------|-------------|--------------|-------|
| **(a) Transaction boundaries** | 3 (recordPayment missing lock; togglePaidStatus missing lock; update missing lock) | 3 ✅ | All multi-table writes now wrapped in single `db.transaction`; all repo calls pass `tx`; advisory locks acquired INSIDE the tx BEFORE balance mutations |
| **(b) Idempotency** | 2 (recordPayment behavior ambiguous; raw 23505 handling unclear) | 2 ✅ | Every mutation has SHA-256 idempotency key; check is INSIDE the tx (eliminates TOCTOU); `recordPayment` returns existing row on duplicate (follows `recordPurchaseIfMissing` pattern); `update` + `togglePaidStatus` use optimistic-lock `version` on the invoice |
| **(c) Error handling** | 4 (generic `INSUFFICIENT_HOURS`; missing `NotFoundError` for archived plan; missing `ConflictError` for codename dup; missing `ValidationError` for `hours=0`) | 4 ✅ | All error paths now use typed error classes (`NotFoundError`, `ValidationError`, `ConflictError`) with `tErrors.x(...)` messages; verified against `credit.service.ts` pattern |
| **(d) Permission checks** | 2 (resolver pattern unclear; service-vs-resolver responsibility unclear) | 2 ✅ | Defense-in-depth: GraphQL resolver uses `authScopes: { loggedIn: true }` + `requireAuth(ctx)` + manual `PermissionsService.hasPermission` check; service-layer `requirePermission` for defense in depth (matches `credit.mutation.ts` + `credit.service.ts` pattern EXACTLY) |
| **(e) Type definitions** | 1 (numeric field type mismatch — `string` vs `number`) | 1 ✅ | Documented: `SelectType` uses `string` (Drizzle returns `numeric` as string for precision); `SubmitInput`/`UpdateInput` use `number` for ergonomic API; service layer converts via `Number()` on read and SQL parameterization on write |
| **(f) API design** | 1 (mutation return type ambiguity) | 1 ✅ | Every mutation returns the created/updated entity (NOT `Boolean`); queries paginated via `queryWithPagination(baseQuery, paginationArgs)`; matches existing `recordCreditPurchase` pattern |
| **(g) Data integrity** | 4 (`textColumn` w/ options; `uuidColumn` for FK; raw `check`; redundant `.defaultRandom().primaryKey()`) | 4 ✅ | All schema declarations now use correct dialect-aware helpers; FK constraints use `uuidDefaultColumn` + `references(() => ..., { onDelete: "set null" / "restrict" / "cascade" })`; CHECK constraints use `checkConstraint(name, pgSql, sqliteSql)` for SQLite compatibility |
| **(h) Cross-plan dependencies** | 1 (undocumented) | 1 ✅ | Added full Cross-Plan Dependencies table (Plans 1-7) with depends-on / unblocks / coordination notes; flagged `billedUnit` + `deductHoursForBooking` / `refundHoursOnCancel` as intentional dead code in v1 (Plan 6 wires them) |
| **(i) Missing scenarios** | 7 (concurrent recordPayment diff keys; concurrent togglePaidStatus same invoice; concurrent update creditHours same student; cross-path recordPayment + update; future paymentDate; null packagePlanId; tiny decimal deduction) | 7 ✅ | Added EC-13 through EC-19 covering all 7 scenarios with explicit fix descriptions |
| **(j) Test coverage** | 3 (generic INSUFFICIENT_HOURS assertion; missing update-only-change tests; missing IDOR tests) | 3 ✅ | Expanded test list from 6 → 18+ test cases covering: idempotency return-existing, mid-tx archival rejection, paid-toggle sibling cascade, auto-flip setting, optimistic-lock version mismatch, paymentNote-only edit (no ADJUSTMENT), creditHours increase/decrease, insufficient-hours pre-check, IDOR scoping, advisory lock acquisition via concurrent ops |

**Total: 28 SE issues found, 28 fixed.**

---

## 5. Verification Commands (for executing agents)

After implementing any of the fixed tasks, run these commands to verify R2 SE compliance:

```bash
# Verify NO forbidden textColumn-with-options patterns in schema
rg "textColumn\([^)]+,\s*\{" backend/db/schema/

# Verify NO redundant .defaultRandom().primaryKey() on uuidColumn
rg "uuidColumn\([^)]+\)\.(defaultRandom|primaryKey)" backend/db/schema/

# Verify NO raw `check` import from drizzle-orm (must use checkConstraint)
rg "^import.*\bcheck\b.*from \"drizzle-orm\"" backend/db/schema/

# Verify FK columns use uuidDefaultColumn (NOT uuidColumn)
rg "uuidColumn\([^)]+\)\.references" backend/db/schema/

# Verify service-layer transaction wrapping
rg "db\.transaction\(async tx =>" backend/services/billing/accounting-payment.service.ts

# Verify advisory lock acquisitions
rg "acquireAdvisoryLock\(tx, \`" backend/services/billing/accounting-payment.service.ts

# Verify typed error classes (NOT generic Error)
rg "throw new Error\(tErrors\." backend/services/billing/accounting-payment.service.ts
# (should return ZERO matches — all errors must be NotFoundError / ValidationError / ConflictError)
```

All commands should return ZERO matches (or expected matches only) for R2 SE compliance.

---

## 6. Next Actions for Implementing Agents

1. **Phase 1 (Schema)** — implement tasks 1.1-1.16 with the corrected helpers. Pay special attention to the `numericColumn` vs `textColumn` distinction and the `checkConstraint` vs `check` distinction. Run the verification greps in §5 above before marking task 1 complete.

2. **Phase 2 (Types + Repos)** — implement tasks 2.1-2.11. The `deductCreditHours` pre-check is the most critical correctness fix — verify it throws `ConflictError` with the typed payload, NOT a generic `Error`.

3. **Phase 3 (Services)** — implement tasks 3.1-3.7. The advisory lock acquisitions in `recordPayment` / `togglePaidStatus` / `update` are the most critical concurrency fixes. Verify by running the concurrent test cases in Phase 10.4.

4. **Phase 4 (GraphQL)** — implement tasks 4.1-4.11. The 3-file split (pothos/query/mutation) is mandatory — do NOT combine into one file. The singular `queryField`/`mutationField` form is mandatory — do NOT use the plural `queryFields`/`mutationFields` form (that's a different code path used only in `cron.pothos.ts` + `permission-management.pothos.ts`).

5. **Phase 10 (Tests)** — implement tasks 10.1-10.7. The 18+ test cases cover the concurrency fixes (advisory locks), the idempotency behavior (return-existing-on-dup), the typed error payloads, and the IDOR scoping. All tests use `runInRollback`; never `expect().rejects.toThrow()` inside `runInRollback`.

6. **Cross-Plan Coordination** — when implementing Plan 6 (`student.billingMode`), DO NOT remove the `deductHoursForBooking` / `refundHoursOnCancel` methods as "unused" — they are the intended extension point. Wire them into recurring-schedule generation + class-instance activation per the Plan 6 design.

7. **Outcome Files** — every task outcome file should explicitly call out which R2 SE fixes were applied (e.g. "Task 3.3 implemented the `acquireAdvisoryLock(tx, student_${studentId})` fix from R2 EC-13"). This makes future audits traceable.
