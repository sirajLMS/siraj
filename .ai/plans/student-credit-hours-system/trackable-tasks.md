# Student Credit-Hours System — Trackable Tasks

## Document Information

- **Feature Name**: Credit-Hours Payments Module (Accounting extension on top of existing credit + quota ledgers)
- **Version**: 1.0
- **Date**: 2026-08-12
- **Related Documents**:
  - [Design Specifications](./specs.md)
  - [Implementation Guide](./implementation.md)
- **Outcome Directory**: `.ai/plans/student-credit-hours-system/outcome/`

## Non-Negotiable Execution Protocol

Every executing agent MUST follow these 5 rules for every task in this plan:

1. **Pre-Execution Outcome Knowledge Read:** Before executing ANY task, read ALL existing files in `.ai/plans/student-credit-hours-system/outcome/`. This ensures the agent absorbs prior research, web search results, documentation lookups, pitfalls, and misunderstandings without re-doing past analysis.

2. **Per-File Quality Loop (MANDATORY):** After creating or modifying ANY file, run the per-file verification loop BEFORE importing or using the file elsewhere:
   ```bash
   bun tsgo
   bun biome:check
   curl -s -X POST http://localhost:4777/lint \
     -H "Content-Type: application/json" \
     -d '{"id":"verify","files":["<the-file>"]}'
   ```
   Fix all errors before proceeding to the next file/subtask.

3. **Global Health Check:** After all files in a task pass per-file verification, run a global health check:
   ```bash
   bun tsgo && bun biome:check && bun run lint
   ```
   All three must exit 0 before marking the task complete.

4. **Post-Execution Outcome File Creation:** Upon completing a task, create a new outcome document under `.ai/plans/student-credit-hours-system/outcome/<task-id>-outcome.md` detailing:
   - Research findings and documentation/web search results
   - Implementation details and decisions made
   - Pitfalls encountered and how they were resolved
   - Carry-over points for future subtasks

5. **Task Progress Checkbox Tracking:** Update the task checkbox `[ ]` → `[x]` in this file upon completing each subtask. Mark parent tasks `[-]` when in progress, `[x]` only when ALL sub-tasks are `[x]`.

## Task Status Legend

| Marker | Meaning |
|--------|---------|
| `[ ]` | Not started |
| `[-]` | In progress |
| `[x]` | Completed |

**MANDATORY SUBTASKS FOR EVERY IMPLEMENTATION TASK:**
Every parent task (X) and sub-task (X.Y) MUST include these mandatory subtasks:
1. **Quality Loop (X.Y.QL)**: Run per-file verification (`bun tsgo` + `bun biome:check` + lint queue)
2. **Instruction Verification (X.Y.IV)**: Validate against ALL applicable AGENTS.md and `.agents/instructions` files (absolute paths from implementation.md Task-to-Instructions Mapping)

---

## Phase 1: Database Foundation

- [ ] **1. Schema, enums, permissions, and GraphQL enum registration**
  - [ ] 1.1 Create `backend/db/schema/billing/package-plans.ts` — `package_plans` table + relations + partial unique index on codename (WHERE deleted_at IS NULL) + active/sort index + 3 CHECK constraints. **R2 SE PATTERN (mandatory):** (a) `id: uuidColumn("id")` — do NOT chain `.defaultRandom().primaryKey()` (helper already applies them — see `dialectAwareBuilder.ts` lines 97-105); (b) `creditHours` + `priceAmount` use `numericColumn(name, { precision: 12, scale: 2 })` (NOT `textColumn(name, { precision, scale })` — textColumn does NOT accept options); (c) CHECK constraints use `checkConstraint(name, pgSql, sqliteSql)` from `dialectAwareBuilder` (NOT raw `check(name, sql)` from `drizzle-orm` which silently no-ops on SQLite — verify with `grep -rn "^import.*\bcheck\b.*from \"drizzle-orm\"" backend/db/schema/` returns ZERO matches in existing code)
  - [ ] 1.2 Edit `backend/db/schema/billing/credit-transactions.ts` — add nullable `changeAmountHours` column via `numericColumn("change_amount_hours", { precision: 12, scale: 2 })` (NOT textColumn w/ options); relax existing `changeAmount` from NOT NULL to NULL; add XOR CHECK constraint via `checkConstraint("credit_transactions_change_amount_xor_chk", pgSql, sqliteSql)` (NOT raw `check`); add index `(studentId, changeAmountHours)`
  - [ ] 1.3 Edit `backend/db/schema/billing/billing.ts` — extend `payments` table with `packagePlanId: uuidDefaultColumn("package_plan_id").references(() => packagePlans.id, { onDelete: "set null" })` (NOT `uuidColumn` — `uuidColumn` is PK-only; FKs use `uuidDefaultColumn` per existing `payments.invoiceId` pattern); `paymentGateway` (enum NOT NULL DEFAULT 'NONE'); `creditHours: numericColumn("credit_hours", { precision: 12, scale: 2 })` (NOT textColumn w/ options); `isPaidStatusOn` (boolean NOT NULL DEFAULT false); `paymentNote` (text nullable); add 3 indexes; extend `invoices` table with `creditHours: numericColumn("credit_hours", { precision: 12, scale: 2 })` (NOT textColumn w/ options)
  - [ ] 1.4 Edit `backend/db/schema/students/students.ts` — add `creditHoursRemaining` + `creditHoursTotal` via `numericColumn(name, { precision: 12, scale: 2 }).notNull().default("0.00")` (NOT textColumn — textColumn does not accept options); add 2 CHECK constraints via `checkConstraint(name, pgSql, sqliteSql)` (NOT raw `check`)
  - [ ] 1.5 Edit `backend/db/schema/classes/scheduling.ts` — add `billedUnit: billedUnitEnum("billed_unit")` (nullable) column to `class_instances`. **R2 SE NOTE:** This column is dead code in v1 — no writer exists until Plan 6 (`student.billingMode` discriminator) lands. Document in outcome file `1-outcome.md` so future agents don't remove `deductHoursForBooking`/`refundHoursOnCancel` as "unused"
  - [ ] 1.6 Edit `backend/db/schema/enums.ts` — add `paymentGatewayEnum` via `createPgEnumFromEnum("payment_gateway", PaymentGateway)` + `billedUnitEnum` via `createPgEnumFromEnum("billed_unit", BilledUnit)` (MUST follow existing `createPgEnumFromEnum` pattern — NOT raw `pgEnum`). The existing `invoiceTypeEnum = createPgEnumFromEnum("invoice_type", InvoiceType)` automatically picks up the new `CREDIT_HOURS_PACKAGE` value from the TypeScript enum; no edit needed for invoiceType in `enums.ts`
  - [ ] 1.7 Create `backend/enum/billing/package-plan.enum.ts` — TypeScript `PaymentGateway` + `BilledUnit` enums + add `export * from "./package-plan.enum";` to `backend/enum/billing/index.ts` barrel
  - [ ] 1.8 Edit `backend/enum/billing/billing.enum.ts` — add `CREDIT_HOURS_PACKAGE = "CREDIT_HOURS_PACKAGE"` to `InvoiceType`
  - [ ] 1.9 Edit `backend/enum/permissions/permission.enum.ts` — add `ACCOUNTING_PAYMENTS_VIEW = "accounting.payments_view"` + `ACCOUNTING_PAYMENTS_MANAGE = "accounting.payments_manage"` (follows existing SCREAMING_SNAKE_CASE → dot-notation pattern)
  - [ ] 1.10 Create `backend/db/migration/<N>-accounting_enums_and_permissions.sql` — follow `6-lms-permissions-and-groups.sql` pattern: `ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'accounting.payments_view'/'accounting.payments_manage'`; `CREATE TYPE payment_gateway AS ENUM (...)` + `CREATE TYPE billed_unit AS ENUM (...)`; `ALTER TYPE invoice_type ADD VALUE IF NOT EXISTS 'CREDIT_HOURS_PACKAGE'`; INSERT permissions + permission_group_permissions grants (super_admin/academy_admin/staff_default for view; super_admin/academy_admin for manage). NOTE: `backend/db/seeds/permissions/` directory does NOT exist — permission seeds live as SQL migrations
  - [ ] 1.11 Edit `backend/graphql/pothos/shared/enum.pothos.ts` — register `PaymentGateway` + `BilledUnit` via `gqlSchemaBuilder.enumType(TypescriptEnum, { name: "GraphQLName" })` pattern (the file registers TypeScript enums, NOT Drizzle pgEnum objects); `InvoiceType` registration already present picks up the new value automatically
  - [ ] 1.12 Create `backend/db/migration/<N+1>-credit_hours_system_settings_seed.sql` — INSERT 3 system_settings keys ON CONFLICT upsert: `accounting_default_currency` (EGP), `accounting_low_hours_threshold` (2.00), `accounting_paid_toggle_auto_flips_invoice` (true)
  - [ ] 1.13 Run `bun run db push` (for new tables/columns/indexes) + `bun run db migrate` (for custom SQL: enum creation, ALTER TYPE ADD VALUE, NOT NULL → NULL relaxation on `credit_transactions.change_amount`, system_settings seed, permission grants). NOTE: command is `bun run db push`/`bun run db migrate` (with `run`), as `db` is a `scripts/dbActions/index.ts` CLI
  - [ ] 1.14 Verify schema applied: query `package_plans`, `payments.payment_gateway`, `students.credit_hours_remaining` exist; `credit_transactions.change_amount` is nullable
  - [ ] 1.15 **Quality Loop**: Per-file verification on all new/edited files. Critical checks:
    - XOR CHECK on `credit_transactions` accepts both legacy class rows (`change_amount` set, `change_amount_hours` NULL) and new hour rows (vice versa)
    - `package_plans` codename unique index is partial (`WHERE deleted_at IS NULL`)
    - All new CHECK constraints non-negative / positive as specified
    - Enum registration uses `createPgEnumFromEnum`, not raw `pgEnum`
    - **R2 SE: grep for forbidden patterns — `rg "textColumn\([^)]+,\s*\{" backend/db/schema/` should return ZERO matches; `rg "uuidColumn\([^)]+\)\.(defaultRandom|primaryKey)" backend/db/schema/` should return ZERO matches; `rg "^import.*\bcheck\b.*from \"drizzle-orm\"" backend/db/schema/` should return ZERO matches**
  - [ ] 1.16 **Instruction Verification**: Verify against:
    - AGENTS.md: `AGENTS.md`, `backend/db/schema/AGENTS.md`, `backend/enum/AGENTS.md`, `backend/graphql/AGENTS.md`
    - Instructions: `.agents/instructions/backend.instructions.md`

