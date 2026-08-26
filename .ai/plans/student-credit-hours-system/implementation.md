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

```typescript
import { boolean, index, integer, jsonb, numeric, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { check, sql } from "drizzle-orm";
import { currencyCodeEnum } from "@/backend/db/schema/enums";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

export const packagePlans = createTable(
  "package_plans",
  {
    id: uuidColumn("id").defaultRandom().primaryKey(),
    codename: varcharColumn("codename", { length: 50 }).notNull(),
    displayName: varcharColumn("display_name", { length: 255 }).notNull(),
    description: textColumn("description"),
    creditHours: numericColumn("credit_hours", { precision: 12, scale: 2 }).notNull(),
    priceAmount: numericColumn("price_amount", { precision: 12, scale: 2 }).notNull(),
    currency: currencyCodeEnum("currency").notNull().$type<CurrencyCode>(),
    active: booleanColumn("active").notNull().default(true),
    sortOrder: integerColumn("sort_order").notNull().default(0),
    metadata: jsonbColumn("metadata"),
    createdAt: timestampColumn("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    deletedAt: timestampColumn("deleted_at", { withTimezone: true, precision: 3 }),
  },
  table => [
    uniqueIndex("package_plans_codename_unique_idx").on(table.codename).where(sql`deleted_at IS NULL`),
    index("package_plans_active_sort_idx").on(table.active, table.sortOrder).where(sql`deleted_at IS NULL`),
    check("package_plans_credit_hours_positive_chk", sql`${table.creditHours} > 0`),
    check("package_plans_price_amount_positive_chk", sql`${table.priceAmount} > 0`),
    check("package_plans_sort_order_non_negative_chk", sql`${table.sortOrder} >= 0`),
  ]
);
```

### 1.2 Extend `backend/db/schema/billing/credit-transactions.ts`

Add `changeAmountHours` numeric column + XOR CHECK constraint; relax `changeAmount` to nullable:

```typescript
changeAmount: integerColumn("change_amount"),  // REMOVED .notNull() — now nullable
changeAmountHours: numericColumn("change_amount_hours", { precision: 12, scale: 2 }),  // NEW
// ...existing columns...
// New check:
check(
  "credit_transactions_change_amount_xor_chk",
  sql`
    (${table.changeAmount} IS NOT NULL AND ${table.changeAmountHours} IS NULL)
    OR
    (${table.changeAmount} IS NULL AND ${table.changeAmountHours} IS NOT NULL)
  `
),
```

Add index: `index("credit_transactions_change_amount_hours_idx").on(table.studentId, table.changeAmountHours)`.

### 1.3 Extend `backend/db/schema/billing/billing.ts` (payments + invoices)

**`payments` table — add columns:**

```typescript
packagePlanId: uuidColumn("package_plan_id").references(() => packagePlans.id, { onDelete: "set null" }),
paymentGateway: paymentGatewayEnum("payment_gateway").notNull().default("NONE").$type<PaymentGateway>(),
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
creditHoursRemaining: numericColumn("credit_hours_remaining", { precision: 12, scale: 2 }).notNull().default("0.00"),
creditHoursTotal: numericColumn("credit_hours_total", { precision: 12, scale: 2 }).notNull().default("0.00"),
// New checks:
check("students_credit_hours_remaining_non_negative_chk", sql`${table.creditHoursRemaining} >= 0`),
check("students_credit_hours_total_non_negative_chk", sql`${table.creditHoursTotal} >= 0`),
```

### 1.5 Extend `backend/db/schema/classes/scheduling.ts` (class_instances)

Add `billedUnit` column:

```typescript
billedUnit: billedUnitEnum("billed_unit"),  // nullable
```

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
- `addCreditHours(studentId, tErrors, hours, expectedVersion?, tx?)` — bumps `creditHoursRemaining` and `creditHoursTotal` by `hours` (numeric, not integer)
- `deductCreditHours(studentId, tErrors, hours, expectedVersion?, tx?)` — decrements `creditHoursRemaining` by `hours`; throws `INSUFFICIENT_HOURS` if it would go negative
- `getCreditHourBalance(studentId, tx?)` — returns `{ creditHoursRemaining, creditHoursTotal }`

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

