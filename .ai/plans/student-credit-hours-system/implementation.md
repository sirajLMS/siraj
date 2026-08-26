# Student Credit-Hours System — Implementation Guide

## Document Information

- **Feature Name**: Credit-Hours Payments Module (Accounting extension on top of existing credit + quota ledgers)
- **Version**: 1.0
- **Date**: 2026-08-12
- **Related Documents**:
  - [Design Specifications](./specs.md)
  - [Trackable Tasks](./trackable-tasks.md)
- **Outcome Directory**: `.ai/plans/student-credit-hours-system/outcome/` — all task outcomes, research findings, and knowledge artifacts

## Pre-Implementation Checklist

Before starting any task in [trackable-tasks.md](./trackable-tasks.md):

- [ ] Read root `AGENTS.md` at `/home/z/my-project/siraj-clone/AGENTS.md`
- [ ] Read layer-specific AGENTS.md for each file you touch (see Task-to-Instructions Mapping below)
- [ ] Read applicable `.agents/instructions/*.instructions.md` files
- [ ] Read [specs.md](./specs.md) for the design decisions that govern your task
- [ ] **Read ALL existing files in `.ai/plans/student-credit-hours-system/outcome/`** to absorb prior research, pitfalls, and learnings
- [ ] Mark the task `[-]` in trackable-tasks.md when starting
- [ ] Mark the task `[x]` when complete and verified
- [ ] Run per-file verification loop before importing new code elsewhere
- [ ] **MANDATORY: After quality loop, run instruction verification subtask to revalidate files against instruction files**
- [ ] **MANDATORY: Every task includes Quality Loop subtask (tsgo + biome:check + lint queue)**
- [ ] **MANDATORY: Every task includes Instruction Verification subtask with absolute AGENTS.md/instructions paths**
- [ ] **MANDATORY: After completing a task, write outcome file to `.ai/plans/student-credit-hours-system/outcome/<task-id>-outcome.md`**

## User Experience & Navigation (from specs.md)

### New Routes & Permissions

| Route | Permission | Roles |
|-------|-----------|-------|
| `/accounting/payments` | `ACCOUNTING_PAYMENTS_VIEW` | super_admin, academy_admin, staff_default |
| `/accounting/payments/new` | `ACCOUNTING_PAYMENTS_MANAGE` | super_admin, academy_admin |
| `/accounting/payments/[id]` | `ACCOUNTING_PAYMENTS_VIEW` | super_admin, academy_admin, staff_default |
| `/accounting/payments/[id]/edit` | `ACCOUNTING_PAYMENTS_MANAGE` | super_admin, academy_admin |
| `/accounting/packages` | `ACCOUNTING_PAYMENTS_VIEW` | super_admin, academy_admin, staff_default |
| `/accounting/packages/new` | `ACCOUNTING_PAYMENTS_MANAGE` | super_admin, academy_admin |
| `/accounting/packages/[id]/edit` | `ACCOUNTING_PAYMENTS_MANAGE` | super_admin, academy_admin |
| `/students/[id]/profile?tab=credit-hours` | `STUDENT_EDIT_QUOTA` + `ACCOUNTING_PAYMENTS_VIEW` | ALL audiences |

### Sidebar Navigation

A **new sidebar group `grp_accounting`** (sibling of `grp_finance`) hosts all Accounting items:

```
grp_accounting (Accounting)
  ├── Payments   (/accounting/payments)
  │   ├── List   (/accounting/payments)
  │   ├── New    (/accounting/payments/new)
  │   ├── View   (/accounting/payments/[id])
  │   └── Edit   (/accounting/payments/[id]/edit)
  └── Packages   (/accounting/packages)
      ├── New    (/accounting/packages/new)
      └── Edit   (/accounting/packages/[id]/edit)
```

Mobile bottom nav: add `accounting-payments` to `BOTTOM_NAV_ITEMS` for STAFF+ roles only.

### Student Credit-Hours Tab

New tab `?tab=credit-hours` on `/students/[id]/profile` renders role-specific content (student, parent, teacher, supervisor). Reuses the existing student profile tab infrastructure — registered alongside the existing `?tab=quota`.

### Mobile vs Desktop

Separate view trees under `frontend/desktop/` and `frontend/mobile/` with shared ViewModels and navigation config — mirrors the Quota plan's split.

### Permission Matrix

| Permission | Value | Granted To (via groups) |
|------------|-------|--------------------------|
| `ACCOUNTING_PAYMENTS_VIEW` | `accounting.payments_view` | `super_admin`, `academy_admin`, `staff_default` |
| `ACCOUNTING_PAYMENTS_MANAGE` | `accounting.payments_manage` | `super_admin`, `academy_admin` |

## Outcome & Knowledge Transfer Protocol (`.ai/plans/student-credit-hours-system/outcome/`)

### BEFORE Execution

Executing agents MUST read ALL existing files in `.ai/plans/student-credit-hours-system/outcome/` to avoid re-analysis.

### AFTER Execution

Executing agents MUST write `.ai/plans/student-credit-hours-system/outcome/<task-id>-outcome.md` containing:
- Research findings and any web/documentation lookups
- Implementation details and decisions made
- Pitfalls encountered and how they were resolved
- Carry-over points for future subtasks

### PROGRESS TRACKING

Executing agents MUST update task checkboxes `[ ]` → `[x]` in `trackable-tasks.md` upon completing each subtask. Parent tasks are marked `[-]` when in progress, `[x]` only when ALL sub-tasks are `[x]`.

### Knowledge Propagation (Final Task)

After all implementation tasks complete, task 14 consolidates all outcome learnings into the project's permanent knowledge base:
1. Create canonical reference doc under `docs/billing/credit-hours-system.md`
2. Update layer AGENTS.md files with new rules/patterns
3. Update `.agents/skills/drizzle/SKILL.md` (exists) and `.agents/skills/review-frontend/SKILL.md` (exists — the plan originally referenced `.agents/skills/frontend-patterns/SKILL.md`, which does NOT exist in this repo)
4. Update `.agents/instructions/backend.instructions.md` and `.agents/instructions/frontend.instructions.md`
5. Update root `AGENTS.md` Important References section
6. Run global health check: `bun tsgo && bun biome:check && bun run lint`
7. Write outcome file: `.ai/plans/student-credit-hours-system/outcome/14-knowledge-propagation-outcome.md`

## Task-to-Instructions Mapping