---

## Phase 2: Backend Types & Repositories

- [ ] **2. Backend type definitions + repositories**
  - [ ] 2.1 Create `backend/types/billing/package-plan.types.ts` — `PackagePlanSelectType`, `PackagePlanInsertType`, `PackagePlanReturnType`, `PackagePlanSubmitInput`, `PackagePlanUpdateInput` (with `version` for optimistic lock)
  - [ ] 2.2 Create `backend/types/billing/accounting-payment.types.ts` — `AccountingPaymentSelectType`, `AccountingPaymentReturnType`, `AccountingPaymentSubmitInput`, `AccountingPaymentUpdateInput` (with `expectedInvoiceVersion?: number` — required when `isPaidStatusOn` or `creditHours` is set, optional otherwise), `AccountingPaymentTogglePaidInput` (with `expectedInvoiceVersion?: number` — for invoice status cascade), `AccountingPaymentFilter`, `AccountingPaymentBalanceReturnType`. **R2 SE Note:** Numeric fields (`creditHours`, `amount`) are typed as `string` in `SelectType` (Drizzle returns `numeric` as string for precision preservation) but `number` in `SubmitInput`/`UpdateInput` for ergonomic API — service layer converts via `Number()` on read and SQL parameterization on write
  - [ ] 2.3 Edit `backend/types/billing/credit.types.ts` — add `CreditHourTransactionSubmitInput` + `CreditHourBalanceReturnType`; keep existing `CreditTransactionSubmitInput` unchanged for backward compat
  - [ ] 2.4 Edit `backend/types/billing/index.ts` — re-export new types
  - [ ] 2.5 Create `backend/db/repo/billing/package-plan.repository.ts` — `create`, `findById`, `findByCodename` (case-insensitive), `listActive`, `listAllPaginated`, `update` (optimistic lock via version), `archive`, `generateIdempotencyKey` (sha256 of codename|displayName|creditHours|priceAmount|currency). **R2 SE Note:** Repository writes use `tx.insert(...).values({...}).returning()` (passing `tx`); reads use `queryDb(tx)` per existing `credit.repository.ts` pattern (line 30, 61, 78). Pagination via `queryWithPagination(baseQuery, paginationArgs)`
  - [ ] 2.6 Create `backend/db/repo/billing/accounting-payment.repository.ts` — `create` (tx), `findById` (with student + package joins — `leftJoin(students, eq(payments.invoiceId, invoices.id)).leftJoin(invoices, eq(invoices.studentId, students.id)).leftJoin(parents, eq(students.parentId, parents.id)).leftJoin(packagePlans, eq(payments.packagePlanId, packagePlans.id))`), `listPaginated` (filter: studentId, parentId, fromDate, toDate, unpaidOnly — all AND combined via `and()` builder; parentId filter joins through `invoices.studentId → students.parentId`), `countForFilter`, `update` (tx), `findPaidSiblingsByInvoice(invoiceId, excludePaymentId)` (returns payments with same invoiceId, `isPaidStatusOn=true`, `id != excludePaymentId`), `generateIdempotencyKey` (sha256 of `studentId|packagePlanId|amount|currency|paymentDate|gateway` — empty string `""` for null `packagePlanId` per EC-18)
  - [ ] 2.7 Edit `backend/db/repo/billing/credit.repository.ts` — add `createHourPurchase` (tx), `deductHoursForBooking` (tx), `refundHoursOnCancel` (tx), `getHourBalance` (tx, reads from `students` table); all write NULL to `change_amount` and set `change_amount_hours`. **R2 SE Note:** These repos mirror the existing `createPurchase` / `deductForBooking` / `refundOnCancel` shape — they accept `(tx: DBTransaction, input: { ... })` and use `insertCreditTransaction` helper. Do NOT duplicate the helper — extract a single `insertCreditTransaction` private function that takes both `changeAmount?` and `changeAmountHours?` and asserts the XOR invariant before insert
  - [ ] 2.8 Edit `backend/db/repo/students/student.repository.ts` — add `addCreditHours(studentId, tErrors, hours, expectedVersion?, tx?)` (reuses `adjustClassesQuota` private helper — atomic SQL increment via `sql\`${students.creditHoursRemaining} + ${hours}\`` + version bump) + `deductCreditHours(studentId, tErrors, hours, expectedVersion?, tx?)` (acquires `acquireStudentLock`, pre-checks `current.creditHoursRemaining >= hours`, throws `ConflictError(tErrors.credit.insufficientHours({studentId, remaining, required}))` on insufficient — DB CHECK is safety net only) + `getCreditHourBalance(studentId, tx?)` (read-only via `queryDb(tx)`). Follow existing `addClasses`/`deductClasses` signature pattern (`export const xxx = async (studentId, tErrors, amount, expectedVersion?, tx?)`)
  - [ ] 2.9 Edit `backend/db/repo/billing/index.ts` + `backend/db/repo/students/index.ts` — re-export new repositories
  - [ ] 2.10 **Quality Loop**: Per-file verification on all new/edited repo + types files. **R2 SE critical checks:**
    - All repo writes pass `tx` (no `db.transaction` calls inside repos — repos are tx-aware, services own the tx)
    - All repo reads use `queryDb(tx)` (NOT raw `db.select()`)
    - `deductCreditHours` pre-check is INSIDE the tx (after `acquireStudentLock`) — not before
    - `numericColumn` reads return `string` — callers `Number()` before arithmetic
  - [ ] 2.11 **Instruction Verification**: Verify against:
    - AGENTS.md: `AGENTS.md`, `backend/types/AGENTS.md`, `backend/db/repo/AGENTS.md`
    - Instructions: `.agents/instructions/backend.instructions.md`