```typescript
export namespace AccountingPaymentService {
  /**
   * Records an accounting payment:
   * 1. Validates student + package plan active
   * 2. In one db.transaction:
   *    a. Creates invoice (invoiceType=CREDIT_HOURS_PACKAGE, status=UNPAID|PAID based on toggle)
   *    b. Creates payment row with package_plan_id, payment_gateway, credit_hours, is_paid_status_on
   *    c. Calls CreditService.recordHourPurchase (inserts credit_transactions row + bumps student balance)
   * 3. Returns the joined AccountingPaymentReturnType
   *
   * Idempotency: deterministic sha256 key; duplicate returns existing row.
   */
  export async function recordPayment(
    actorUserId: string,
    input: AccountingPaymentSubmitInput,
    tErrors: ErrorsLabels
  ): Promise<AccountingPaymentReturnType>;

  /**
   * Toggles paid status on an existing payment:
   * - If flipping ON → invoice.status = PAID, paidDate = paymentDate (or NOW())
   * - If flipping OFF → check no other paid siblings; if none, invoice.status = UNPAID, paidDate = NULL
   * - Respects system_setting `accounting_paid_toggle_auto_flips_invoice`
   */
  export async function togglePaidStatus(
    actorUserId: string,
    paymentId: string,
    isPaidStatusOn: boolean,
    tErrors: ErrorsLabels
  ): Promise<AccountingPaymentReturnType>;

  /**
   * Edits a payment's gateway/note/creditHours.
   * - creditHours change → inserts ADJUSTMENT credit_transaction row with delta
   * - creditHours decrease rejected if it would push student.creditHoursRemaining < 0
   */
  export async function update(
    actorUserId: string,
    input: AccountingPaymentUpdateInput,
    tErrors: ErrorsLabels
  ): Promise<AccountingPaymentReturnType>;

  export async function getById(actorUserId, paymentId, tErrors): Promise<AccountingPaymentReturnType>;
  export async function listPaginated(
    actorUserId, filter, pagination, tErrors
  ): Promise<{ rows: AccountingPaymentReturnType[]; totalCount: number }>;
  export async function getStudentBalance(
    actorUserId, studentId, tErrors
  ): Promise<AccountingPaymentBalanceReturnType>;
}
```

Permission: `ACCOUNTING_PAYMENTS_MANAGE` for `recordPayment` / `togglePaidStatus` / `update`; `ACCOUNTING_PAYMENTS_VIEW` (or `assertAssociatedOrManage`) for `getById` / `listPaginated` / `getStudentBalance`.

### `backend/services/billing/credit.service.ts` (edit) — extend with hour variants

Add new methods alongside existing class-based ones (do NOT modify existing `recordPurchase`, `deductForBooking`, `refundOnCancel`):