| Task Path Prefix | Applicable AGENTS.md Files | Applicable .agents/instructions Files |
|-----------------|----------------------------|----------------------------------------|
| `backend/db/schema/**` | `backend/db/schema/AGENTS.md`, `backend/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| `backend/db/repo/**` | `backend/db/repo/AGENTS.md`, `backend/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| `backend/db/test/**` | `backend/db/test/AGENTS.md`, `backend/AGENTS.md` | `.agents/instructions/backend.instructions.md`, `.agents/instructions/tests.instructions.md` |
| `backend/services/**` | `backend/services/AGENTS.md`, `backend/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| `backend/graphql/**` | `backend/graphql/AGENTS.md`, `backend/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| `backend/types/**` | `backend/types/AGENTS.md`, `backend/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| `backend/enum/**` | `backend/enum/AGENTS.md`, `backend/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| `scripts/**` | `scripts/run-test/AGENTS.md` | `.agents/instructions/backend.instructions.md`, `.agents/instructions/tests.instructions.md` (if DB ops) |
| `shared/locale/**` | `shared/AGENTS.md` | (none specific) |
| `app/**` | `app/AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| `frontend/common/**` | `frontend/common/views/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `frontend/common/stores/AGENTS.md`, `frontend/AGENTS.md` | `.agents/instructions/frontend.instructions.md` |
| `frontend/desktop/**` | `frontend/desktop/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md` | `.agents/instructions/frontend.instructions.md`, `.agents/instructions/mobile-desktop.instructions.md` |
| `frontend/mobile/**` | `frontend/mobile/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md` | `.agents/instructions/frontend.instructions.md`, `.agents/instructions/mobile-desktop.instructions.md` |
| `test/ui/**` | `test/ui/AGENTS.md` | `.agents/instructions/tests.instructions.md` |

**Note:** A file may match multiple prefixes — read ALL matching instruction files.

## Implementation Strategy

Build bottom-up in dependency order:

1. **Schema & enums** → types → repositories → services → GraphQL
2. **PackagePlanService** before AccountingPaymentService
3. **CreditService hour-extension** before any hour booking integration
4. **Frontend GraphQL docs + codegen** before any frontend views
5. **Frontend views** after i18n namespace exists
6. **Quality loop per file** as primary verification

### Development Conventions (from AGENTS.md)

- Runtime: **Bun** (not Node.js)
- Logging: `logger` from `@/backend/lib/logger` (backend) or `@/frontend/utils/logger` (frontend) — never `console.*`
- Path aliases: `@/*` maps to project root — no relative imports across layers
- i18n: compile-time system in `shared/locale/` — never hardcode user-facing strings
- GraphQL documents: `frontend/common/graphql/sharedDocuments/<domain>.documents.ts`
- GraphQL hooks: import from `@apollo/client/react` — **NO `useLazyQuery`**
- Database tests: always use `runInRollback` wrapper; never `expect().rejects.toThrow()` inside it
- After schema changes: `bun run generate:gqlSchema && bun codegen`
- After DB schema: `bun run db push` (no migrate for new tables during dev)

### Drizzle Schema Convention (CRITICAL)

- **Schema changes** (new tables, columns, indexes): Use `bun run db push` — creates schema automatically
- **Custom SQL migrations** (seed data, complex transforms, NOT NULL → NULL relaxations): Use `bun run db migrate` — for non-Drizzle SQL only

### Per-File Quality Loop (MANDATORY)

```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:4777/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify","files":["<the-file>"]}'
```

**Fix all errors before proceeding to next file/subtask.**

### Instruction Verification (MANDATORY after Quality Loop)

After quality loop passes, validate the file against ALL applicable AGENTS.md and `.agents/instructions` files from the Task-to-Instructions Mapping table above.

---

## Phase 1: Database Schema & Enums

### 1.1 New schema file: `backend/db/schema/billing/package-plans.ts`

> **SE Pattern Compliance (R2):**
> - `uuidColumn("id")` already applies `.defaultRandom().primaryKey()` inside the helper (see `dialectAwareBuilder.ts` lines 97-105). Do NOT chain those calls — they are not exposed on the return type.
> - `numericColumn(name, { precision, scale })` is the dialect-aware helper for decimal/numeric columns. On PG it produces `numeric(p, s)` (returned as `string`); on SQLite it stores as `text` to preserve precision (mirrors the existing `students.hoursPerWeek` + `payments.amount` pattern). `textColumn(name)` does NOT accept precision/scale options — using it for monetary amounts with options is a TypeScript error.
> - `checkConstraint(name, pgSql, sqliteSql)` is the dialect-aware CHECK helper. `check(name, sql)` from `drizzle-orm` is PG-only and silently no-ops on SQLite (the existing codebase NEVER uses raw `check(...)` — verified via grep). Pass `null` for `sqliteSql` when SQLite cannot enforce the predicate (e.g. PG-only UDFs).
> - CHECK constraints on `numericColumn` values must use raw SQL comparison operators that work on both `numeric` (PG) and `text` (SQLite). For SQLite, the comparison uses lexicographic ordering — for non-negative numbers stored in fixed-precision form (e.g. `"0.00"`, `"12.50"`), the comparison works correctly because all values share the same scale. For mixed-scale values, prefer a service-layer validation in addition to the DB CHECK.

```typescript
import { sql } from "drizzle-orm";
import {
  booleanColumn,
  checkConstraint,
  createTable,
  index,
  integerColumn,
  jsonbColumn,
  numericColumn,
  textColumn,
  timestampColumn,
  uniqueIndex,
  uuidColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { currencyCodeEnum } from "@/backend/db/schema/enums";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

export const packagePlans = createTable(
  "package_plans",
  {
    id: uuidColumn("id"), // helper already applies .defaultRandom().primaryKey()
    codename: varcharColumn("codename", { length: 50 }).notNull(),
    displayName: varcharColumn("display_name", { length: 255 }).notNull(),
    description: textColumn("description"),
    // numericColumn: PG produces numeric(12,2) (returned as string); SQLite stores as text.
    creditHours: numericColumn("credit_hours", { precision: 12, scale: 2 }).notNull(),
    priceAmount: numericColumn("price_amount", { precision: 12, scale: 2 }).notNull(),
    currency: currencyCodeEnum("currency").notNull().$type<CurrencyCode>(),
    active: booleanColumn("active").notNull().default(true),
    sortOrder: integerColumn("sort_order").notNull().default(0),
    metadata: jsonbColumn("metadata"),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
    deletedAt: timestampColumn("deleted_at"),
  },
  table => [
    uniqueIndex("package_plans_codename_unique_idx").on(table.codename).where(sql`deleted_at IS NULL`),
    index("package_plans_active_sort_idx").on(table.active, table.sortOrder).where(sql`deleted_at IS NULL`),
    // checkConstraint(name, pgSql, sqliteSql) — dialect-aware. SQLite enforces the
    // same predicate via raw text comparison (works because all values share scale=2).
    checkConstraint(
      "package_plans_credit_hours_positive_chk",
      sql`${table.creditHours} > 0`,
      sql`${table.creditHours} > 0`
    ),
    checkConstraint(
      "package_plans_price_amount_positive_chk",
      sql`${table.priceAmount} > 0`,
      sql`${table.priceAmount} > 0`
    ),
    checkConstraint(
      "package_plans_sort_order_non_negative_chk",
      sql`${table.sortOrder} >= 0`,
      sql`${table.sortOrder} >= 0`
    ),
  ]
);
```

### 1.2 Extend `backend/db/schema/billing/credit-transactions.ts`

Add `changeAmountHours` numeric column + XOR CHECK constraint; relax `changeAmount` to nullable:

```typescript
// Use numericColumn (NOT textColumn w/ options) — textColumn does not accept precision/scale.
changeAmount: integerColumn("change_amount"),  // REMOVED .notNull() — now nullable
changeAmountHours: numericColumn("change_amount_hours", { precision: 12, scale: 2 }),  // NEW
// ...existing columns...
// New XOR CHECK — use checkConstraint (NOT raw check) for SQLite compatibility.
checkConstraint(
  "credit_transactions_change_amount_xor_chk",
  sql`
    (${table.changeAmount} IS NOT NULL AND ${table.changeAmountHours} IS NULL)
    OR
    (${table.changeAmount} IS NULL AND ${table.changeAmountHours} IS NOT NULL)
  `,
  sql`
    (${table.changeAmount} IS NOT NULL AND ${table.changeAmountHours} IS NULL)
    OR
    (${table.changeAmount} IS NULL AND ${table.changeAmountHours} IS NOT NULL)
  `
),
```

Add index: `index("credit_transactions_change_amount_hours_idx").on(table.studentId, table.changeAmountHours)`.

### 1.3 Extend `backend/db/schema/billing/billing.ts` (payments + invoices)

> **SE Pattern Compliance (R2):**
> - FK columns use `uuidDefaultColumn(name).references(...)` (NOT `uuidColumn(name).references(...)`) — `uuidColumn` is reserved for PK columns (it applies `.defaultRandom().primaryKey()` internally). All FK columns in the existing schema (`payments.invoiceId`, `invoices.parentId`, etc.) use `uuidDefaultColumn`.

**`payments` table — add columns:**

```typescript
// FK column — use uuidDefaultColumn (matches existing payments.invoiceId pattern).
packagePlanId: uuidDefaultColumn("package_plan_id").references(() => packagePlans.id, { onDelete: "set null" }),
paymentGateway: paymentGatewayEnum("payment_gateway").notNull().default("NONE").$type<PaymentGateway>(),
// numericColumn (NOT textColumn w/ options) — textColumn does not accept precision/scale.
creditHours: numericColumn("credit_hours", { precision: 12, scale: 2 }),
isPaidStatusOn: booleanColumn("is_paid_status_on").notNull().default(false),
paymentNote: textColumn("payment_note"),
```

Add indexes: `(paymentGateway)`, `(packagePlanId)`, `(isPaidStatusOn)`.

**`invoices` table — add column:**

```typescript
creditHours: numericColumn("credit_hours", { precision: 12, scale: 2 }),
```

### 1.4 Extend `backend/db/schema/students/students.ts`

Add two columns + two CHECKs:

```typescript
// numericColumn — PG produces numeric(12,2) (returned as string); SQLite stores as text.
// Default to "0.00" (string literal — both PG and SQLite accept string defaults on numeric columns).
creditHoursRemaining: numericColumn("credit_hours_remaining", { precision: 12, scale: 2 }).notNull().default("0.00"),
creditHoursTotal: numericColumn("credit_hours_total", { precision: 12, scale: 2 }).notNull().default("0.00"),
// New checks — use checkConstraint (NOT raw check) for SQLite compatibility.
// Both predicates work on SQLite via lexicographic comparison (all values share scale=2 → consistent ordering).
checkConstraint(
  "students_credit_hours_remaining_non_negative_chk",
  sql`${table.creditHoursRemaining} >= 0`,
  sql`${table.creditHoursRemaining} >= 0`
),
checkConstraint(
  "students_credit_hours_total_non_negative_chk",
  sql`${table.creditHoursTotal} >= 0`,
  sql`${table.creditHoursTotal} >= 0`
),
```

### 1.5 Extend `backend/db/schema/classes/scheduling.ts` (class_instances)

Add `billedUnit` column:

```typescript
billedUnit: billedUnitEnum("billed_unit"),  // nullable
```

> **R2 SE NOTE — Dead Code in v1:** The `billedUnit` column is added in v1 as schema scaffolding only. No v1 code path writes `HOUR_CREDIT` — the only writers (`recurring-schedule` generation + `class-instance` activation) are deferred to Epic 6 (`student.billingMode` discriminator). The dedicated `CreditService.deductHoursForBooking` / `refundHoursOnCancel` methods (Phase 3.2) are also dead code in v1 — they are unit-tested (Phase 10.3) but no production code path invokes them until Epic 6 lands. This is intentional (de-risking the CreditService extension before the scheduling integration re-touches it), but should be documented in the outcome file so a future agent doesn't remove them as "unused".


### 1.6 Enum additions to `backend/db/schema/enums.ts`

> **PATTERN COMPLIANCE:** This codebase uses the shared `createPgEnumFromEnum(name, tsEnum)` utility (see `backend/utils/db.utils.ts`) instead of raw `pgEnum(...)`. Every existing enum in `backend/db/schema/enums.ts` (e.g. `currencyCodeEnum`, `invoiceStatusEnum`, `creditReasonEnum`) follows this pattern. New entries MUST follow it too.

```typescript
import { createPgEnumFromEnum } from "@/backend/utils/db.utils";
import { PaymentGateway, BilledUnit } from "@/backend/enum/billing/package-plan.enum";

// NEW pgEnums (driven by the TypeScript enums created in §1.7):
export const paymentGatewayEnum = createPgEnumFromEnum("payment_gateway", PaymentGateway);
export const billedUnitEnum = createPgEnumFromEnum("billed_unit", BilledUnit);

// EXISTING invoiceTypeEnum is already declared via createPgEnumFromEnum("invoice_type", InvoiceType)
// in `enums.ts`. The new `CREDIT_HOURS_PACKAGE` value is added to the TypeScript `InvoiceType`
// enum in `backend/enum/billing/billing.enum.ts` (see §1.8); the existing
// `createPgEnumFromEnum("invoice_type", InvoiceType)` call picks it up automatically — no code
// change in `enums.ts` is required for the InvoiceType extension.
```

**SQL migration (new file `backend/db/migration/<N>-accounting_enums_and_permissions.sql`):**

```sql
-- Create the two new pgEnum types (mirrors createPgEnumFromEnum output)
DO $$ BEGIN
  CREATE TYPE payment_gateway AS ENUM ('NONE', 'PAYPAL', 'WESTERN_UNION', 'BANK', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE billed_unit AS ENUM ('CLASS_CREDIT', 'HOUR_CREDIT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Extend existing invoice_type enum with the new value (must run BEFORE any tx using it)
ALTER TYPE invoice_type ADD VALUE IF NOT EXISTS 'CREDIT_HOURS_PACKAGE';
```

### 1.7 TypeScript enums

**`backend/enum/billing/package-plan.enum.ts`** (new):

```typescript
export enum PaymentGateway {
  NONE = "NONE",
  PAYPAL = "PAYPAL",
  WESTERN_UNION = "WESTERN_UNION",
  BANK = "BANK",
  OTHER = "OTHER",
}

export enum BilledUnit {
  CLASS_CREDIT = "CLASS_CREDIT",
  HOUR_CREDIT = "HOUR_CREDIT",
}
```

Re-export from `backend/enum/billing/index.ts` (existing barrel at `backend/enum/billing/index.ts` — add `export * from "./package-plan.enum";`).

**`backend/enum/billing/billing.enum.ts`** (edit) — add `CREDIT_HOURS_PACKAGE = "CREDIT_HOURS_PACKAGE"` to `InvoiceType`. The existing `createPgEnumFromEnum("invoice_type", InvoiceType)` call in `enums.ts` automatically picks up the new value at the TypeScript layer; the SQL migration (§1.6) adds the value to the Postgres enum.

**Register new enums in `backend/graphql/pothos/shared/enum.pothos.ts`** — follow the existing pattern `gqlSchemaBuilder.enumType(TypescriptEnum, { name: "GraphQLName" })` (note: the existing file registers TypeScript enums, NOT the Drizzle pgEnum objects):

```typescript
import { PaymentGateway, BilledUnit } from "@/backend/enum/billing/package-plan.enum";

export const PaymentGatewayPothosEnum = gqlSchemaBuilder.enumType(PaymentGateway, {
  name: "PaymentGateway",
});

export const BilledUnitPothosEnum = gqlSchemaBuilder.enumType(BilledUnit, {
  name: "BilledUnit",
});
```

### 1.8 Permission additions

**`backend/enum/permissions/permission.enum.ts`** (edit):

```typescript
// Accounting Payments Module (new)
ACCOUNTING_PAYMENTS_VIEW = "accounting.payments_view",
ACCOUNTING_PAYMENTS_MANAGE = "accounting.payments_manage",
```

**Seed grants** — permission seeds live as SQL migration files under `backend/db/migration/` (NOT under `backend/db/seeds/permissions/`, which does not exist). Create `backend/db/migration/<N>-accounting_permissions_and_groups.sql` following the pattern of `6-lms-permissions-and-groups.sql`:

```sql
-- Add new app_permission enum values
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'accounting.payments_view';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'accounting.payments_manage';

-- Disable system-permission trigger (matches existing migration pattern)
DO $$ BEGIN
  ALTER TABLE permissions DISABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- INSERT INTO permissions (...) the two new permission rows (with EN/AR description jsonb)
-- INSERT INTO permission_group_permissions (...) grants:
--   accounting.payments_view  → super_admin, academy_admin, staff_default
--   accounting.payments_manage → super_admin, academy_admin

-- Re-enable trigger
DO $$ BEGIN
  ALTER TABLE permissions ENABLE TRIGGER trg_protect_system_permissions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
```

### 1.9 Apply schema

```bash
bun run db push     # for new tables/columns/indexes
bun run db migrate  # for custom SQL: enum creation, ALTER TYPE ADD VALUE, NOT NULL → NULL relaxation, system_settings seed, permission grants
```

> **NOTE:** `bun run db` launches the `scripts/dbActions/index.ts` CLI; `push` and `migrate` are sub-commands of that CLI (per `backend/db/schema/AGENTS.md`).

---

## Phase 2: Backend Types

### `backend/types/billing/package-plan.types.ts` (new)

```typescript
export type PackagePlanSelectType = typeof packagePlans.$inferSelect;
export type PackagePlanInsertType = typeof packagePlans.$inferInsert;
export type PackagePlanReturnType = Omit<PackagePlanSelectType, "deletedAt">;
export interface PackagePlanSubmitInput {
  codename: string;
  displayName: string;
  description?: string | null;
  creditHours: number;
  priceAmount: number;
  currency: CurrencyCode;
  active?: boolean;
  sortOrder?: number;
  metadata?: Record<string, unknown> | null;
}
export interface PackagePlanUpdateInput extends Partial<PackagePlanSubmitInput> {
  id: string;
  version: number;  // optimistic lock
}
```

### `backend/types/billing/accounting-payment.types.ts` (new)

```typescript
export interface AccountingPaymentSelectType {
  // extends payments table shape + joined fields
  id: string;
  invoiceId: string;
  studentId: string | null;  // via invoice join
  studentName: string | null;
  packagePlanId: string | null;
  packageCodename: string | null;
  amount: string;  // numeric as string per Drizzle convention
  currency: CurrencyCode;
  creditHours: string | null;
  paymentGateway: PaymentGateway;
  paymentDate: Date;
  isPaidStatusOn: boolean;
  paymentNote: string | null;
  transactionId: string | null;
  createdAt: Date;
}

export interface AccountingPaymentSubmitInput {
  studentId: string;
  packagePlanId?: string | null;
  creditHours: number;
  amount: number;
  currency: CurrencyCode;
  paymentGateway: PaymentGateway;
  paymentDate: Date;
  isPaidStatusOn: boolean;
  paymentNote?: string | null;
}

export interface AccountingPaymentUpdateInput {
  id: string;
  paymentGateway?: PaymentGateway;
  isPaidStatusOn?: boolean;
  paymentNote?: string | null;
  creditHours?: number;  // triggers ADJUSTMENT ledger row
  // R2 SE: optimistic lock on the parent invoice (which has `version`).
  // Required when `isPaidStatusOn` or `creditHours` is set (those mutate invoice status / ledger).
  // Optional for `paymentGateway` / `paymentNote`-only edits (no invoice mutation).
  expectedInvoiceVersion?: number;
}

export interface AccountingPaymentTogglePaidInput {
  paymentId: string;
  isPaidStatusOn: boolean;
  // R2 SE: required for the invoice status cascade — concurrent `togglePaidStatus`
  // calls on payments of the same invoice would otherwise race on the invoice row.
  // The service acquires `acquireInvoiceLock(tx, invoiceId)` BEFORE reading the
  // invoice (mirrors `BillingRepository.updateInvoiceStatus`).
  expectedInvoiceVersion?: number;
}

export interface AccountingPaymentFilter {
  studentId?: string | null;
  parentId?: string | null;
  fromDate?: Date | null;
  toDate?: Date | null;
  unpaidOnly?: boolean | null;
}

export interface AccountingPaymentBalanceReturnType {
  studentId: string;
  creditHoursRemaining: number;
  creditHoursTotal: number;
}
```

### `backend/types/billing/credit.types.ts` (edit) — extend with hour variants

```typescript
export interface CreditTransactionSubmitInput {
  // existing fields (for class-based purchases)
  studentId: string;
  hours: number;  // class count (legacy field name kept for backward compat)
  sourcePaymentId?: string | null;
  notes?: string | null;
}

export interface CreditHourTransactionSubmitInput {
  // NEW — for hour-based purchases
  studentId: string;
  creditHours: number;  // decimal hours
  sourcePaymentId?: string | null;
  notes?: string | null;
}

export interface CreditHourBalanceReturnType {
  studentId: string;
  creditHoursRemaining: number;
  creditHoursTotal: number;
}
```

Re-export from `backend/types/billing/index.ts`.

---

## Phase 3: Repository Layer

### `backend/db/repo/billing/package-plan.repository.ts` (new)

Key methods:
- `create(input)` — insert
- `findById(id)`, `findByCodename(codename)` — case-insensitive codename lookup
- `listActive()` — catalog dropdown source (sorted by `sortOrder ASC, displayName ASC`)
- `listAllPaginated(filter, pagination)` — admin catalog CRUD
- `update(id, input, version)` — optimistic lock
- `archive(id)` — soft-delete (`deletedAt = NOW()`)
- `generateIdempotencyKey(input)` — `sha256(codename|displayName|creditHours|priceAmount|currency)`

### `backend/db/repo/billing/accounting-payment.repository.ts` (new)

Key methods:
- `create(tx, input)` — insert payment row + return joined result
- `findById(id)` — single payment with student + package joins
- `listPaginated(filter, pagination)` — DataGrid source with filters
- `countForFilter(filter)` — total count for pagination
- `update(tx, id, input)` — partial update (gateway, note, paid toggle)
- `findPaidSiblingsByInvoice(invoiceId, excludePaymentId)` — for the paid-toggle cascade check
- `generateIdempotencyKey(input)` — `sha256(studentId|packagePlanId|amount|currency|paymentDate|gateway)`

### `backend/db/repo/billing/credit.repository.ts` (edit)

Extend with hour-based variants:
- `createHourPurchase(tx, input)` — insert row with `changeAmountHours`, `changeAmount = NULL`
- `deductHoursForBooking(tx, input)` — insert row with `changeAmountHours = -hours`, `reason = DEDUCTION`
- `refundHoursOnCancel(tx, input)` — insert row with `changeAmountHours = +hours`, `reason = REFUND`
- `getHourBalance(tx, studentId)` — returns `{ creditHoursRemaining, creditHoursTotal }` from `students` table

### `backend/db/repo/students/student.repository.ts` (edit)

Add hour-balance mutators (mirror existing `addClasses` / `deductClasses` — note that existing signatures use `export const xxx = async (studentId, tErrors, amount=1, expectedVersion?, tx?)` and write via `adjustClassesQuota` helper):

> **R2 SE Pattern Compliance (verified against existing `addClasses`/`deductClasses` in `student.repository.ts` lines 318-401):**
> - Both `addCreditHours` and `deductCreditHours` reuse the existing `adjustClassesQuota` private helper which already: (1) acquires `acquireStudentLock(tx, studentId)` advisory lock, (2) reads the current row, (3) checks `expectedVersion?` for optimistic lock, (4) performs atomic SQL increment via `sql\`${students.creditHoursRemaining} + ${hours}\``, (5) bumps `version: sql\`${students.version} + 1\``.
> - `deductCreditHours` MUST pre-check `current.creditHoursRemaining - hours >= 0` BEFORE the SQL decrement — throw `ConflictError(tErrors.credit.insufficientHours({ studentId, remaining: current.creditHoursRemaining, required: hours }))` if insufficient (mirrors the existing `CreditService.deductForBooking` pre-check at line 250-252; the DB-level CHECK `students_credit_hours_remaining_non_negative_chk` is the safety net).
> - Numeric values are passed as `number` (TypeScript) but rendered as `sql\`... + ${hours}\`` so Drizzle serializes them safely into the SQL string. The `numericColumn` returns `string` from the DB on read — `addCreditHours`/`deductCreditHours` accept `number` for ergonomics; the SQL arithmetic coerces correctly.

```typescript
export namespace StudentRepository {
  // ...existing exports unchanged...

  /**
   * Bumps creditHoursRemaining + creditHoursTotal atomically. Reuses adjustClassesQuota
   * (acquires acquireStudentLock, checks expectedVersion, atomic SQL increment + version bump).
   */
  export const addCreditHours = async (
    studentId: string,
    tErrors: ErrorsLabels,
    hours: number,
    expectedVersion?: number,
    tx?: DBTransaction
  ): Promise<Types.StudentSelectType> =>
    runStudentUpdate(
      studentId,
      () => ({
        creditHoursRemaining: sql`${students.creditHoursRemaining} + ${hours}`,
        creditHoursTotal: sql`${students.creditHoursTotal} + ${hours}`,
      }),
      tErrors,
      expectedVersion,
      tx
    );

  /**
   * Decrements creditHoursRemaining by `hours` atomically. Pre-checks for sufficient
   * balance (throws ConflictError on insufficient) — the DB CHECK is a safety net only.
   *
   * NOTE: Unlike deductClasses (which subtracts a fixed integer), this version must
   * subtract a decimal `hours` value AND pre-check `current.creditHoursRemaining >= hours`.
   * The pre-check is OUTSIDE the SQL — done inside the tx after acquiring the lock.
   */
  export const deductCreditHours = async (
    studentId: string,
    tErrors: ErrorsLabels,
    hours: number,
    expectedVersion?: number,
    tx?: DBTransaction
  ): Promise<Types.StudentSelectType> => {
    const runner = async (t: DBTransaction) => {
      await acquireStudentLock(t, studentId); // from existing private helper
      const [current] = await t.select().from(students).where(eq(students.id, studentId)).limit(1);
      if (!current) throw new NotFoundError("STUDENT", tErrors.studentNotFound(studentId));
      if (expectedVersion !== undefined && current.version !== expectedVersion) {
        throw new ConflictError(tErrors.studentVersionMismatch({ id: studentId, expectedVersion, gotVersion: current.version }));
      }
      const currentRemaining = Number(current.creditHoursRemaining); // numericColumn returns string
      if (currentRemaining < hours) {
        throw new ConflictError(tErrors.credit.insufficientHours({ studentId, remaining: currentRemaining, required: hours }));
      }
      const [updated] = await t
        .update(students)
        .set({
          creditHoursRemaining: sql`${students.creditHoursRemaining} - ${hours}`,
          version: sql`${students.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(students.id, studentId))
        .returning();
      return updated;
    };
    return tx ? runner(tx) : db.transaction(runner);
  };

  /** Read-only — returns the hour balance from the students table. Uses queryDb(tx). */
  export const getCreditHourBalance = async (
    studentId: string,
    tx?: DBTransaction
  ): Promise<{ creditHoursRemaining: number; creditHoursTotal: number }> => {
    const q = queryDb(tx);
    const [row] = await q
      .select({
        creditHoursRemaining: students.creditHoursRemaining,
        creditHoursTotal: students.creditHoursTotal,
      })
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);
    return {
      creditHoursRemaining: row ? Number(row.creditHoursRemaining) : 0,
      creditHoursTotal: row ? Number(row.creditHoursTotal) : 0,
    };
  };
}
```

Re-export from `backend/db/repo/billing/index.ts` (for accounting repositories) and `backend/db/repo/students/index.ts` (for student mutators).

---

## Phase 4: Service Layer

### `backend/services/billing/package-plan.service.ts` (new)

```typescript
export namespace PackagePlanService {
  export async function create(actorUserId, input, tErrors): Promise<PackagePlanReturnType>;
  export async function update(actorUserId, input, tErrors): Promise<PackagePlanReturnType>;
  export async function archive(actorUserId, id, tErrors): Promise<void>;
  export async function getById(id, tErrors): Promise<PackagePlanReturnType>;
  export async function listActive(): Promise<PackagePlanReturnType[]>;
  export async function listPaginated(filter, pagination): Promise<{ rows, totalCount }>;
}
```

Permission: `ACCOUNTING_PAYMENTS_MANAGE` for write ops; no permission check on `listActive` (used by Add Payment form dropdown — admin already has manage).

### `backend/services/billing/accounting-payment.service.ts` (new) — THE ORCHESTRATOR

> **R2 SE Pattern Compliance (verified against `billing-management.service.ts` + `credit.service.ts`):**
>
> **Transaction boundaries:**
> - `recordPayment`, `togglePaidStatus`, `update` (when `creditHours` changes) ALL wrap their multi-table writes in a single `db.transaction(async tx => { ... })`. Every repo call inside the tx passes `tx`.
> - Repo reads inside the tx use `queryDb(tx)` (stateless reads reuse the tx's snapshot).
>
> **Advisory locks (defense-in-depth against lost updates):**
> - `recordPayment`: acquire `acquireAdvisoryLock(tx, \`student_\${studentId}\`)` BEFORE bumping `students.creditHoursRemaining` — two concurrent `recordPayment` calls with DIFFERENT idempotency keys (e.g. admin changes `paymentDate` by 1 second) would otherwise race on the balance bump (atomic SQL increment + version bump mitigates but doesn't prevent the ledger from showing two simultaneous purchases for a momentarily stale balance). The advisory lock serializes balance-affecting ops per student.
> - `update` (creditHours change): same `acquireAdvisoryLock(tx, \`student_\${studentId}\`)` for the same reason.
> - `togglePaidStatus`: acquire `acquireAdvisoryLock(tx, \`invoice_\${invoiceId}\`)` BEFORE reading the invoice (mirrors `BillingRepository.acquireInvoiceLock` + `updateInvoiceStatus`).
>
> **Idempotency:**
> - `recordPayment`: deterministic SHA-256 key derived from `studentId|packagePlanId|amount|currency|paymentDate|gateway`. Idempotency check is INSIDE the tx (eliminates TOCTOU race — matches `CreditService.recordPurchaseIfMissing` pattern). On duplicate-key: RETURN the existing row (do NOT throw `ConflictError`). This DIVERGES from the public `CreditService.recordPurchase` (which throws on duplicate) — `recordPayment` follows the `recordPurchaseIfMissing` "return existing" pattern per US-2.1 AC#4. Raw Postgres 23505 unique violations are also caught at the tx boundary and resolved to the existing row (matches `recordPurchaseIfMissing`).
> - `update`, `togglePaidStatus`: idempotent via the optimistic-lock `version` check on the invoice (a concurrent call's `version` mismatch surfaces as `tErrors.billing.invoiceVersionMismatch`).
>
> **Error handling:**
> - `NotFoundError("STUDENT", tErrors.studentNotFound(studentId))` when student missing.
> - `NotFoundError("PACKAGE_PLAN", tErrors.package.planArchived(id))` when package archived between form-open and submit.
> - `ValidationError(tErrors.package.invalidInput)` for `creditHours <= 0` / `priceAmount <= 0`.
> - `ConflictError(tErrors.package.codenameAlreadyExists)` on duplicate codename (PG 23505 from the partial unique index).
> - `ConflictError(tErrors.credit.insufficientHours({ studentId, remaining }))` when `deductCreditHours` would push `creditHoursRemaining < 0`.
> - `ConflictError(tErrors.credit.duplicatePurchase)` NOT thrown by `recordPayment` (returns existing row instead — see above).
>
> **Permission checks (defense in depth):**
> - Service calls `requirePermission(actorUserId, AppPermission.ACCOUNTING_PAYMENTS_MANAGE, tErrors)` at the top of `recordPayment` / `togglePaidStatus` / `update`.
> - Service calls `requirePermission(actorUserId, AppPermission.ACCOUNTING_PAYMENTS_VIEW, tErrors)` at the top of `getById` / `listPaginated` / `getStudentBalance`, PLUS `assertAssociatedOrManage(actorUserId, studentId, tErrors, AppPermission.ACCOUNTING_PAYMENTS_MANAGE)` for student-scoped variants (IDOR protection — matches `CreditService.getStudentBalance`).
> - GraphQL resolver additionally calls `PermissionsService.hasPermission(actorUserId, AppPermission.XXX)` (matches `credit.mutation.ts` pattern) so unauthorized users get a friendly `insufficientPermissions` error before reaching the service.

```typescript
export namespace AccountingPaymentService {
  /**
   * Records an accounting payment:
   * 1. Validates student exists + package plan active (pre-tx read; not racy because the
   *    service rejects mid-tx archival via the `active=false` snapshot check inside the tx)
   * 2. Derives idempotency key from input
   * 3. In one db.transaction(async tx => { ... }):
   *    a. acquireAdvisoryLock(tx, `student_${studentId}`)
   *    b. Check for existing row by idempotencyKey — if found, return it (return-existing-on-dup)
   *    c. Re-validate student + package plan active inside the tx (catches mid-tx archival)
   *    d. Insert invoice (invoiceType=CREDIT_HOURS_PACKAGE, status=UNPAID|PAID based on toggle)
   *    e. Insert payment row with package_plan_id, payment_gateway, credit_hours, is_paid_status_on
   *    f. Call CreditService.recordHourPurchase(tx, ...) — inserts credit_transactions row + bumps
   *       student balance via atomic SQL increment (CreditService handles the ledger insert)
   * 4. AFTER commit (non-blocking): dispatch ACCOUNTING_PAYMENT_RECORDED notification
   * 5. Return the joined AccountingPaymentReturnType
   *
   * Idempotency: deterministic sha256 key; duplicate returns existing row (NOT throw).
   */
  export async function recordPayment(
    actorUserId: string,
    input: AccountingPaymentSubmitInput,
    tErrors: ErrorsLabels
  ): Promise<AccountingPaymentReturnType>;

  /**
   * Toggles paid status on an existing payment:
   * - If flipping ON → invoice.status = PAID, paidDate = paymentDate (or NOW())
   * - If flipping OFF → check no other paid siblings via findPaidSiblingsByInvoice;
   *   if none, invoice.status = UNPAID, paidDate = NULL
   * - Respects system_setting `accounting_paid_toggle_auto_flips_invoice` (read INSIDE the tx
   *   via SystemSettingsService.getSettingByKey(key, tx))
   * - acquires `acquireAdvisoryLock(tx, invoice_${invoiceId})` before reading invoice
   */
  export async function togglePaidStatus(
    actorUserId: string,
    input: AccountingPaymentTogglePaidInput,
    tErrors: ErrorsLabels
  ): Promise<AccountingPaymentReturnType>;

  /**
   * Edits a payment's gateway/note/creditHours.
   * - For gateway/note-only edits: single UPDATE on payment row (no tx, no invoice mutation,
   *   no optimistic lock required).
   * - For creditHours change: in db.transaction(async tx => { ... }):
   *   a. acquireAdvisoryLock(tx, `student_${studentId}`)
   *   b. Read payment + invoice + student inside tx
   *   c. If creditHours increase: insert ADJUSTMENT credit_transaction with deltaHours=+(new-old);
   *      bump student.creditHoursRemaining + creditHoursTotal atomically.
   *   d. If creditHours decrease: pre-check current.creditHoursRemaining >= (old-new);
   *      if insufficient, throw ConflictError(tErrors.credit.insufficientHours(...));
   *      else insert ADJUSTMENT row with deltaHours=-(old-new); decrement student.creditHoursRemaining.
   *   e. Update payment.creditHours to the new value (snapshot of plan at edit time).
   */
  export async function update(
    actorUserId: string,
    input: AccountingPaymentUpdateInput,
    tErrors: ErrorsLabels
  ): Promise<AccountingPaymentReturnType>;

  export async function getById(
    actorUserId: string,
    paymentId: string,
    tErrors: ErrorsLabels
  ): Promise<AccountingPaymentReturnType>;
  export async function listPaginated(
    actorUserId: string,
    filter: AccountingPaymentFilter,
    pagination: PaginationArgs | null,
    tErrors: ErrorsLabels
  ): Promise<{ rows: AccountingPaymentReturnType[]; totalCount: number }>;
  export async function getStudentBalance(
    actorUserId: string,
    studentId: string,
    tErrors: ErrorsLabels
  ): Promise<AccountingPaymentBalanceReturnType>;
}
```

Permission: `ACCOUNTING_PAYMENTS_MANAGE` for `recordPayment` / `togglePaidStatus` / `update`; `ACCOUNTING_PAYMENTS_VIEW` + `assertAssociatedOrManage` for `getById` / `listPaginated` (when filtered by studentId) / `getStudentBalance`. `listPaginated` without studentId filter requires plain `ACCOUNTING_PAYMENTS_VIEW` (admin views all).

### `backend/services/billing/credit.service.ts` (edit) — extend with hour variants

Add new methods alongside existing class-based ones (do NOT modify existing `recordPurchase`, `deductForBooking`, `refundOnCancel`):

> **R2 SE Pattern Compliance (verified against existing `CreditService`):**
> - `recordHourPurchase` mirrors `recordPurchaseIfMissing` (NOT `recordPurchase`) — it's an internal helper called from `AccountingPaymentService.recordPayment`'s transaction. It takes `tx: DBTransaction` as its first param (NOT a top-level `db.transaction`) — the caller owns the tx. It does NOT call `requirePermission` itself (the caller's permission check covers it).
> - `deductHoursForBooking` / `refundHoursOnCancel` mirror the existing `deductForBooking` / `refundOnCancel` (line 240-306 of `credit.service.ts`) — they accept `tx: DBTransaction` as a positional parameter, do NOT call `requirePermission`, and reuse the shared `runIdempotentBookingLedgerOp` helper. Refactor the helper to accept either `deltaClasses` OR `deltaHours` (one is non-null per the XOR constraint enforced by the DB CHECK).
> - `deductHoursForBooking` MUST pre-check `current.creditHoursRemaining >= hours` BEFORE the SQL decrement — throw `ConflictError(tErrors.credit.insufficientHours({ studentId, remaining: current.creditHoursRemaining, required: hours }))` if insufficient (mirrors the existing `deductForBooking`'s pre-check at line 250-252).

```typescript
export namespace CreditService {
  // ...existing exports unchanged...

  /**
   * Records an hour-based credit purchase. Internal helper — called inside
   * AccountingPaymentService.recordPayment's transaction. Mirrors recordPurchaseIfMissing
   * (return-existing-on-dup) but writes change_amount_hours instead of change_amount.
   *
   * IMPORTANT: Does NOT call requirePermission (caller owns the tx + permission check).
   * Does NOT wrap in db.transaction (caller owns the tx).
   */
  export async function recordHourPurchase(
    actorUserId: string,
    input: CreditHourTransactionSubmitInput,
    idempotencyKey: string, // derived by caller — needed for return-existing-on-dup
    tx: DBTransaction,
    tErrors: ErrorsLabels
  ): Promise<CreditTransactionReturnType>;

  /**
   * Deducts hours for a class booking. Called by class-instance activation when
   * billedUnit=HOUR_CREDIT (deferred to Epic 6 — dead code in v1, unit-tested only).
   *
   * Pre-checks current.creditHoursRemaining >= hours; throws ConflictError
   * (tErrors.credit.insufficientHours) if insufficient.
   *
   * Mirrors deductForBooking: takes tx as positional param, reuses
   * runIdempotentBookingLedgerOp, does NOT call requirePermission.
   */
  export async function deductHoursForBooking(
    studentId: string,
    classInstanceId: string,
    hours: number,
    creditedByUserId: string,
    idempotencyKey: string,
    tx: DBTransaction,
    tErrors: ErrorsLabels,
    locale?: string
  ): Promise<void>;

  /** Refunds hours on class cancellation. Idempotent via ledger key. Mirrors refundOnCancel. */
  export async function refundHoursOnCancel(
    studentId: string,
    classInstanceId: string,
    hours: number,
    creditedByUserId: string,
    idempotencyKey: string,
    tx: DBTransaction,
    tErrors: ErrorsLabels
  ): Promise<void>;

  /** Returns student's hour balance (creditHoursRemaining + creditHoursTotal). Read-only. */
  export async function getStudentHourBalance(
    actorUserId: string,
    studentId: string,
    tErrors: ErrorsLabels
  ): Promise<CreditHourBalanceReturnType>;
}
```

**Shared idempotency helper** — refactor `runIdempotentBookingLedgerOp` to accept either `deltaClasses` or `deltaHours` (one is non-null, other is null per the XOR constraint). Both `deductForBooking` and `deductHoursForBooking` share the same helper.

### Permission helper

Extend `backend/services/billing/permission-utils.ts`:

```typescript
// Reuse assertAssociatedOrManage for student-scoped queries.
// For list-paginated with no student filter, require ACCOUNTING_PAYMENTS_VIEW directly.
```

---

## Phase 5: GraphQL Layer

> **R2 SE Pattern Compliance (verified against the actual codebase):**
> - The existing Pothos layer uses FLAT files per feature inside `backend/graphql/pothos/billing/` for OBJECT TYPES ONLY (e.g. `billing-alerts.pothos.ts`, `billing-history.pothos.ts`, `billing-management.pothos.ts`, `credit.pothos.ts`). QUERIES live in `backend/graphql/query/billing/<name>.query.ts` (using `gqlSchemaBuilder.queryField(...)` singular form — see `backend/graphql/query/billing/credit.query.ts`). MUTATIONS live in `backend/graphql/mutation/billing/<name>.mutation.ts` (using `gqlSchemaBuilder.mutationField(...)` singular form — see `backend/graphql/mutation/billing/credit.mutation.ts`).
> - The previous plan revision (R1) incorrectly prescribed putting types + queries + mutations ALL in one `accounting.pothos.ts` file. That's WRONG — split into 3 files matching the existing pattern.
> - Resolver pattern (verified from `credit.mutation.ts` + `credit.query.ts`): `authScopes: { loggedIn: true }` (basic auth at Pothos layer) + `await requireAuth(ctx)` for caller userId + `await PermissionsService.hasPermission(actorUserId, AppPermission.XXX)` manual check inside resolver + service-side `requirePermission` (defense in depth — matches `credit.service.ts` line 153). Do NOT use `authScopes: { permission: AppPermission.XXX }` as the sole gate (that pattern is only used in `permission-management.pothos.ts`, not billing).

### New files (3, not 1):

#### 5.1 `backend/graphql/pothos/billing/accounting.pothos.ts` — Object + Input types ONLY

Define ALL of the following in this single file:

**Object types:**
- `PackagePlan` — wraps `PackagePlanReturnType`
- `AccountingPayment` — wraps `AccountingPaymentReturnType` with student + package nested resolvers
- `AccountingPaymentBalance` — wraps `AccountingPaymentBalanceReturnType`

**Input types:**
- `AccountingPaymentFilterInput` — input type for filter
- `PackagePlanInput`, `PackagePlanUpdateInput` — input types
- `AccountingPaymentInput`, `AccountingPaymentTogglePaidInput`, `AccountingPaymentUpdateInput` — input types (mirror the service-layer types from Phase 2)

```typescript
// Example skeleton — full field list per Phase 2 type definitions:
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  BilledUnitPothosEnum,
  CurrencyCodePothosObject,
  InvoiceStatusPothosObject,
  InvoiceTypePothosObject,
  PaymentGatewayPothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { packagePlanFields } from "@/backend/graphql/pothos/billing/__shared__/packagePlanFieldHelpers"; // NEW shared helper file (see Phase 5.4)
import type {
  AccountingPaymentBalanceReturnType,
  AccountingPaymentReturnType,
  AccountingPaymentSubmitInput,
  AccountingPaymentTogglePaidInput,
  AccountingPaymentUpdateInput,
  AccountingPaymentFilter,
  PackagePlanReturnType,
  PackagePlanSubmitInput,
  PackagePlanUpdateInput,
} from "@/backend/types";

export const PackagePlanRef = gqlSchemaBuilder.objectRef<PackagePlanReturnType>("PackagePlan");
export const PackagePlanPothosObject = PackagePlanRef.implement({
  fields: t => packagePlanFields(t),
});

export const AccountingPaymentRef = gqlSchemaBuilder.objectRef<AccountingPaymentReturnType>("AccountingPayment");
export const AccountingPaymentPothosObject = AccountingPaymentRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    invoiceId: t.exposeString("invoiceId"),
    studentId: t.exposeString("studentId", { nullable: true }),
    studentName: t.exposeString("studentName", { nullable: true }),
    packagePlanId: t.exposeString("packagePlanId", { nullable: true }),
    packageCodename: t.exposeString("packageCodename", { nullable: true }),
    amount: t.exposeString("amount"),
    currency: t.expose("currency", { type: CurrencyCodePothosObject }),
    creditHours: t.exposeString("creditHours", { nullable: true }),
    paymentGateway: t.expose("paymentGateway", { type: PaymentGatewayPothosEnum }),
    paymentDate: t.expose("paymentDate", { type: "DateTime" }),
    isPaidStatusOn: t.exposeBoolean("isPaidStatusOn"),
    paymentNote: t.exposeString("paymentNote", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});

export const AccountingPaymentBalanceRef =
  gqlSchemaBuilder.objectRef<AccountingPaymentBalanceReturnType>("AccountingPaymentBalance");
export const AccountingPaymentBalancePothosObject = AccountingPaymentBalanceRef.implement({
  fields: t => ({
    id: t.string({ resolve: parent => parent.studentId }),
    studentId: t.exposeString("studentId"),
    creditHoursRemaining: t.exposeString("creditHoursRemaining"), // numeric returned as string per Drizzle
    creditHoursTotal: t.exposeString("creditHoursTotal"),
  }),
});

export const PackagePlanInput = gqlSchemaBuilder
  .inputRef<PackagePlanSubmitInput>("PackagePlanInput")
  .implement({
    fields: t => ({
      codename: t.string({ required: true, directives: { constraint: { maxLength: 50 } } }),
      displayName: t.string({ required: true, directives: { constraint: { maxLength: 255 } } }),
      description: t.string({ required: false }),
      creditHours: t.float({ required: true, directives: { constraint: { min: 0.01 } } }),
      priceAmount: t.float({ required: true, directives: { constraint: { min: 0.01 } } }),
      currency: t.arg({ type: CurrencyCodePothosObject, required: true }),
      active: t.boolean({ required: false }),
      sortOrder: t.int({ required: false }),
    }),
  });

export const PackagePlanUpdateInput = gqlSchemaBuilder
  .inputRef<PackagePlanUpdateInput>("PackagePlanUpdateInput")
  .implement({
    fields: t => ({
      id: t.id({ required: true }),
      codename: t.string({ required: false }),
      displayName: t.string({ required: false }),
      description: t.string({ required: false }),
      creditHours: t.float({ required: false }),
      priceAmount: t.float({ required: false }),
      currency: t.arg({ type: CurrencyCodePothosObject, required: false }),
      active: t.boolean({ required: false }),
      sortOrder: t.int({ required: false }),
      version: t.int({ required: true }), // optimistic lock
    }),
  });

export const AccountingPaymentInput = gqlSchemaBuilder
  .inputRef<AccountingPaymentSubmitInput>("AccountingPaymentInput")
  .implement({ /* ...fields... */ });

export const AccountingPaymentTogglePaidInput = gqlSchemaBuilder
  .inputRef<AccountingPaymentTogglePaidInput>("AccountingPaymentTogglePaidInput")
  .implement({
    fields: t => ({
      paymentId: t.id({ required: true }),
      isPaidStatusOn: t.boolean({ required: true }),
      expectedInvoiceVersion: t.int({ required: false }), // optimistic lock
    }),
  });

export const AccountingPaymentUpdateInput = gqlSchemaBuilder
  .inputRef<AccountingPaymentUpdateInput>("AccountingPaymentUpdateInput")
  .implement({
    fields: t => ({
      id: t.id({ required: true }),
      paymentGateway: t.arg({ type: PaymentGatewayPothosEnum, required: false }),
      isPaidStatusOn: t.boolean({ required: false }),
      paymentNote: t.string({ required: false }),
      creditHours: t.float({ required: false }),
      expectedInvoiceVersion: t.int({ required: false }), // required when isPaidStatusOn or creditHours set
    }),
  });

export const AccountingPaymentFilterInput = gqlSchemaBuilder
  .inputRef<AccountingPaymentFilter>("AccountingPaymentFilterInput")
  .implement({ /* ...fields... */ });
```

#### 5.2 `backend/graphql/query/billing/accounting.query.ts` — Queries ONLY

```typescript
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AccountingPaymentBalancePothosObject,
  AccountingPaymentFilterInput,
  AccountingPaymentPothosObject,
  PackagePlanPothosObject,
} from "@/backend/graphql/pothos/billing/accounting.pothos";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { parsePaginationArgs } from "@/backend/graphql/utils/pagination-utils";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { AccountingPaymentService, PackagePlanService, PermissionsService } from "@/backend/services";
import { AppPermission } from "@/backend/enum";

gqlSchemaBuilder.queryField("packagePlans", t =>
  t.field({
    type: [PackagePlanPothosObject],
    authScopes: { loggedIn: true },
    args: { activeOnly: t.arg.boolean({ required: false }) },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      // View permission OR manage (admin auto-fill dropdown)
      const hasPermission =
        (await PermissionsService.hasPermission(actorUserId, AppPermission.ACCOUNTING_PAYMENTS_VIEW)) ||
        (await PermissionsService.hasPermission(actorUserId, AppPermission.ACCOUNTING_PAYMENTS_MANAGE));
      if (!hasPermission) throw new Error(tErrors.insufficientPermissions);
      return args.activeOnly
        ? PackagePlanService.listActive()
        : PackagePlanService.listPaginated(actorUserId, {}, null, tErrors).then(r => r.rows);
    },
  })
);

// ...similar pattern for: packagePlan(id), accountingPayments(filter, pagination),
// accountingPayment(id), studentCreditHourBalance(studentId)...
```

#### 5.3 `backend/graphql/mutation/billing/accounting.mutation.ts` — Mutations ONLY

```typescript
import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AccountingPaymentPothosObject,
  AccountingPaymentInput,
  AccountingPaymentTogglePaidInput,
  AccountingPaymentUpdateInput,
  PackagePlanInput,
  PackagePlanPothosObject,
  PackagePlanUpdateInput,
} from "@/backend/graphql/pothos/billing/accounting.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { AccountingPaymentService, PackagePlanService, PermissionsService } from "@/backend/services";

gqlSchemaBuilder.mutationField("createPackagePlan", t =>
  t.field({
    type: PackagePlanPothosObject,
    description: "Create a new package plan (admin-only).",
    authScopes: { loggedIn: true },
    args: { input: t.arg({ type: PackagePlanInput, required: true }) },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      const hasPermission = await PermissionsService.hasPermission(
        actorUserId,
        AppPermission.ACCOUNTING_PAYMENTS_MANAGE
      );
      if (!hasPermission) throw new Error(tErrors.insufficientPermissions);
      return PackagePlanService.create(actorUserId, args.input, tErrors);
    },
  })
);

// ...similar pattern for: updatePackagePlan, archivePackagePlan,
// recordAccountingPayment, updateAccountingPayment, toggleAccountingPaymentPaidStatus...
```

#### 5.4 Shared field helpers — `backend/graphql/pothos/billing/__shared__/packagePlanFieldHelpers.ts`

Mirror existing `__shared__/creditFieldHelpers.ts` + `__shared__/paymentFieldHelpers.ts` pattern. Define a `packagePlanFields(t)` helper that returns the field map for `PackagePlan` (id, codename, displayName, description, creditHours, priceAmount, currency, active, sortOrder, metadata, createdAt, updatedAt). This enables field reuse in detail/list/nested-resolver contexts.

### Barrel registration

Edit `backend/graphql/pothos/billing/index.ts` — add:
```typescript
export * from "./accounting.pothos";
```

Edit `backend/graphql/query/billing/index.ts` — add:
```typescript
export * from "./accounting.query";
```

Edit `backend/graphql/mutation/billing/index.ts` — add:
```typescript
export * from "./accounting.mutation";
```

The root barrels (`backend/graphql/pothos/index.ts`, `backend/graphql/query/index.ts`, `backend/graphql/mutation/index.ts`) already re-export `./billing`, so no root change needed.

### Schema regen

```bash
bun run generate:gqlSchema && bun run codegen
```

---

## Phase 6: Frontend GraphQL Documents

> **PATTERN COMPLIANCE:** Per `frontend/common/graphql/AGENTS.md`, GraphQL documents are organized by domain in `frontend/common/graphql/sharedDocuments/<domain>/<domain>.documents.ts`. Each domain has its own directory + `index.ts` barrel; the root `frontend/common/graphql/sharedDocuments/index.ts` re-exports each domain.

### `frontend/common/graphql/sharedDocuments/billing/accounting-payments.documents.ts` (new)

Define all queries + mutations above as typed Apollo documents. Follow the existing pattern from `frontend/common/graphql/sharedDocuments/billing/credit-lms.documents.ts`:
- Import: `import { gql, type TypedDocumentNode } from "@apollo/client";` (NOT from `@apollo/client/react` — that's for hooks only)
- Use generated types: `import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types"; import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";`
- Document naming convention: `<operationName>QueryDocument` / `<operationName>MutationDocument` (camelCase)
- Every document MUST include the `id` field on every selection set

### `frontend/common/graphql/sharedDocuments/billing/index.ts` (new barrel)

```typescript
export * from "./accounting.documents";
```

### Edit `frontend/common/graphql/sharedDocuments/index.ts`

Add `export * from "./accounting";` (alongside the existing `export * from "./billing";` line).

### Codegen-generated hooks

The hooks (`usePackagePlansQuery`, `usePackagePlanQuery`, `useCreatePackagePlanMutation`, `useUpdatePackagePlanMutation`, `useArchivePackagePlanMutation`, `useAccountingPaymentsQuery`, `useAccountingPaymentQuery`, `useRecordAccountingPaymentMutation`, `useUpdateAccountingPaymentMutation`, `useToggleAccountingPaymentPaidStatusMutation`, `useStudentCreditHourBalanceQuery`) are **auto-generated** by `graphql-codegen` (configured via `codegen.ts`) into `frontend/common/graphql/generated/gql/`. They are NOT hand-authored. Import them from `@/frontend/common/graphql/generated/gql`.

**CRITICAL:** Use `useQuery` (not `useLazyQuery`) per `frontend/common/graphql/AGENTS.md` §27-29. Import hooks from `"@apollo/client/react"`.

---

## Phase 7: i18n Namespace

### New locale directory: `shared/locale/types/dashboard/billing/`

Files (mirror existing `dashboard/billing/` structure — each tab/feature gets its own file):

| File | Purpose |
|------|---------|
| `payments.ts` | Payments DataGrid + Add Payment form labels (filter bar, column headers, paid toggle labels, empty state, validation messages) |
| `package-plans.ts` | Package Plans catalog labels (form labels, validation errors) |
| `student-credit-hours.ts` | Student credit-hours tab labels (balance card, recent purchases, low-balance alert) |
| `index.ts` | Barrel re-export: `export * from "./payments"; export * from "./package-plans"; export * from "./student-credit-hours";` |

### Navigation labels — edit `shared/locale/types/dashboard/core/nav.ts`

> **PATTERN COMPLIANCE:** Navigation labels (sidebar group names, nav-item labels) live in `shared/locale/types/dashboard/core/nav.ts` as part of the `DashboardNavigationLabels` interface (NOT under `accounting/`). Existing examples: `navGroupFinance`, `navGroupBilling`, `billingAdmin`, `quotas`, `invoices`. Add the following fields to `DashboardNavigationLabels`:

```typescript
readonly navGroupAccounting: string;
readonly accountingPayments: string;
readonly accountingPackages: string;
```

Also add EN + AR implementations for these three keys in `shared/locale/en/dashboard/core/nav.json` + `shared/locale/ar/dashboard/core/nav.json`.

### Error labels — edit `shared/locale/types/errors/index.ts`

> **PATTERN COMPLIANCE:** The existing `CreditErrors` interface (lines 83-90 of `errors/index.ts`) defines `duplicatePurchase`, `insufficientBalance`, `invalidInput`. There is NO existing `PackageErrors` interface. Add:

1. Extend `CreditErrors` with `insufficientHours: (params: { studentId: string; remaining: number }) => string;`
2. Add new `PackageErrors` interface:
```typescript
export interface PackageErrors {
  readonly codenameAlreadyExists: string;
  readonly invalidInput: string;
  readonly planArchived: string;
}
```
3. Add `readonly package: PackageErrors;` to `ErrorsLabels`
4. Add EN + AR implementations under `shared/locale/en/errors/*.json` + `shared/locale/ar/errors/*.json`

### Payment gateway labels — add to `shared/locale/types/dashboard/billing/payments.ts`

Include a `gateways` record: `{ NONE, PAYPAL, WESTERN_UNION, BANK, OTHER }` keyed by `PaymentGateway` enum value. (NOT in `shared/locale/types/ui/index.ts` — keep all accounting labels co-located.)

### Root barrel — edit `shared/locale/types/index.ts`

> **PATTERN COMPLIANCE:** The dashboard namespace barrel is `shared/locale/types/index.ts` (NOT `shared/locale/types/dashboard/index.ts`, which does not exist). Add `export * from "./dashboard/billing";` alongside the existing `export * from "./dashboard/billing";` line.

### EN + AR implementations

`shared/locale/en/dashboard/billing/*.json` + `shared/locale/ar/dashboard/billing/*.json` — RTL-compliant strings.

Key labels required (full list in trackable-tasks.md):
- `payments.title`, `payments.add`, `payments.filter.student`, `payments.filter.parent`, `payments.filter.fromDate`, `payments.filter.toDate`, `payments.filter.unpaidOnly`, `payments.columns.studentName`, `payments.columns.credit`, `payments.columns.paid`, `payments.columns.currency`, `payments.columns.package`, `payments.columns.gateway`, `payments.columns.paymentDate`, `payments.columns.createdAt`, `payments.columns.actions`, `payments.empty`, `payments.paidToggle.on`, `payments.paidToggle.off`
- `package.codenameAlreadyExists`, `package.invalidInput`, `package.planArchived` (in `errors/index.ts` PackageErrors interface)
- `credit.insufficientHours`, `credit.duplicatePurchase` (extending existing CreditErrors)
- `gateways.NONE`, `gateways.PAYPAL`, `gateways.WESTERN_UNION`, `gateways.BANK`, `gateways.OTHER` (in `payments.ts`)

### Regenerate locale snapshots:

```bash
bun run locale:snapshots
```

> **NOTE:** The actual script name is `locale:snapshots` (plural), per `package.json`. Snapshots are written to `public/static/locale-snapshots/{en,ar}/`.

---

## Phase 8: Frontend Views

### Navigation config

Edit `frontend/common/views/dashboard/config/navigationConfig.ts`:
- Add new group `grp_accounting` (siblings of `grp_finance`)
- Add nav items: `payments`, `payments-new`, `packages`, `packages-new`
- Add `PAGE_PERMISSIONS.accountingPaymentsView = ACCOUNTING_PAYMENTS_VIEW`, `PAGE_PERMISSIONS.accountingPaymentsManage = ACCOUNTING_PAYMENTS_MANAGE`
- Mobile: add `accounting-payments` to `BOTTOM_NAV_ITEMS` for STAFF+

### Desktop views — `frontend/desktop/views/dashboard/billing/accounting/`

> **PATTERN COMPLIANCE:** Per `frontend/desktop/AGENTS.md`, desktop views live under `frontend/desktop/views/dashboard/<domain>/*.desktop.tsx`. The `dashboard/` segment is mandatory.

| File | Purpose |
|------|---------|
| `PaymentsListView.desktop.tsx` | DataGrid + filter bar |
| `PaymentDetailView.desktop.tsx` | Side-panel detail |
| `PaymentFormView.desktop.tsx` | Add/Edit form with package auto-fill |
| `PackagePlansListView.desktop.tsx` | Catalog DataGrid |
| `PackagePlanFormView.desktop.tsx` | Add/Edit form |

### Mobile views — `frontend/mobile/views/dashboard/billing/accounting/`

Mirror desktop with card-list layouts under `frontend/mobile/views/dashboard/billing/accounting/*.mobile.tsx`. Shared ViewModels under `frontend/common/views/dashboard/billing/accounting/`.

### ViewModels — `frontend/common/views/dashboard/billing/accounting/`

> **PATTERN COMPLIANCE:** Existing ViewModels are hooks named `useXxxViewModel.ts` located directly under `frontend/common/views/dashboard/<domain>/` (e.g. `frontend/common/views/dashboard/billing/quota/useQuotaFormViewModel.ts`). There is NO `viewmodels/` subdirectory and the `ViewModel` suffix comes AFTER the `use...ViewModel` hook name.

- `usePaymentsListViewModel.ts` — filter state, pagination, query wiring
- `usePaymentFormViewModel.ts` — package auto-fill logic, form validation
- `usePackagePlanFormViewModel.ts` — codename uniqueness check, optimistic lock

### Zustand stores — `frontend/common/stores/` (flat structure)

> **PATTERN COMPLIANCE:** Existing Zustand stores live FLAT in `frontend/common/stores/` (no subdirectories), named like `adminBillingStore.ts`, `quotaStore.ts`, `manualInvoiceUiStore.ts`. The `__shared__/` directory exists for utilities only.

- `frontend/common/stores/accountingPaymentsStore.ts` — list filter + pagination state
- `frontend/common/stores/packagePlansStore.ts` — catalog cache (read-through)

### Student credit-hours tab

> **PATTERN COMPLIANCE:** The existing student profile tab registry is `frontend/common/views/dashboard/students/profile/studentProfileTabs.ts` — its `STUDENT_PROFILE_TABS` array currently holds `["profile", "status", "classes", "quota", "history"]`. The new tab is added here. The `resolveStudentsPageAudience` helper lives at `app/(dashboard)/lib/resolve-students-page-audience.ts` (note: import via `@/app/(dashboard)/lib/resolve-students-page-audience`).

- Edit `frontend/common/views/dashboard/students/profile/studentProfileTabs.ts` — add `"credit-hours"` to `STUDENT_PROFILE_TABS` and define `CREDIT_HOURS_TAB_GROUPS`
- New component `frontend/common/views/dashboard/students/profile/StudentCreditHoursTab.tsx` (no `tabs/` subdirectory exists; the existing `sections/` directory holds section components like `StudentAdminSection.tsx`)
- Per-audience rendering: student/parent/teacher/supervisor variants via existing `resolveStudentsPageAudience` helper

---

## Phase 9: Backend Tests

### `backend/db/test/repo/billing/package-plan.repository.test.ts` (new)

Tests:
- `create` + `findByCodename` (case-insensitive)
- `listActive` excludes archived
- `update` optimistic-lock conflict
- `archive` soft-delete + codename reuse allowed

### `backend/db/test/repo/billing/accounting-payment.repository.test.ts` (new)

Tests:
- `create` joins student + package correctly
- `listPaginated` filters (student, parent, date range, unpaid-only) — AND combinations
- `findPaidSiblingsByInvoice` returns correct siblings

### `backend/db/test/logic/lms/credit-hours-workflow.test.ts` (new)

Tests:
- `recordHourPurchase` bumps `students.creditHoursRemaining` + `creditHoursTotal` correctly
- `deductHoursForBooking` rejects on insufficient balance with `ConflictError(tErrors.credit.insufficientHours)` (NOT a generic `INSUFFICIENT_HOURS` — must be a typed `ConflictError` with the `remaining` + `required` payload)
- `refundHoursOnCancel` is idempotent (same idempotency key returns existing row, no duplicate insert)
- Hour + class ledgers coexist without interference (one row with `changeAmount` set + `changeAmountHours` NULL, another with the reverse — both pass the XOR CHECK)
- `deductHoursForBooking` with `hours=0` rejected with `ValidationError` (must be > 0)
- `deductHoursForBooking` with `hours=0.5` (fractional) succeeds when `creditHoursRemaining >= 0.5`

### `backend/db/test/logic/lms/accounting-payment-workflow.test.ts` (new)

Tests (all under `runInRollback`):
- `recordPayment` creates invoice + payment + credit_transaction in one tx — verify all 3 rows exist after commit, all referencing each other via FK
- `recordPayment` idempotency: duplicate input (same studentId|packagePlanId|amount|currency|paymentDate|gateway) returns the existing payment row (NOT throws `ConflictError`)
- `recordPayment` with package plan archived between form-open and submit → rejects with `NotFoundError(tErrors.package.planArchived(id))` (re-checks `active=true` INSIDE the tx)
- `recordPayment` with student deleted mid-tx → rejects with `NotFoundError(tErrors.studentNotFound(id))`
- `recordPayment` with `isPaidStatusOn=true` → invoice `status=PAID`, `paidDate=paymentDate`
- `recordPayment` with `isPaidStatusOn=false` → invoice `status=UNPAID`, `paidDate=NULL`
- `togglePaidStatus` ON → invoice PAID; OFF → invoice UNPAID (when no siblings)
- `togglePaidStatus` OFF with paid sibling → invoice stays PAID (sibling check via `findPaidSiblingsByInvoice`)
- `togglePaidStatus` respects `accounting_paid_toggle_auto_flips_invoice=false` → only the payment row's toggle changes; invoice untouched
- `togglePaidStatus` with stale `expectedInvoiceVersion` → `ConflictError(tErrors.billing.invoiceVersionMismatch)` (optimistic lock)
- `togglePaidStatus` acquires `acquireAdvisoryLock(tx, invoice_${invoiceId})` — verify by running two concurrent toggles (one ON, one OFF) on payments of the same invoice; the second waits for the first to commit
- `update` with `paymentNote` change only → no ADJUSTMENT row, no balance change, no tx needed (or single-statement UPDATE)
- `update` with `paymentGateway` change only → no ADJUSTMENT row
- `update` with `creditHours` increase → ADJUSTMENT row inserted with `changeAmountHours=+(new-old)`, balance bumped atomically
- `update` with `creditHours` decrease (within balance) → ADJUSTMENT row inserted with `changeAmountHours=-(old-new)`, balance decremented atomically
- `update` with `creditHours` decrease past balance → `ConflictError(tErrors.credit.insufficientHours)` (pre-check inside tx, after acquiring student lock)
- `update` acquires `acquireAdvisoryLock(tx, student_${studentId})` — verify by running concurrent creditHours edits on two payments of the same student; second waits
- `getStudentBalance` IDOR: caller without `ACCOUNTING_PAYMENTS_VIEW` AND not associated with student → `Error(tErrors.insufficientPermissions)`
- `listPaginated` with no student filter (admin view-all) requires `ACCOUNTING_PAYMENTS_VIEW` only (not `assertAssociatedOrManage`)

All tests use `runInRollback` wrapper; never `expect().rejects.toThrow()` inside `runInRollback` per `backend/db/test/AGENTS.md`.

---

## Phase 10: Frontend Tests

### `test/ui/accounting/payments-list.test.tsx` (new)

- Renders DataGrid with mock data
- Filter bar interactions (student select, date range, unpaid toggle)
- Empty state

### `test/ui/accounting/payment-form.test.tsx` (new)

- Package selection auto-fills Credit/Paid/Currency
- Submit triggers `recordAccountingPayment` mutation
- Idempotency: re-submit shows the existing row

### `test/ui/accounting/package-plans.test.tsx` (new)

- Catalog CRUD
- Codename uniqueness error display

---

## Phase 11: Cron / Notifications (Lightweight)

### `backend/services/notification/accounting-notification.builders.ts` (new)

New events (reuse existing notification infrastructure):
- `ACCOUNTING_LOW_HOURS` — when `creditHoursRemaining` < `accounting_low_hours_threshold` after a deduction
- `ACCOUNTING_PAYMENT_RECORDED` — receipt-style notification to student (+ parent if linked)

Register in `NotificationEventType` enum + notification prefs.

---

## Phase 12: Quality Gate & Knowledge Propagation

### Global health check

```bash
bun tsgo && bun biome:check && bun run lint
```

All three must exit 0.

### Knowledge propagation

- Write `docs/billing/credit-hours-system.md` (canonical reference)
- Update layer AGENTS.md files: `backend/db/schema/`, `backend/db/repo/`, `backend/services/`, `backend/graphql/`, `backend/types/`, `backend/enum/`, `frontend/common/graphql/`, `frontend/common/views/`, `frontend/`
- Update `.agents/skills/drizzle/SKILL.md` (exists) and `.agents/skills/review-frontend/SKILL.md` (exists — the plan originally referenced `.agents/skills/frontend-patterns/SKILL.md`, which does NOT exist; the closest match is `review-frontend`)
- Update root `AGENTS.md` Important References section

---

## Industry Research Patterns Applied

1. **Parallel-ledger extension** — reusing `credit_transactions` with a discriminator column mirrors Stripe's balance transaction model (single ledger, multiple transaction types).
2. **Snapshot-on-purchase** — package plan fields are copied to the payment row at purchase time, so plan edits don't rewrite history (Lago, Chargebee catalog pattern).
3. **Idempotency via deterministic SHA-256** — same pattern as existing `CreditService.deriveBookingIdempotencyKey`.
4. **Single orchestrator service** — `AccountingPaymentService` owns the cross-table transaction; no repo writes payment rows directly (prevents the double-deduction bug class seen in the Quota plan).
5. **Config vs. ledger separation** — `package_plans` is a catalog (mutable); `credit_transactions` is a ledger (append-only). Quotas plan applies the same separation.
6. **Permission isolation** — new `ACCOUNTING_PAYMENTS_*` permissions don't overlap with existing `BILLING_*` permissions; both can coexist on the same user.
7. **CHECK-constraint invariants** — the XOR on `change_amount` vs `change_amount_hours` enforces the "either/or" rule at the DB layer, not just the service layer (defense in depth).