---

## Phase 3: Backend Services

- [ ] **3. PackagePlanService + CreditService hour-extension + AccountingPaymentService**
  - [ ] 3.1 Create `backend/services/billing/package-plan.service.ts` — `create` (perm: `ACCOUNTING_PAYMENTS_MANAGE`), `update` (optimistic lock), `archive`, `getById`, `listActive`, `listPaginated`; codename uniqueness check returns friendly `ConflictError(tErrors.package.codenameAlreadyExists)` error; archived plan rejection returns `NotFoundError("PACKAGE_PLAN", tErrors.package.planArchived(id))`. **R2 SE Note:** Service calls `requirePermission(actorUserId, AppPermission.ACCOUNTING_PAYMENTS_MANAGE, tErrors)` at the top of write ops (mirrors `CreditService.recordPurchase` line 153); `listActive` requires no permission (admin auto-fill dropdown — caller already authorized)
  - [ ] 3.2 Edit `backend/services/billing/credit.service.ts` — add `recordHourPurchase(actorUserId, input, idempotencyKey, tx, tErrors)` (internal — does NOT call `requirePermission`, does NOT wrap in `db.transaction`; caller owns the tx; mirrors `recordPurchaseIfMissing` return-existing-on-dup pattern NOT `recordPurchase` throw-on-dup), `deductHoursForBooking(studentId, classInstanceId, hours, creditedByUserId, idempotencyKey, tx, tErrors, locale?)` (mirrors existing `deductForBooking` — pre-checks `current.creditHoursRemaining >= hours`, throws `ConflictError(tErrors.credit.insufficientHours({studentId, remaining, required}))` on insufficient — see `credit.service.ts` line 250-252 for the existing class-balance pre-check pattern), `refundHoursOnCancel`, `getStudentHourBalance`. **R2 SE Note:** Refactor `runIdempotentBookingLedgerOp` to accept either `deltaClasses` OR `deltaHours` (one non-null per the XOR constraint enforced by the DB CHECK); do NOT modify existing `recordPurchase`/`deductForBooking`/`refundOnCancel`/`getStudentBalance`. The new methods are dead code in v1 (no caller until Plan 6) — unit-tested only
  - [ ] 3.3 Create `backend/services/billing/accounting-payment.service.ts` — `recordPayment` (orchestrates invoice + payment + credit_transactions + student balance in single `db.transaction(async tx => { ... })`; acquires `acquireAdvisoryLock(tx, \`student_\${studentId}\`)` INSIDE the tx BEFORE any balance-affecting op per EC-13; idempotency check INSIDE the tx — duplicates RETURN the existing row per US-2.1 AC#4 — follows `recordPurchaseIfMissing` pattern NOT `recordPurchase` throw-on-dup pattern; re-validates student + package plan `active=true` INSIDE the tx per EC-2), `togglePaidStatus` (acquires `acquireAdvisoryLock(tx, \`invoice_\${invoiceId}\`)` per EC-14 BEFORE reading invoice; handles invoice status cascade via `findPaidSiblingsByInvoice` + respects `accounting_paid_toggle_auto_flips_invoice` system setting read INSIDE the tx via `SystemSettingsService.getSettingByKey(key, tx)`; accepts `expectedInvoiceVersion?` for optimistic lock), `update` (gateway/note-only edits = single-statement UPDATE, no tx; creditHours change = `db.transaction` with `acquireAdvisoryLock(tx, \`student_\${studentId}\`)` per EC-15; creditHours delta inserts ADJUSTMENT ledger row, decrease rejected with `ConflictError(tErrors.credit.insufficientHours)` if balance would go negative), `getById`, `listPaginated`, `getStudentBalance` (last three use `assertAssociatedOrManage` for IDOR on student-scoped variants)
  - [ ] 3.4 Edit `backend/services/billing/permission-utils.ts` — `assertAssociatedOrManage` already supports student-scoped queries; document the new `ACCOUNTING_PAYMENTS_VIEW`/`ACCOUNTING_PAYMENTS_MANAGE` permission usage in JSDoc; no code changes needed if helper is generic
  - [ ] 3.5 Edit `backend/services/billing/index.ts` — re-export `PackagePlanService` + `AccountingPaymentService`
  - [ ] 3.6 **Quality Loop**: Per-file verification on all new/edited service files. **R2 SE critical checks:**
    - `AccountingPaymentService.recordPayment` wraps EVERYTHING in `db.transaction(async tx => { ... })`; no repo writes outside the tx; all repo calls pass `tx`
    - Idempotency key is deterministic SHA-256; idempotency check is INSIDE the tx (eliminates TOCTOU race — matches `CreditService.recordPurchaseIfMissing` pattern at line 117); duplicate returns existing row (NOT throws `ConflictError` — diverges from `recordPurchase` throw-on-dup pattern at line 170)
    - `togglePaidStatus` OFF path checks `findPaidSiblingsByInvoice` BEFORE flipping invoice to UNPAID; acquires `acquireAdvisoryLock(tx, invoice_${invoiceId})` BEFORE reading invoice (mirrors `BillingRepository.acquireInvoiceLock`)
    - `update` creditHours-change path acquires `acquireAdvisoryLock(tx, student_${studentId})` BEFORE balance mutation
    - All error throws use typed error classes: `NotFoundError("ENTITY", tErrors.x)`, `ValidationError(tErrors.x)`, `ConflictError(tErrors.x)` — NEVER plain `Error(...)` for domain errors
    - Service `requirePermission(actorUserId, AppPermission.XXX, tErrors)` at the top of write ops (defense in depth — GraphQL resolver ALSO checks via `PermissionsService.hasPermission`)
  - [ ] 3.7 **Instruction Verification**: Verify against:
    - AGENTS.md: `AGENTS.md`, `backend/services/AGENTS.md`
    - Instructions: `.agents/instructions/backend.instructions.md`

---

## Phase 4: GraphQL Layer

- [ ] **4. Pothos types + queries + mutations + codegen (3 files, NOT 1)**
  - [ ] 4.1 Create `backend/graphql/pothos/billing/accounting.pothos.ts` — **OBJECT TYPES + INPUT TYPES ONLY** (NOT queries/mutations). Define `PackagePlan` + `AccountingPayment` + `AccountingPaymentBalance` object types + all input types (`AccountingPaymentFilterInput`, `PackagePlanInput`, `PackagePlanUpdateInput`, `AccountingPaymentInput`, `AccountingPaymentTogglePaidInput`, `AccountingPaymentUpdateInput`). **R2 SE PATTERN (mandatory):** Use `gqlSchemaBuilder.objectRef<ReturnType>("Name").implement({ fields: t => ({...}) })` for objects and `gqlSchemaBuilder.inputRef<SubmitInput>("Name").implement({ fields: t => ({...}) })` for inputs. Numeric fields are `t.exposeString` (Drizzle returns `numeric` as string). `version` + `expectedInvoiceVersion` are `t.int({ required: ... })` for optimistic lock. PATTERN COMPLIANCE: existing pothos files like `credit.pothos.ts` contain ONLY types — queries live in `backend/graphql/query/billing/<name>.query.ts` and mutations in `backend/graphql/mutation/billing/<name>.mutation.ts` (see `backend/graphql/query/billing/credit.query.ts` + `backend/graphql/mutation/billing/credit.mutation.ts` for reference). Do NOT mix types + queries + mutations in one file.
  - [ ] 4.2 Create `backend/graphql/pothos/billing/__shared__/packagePlanFieldHelpers.ts` — `packagePlanFields(t)` shared field map for `PackagePlan` (mirror existing `__shared__/creditFieldHelpers.ts` + `__shared__/paymentFieldHelpers.ts` pattern). Enables field reuse in detail/list/nested-resolver contexts.
  - [ ] 4.3 Create `backend/graphql/query/billing/accounting.query.ts` — **QUERIES ONLY** via `gqlSchemaBuilder.queryField("name", t => t.field({ ... }))` (singular form — see `credit.query.ts` line 12). Define `packagePlans(activeOnly: Boolean)` → `[PackagePlan!]!`, `packagePlan(id: ID!)` → `PackagePlan`, `accountingPayments(filter: AccountingPaymentFilterInput, pagination: PaginationInput)` → `[AccountingPayment!]!`, `accountingPayment(id: ID!)` → `AccountingPayment`, `studentCreditHourBalance(studentId: ID!)` → `AccountingPaymentBalance!`. **R2 SE PATTERN (mandatory per `credit.query.ts`):** Each query uses `authScopes: { loggedIn: true }` (basic auth) + `const actorUserId = await requireAuth(ctx);` + manual `await PermissionsService.hasPermission(actorUserId, AppPermission.XXX)` check inside resolver (throw `Error(tErrors.insufficientPermissions)` if missing) + service call. Do NOT use `authScopes: { permission: AppPermission.XXX }` as sole gate — that pattern is only in `permission-management.pothos.ts`, not billing.
  - [ ] 4.4 Create `backend/graphql/mutation/billing/accounting.mutation.ts` — **MUTATIONS ONLY** via `gqlSchemaBuilder.mutationField("name", t => t.field({ ... }))` (singular form — see `credit.mutation.ts` line 7). Define `createPackagePlan(input: PackagePlanInput!)` → `PackagePlan!`, `updatePackagePlan(input: PackagePlanUpdateInput!)` → `PackagePlan!`, `archivePackagePlan(id: ID!)` → `PackagePlan!`, `recordAccountingPayment(input: AccountingPaymentInput!)` → `AccountingPayment!`, `updateAccountingPayment(input: AccountingPaymentUpdateInput!)` → `AccountingPayment!`, `toggleAccountingPaymentPaidStatus(input: AccountingPaymentTogglePaidInput!)` → `AccountingPayment!`. **R2 SE PATTERN (mandatory per `credit.mutation.ts`):** Each mutation uses `authScopes: { loggedIn: true }` + `await requireAuth(ctx)` + manual `PermissionsService.hasPermission` check + service call (matches `credit.mutation.ts` lines 17-34 EXACTLY). Every mutation returns the created/updated entity (NOT a boolean) — matches existing `recordCreditPurchase` mutation returning `CreditPurchaseResultPothosObject`.
  - [ ] 4.5 Edit `backend/graphql/pothos/billing/index.ts` — add `export * from "./accounting.pothos";`
  - [ ] 4.6 Edit `backend/graphql/query/billing/index.ts` — add `export * from "./accounting.query";`
  - [ ] 4.7 Edit `backend/graphql/mutation/billing/index.ts` — add `export * from "./accounting.mutation";`
  - [ ] 4.8 Run `bun run generate:gqlSchema && bun run codegen` — regenerate GraphQL schema + typed hooks into `frontend/common/graphql/generated/gql/`
  - [ ] 4.9 Verify generated schema includes new types/queries/mutations by inspecting `schema.graphql`
  - [ ] 4.10 **Quality Loop**: Per-file verification on all new GraphQL files. **R2 SE critical checks:**
    - 3 separate files (pothos types, query, mutation) — NOT one combined file
    - All mutations return the entity (NOT `Boolean`)
    - `authScopes: { loggedIn: true }` (NOT `{ permission: ... }` as sole gate)
    - `PermissionsService.hasPermission` check inside resolver (defense in depth with service-layer `requirePermission`)
  - [ ] 4.11 **Instruction Verification**: Verify against:
    - AGENTS.md: `AGENTS.md`, `backend/graphql/AGENTS.md`, `backend/graphql/pothos/AGENTS.md`, `backend/graphql/query/AGENTS.md`, `backend/graphql/mutation/AGENTS.md`
    - Instructions: `.agents/instructions/backend.instructions.md`

---

## Phase 5: i18n Namespace

- [ ] **5. Accounting locale namespace (EN + AR)**
  - [ ] 5.1 Create `shared/locale/types/dashboard/accounting/payments.ts` — TypeScript label interface for payments DataGrid + Add Payment form (filter bar labels, column headers, paid toggle labels, empty state, validation errors). Include a `gateways` record keyed by `PaymentGateway` enum value (NONE/PAYPAL/WESTERN_UNION/BANK/OTHER) — keep all accounting labels co-located, NOT in `shared/locale/types/ui/`
  - [ ] 5.2 Create `shared/locale/types/dashboard/accounting/package-plans.ts` — TypeScript label interface for package catalog (form labels; validation errors stay in `errors/index.ts` PackageErrors interface)
  - [ ] 5.3 Create `shared/locale/types/dashboard/accounting/student-credit-hours.ts` — TypeScript label interface for student credit-hours tab (balance card, recent purchases, low-balance alert)
  - [ ] 5.4 Create `shared/locale/types/dashboard/accounting/index.ts` — barrel re-export: `export * from "./payments"; export * from "./package-plans"; export * from "./student-credit-hours";`
  - [ ] 5.5 Edit `shared/locale/types/index.ts` — add `export * from "./dashboard/accounting";` (NOTE: there is NO `shared/locale/types/dashboard/index.ts` file — the dashboard namespace barrel is `shared/locale/types/index.ts` itself)
  - [ ] 5.6 Edit `shared/locale/types/dashboard/core/nav.ts` — add `navGroupAccounting`, `accountingPayments`, `accountingPackages` fields to `DashboardNavigationLabels` (PATTERN COMPLIANCE: navigation labels live in `core/nav.ts`, NOT under `accounting/`)
  - [ ] 5.7 Create `shared/locale/en/dashboard/accounting/payments.json` + `package-plans.json` + `student-credit-hours.json` — EN implementations (RTL-safe; LTR for currency symbols). Also add `navGroupAccounting`/`accountingPayments`/`accountingPackages` to `shared/locale/en/dashboard/core/nav.json`
  - [ ] 5.8 Create `shared/locale/ar/dashboard/accounting/payments.json` + `package-plans.json` + `student-credit-hours.json` — AR implementations (RTL strings, LTR currency codes). Also add nav labels to `shared/locale/ar/dashboard/core/nav.json`
  - [ ] 5.9 Edit `shared/locale/types/errors/index.ts` + EN/AR implementations: extend existing `CreditErrors` interface with `insufficientHours: (params: { studentId: string; remaining: number }) => string`; add NEW `PackageErrors` interface with `codenameAlreadyExists`, `invalidInput`, `planArchived`; add `readonly package: PackageErrors;` property to `ErrorsLabels`. (Note: there is NO existing `package.*` error namespace — this is a new addition.)
  - [ ] 5.10 Run `bun run locale:snapshots` (script name is `locale:snapshots` plural, per `package.json`) — regenerate locale snapshots under `public/static/locale-snapshots/{en,ar}/dashboard.accounting.*.json`
  - [ ] 5.11 Verify snapshots exist for both `en` and `ar` for all 3 accounting namespaces + nav labels
  - [ ] 5.12 **Quality Loop**: Per-file verification on all new locale files
  - [ ] 5.13 **Instruction Verification**: Verify against:
    - AGENTS.md: `shared/AGENTS.md`
    - (No specific instructions file for shared/locale)

---

## Phase 6: Frontend GraphQL Documents & Hooks

- [ ] **6. Frontend GraphQL documents + codegen hooks**
  - [ ] 6.1 Create `frontend/common/graphql/sharedDocuments/accounting/accounting.documents.ts` — typed Apollo documents for all queries + mutations defined in Phase 4. PATTERN COMPLIANCE: per `frontend/common/graphql/AGENTS.md`, each domain has its own directory + `index.ts` barrel. Import `gql` + `TypedDocumentNode` from `@apollo/client` (NOT `@apollo/client/react`). Use generated types from `@/frontend/common/graphql/generated/gql/`. Document names follow `<operationName>QueryDocument`/`<operationName>MutationDocument` convention. Every selection set MUST include `id` field.
  - [ ] 6.2 Create `frontend/common/graphql/sharedDocuments/accounting/index.ts` — barrel: `export * from "./accounting.documents";`
  - [ ] 6.3 Edit `frontend/common/graphql/sharedDocuments/index.ts` — add `export * from "./accounting";` alongside existing `export * from "./billing";`
  - [ ] 6.4 Verify codegen-generated hooks exist in `frontend/common/graphql/generated/gql/` (after Phase 4 codegen run): `usePackagePlansQuery`, `usePackagePlanQuery`, `useCreatePackagePlanMutation`, `useUpdatePackagePlanMutation`, `useArchivePackagePlanMutation`, `useAccountingPaymentsQuery`, `useAccountingPaymentQuery`, `useRecordAccountingPaymentMutation`, `useUpdateAccountingPaymentMutation`, `useToggleAccountingPaymentPaidStatusMutation`, `useStudentCreditHourBalanceQuery`. These are AUTO-GENERATED by `graphql-codegen` — NOT hand-authored.
  - [ ] 6.5 Run `bun run codegen` if not already run in Phase 4
  - [ ] 6.6 **Quality Loop**: Per-file verification on all new frontend GraphQL files
  - [ ] 6.7 **Instruction Verification**: Verify against:
    - AGENTS.md: `frontend/common/graphql/AGENTS.md`, `frontend/common/stores/AGENTS.md`, `frontend/AGENTS.md`
    - Instructions: `.agents/instructions/frontend.instructions.md`

---

## Phase 7: Navigation & Routing

- [ ] **7. Navigation config + route scaffolding**
  - [ ] 7.1 Edit `frontend/common/views/dashboard/config/navigationConfig.ts` — add `grp_accounting` group (sibling of existing `grp_finance` — note: the existing group is `grp_finance`, NOT `grp_accounting` or `grp_billing`); add nav items: `payments`, `payments-new`, `packages`, `packages-new`; add `PAGE_PERMISSIONS.accountingPaymentsView = [AppPermission.ACCOUNTING_PAYMENTS_VIEW] as PagePermissions` + `PAGE_PERMISSIONS.accountingPaymentsManage = [AppPermission.ACCOUNTING_PAYMENTS_MANAGE] as PagePermissions` to `frontend/common/types/page-permissions.types.ts`; add `accounting-payments` to `BOTTOM_NAV_ITEMS` for STAFF+
  - [ ] 7.2 Edit `frontend/common/views/dashboard/config/mockNavigationConfig.ts` — add mock entries mirroring production config (for tests/storybook)
  - [ ] 7.3 Edit `frontend/common/views/dashboard/config/navIconKeys.ts` + `navIconRegistry.tsx` — add `packages` icon (e.g., `Inventory2Outlined` or `CardGiftcardOutlined`); `payments` icon already exists in `navIconKeys.ts` (line 34 of `navIconRegistry.tsx`)
  - [ ] 7.4 Create route files under `app/(dashboard)/accounting/`:
    - `payments/page.tsx` (list)
    - `payments/new/page.tsx` (form)
    - `payments/[id]/page.tsx` (detail)
    - `payments/[id]/edit/page.tsx` (edit)
    - `packages/page.tsx` (catalog)
    - `packages/new/page.tsx` (form)
    - `packages/[id]/edit/page.tsx` (edit)
  - [ ] 7.5 Each route page checks permission and renders the appropriate desktop/mobile view based on viewport
  - [ ] 7.6 Edit `frontend/common/views/dashboard/students/profile/studentProfileTabs.ts` — add `"credit-hours"` to `STUDENT_PROFILE_TABS` array + define `CREDIT_HOURS_TAB_GROUPS` mapping (alongside existing `quota` tab). New component `frontend/common/views/dashboard/students/profile/StudentCreditHoursTab.tsx` (no `tabs/` subdirectory; the existing `sections/` directory holds section components like `StudentAdminSection.tsx`)
  - [ ] 7.7 **Quality Loop**: Per-file verification on all new route + nav config files
  - [ ] 7.8 **Instruction Verification**: Verify against:
    - AGENTS.md: `app/AGENTS.md`, `frontend/common/views/AGENTS.md`, `frontend/AGENTS.md`
    - Instructions: `.agents/instructions/frontend.instructions.md`, `.agents/instructions/mobile-desktop.instructions.md`

---

## Phase 8: Frontend Views — Payments Module

- [ ] **8. Payments list + form + detail views (desktop + mobile + shared ViewModels)**
  - [ ] 8.1 Create `frontend/common/views/dashboard/accounting/usePaymentsListViewModel.ts` — filter state (studentId, parentId, fromDate, toDate, unpaidOnly), pagination state, query wiring via `useAccountingPaymentsQuery`. PATTERN COMPLIANCE: existing ViewModels are `useXxxViewModel.ts` hooks located directly under `frontend/common/views/dashboard/<domain>/` (e.g. `useQuotaFormViewModel.ts`). NO `viewmodels/` subdirectory exists.
  - [ ] 8.2 Create `frontend/common/views/dashboard/accounting/usePaymentFormViewModel.ts` — package auto-fill logic (when `packagePlanId` changes, fetch plan via `usePackagePlanQuery` and auto-fill `creditHours`/`amount`/`currency` — fields remain editable), form validation (zod schema), submit handler
  - [ ] 8.3 Create `frontend/common/stores/accountingPaymentsStore.ts` — Zustand store for list filter + pagination state; persist filter across route changes. PATTERN COMPLIANCE: existing stores live FLAT in `frontend/common/stores/` (no subdirectories), named like `adminBillingStore.ts`, `quotaStore.ts`
  - [ ] 8.4 Create desktop view `frontend/desktop/views/dashboard/accounting/PaymentsListView.desktop.tsx` — MUI DataGrid with 9 columns (Student Name, Credit, Paid, Currency, Package, Payment Gateway, Payment Date, Created At, Actions); filter bar above grid; empty state; pagination controls. PATTERN COMPLIANCE: per `frontend/desktop/AGENTS.md`, desktop views live under `frontend/desktop/views/dashboard/<domain>/*.desktop.tsx` (mandatory `dashboard/` segment + `.desktop.tsx` suffix). All MUI components (Typography/Stack/Box) MUST use `sx={{...}}` prop — no v9-style props like `align=` or `mt=`.
  - [ ] 8.5 Create desktop view `frontend/desktop/views/dashboard/accounting/PaymentDetailView.desktop.tsx` — side panel with all payment fields + audit info; "Edit" + "Toggle Paid" action buttons
  - [ ] 8.6 Create desktop view `frontend/desktop/views/dashboard/accounting/PaymentFormView.desktop.tsx` — Add/Edit form; Student select, Package select (active only), Credit/Paid/Currency (auto-filled, editable), Payment Gateway select, Payment Date picker, Paid toggle, Note rich-text field
  - [ ] 8.7 Create mobile views `frontend/mobile/views/dashboard/accounting/PaymentsListView.mobile.tsx` + `PaymentDetailView.mobile.tsx` + `PaymentFormView.mobile.tsx` — card-list layouts, inline stacked form sections (`.mobile.tsx` suffix mandatory per `frontend/mobile/AGENTS.md`)
  - [ ] 8.8 Wire route pages from Phase 7 to render desktop vs mobile based on viewport (using existing `useIsMobile` hook)
  - [ ] 8.9 Add the `?tab=credit-hours` rendering for student profile — component `frontend/common/views/dashboard/students/profile/StudentCreditHoursTab.tsx` reads `useStudentCreditHourBalanceQuery` + last 10 hour-based transactions; per-audience rendering via existing `resolveStudentsPageAudience` helper from `@/app/(dashboard)/lib/resolve-students-page-audience`
  - [ ] 8.10 **Quality Loop**: Per-file verification on all new frontend files. Critical checks:
    - Form uses `useQuery` (not `useLazyQuery`) for package auto-fill
    - All user-facing strings from i18n namespace (no hardcoded strings)
    - Paid toggle disabled while mutation in flight
    - Mobile layouts pass RTL test (Arabic locale)
    - No MUI v9-style props on Typography/Stack/Box (use `sx`)
  - [ ] 8.11 **Instruction Verification**: Verify against:
    - AGENTS.md: `frontend/common/views/AGENTS.md`, `frontend/common/stores/AGENTS.md`, `frontend/desktop/AGENTS.md`, `frontend/mobile/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
    - Instructions: `.agents/instructions/frontend.instructions.md`, `.agents/instructions/mobile-desktop.instructions.md`

---

## Phase 9: Frontend Views — Package Plans Catalog

- [ ] **9. Package Plans CRUD views (desktop + mobile + shared ViewModels)**
  - [ ] 9.1 Create `frontend/common/views/dashboard/accounting/usePackagePlanFormViewModel.ts` — codename uniqueness check (client-side optimistic), optimistic-lock version tracking, form validation
  - [ ] 9.2 Create desktop view `frontend/desktop/views/dashboard/accounting/PackagePlansListView.desktop.tsx` — DataGrid with columns: Codename, Display Name, Credit Hours, Price, Currency, Active, Sort Order, Actions (Edit, Archive)
  - [ ] 9.3 Create desktop view `frontend/desktop/views/dashboard/accounting/PackagePlanFormView.desktop.tsx` — Add/Edit form; all fields; archive action with confirmation dialog
  - [ ] 9.4 Create mobile views `frontend/mobile/views/dashboard/accounting/PackagePlansListView.mobile.tsx` + `PackagePlanFormView.mobile.tsx`
  - [ ] 9.5 Wire route pages from Phase 7 to render desktop vs mobile based on viewport
  - [ ] 9.6 **Quality Loop**: Per-file verification on all new frontend files
  - [ ] 9.7 **Instruction Verification**: Verify against:
    - AGENTS.md: `frontend/common/views/AGENTS.md`, `frontend/desktop/AGENTS.md`, `frontend/mobile/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
    - Instructions: `.agents/instructions/frontend.instructions.md`, `.agents/instructions/mobile-desktop.instructions.md`

---

## Phase 10: Backend Tests

- [ ] **10. Repository + service + workflow tests**
  - [ ] 10.1 Create `backend/db/test/repo/billing/package-plan.repository.test.ts` — `create` + `findByCodename` (case-insensitive), `listActive` excludes archived, `update` optimistic-lock conflict throws `ConflictError(tErrors.studentVersionMismatch)` (NOT generic Error), `archive` soft-delete + codename reuse allowed; all tests use `runInRollback` wrapper; never `expect().rejects.toThrow()` inside `runInRollback` per `backend/db/test/AGENTS.md`
  - [ ] 10.2 Create `backend/db/test/repo/billing/accounting-payment.repository.test.ts` — `create` joins student + package correctly (verify `packageCodename` + `studentName` populated), `listPaginated` filters (student, parent, date range, unpaid-only — all AND combinations via `and()` builder), `findPaidSiblingsByInvoice(invoiceId, excludePaymentId)` returns correct siblings (excludes the queried payment + includes only `isPaidStatusOn=true` ones); `generateIdempotencyKey` is deterministic (same input → same key) AND uses empty string `""` for null `packagePlanId` (per EC-18)
  - [ ] 10.3 Create `backend/db/test/logic/lms/credit-hours-workflow.test.ts` — `recordHourPurchase` bumps `students.creditHoursRemaining` + `creditHoursTotal` correctly (verify atomic SQL increment, not read-modify-write); `deductHoursForBooking` rejects on insufficient balance with `ConflictError(tErrors.credit.insufficientHours({studentId, remaining, required}))` (NOT generic `INSUFFICIENT_HOURS` string — verify the typed payload); `refundHoursOnCancel` idempotent (same idempotency key returns existing row, no duplicate insert); hour + class ledgers coexist without interference (one row with `changeAmount` set + `changeAmountHours` NULL, another with reverse — both pass XOR CHECK); `deductHoursForBooking` with `hours=0` rejected with `ValidationError`; `deductHoursForBooking` with fractional `hours=0.5` succeeds when `creditHoursRemaining >= 0.5`
  - [ ] 10.4 Create `backend/db/test/logic/lms/accounting-payment-workflow.test.ts` — `recordPayment` creates invoice + payment + credit_transaction in one tx (verify all 3 rows exist after commit, FKs reference each other); idempotency: duplicate input returns existing row (NOT throws `ConflictError`); `recordPayment` with package plan archived between form-open and submit rejects with `NotFoundError(tErrors.package.planArchived)` (re-checks `active=true` INSIDE the tx); `recordPayment` with `isPaidStatusOn=true` → invoice `status=PAID`, `paidDate=paymentDate`; `togglePaidStatus` ON → invoice PAID; OFF → invoice UNPAID (when no siblings); OFF with paid sibling → invoice stays PAID; respects `accounting_paid_toggle_auto_flips_invoice=false`; stale `expectedInvoiceVersion` → `ConflictError(tErrors.billing.invoiceVersionMismatch)`; `update` with `paymentNote` change only → NO ADJUSTMENT row inserted, NO balance change; `update` with `creditHours` increase → ADJUSTMENT row with `changeAmountHours=+(new-old)`, balance bumped; `update` with `creditHours` decrease (within balance) → ADJUSTMENT row with `changeAmountHours=-(old-new)`, balance decremented; `update` with `creditHours` decrease past balance → `ConflictError(tErrors.credit.insufficientHours)`; `getStudentBalance` IDOR: caller without `ACCOUNTING_PAYMENTS_VIEW` AND not associated with student → `Error(tErrors.insufficientPermissions)`; `listPaginated` with no student filter (admin view-all) requires `ACCOUNTING_PAYMENTS_VIEW` only
  - [ ] 10.5 Run all tests via `bun test` — all must pass
  - [ ] 10.6 **Quality Loop**: Per-file verification on all new test files
  - [ ] 10.7 **Instruction Verification**: Verify against:
    - AGENTS.md: `backend/db/test/AGENTS.md`, `backend/AGENTS.md`
    - Instructions: `.agents/instructions/backend.instructions.md`, `.agents/instructions/tests.instructions.md`

---

## Phase 11: Frontend Tests

- [ ] **11. UI tests for payments + package plans**
  - [ ] 11.1 Create `test/ui/accounting/payments-list.test.tsx` — renders DataGrid with mock data; filter bar interactions (student select, date range, unpaid toggle); empty state; pagination controls
  - [ ] 11.2 Create `test/ui/accounting/payment-form.test.tsx` — package selection auto-fills Credit/Paid/Currency; submit triggers `recordAccountingPayment` mutation; idempotency: re-submit shows existing row; paid toggle interaction
  - [ ] 11.3 Create `test/ui/accounting/package-plans.test.tsx` — catalog CRUD; codename uniqueness error display; archive action with confirmation
  - [ ] 11.4 Create `test/ui/accounting/student-credit-hours-tab.test.tsx` — renders balance card; renders recent purchases; low-balance alert renders when below threshold
  - [ ] 11.5 Run `bun test` for UI suite — all must pass
  - [ ] 11.6 **Quality Loop**: Per-file verification on all new test files
  - [ ] 11.7 **Instruction Verification**: Verify against:
    - AGENTS.md: `test/ui/AGENTS.md`
    - Instructions: `.agents/instructions/tests.instructions.md`

---

## Phase 12: Notifications (Lightweight)

- [ ] **12. Accounting notification events + builders**
  - [ ] 12.1 Edit `backend/enum/notifications/notificationDeliveries.enum.ts` (or equivalent `NotificationEventType` enum) — add `ACCOUNTING_LOW_HOURS` + `ACCOUNTING_PAYMENT_RECORDED` event types
  - [ ] 12.2 Create `backend/services/notification/accounting-notification.builders.ts` — payload builders for both events; `ACCOUNTING_PAYMENT_RECORDED` delivers to student (+ parent if linked); `ACCOUNTING_LOW_HOURS` delivers to student + parent + admin
  - [ ] 12.3 Edit `backend/services/billing/accounting-payment.service.ts` — call notification dispatch after successful `recordPayment` (non-blocking, fire-and-forget pattern matching existing notification calls)
  - [ ] 12.4 Edit `backend/services/billing/credit.service.ts` — after `deductHoursForBooking`, check if `creditHoursRemaining < accounting_low_hours_threshold` system setting; if so, dispatch `ACCOUNTING_LOW_HOURS`
  - [ ] 12.5 Add notification pref entries (default ON for both events) to the existing notification preferences seed
  - [ ] 12.6 Add EN + AR notification templates to `shared/locale/types/notifications/` + EN/AR implementations
  - [ ] 12.7 **Quality Loop**: Per-file verification on all new/edited notification files
  - [ ] 12.8 **Instruction Verification**: Verify against:
    - AGENTS.md: `backend/services/AGENTS.md`, `backend/enum/AGENTS.md`, `shared/AGENTS.md`
    - Instructions: `.agents/instructions/backend.instructions.md`

---

## Phase 13: Quality Gate

- [ ] **13. Global health check + end-to-end verification**
  - [ ] 13.1 Run global type check: `bun tsgo` — must exit 0
  - [ ] 13.2 Run global lint: `bun biome:check` — must exit 0
  - [ ] 13.3 Run global lint queue: `bun run lint` — must exit 0
  - [ ] 13.4 Run full backend test suite: `bun test backend/` — all tests pass
  - [ ] 13.5 Run full UI test suite: `bun test test/ui/` — all tests pass
  - [ ] 13.6 Manual smoke test (documented in outcome file):
    - Create a package plan via `/accounting/packages/new`
    - Record an accounting payment via `/accounting/payments/new` for a student
    - Verify student's `creditHoursRemaining` bumped
    - Toggle Paid OFF → verify invoice status flipped to UNPAID
    - Toggle Paid ON → verify invoice status flipped back to PAID
    - Filter payments by Student, Parent, Date range, Unpaid only — verify AND combinations
    - View student credit-hours tab — verify balance + recent purchases
  - [ ] 13.7 Verify RTL rendering by switching locale to `ar` — Add Payment form fields render right-to-left; currency symbols stay LTR
  - [ ] 13.8 Verify permission isolation: a user without `ACCOUNTING_PAYMENTS_VIEW` cannot see the Accounting sidebar group; GraphQL queries return `ForbiddenError`
  - [ ] 13.9 Verify backward compatibility: existing `/billing`, `/invoices`, `/quotas` flows continue to work unchanged; existing `credit_transactions` rows pass the new XOR CHECK constraint (no migration errors)
  - [ ] 13.10 Write outcome file `.ai/plans/student-credit-hours-system/outcome/13-quality-gate-outcome.md` documenting all verification results + any deferred items

---

## Phase 14: Knowledge Propagation

- [ ] **14. Knowledge propagation + canonical documentation**
  - [ ] 14.1 Create canonical reference doc `docs/billing/credit-hours-system.md` — architecture overview, data model, service layer, GraphQL API, frontend structure, testing approach, migration path
  - [ ] 14.2 Update `docs/billing/quota-system.md` (existing) — add cross-reference to the credit-hours system doc + note the parallel-ledger relationship
  - [ ] 14.3 Update layer AGENTS.md files with new rules/patterns:
    - `backend/db/schema/AGENTS.md` — XOR CHECK constraint pattern for parallel ledgers
    - `backend/db/repo/AGENTS.md` — snapshot-on-purchase pattern for package plans
    - `backend/services/AGENTS.md` — single-orchestrator service pattern (`AccountingPaymentService`)
    - `backend/graphql/AGENTS.md` — new query/mutation registration pattern
    - `backend/types/AGENTS.md` — hour-based type variants alongside existing class-based types
    - `backend/enum/AGENTS.md` — enum extension pattern (adding values to existing pgEnum)
    - `frontend/common/graphql/AGENTS.md` — new sharedDocuments file convention
    - `frontend/common/views/AGENTS.md` — ViewModel pattern for accounting forms
    - `frontend/AGENTS.md` — accounting route group + permission matrix
  - [ ] 14.4 Update `.agents/skills/drizzle/SKILL.md` — add XOR CHECK constraint example + partial unique index example
  - [ ] 14.5 Update `.agents/skills/review-frontend/SKILL.md` (exists — the plan originally referenced `.agents/skills/frontend-patterns/SKILL.md` which does NOT exist) — add accounting form auto-fill pattern. (Also consider creating a dedicated `.agents/skills/frontend-patterns/SKILL.md` if the team prefers a separate skill — confirm with codebase owner first)
  - [ ] 14.6 Update `.agents/instructions/backend.instructions.md` — note the new accounting permissions + service orchestrator pattern
  - [ ] 14.7 Update `.agents/instructions/frontend.instructions.md` — note the new accounting route group + i18n namespace
  - [ ] 14.8 Update root `AGENTS.md` Important References section — add link to `docs/billing/credit-hours-system.md` + the new `.ai/plans/student-credit-hours-system/` plan directory
  - [ ] 14.9 Run final global health check: `bun tsgo && bun biome:check && bun run lint` — must exit 0
  - [ ] 14.10 Write outcome file `.ai/plans/student-credit-hours-system/outcome/14-knowledge-propagation-outcome.md` documenting all propagation steps + final health check result

---

## Summary

| Phase | Task | Effort |
|-------|------|--------|
| 1 | Schema, enums, permissions | High |
| 2 | Types + repositories | High |
| 3 | Services (3 services) | High |
| 4 | GraphQL types/queries/mutations | Medium |
| 5 | i18n namespace (EN + AR) | Medium |
| 6 | Frontend GraphQL documents + hooks | Low |
| 7 | Navigation + route scaffolding | Medium |
| 8 | Payments views (desktop + mobile) | High |
| 9 | Package plans views | Medium |
| 10 | Backend tests | High |
| 11 | Frontend tests | Medium |
| 12 | Notifications | Low |
| 13 | Quality gate | Medium |
| 14 | Knowledge propagation | Medium |

**Estimated total effort**: ~14 working days for a single full-stack agent; ~7 days with two agents (backend + frontend parallelized after Phase 4).

## Dependencies

- Phase 2 depends on Phase 1
- Phase 3 depends on Phase 2
- Phase 4 depends on Phase 3
- Phase 5 can start in parallel with Phase 4
- Phase 6 depends on Phase 4
- Phase 7 depends on Phase 5 + Phase 6
- Phase 8 depends on Phase 7
- Phase 9 depends on Phase 7
- Phase 10 depends on Phase 3
- Phase 11 depends on Phase 8 + Phase 9
- Phase 12 depends on Phase 3
- Phase 13 depends on all prior phases
- Phase 14 depends on Phase 13

## Deferred Items (Not in This Plan)

- `student.billingMode` discriminator (CLASS_BASED / HOUR_BASED / MIXED) — Future Epic 6; would drive automatic billing-path selection at scheduling time
- Package plan → quota bridge (auto-creating a `quotas` row with `totalHours` on package purchase) — deferred until quotas table natively supports hours
- Bulk payment import — single-payment insert only in v1
- Multi-currency hour balances — single numeric balance; currency is informational on payment row
- Hour-refund proration policy — v1 uses free-form admin-note refunds