```typescript
export namespace CreditService {
  // ...existing exports unchanged...

  /** Records an hour-based credit purchase. Mirrors recordPurchase but writes change_amount_hours. */
  export async function recordHourPurchase(
    actorUserId: string,
    input: CreditHourTransactionSubmitInput,
    tErrors: ErrorsLabels
  ): Promise<CreditTransactionReturnType>;

  /** Deducts hours for a class booking. Called by class-instance activation when billedUnit=HOUR_CREDIT. */
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

  /** Refunds hours on class cancellation. Idempotent via ledger key. */
  export async function refundHoursOnCancel(
    studentId: string,
    classInstanceId: string,
    hours: number,
    creditedByUserId: string,
    idempotencyKey: string,
    tx: DBTransaction,
    tErrors: ErrorsLabels
  ): Promise<void>;

  /** Returns student's hour balance (creditHoursRemaining + creditHoursTotal). */
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

> **PATTERN COMPLIANCE:** The existing Pothos layer uses FLAT files per feature inside `backend/graphql/pothos/billing/` (e.g. `billing-alerts.pothos.ts`, `billing-history.pothos.ts`, `billing-management.pothos.ts`, `credit.pothos.ts`). There are NO `types/billing/`, `queries/billing/`, or `mutations/billing/` subdirectories — types, queries, and mutations for a feature live together in a single `.pothos.ts` file. The new accounting feature follows this pattern.

### New Pothos file: `backend/graphql/pothos/billing/accounting.pothos.ts`

Define ALL of the following in this single file:

**Object types:**
- `PackagePlan` — wraps `PackagePlanReturnType`
- `AccountingPayment` — wraps `AccountingPaymentReturnType` with student + package nested resolvers
- `AccountingPaymentBalance` — wraps `AccountingPaymentBalanceReturnType`

**Input types:**
- `AccountingPaymentFilterInput` — input type for filter
- `PackagePlanInput`, `PackagePlanUpdateInput` — input types
- `AccountingPaymentInput`, `AccountingPaymentUpdateInput` — input types

**Queries:**
- `packagePlans(activeOnly: Boolean)` → `[PackagePlan!]!`
- `packagePlan(id: ID!)` → `PackagePlan`
- `accountingPayments(filter: AccountingPaymentFilterInput, pagination: PaginationInput)` → `AccountingPaymentConnection!`
- `accountingPayment(id: ID!)` → `AccountingPayment`
- `studentCreditHourBalance(studentId: ID!)` → `AccountingPaymentBalance!`

**Mutations:**
- `createPackagePlan(input: PackagePlanInput!)` → `PackagePlan!` (perm: `ACCOUNTING_PAYMENTS_MANAGE`)
- `updatePackagePlan(input: PackagePlanUpdateInput!)` → `PackagePlan!` (perm: `ACCOUNTING_PAYMENTS_MANAGE`)
- `archivePackagePlan(id: ID!)` → `PackagePlan!` (perm: `ACCOUNTING_PAYMENTS_MANAGE`)
- `recordAccountingPayment(input: AccountingPaymentInput!)` → `AccountingPayment!` (perm: `ACCOUNTING_PAYMENTS_MANAGE`)
- `updateAccountingPayment(input: AccountingPaymentUpdateInput!)` → `AccountingPayment!` (perm: `ACCOUNTING_PAYMENTS_MANAGE`)
- `toggleAccountingPaymentPaidStatus(id: ID!, isPaidStatusOn: Boolean!)` → `AccountingPayment!` (perm: `ACCOUNTING_PAYMENTS_MANAGE`)

### Barrel registration

Edit `backend/graphql/pothos/billing/index.ts` — add:
```typescript
export * from "./accounting.pothos";
```

The root barrel `backend/graphql/pothos/index.ts` already re-exports `./billing`, so no change there.

### Schema regen

```bash
bun run generate:gqlSchema && bun run codegen
```

---

## Phase 6: Frontend GraphQL Documents

> **PATTERN COMPLIANCE:** Per `frontend/common/graphql/AGENTS.md`, GraphQL documents are organized by domain in `frontend/common/graphql/sharedDocuments/<domain>/<domain>.documents.ts`. Each domain has its own directory + `index.ts` barrel; the root `frontend/common/graphql/sharedDocuments/index.ts` re-exports each domain.

### `frontend/common/graphql/sharedDocuments/accounting/accounting.documents.ts` (new)

Define all queries + mutations above as typed Apollo documents. Follow the existing pattern from `frontend/common/graphql/sharedDocuments/billing/credit-lms.documents.ts`:
- Import: `import { gql, type TypedDocumentNode } from "@apollo/client";` (NOT from `@apollo/client/react` — that's for hooks only)
- Use generated types: `import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types"; import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";`
- Document naming convention: `<operationName>QueryDocument` / `<operationName>MutationDocument` (camelCase)
- Every document MUST include the `id` field on every selection set

### `frontend/common/graphql/sharedDocuments/accounting/index.ts` (new barrel)

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

### New locale directory: `shared/locale/types/dashboard/accounting/`

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

### Payment gateway labels — add to `shared/locale/types/dashboard/accounting/payments.ts`

Include a `gateways` record: `{ NONE, PAYPAL, WESTERN_UNION, BANK, OTHER }` keyed by `PaymentGateway` enum value. (NOT in `shared/locale/types/ui/index.ts` — keep all accounting labels co-located.)

### Root barrel — edit `shared/locale/types/index.ts`

> **PATTERN COMPLIANCE:** The dashboard namespace barrel is `shared/locale/types/index.ts` (NOT `shared/locale/types/dashboard/index.ts`, which does not exist). Add `export * from "./dashboard/accounting";` alongside the existing `export * from "./dashboard/billing";` line.

### EN + AR implementations

`shared/locale/en/dashboard/accounting/*.json` + `shared/locale/ar/dashboard/accounting/*.json` — RTL-compliant strings.

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

### Desktop views — `frontend/desktop/views/dashboard/accounting/`

> **PATTERN COMPLIANCE:** Per `frontend/desktop/AGENTS.md`, desktop views live under `frontend/desktop/views/dashboard/<domain>/*.desktop.tsx`. The `dashboard/` segment is mandatory.

| File | Purpose |
|------|---------|
| `PaymentsListView.desktop.tsx` | DataGrid + filter bar |
| `PaymentDetailView.desktop.tsx` | Side-panel detail |
| `PaymentFormView.desktop.tsx` | Add/Edit form with package auto-fill |
| `PackagePlansListView.desktop.tsx` | Catalog DataGrid |
| `PackagePlanFormView.desktop.tsx` | Add/Edit form |

### Mobile views — `frontend/mobile/views/dashboard/accounting/`

Mirror desktop with card-list layouts under `frontend/mobile/views/dashboard/accounting/*.mobile.tsx`. Shared ViewModels under `frontend/common/views/dashboard/accounting/`.

### ViewModels — `frontend/common/views/dashboard/accounting/`

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
- `deductHoursForBooking` rejects on insufficient balance with `INSUFFICIENT_HOURS`
- `refundHoursOnCancel` is idempotent (same idempotency key returns existing row)
- Hour + class ledgers coexist without interference

### `backend/db/test/logic/lms/accounting-payment-workflow.test.ts` (new)

Tests:
- `recordPayment` creates invoice + payment + credit_transaction in one tx
- `recordPayment` idempotency: duplicate returns first row
- `togglePaidStatus` ON → invoice PAID; OFF → invoice UNPAID (when no siblings)
- `togglePaidStatus` OFF with paid sibling → invoice stays PAID
- `update` creditHours increase → ADJUSTMENT row inserted, balance bumped
- `update` creditHours decrease past balance → rejected with `INSUFFICIENT_HOURS`

All tests use `runInRollback` wrapper.

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
