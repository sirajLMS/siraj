# Plan 6 — Expense Ledger: Implementation

> Companion to `specs.md`. Describes how the Siraj LMS gains a new
> `expenses` table, an `ExpenseService` with both UI-facing and
> Plan-5-internal entry points, and the `/accounting/expenses` page.

---

## 1. Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              Next.js 16 App Router                          │
│                                                                            │
│   /accounting/expenses                                                      │
│   ┌───────────────────────────────────────────────────────────┐             │
│   │ ExpenseLedgerContainer                                     │             │
│   │  - Apollo useQuery(EXPENSES, { variables })                │             │
│   │  - MUI DataGrid (filter: title, type, month, payment date) │             │
│   │  - Toolbar: Add New | Bulk Delete | Export CSV             │             │
│   │  - Per-row: Edit | Delete | View Source (drill-down)        │             │
│   └────────────────────────────────┬──────────────────────────┘             │
└─────────────────────────────────────┼──────────────────────────────────────┘
                                      │ GraphQL (Pothos)
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                          GraphQL Layer (Pothos)                              │
│   Query:    expenses(filter, pagination) → ExpensePage                    │
│             expense(id)                    → Expense                        │
│   Mutation: createExpense(input)           → Expense                       │
│             updateExpense(input)            → Expense                      │
│             deleteExpense(input)            → DeleteResult                 │
│             bulkDeleteExpenses(input)       → BulkDeleteResult             │
│   (NO public mutation for createInternal — internal TS call only)            │
└─────────────────────────────────────┬────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                      Service Layer (ExpenseService)                          │
│   create(input, actorUserId, tErrors) → Expense        [UI entry point]    │
│   createInternal(input, tx, tErrors) → Expense        [Plan 5 cross-call] │
│     - no permission check (caller owns it)                                 │
│     - uses caller's tx (atomic with Plan 5's bulkCarryoverToExpense)      │
│   update(input, actorUserId, tErrors) → Expense                            │
│   softDelete({ id, actorUserId, reason, tx? }, tErrors) → Expense         │
│     - called by deleteExpense (UI) AND by Plan 5's unpayCarryoverBalance  │
│   bulkDelete(input, actorUserId, tErrors) → BulkDeleteResult              │
│   getById / getReport(actorUserId, filters, pagination, tErrors)          │
└─────────────────────────────────────┬────────────────────────────────────┘
                                      │ Drizzle ORM
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                          PostgreSQL                                          │
│   expenses (NEW)                                                            │
│     id, teacherId (nullable), teacherName (nullable), title, type,         │
│     expenseValue, expenseCurrency, paymentDate, expenseDate (YYYY-MM),    │
│     note, sourceEntity (nullable), sourceEntityId (nullable),             │
│     createdByUserId, deletedAt, deletedByUserId, deletedReason,            │
│     createdAt, updatedAt                                                    │
│   audit_logs (existing — reused for EXPENSE_* rows)                         │
└────────────────────────────────────────────────────────────────────────────┘
```

**Design principle:** The `expenses` table is the single source of
truth for all outgoing money. Manual UI entries write rows with
`sourceEntity = null`; Plan 5's `bulkCarryoverToExpense` writes rows
with `sourceEntity = 'carryover_balances'` via `ExpenseService.createInternal`
inside its own transaction. The same `softDelete` is reused by both
the UI delete button and Plan 5's `unpayCarryoverBalance`.

---

## 2. Data Model

### 2.1 New enum: `ExpenseType`

**File:** `backend/enum/expenses/expense-type.enum.ts`

```ts
export enum ExpenseType {
  SALARIES = "Salaries",
  MARKETING = "Marketing",
  LOGISTICS = "Logistics",
  TECHNOLOGY = "Technology",
}
```

Mirror this enum in:
- `shared/constants/expenses/expense-type.enum.ts` (shared client/server)
- `backend/db/schema/enums.ts` via
  `createPgEnumFromEnum("expense_type", ExpenseType)`

### 2.2 New permission: `ACCOUNTING_EXPENSES_VIEW` + `ACCOUNTING_EXPENSES_MANAGE`

**File:** `backend/enum/permissions/permission.enum.ts`

```ts
// LMS — Accounting / Expenses (Plan 6)
ACCOUNTING_EXPENSES_VIEW = "accounting.expenses_view",
ACCOUNTING_EXPENSES_MANAGE = "accounting.expenses_manage",
```

Add to the seed `permission-groups` so the "Accounting" /
"Finance Manager" group gets both by default.

### 2.3 New table: `expenses`

**File:** `backend/db/schema/expenses/expenses.ts`

```ts
import {
  date, index, numeric, pgTable, text, timestamp, uuid, varchar,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { currencyCodeEnum, expenseTypeEnum } from "@/backend/db/schema/enums";
import { teachers } from "@/backend/db/schema/teachers/teachers";
import { users } from "@/backend/db/schema/users/users";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ExpenseType } from "@/backend/enum";

export const expenses = createTable(
  "expenses",
  {
    id: uuidColumn("id").defaultRandom().primaryKey(),
    // Nullable — set for Salaries (always) and some Logistics (reimbursement).
    teacherId: uuidColumn("teacher_id").references(() => teachers.id, {
      onDelete: "set null",
    }),
    // Snapshot at creation time — survives teacher rename / deactivate.
    teacherName: varcharColumn("teacher_name", { length: 200 }),
    title: varcharColumn("title", { length: 200 }).notNull(),
    type: expenseTypeEnum("type").notNull().$type<ExpenseType>(),
    expenseValue: textColumn("expense_value", { precision: 12, scale: 2 }).notNull(),
    expenseCurrency: currencyCodeEnum("expense_currency").notNull().$type<CurrencyCode>(),
    paymentDate: textColumn("payment_date").notNull(),
    // YYYY-MM string — the accounting month the expense belongs to.
    expenseDate: varcharColumn("expense_date", { length: 7 }).notNull(),
    note: textColumn("note"),
    // Provenance — null for manual, 'carryover_balances' for Plan 5.
    sourceEntity: varcharColumn("source_entity", { length: 64 }),
    sourceEntityId: uuidColumn("source_entity_id"),
    createdByUserId: uuidColumn("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "set null" }),
    // Soft-delete (AC-6.1).
    deletedAt: timestampColumn("deleted_at", { withTimezone: true, precision: 3 }),
    deletedByUserId: uuidColumn("deleted_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    deletedReason: varcharColumn("deleted_reason", { length: 500 }),
    createdAt: timestampColumn("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  (table) => [
    index("expenses_teacher_id_idx").on(table.teacherId),
    index("expenses_type_idx").on(table.type),
    index("expenses_payment_date_idx").on(table.paymentDate),
    index("expenses_expense_date_idx").on(table.expenseDate),
    index("expenses_source_entity_idx").on(table.sourceEntity),
    index("expenses_source_entity_id_idx").on(table.sourceEntityId),
    index("expenses_created_by_user_id_idx").on(table.createdByUserId),
    index("expenses_deleted_at_idx").on(table.deletedAt),
    // Composite index for the most common filter (type + expenseDate).
    index("expenses_type_expense_date_idx").on(table.type, table.expenseDate),
  ],
);
```

### 2.4 Drizzle relations

**File:** `backend/db/drizzleRelations.ts` (additive)

```ts
import { expenses } from "@/backend/db/schema/expenses/expenses";

export const expensesRelations = relations(expenses, ({ one }) => ({
  teacher: one(teachers, { fields: [expenses.teacherId], references: [teachers.id] }),
  createdByUser: one(users, { fields: [expenses.createdByUserId], references: [users.id] }),
  deletedByUser: one(users, { fields: [expenses.deletedByUserId], references: [users.id] }),
}));
```

### 2.5 Migration policy

- New table — fully additive; existing rows unaffected.
- New enum type `expense_type` — created via `CREATE TYPE` (transactional).
- Zero downtime for existing flows.

---

## 3. Service Layer

**File:** `backend/services/expenses/expense.service.ts`

### 3.1 New input/output types

**File:** `backend/types/expenses/expense.types.ts`

```ts
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ExpenseType } from "@/backend/enum";

export interface CreateExpenseInput {
  teacherId?: string | null;
  teacherName?: string | null;
  title: string;
  type: ExpenseType;
  expenseValue: string;        // numeric as string
  expenseCurrency: CurrencyCode;
  paymentDate: string;        // ISO date
  expenseDate: string;        // YYYY-MM
  note?: string | null;
  // Provenance — null for manual UI entries; set by Plan 5.
  sourceEntity?: string | null;
  sourceEntityId?: string | null;
  createdByUserId: string;
  clientRequestId?: string | null;
}

export interface CreateExpenseInternalInput extends CreateExpenseInput {
  // Marker — internal calls bypass the permission check.
  __internal?: true;
}

export interface UpdateExpenseInput {
  id: string;
  title?: string | null;
  type?: ExpenseType | null;
  expenseValue?: string | null;
  expenseCurrency?: CurrencyCode | null;
  paymentDate?: string | null;
  expenseDate?: string | null;
  note?: string | null;
  teacherId?: string | null;
  teacherName?: string | null;
  actorUserId: string;
}

export interface DeleteExpenseInput {
  id: string;
  reason?: string | null;
  actorUserId: string;
}

export interface BulkDeleteExpensesInput {
  ids: readonly string[];
  reason?: string | null;
  actorUserId: string;
}

export interface SoftDeleteInput {
  id: string;
  actorUserId: string;
  reason?: string | null;
  tx?: PgTransaction; // when called from Plan 5's tx, reuse it
}

export interface ExpenseFilters {
  title?: string | null;
  types?: readonly ExpenseType[] | null;
  expenseDate?: string | null;        // YYYY-MM
  paymentDateFrom?: string | null;
  paymentDateTo?: string | null;
  includeDeleted?: boolean | null;
}

export interface ExpenseRow {
  id: string;
  teacherId: string | null;
  teacherName: string | null;
  title: string;
  type: ExpenseType;
  expenseValue: string;
  expenseCurrency: CurrencyCode;
  paymentDate: string;
  expenseDate: string;
  note: string | null;
  sourceEntity: string | null;
  sourceEntityId: string | null;
  createdByUserId: string;
  createdByName: string;
  deletedAt: string | null;
  deletedByUserId: string | null;
  deletedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpensePage {
  rows: ExpenseRow[];
  totalCount: number;
  aggregates: {
    totalValue: string;
    dominantCurrency: CurrencyCode;
    rowCountByType: Record<ExpenseType, number>;
  };
}
```

### 3.2 `create` (UI entry point) + `createInternal` (Plan 5 cross-call)

```ts
export async function create(
  input: CreateExpenseInput,
  actorUserId: string,
  tErrors: ErrorsLabels,
): Promise<ExpenseRow> {
  await requirePermission(actorUserId, AppPermission.ACCOUNTING_EXPENSES_MANAGE, tErrors);
  return db.transaction(async (tx) => createInternal(input, tx, tErrors));
}

/**
 * Internal entry point — bypasses permission check (caller owns it).
 * Uses the caller's tx when provided; opens its own when not.
 *
 * Called by:
 *   - Plan 5's `bulkCarryoverToExpense` (with its own tx).
 *   - `create` (above) after the permission check (opens its own tx).
 */
export async function createInternal(
  input: CreateExpenseInput,
  tx: PgTransaction,
  tErrors: ErrorsLabels,
): Promise<ExpenseRow> {
  validateCreateInput(input, tErrors);

  // Idempotency check (only when clientRequestId is provided).
  if (input.clientRequestId) {
    const existing = await AuditLogRepository.findRecentByActorAndHash(
      input.createdByUserId, "EXPENSE_CREATE",
      deriveCreateIdempotencyKey(input),
      /*windowSeconds=*/30, tx,
    );
    if (existing) return reconstructFromAuditLog(existing, tx);
  }

  const sanitizedTitle = sanitizePlainText(input.title).slice(0, 200);
  const sanitizedNote = input.note ? sanitizePlainText(input.note).slice(0, 2000) : null;
  const teacherName = input.teacherName ?? (input.teacherId
    ? await TeacherRepository.fetchDisplayName(input.teacherId, tx)
    : null);

  const [row] = await tx.insert(expenses)
    .values({
      teacherId: input.teacherId ?? null,
      teacherName: teacherName ?? null,
      title: sanitizedTitle,
      type: input.type,
      expenseValue: input.expenseValue,
      expenseCurrency: input.expenseCurrency,
      paymentDate: input.paymentDate,
      expenseDate: input.expenseDate,
      note: sanitizedNote,
      sourceEntity: input.sourceEntity ?? null,
      sourceEntityId: input.sourceEntityId ?? null,
      createdByUserId: input.createdByUserId,
    })
    .returning();

  if (!row) throw new DomainError("EXPENSE_CREATE_FAILED", "expenses insert returned no row");

  await AuditLogRepository.create(tx, {
    actorUserId: input.createdByUserId,
    action: "EXPENSE_CREATE",
    entityType: "expenses",
    entityId: row.id,
    metadata: {
      idempotencyKey: input.clientRequestId ? deriveCreateIdempotencyKey(input) : null,
      type: row.type,
      value: row.expenseValue,
      currency: row.expenseCurrency,
      sourceEntity: row.sourceEntity,
      sourceEntityId: row.sourceEntityId,
    },
  });

  logger.info("Expense created", {
    actorUserId: input.createdByUserId,
    expenseId: row.id,
    type: row.type,
    value: row.expenseValue,
    currency: row.expenseCurrency,
  });

  return mapToExpenseRow(row);
}

function validateCreateInput(input: CreateExpenseInput, tErrors: ErrorsLabels) {
  if (!input.title?.trim()) throw new DomainError("EXPENSE_TITLE_REQUIRED", tErrors.expenses.titleRequired);
  if (!input.expenseValue) throw new DomainError("EXPENSE_VALUE_REQUIRED", tErrors.expenses.valueRequired);
  if (Number(input.expenseValue) < 0) throw new DomainError("EXPENSE_VALUE_NEGATIVE", tErrors.expenses.valueNegative);
  if (!input.expenseCurrency) throw new DomainError("EXPENSE_CURRENCY_REQUIRED", tErrors.expenses.currencyRequired);
  if (!input.paymentDate) throw new DomainError("PAYMENT_DATE_INVALID", tErrors.expenses.paymentDateInvalid);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.paymentDate)) throw new DomainError("PAYMENT_DATE_INVALID", tErrors.expenses.paymentDateInvalid);
  if (!input.expenseDate || !/^\d{4}-\d{2}$/.test(input.expenseDate)) throw new DomainError("EXPENSE_DATE_INVALID", tErrors.expenses.expenseDateInvalid);
}
```

### 3.3 `update`

```ts
export async function update(
  input: UpdateExpenseInput,
  tErrors: ErrorsLabels,
): Promise<ExpenseRow> {
  await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_EXPENSES_MANAGE, tErrors);

  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(expenses)
      .where(eq(expenses.id, input.id)).forUpdate();
    if (!existing) throw new DomainError("EXPENSE_NOT_FOUND", tErrors.expenses.notFound);
    if (existing.deletedAt) throw new DomainError("EXPENSE_ALREADY_DELETED", tErrors.expenses.alreadyDeleted);

    // AC-3.3 — Salaries expenses are read-only on `type`.
    if (existing.type === ExpenseType.SALARIES && input.type && input.type !== existing.type) {
      throw new DomainError("EXPENSE_TYPE_IMMUTABLE_FOR_SALARIES", tErrors.expenses.typeImmutableForSalaries);
    }
    // Salaries expenses also have immutable value (Q5).
    if (existing.type === ExpenseType.SALARIES && input.expenseValue && input.expenseValue !== existing.expenseValue) {
      throw new DomainError("EXPENSE_VALUE_IMMUTABLE_FOR_SALARIES", tErrors.expenses.valueImmutableForSalaries);
    }

    if (input.expenseDate && !/^\d{4}-\d{2}$/.test(input.expenseDate)) {
      throw new DomainError("EXPENSE_DATE_INVALID", tErrors.expenses.expenseDateInvalid);
    }
    if (input.paymentDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.paymentDate)) {
      throw new DomainError("PAYMENT_DATE_INVALID", tErrors.expenses.paymentDateInvalid);
    }

    const patch = {
      title: input.title ? sanitizePlainText(input.title).slice(0, 200) : undefined,
      type: input.type ?? undefined,
      expenseValue: input.expenseValue ?? undefined,
      expenseCurrency: input.expenseCurrency ?? undefined,
      paymentDate: input.paymentDate ?? undefined,
      expenseDate: input.expenseDate ?? undefined,
      note: input.note !== undefined
        ? (input.note ? sanitizePlainText(input.note).slice(0, 2000) : null)
        : undefined,
      teacherId: input.teacherId !== undefined ? input.teacherId : undefined,
      teacherName: input.teacherName !== undefined ? input.teacherName : undefined,
      updatedAt: new Date(),
    };

    const [updated] = await tx.update(expenses)
      .set(patch)
      .where(eq(expenses.id, input.id))
      .returning();

    await AuditLogRepository.create(tx, {
      actorUserId: input.actorUserId,
      action: "EXPENSE_UPDATE",
      entityType: "expenses",
      entityId: input.id,
      metadata: {
        previousValues: pickChanged(existing, patch),
        newValues: patch,
      },
    });

    return mapToExpenseRow(updated);
  });
}
```

### 3.4 `softDelete` (shared by UI delete + Plan 5 unpay)

```ts
export async function softDelete(
  { id, actorUserId, reason, tx }: SoftDeleteInput,
  tErrors: ErrorsLabels,
): Promise<ExpenseRow> {
  const useTx = tx ?? db;
  const inExternalTx = tx != null;

  async function run(tx: PgTransaction) {
    const [existing] = await tx.select().from(expenses)
      .where(eq(expenses.id, id)).forUpdate();
    if (!existing) throw new DomainError("EXPENSE_NOT_FOUND", tErrors.expenses.notFound);

    // AC-6.2 — idempotent if already soft-deleted.
    if (existing.deletedAt) {
      return mapToExpenseRow(existing);
    }

    // AC-3.5 — Salaries expenses with paid carryover must go via Unpay.
    if (existing.sourceEntity === "carryover_balances" && existing.sourceEntityId) {
      const [carryover] = await tx.select().from(carryoverBalances)
        .where(eq(carryoverBalances.id, existing.sourceEntityId)).forUpdate();
      if (carryover?.isPaid) {
        throw new DomainError("EXPENSE_DELETE_VIA_UNPAY", tErrors.expenses.deleteViaUnpay);
      }
    }

    const [updated] = await tx.update(expenses)
      .set({
        deletedAt: new Date(),
        deletedByUserId: actorUserId,
        deletedReason: reason ? sanitizePlainText(reason).slice(0, 500) : null,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, id))
      .returning();

    await AuditLogRepository.create(tx, {
      actorUserId,
      action: "EXPENSE_DELETE",
      entityType: "expenses",
      entityId: id,
      metadata: { reason: reason ?? null },
    });

    logger.info("Expense soft-deleted", { actorUserId, expenseId: id, reason });

    return mapToExpenseRow(updated);
  }

  return inExternalTx ? run(tx!) : db.transaction(run);
}
```

### 3.5 `bulkDelete` (atomic)

```ts
export async function bulkDelete(
  input: BulkDeleteExpensesInput,
  tErrors: ErrorsLabels,
): Promise<{ deleted: string[]; auditLogIds: string[] }> {
  await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_EXPENSES_MANAGE, tErrors);

  return db.transaction(async (tx) => {
    const deleted: string[] = [];
    const auditLogIds: string[] = [];
    for (const id of input.ids) {
      // softDelete reuses the tx; throws on AC-3.5-protected rows.
      const row = await softDelete(
        { id, actorUserId: input.actorUserId, reason: input.reason, tx },
        tErrors,
      );
      deleted.push(row.id);
    }
    return { deleted, auditLogIds };
  });
}
```

### 3.6 `getReport` (read model)

```ts
export async function getReport(
  actorUserId: string,
  filters: ExpenseFilters,
  pagination: { limit: number; offset: number },
  tErrors: ErrorsLabels,
): Promise<ExpensePage> {
  await requirePermission(actorUserId, AppPermission.ACCOUNTING_EXPENSES_VIEW, tErrors);

  const { rows, totalCount } = await ExpenseRepository.findFiltered(
    filters, pagination,
  );

  const totalValue = rows.reduce((s, r) => s + Number(r.expenseValue), 0).toFixed(2);
  const dominantCurrency = pickDominantCurrency(rows);
  const rowCountByType = countBy(rows, (r) => r.type);

  return {
    rows: rows.map(mapToExpenseRow),
    totalCount,
    aggregates: { totalValue, dominantCurrency, rowCountByType },
  };
}
```

### 3.7 Helpers

- `deriveCreateIdempotencyKey(input)` → sha256 of (`title`, `type`,
  `expenseValue`, `expenseCurrency`, `paymentDate`, `expenseDate`,
  `teacherId`, `sourceEntity`, `sourceEntityId`, `createdByUserId`).
- `pickChanged(existing, patch)` → returns only the fields that
  actually changed (for `audit_logs.metadata.previousValues`).
- `reconstructFromAuditLog(auditLog, tx)` → re-reads the expense row
  by `entityId` from `audit_logs` so idempotent re-submit returns
  the live row, not a stale snapshot.

---

## 4. GraphQL Layer (Pothos)

### 4.1 New types

**File:** `backend/graphql/pothos/expenses/expense.pothos.ts`

```ts
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { ExpenseType } from "@/backend/enum";

export const ExpenseTypePothosEnum = gqlSchemaBuilder.enumType(ExpenseType, {
  name: "ExpenseType",
  description: "Salaries | Marketing | Logistics | Technology",
});

export const ExpensePothosObject = gqlSchemaBuilder
  .objectRef<ExpenseRow>("Expense")
  .implement({
    fields: (t) => ({
      id: t.exposeID("id"),
      teacherId: t.exposeID("teacherId", { nullable: true }),
      teacherName: t.exposeString("teacherName", { nullable: true }),
      title: t.exposeString("title"),
      type: t.expose("type", { type: ExpenseTypePothosEnum }),
      expenseValue: t.exposeString("expenseValue"),
      expenseCurrency: t.expose("expenseCurrency", { type: CurrencyCodePothosObject }),
      paymentDate: t.exposeString("paymentDate"),
      expenseDate: t.exposeString("expenseDate"),
      note: t.exposeString("note", { nullable: true }),
      sourceEntity: t.exposeString("sourceEntity", { nullable: true }),
      sourceEntityId: t.exposeID("sourceEntityId", { nullable: true }),
      createdByUserId: t.exposeID("createdByUserId"),
      createdByName: t.exposeString("createdByName"),
      deletedAt: t.expose("deletedAt", { type: "DateTime", nullable: true }),
      deletedByUserId: t.exposeID("deletedByUserId", { nullable: true }),
      deletedReason: t.exposeString("deletedReason", { nullable: true }),
      createdAt: t.expose("createdAt", { type: "DateTime" }),
      updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    }),
  });

export const ExpensePagePothosObject = gqlSchemaBuilder
  .objectRef<ExpensePage>("ExpensePage")
  .implement({
    fields: (t) => ({
      rows: t.field({ type: [ExpensePothosObject], resolve: (p) => p.rows }),
      totalCount: t.exposeInt("totalCount"),
      totalValue: t.exposeString("totalValue"),
      dominantCurrency: t.expose("dominantCurrency", { type: CurrencyCodePothosObject }),
      rowCountByType: t.field({ type: "JSON", resolve: (p) => p.aggregates.rowCountByType }),
    }),
  });

export const ExpenseFilterPothosInput = gqlSchemaBuilder.inputType("ExpenseFilter", {
  fields: (t) => ({
    title: t.string({ required: false }),
    types: t.field({ type: [ExpenseTypePothosEnum], required: false }),
    expenseDate: t.string({ required: false }), // YYYY-MM
    paymentDateFrom: t.string({ required: false }),
    paymentDateTo: t.string({ required: false }),
    includeDeleted: t.booleanColumn({ required: false }),
  }),
});

export const CreateExpenseInputPothos = gqlSchemaBuilder.inputType("CreateExpenseInput", {
  fields: (t) => ({
    teacherId: t.id({ required: false }),
    title: t.string({ required: true }),
    type: t.field({ type: ExpenseTypePothosEnum, required: true }),
    expenseValue: t.string({ required: true }),
    expenseCurrency: t.field({ type: CurrencyCodePothosObject, required: true }),
    paymentDate: t.string({ required: true }),
    expenseDate: t.string({ required: true }),
    note: t.string({ required: false }),
    clientRequestId: t.string({ required: false }),
  }),
});

export const UpdateExpenseInputPothos = gqlSchemaBuilder.inputType("UpdateExpenseInput", {
  fields: (t) => ({
    id: t.id({ required: true }),
    title: t.string({ required: false }),
    type: t.field({ type: ExpenseTypePothosEnum, required: false }),
    expenseValue: t.string({ required: false }),
    expenseCurrency: t.field({ type: CurrencyCodePothosObject, required: false }),
    paymentDate: t.string({ required: false }),
    expenseDate: t.string({ required: false }),
    note: t.string({ required: false }),
    teacherId: t.id({ required: false }),
    teacherName: t.string({ required: false }),
  }),
});
```

> **Note on AC-2.5:** `CreateExpenseInputPothos.type` accepts all 4
> values, but the **UI** hides `Salaries`. The server additionally
> rejects `Salaries` from the public `createExpense` mutation with
> `EXPENSE_SALARIES_VIA_CARRYOVER_ONLY` — only `createInternal`
> (Plan 5's path) can write `Salaries` rows.

### 4.2 New queries

**File:** `backend/graphql/query/expenses/expense.query.ts`

```ts
gqlSchemaBuilder.queryField("expenses", (t) =>
  t.field({
    type: ExpensePagePothosObject,
    description: "Paginated, filtered expense ledger.",
    authScopes: { permission: AppPermission.ACCOUNTING_EXPENSES_VIEW },
    args: {
      filter: t.arg({ type: ExpenseFilterPothosInput, required: false }),
      limit: t.arg.int({ required: false, defaultValue: 50 }),
      offset: t.arg.int({ required: false, defaultValue: 0 }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return ExpenseService.getReport(
        actorUserId, args.filter ?? {},
        { limit: args.limit ?? 50, offset: args.offset ?? 0 },
        ctx.t().errorsTranslations,
      );
    },
  })
);

gqlSchemaBuilder.queryField("expense", (t) =>
  t.field({
    type: ExpensePothosObject,
    description: "Single expense by id (for drill-down).",
    authScopes: { permission: AppPermission.ACCOUNTING_EXPENSES_VIEW },
    args: { id: t.arg.id({ required: true }) },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return ExpenseService.getById(actorUserId, args.id, ctx.t().errorsTranslations);
    },
  })
);
```

### 4.3 New mutations

**File:** `backend/graphql/mutation/expenses/expense.mutation.ts`

Four mutation fields: `createExpense`, `updateExpense`, `deleteExpense`,
`bulkDeleteExpenses`. Each follows the standard shape:
`authScopes: { permission: ACCOUNTING_EXPENSES_MANAGE }`, `args`,
`resolve` that calls the corresponding service method with
`actorUserId` from `requireAuth(ctx)`.

> **No public mutation for `createInternal`** — that's a
> TypeScript-only service call from Plan 5 (AC-5.6).

### 4.4 CSV export endpoint

**File:** `app/api/expenses/export/route.ts` — thin Next.js Route
Handler identical in shape to the payroll export (Plan 3 §4.4) and the
carryover export (Plan 5 §4.4).

---

## 5. Frontend

### 5.1 Apollo documents

**File:** `frontend/common/graphql/sharedDocuments/expenses/expense.documents.ts`

Defines: `EXPENSES_QUERY`, `EXPENSE_QUERY`,
`CREATE_EXPENSE_MUTATION`, `UPDATE_EXPENSE_MUTATION`,
`DELETE_EXPENSE_MUTATION`, `BULK_DELETE_EXPENSES_MUTATION`.

### 5.2 Routes

| Route                            | File                                                    | Purpose                                  |
|----------------------------------|---------------------------------------------------------|------------------------------------------|
| `/accounting/expenses`           | `app/(dashboard)/accounting/expenses/page.tsx`         | Expense Ledger list                      |
| `/accounting/expenses/[id]`      | `app/(dashboard)/accounting/expenses/[id]/page.tsx`    | Detail drawer (audit log timeline)       |

### 5.3 Expense Ledger list page

**Component:** `frontend/common/views/dashboard/billing/accounting/expenses/ExpenseLedgerContainer.tsx`

- MUI `DataGrid` (v9) with columns: title, type chip, teacher (when set),
  value + currency, payment date, expense month, source chip (Manual /
  From Carryover), note, created-at, actions (Edit / Delete / View Source).
- Toolbar (gated on `_MANAGE`): Add New, Bulk Delete, Export CSV.
- Aggregate footer: total value + dominant currency + count by type.
- Empty state: "No expenses match the current filters."

### 5.4 Add New / Edit modal

**Component:** `frontend/common/views/dashboard/billing/accounting/expenses/ExpenseFormDialog.tsx`

Fields per AC-3.1. The `type` dropdown hides `Salaries` (AC-2.5). When
editing a `Salaries` expense (rare — only via drill-down), the `type`
and `expenseValue` fields are disabled (AC-3.3 + Q5). Validation:
- `title` non-empty, max 200 chars.
- `expenseValue >= 0`, max 12 digits + 2 decimals.
- `expenseCurrency` required.
- `paymentDate` valid ISO date.
- `expenseDate` valid `YYYY-MM`.

### 5.5 Filter bar

**Component:** `frontend/common/views/dashboard/billing/accounting/expenses/ExpenseFilterBar.tsx`

Title search (debounced 300 ms), type multi-select, expense month
picker (`YYYY-MM`), payment date range picker, "Include deleted"
toggle (default off), Clear button.

### 5.6 Source chip + drill-down

**Component:** `frontend/common/views/dashboard/billing/accounting/expenses/ExpenseSourceChip.tsx`

Renders "Manual" (grey, no click) when `sourceEntity IS NULL`; renders
"From Carryover" (blue, clickable) when `sourceEntity = 'carryover_balances'`.
Clicking opens the CarryoverDetailDrawer (Plan 5) for the linked
`sourceEntityId` — done via a shared Apollo `client.query` +
`CarryoverDetailDrawer` open-state.

### 5.7 Zustand store

**File:** `frontend/common/stores/expenseFilterStore.ts`

`title`, `types`, `expenseDate`, `paymentDateFrom`, `paymentDateTo`,
`includeDeleted`, `page`, `pageSize`, `selectedIds`; `reset()`,
`clearFilters()`, `toggleSelected(id)`, `clearSelection()`.

---

## 6. UX & Navigation

### 6.1 Sidebar nav item

**File:** `frontend/common/views/dashboard/config/navigationConfig.ts`

Add to `SIDEBAR_NAV_ITEMS` under the existing `grp_finance` group:

```ts
{
  key: "accounting-expenses",
  labelKey: "accountingExpenses",
  iconKey: "receiptLong",
  href: "/accounting/expenses",
  section: "main",
  permission: PAGE_PERMISSIONS.accountingExpensesView,
  groupId: "grp_finance",
},
```

### 6.2 Page permissions

**File:** `frontend/common/types/page-permissions.types.ts`

```ts
accountingExpensesView: [AppPermission.ACCOUNTING_EXPENSES_VIEW] as PagePermissions,
accountingExpensesManage: [AppPermission.ACCOUNTING_EXPENSES_MANAGE] as PagePermissions,
```

---

## 7. i18n

### 7.1 Namespace

**File:** `shared/locale/types/dashboard/billing/expenses.ts`

New namespace `dashboard.accounting.expenses` with keys:

| Key                                  | EN                                                       | AR                                                       |
|--------------------------------------|----------------------------------------------------------|----------------------------------------------------------|
| `title`                              | "Expense Ledger"                                         | "سجل المصروفات"                                          |
| `column.title`                       | "Title"                                                  | "العنوان"                                                |
| `column.type`                        | "Type"                                                  | "النوع"                                                  |
| `column.teacher`                     | "Teacher"                                                | "المعلم"                                                  |
| `column.value`                       | "Value"                                                  | "القيمة"                                                 |
| `column.paymentDate`                | "Payment date"                                          | "تاريخ الدفع"                                            |
| `column.expenseDate`                | "Expense month"                                         | "شهر المصروف"                                            |
| `column.source`                     | "Source"                                                | "المصدر"                                                 |
| `column.note`                       | "Note"                                                  | "ملاحظة"                                                  |
| `column.createdAt`                  | "Created at"                                            | "أُنشئ في"                                               |
| `type.Salaries`                     | "Salaries"                                              | "الرواتب"                                                |
| `type.Marketing`                    | "Marketing"                                             | "التسويق"                                                |
| `type.Logistics`                    | "Logistics"                                             | "اللوجستيات"                                             |
| `type.Technology`                   | "Technology"                                            | "التقنية"                                                |
| `source.Manual`                     | "Manual"                                                | "يدوي"                                                   |
| `source.FromCarryover`             | "From Carryover"                                        | "من الترحيل"                                            |
| `action.addNew`                    | "Add New"                                               | "إضافة جديد"                                            |
| `action.edit`                      | "Edit"                                                  | "تعديل"                                                  |
| `action.delete`                    | "Delete"                                                | "حذف"                                                    |
| `action.bulkDelete`                | "Bulk Delete"                                           | "حذف جماعي"                                              |
| `action.viewSource`                | "View source"                                           | "عرض المصدر"                                            |
| `modal.form.title`                 | "Title"                                                 | "العنوان"                                                |
| `modal.form.type`                  | "Type"                                                  | "النوع"                                                  |
| `modal.form.teacher`               | "Teacher (optional)"                                   | "المعلم (اختياري)"                                      |
| `modal.form.value`                 | "Value"                                                 | "القيمة"                                                 |
| `modal.form.currency`              | "Currency"                                              | "العملة"                                                 |
| `modal.form.paymentDate`           | "Payment date"                                          | "تاريخ الدفع"                                            |
| `modal.form.expenseDate`           | "Expense month"                                         | "شهر المصروف"                                            |
| `modal.form.note`                  | "Note"                                                  | "ملاحظة"                                                  |
| `validation.titleRequired`         | "Title is required."                                    | "العنوان مطلوب."                                          |
| `validation.valueNegative`         | "Value cannot be negative."                             | "لا يمكن أن تكون القيمة سالبة."                          |
| `validation.expenseDateInvalid`    | "Expense month must be in YYYY-MM format."              | "يجب أن يكون شهر المصروف بصيغة YYYY-MM."                |
| `validation.paymentDateInvalid`    | "Payment date must be a valid date."                   | "يجب أن يكون تاريخ الدفع تاريخًا صالحًا."                |
| `error.notFound`                   | "Expense not found."                                    | "المصروف غير موجود."                                    |
| `error.alreadyDeleted`             | "Expense is already deleted."                          | "المصروف محذوف بالفعل."                                  |
| `error.deleteViaUnpay`             | "This salary expense must be removed via the Carryover Unpay flow." | "يجب حذف مصروف الراتب هذا عبر تدفق (إلغاء دفع الترحيل)." |
| `error.typeImmutableForSalaries`   | "Type is read-only for Salaries expenses."              | "النوع للقراءة فقط لمصروفات الرواتب."                    |
| `error.valueImmutableForSalaries`   | "Value is read-only for Salaries expenses."              | "القيمة للقراءة فقط لمصروفات الرواتب."                  |
| `success.created`                 | "Expense created."                                     | "تم إنشاء المصروف."                                      |
| `success.updated`                  | "Expense updated."                                     | "تم تحديث المصروف."                                      |
| `success.deleted`                  | "Expense deleted."                                     | "تم حذف المصروف."                                        |
| `aggregate.totalValue`            | "Total value"                                          | "إجمالي القيمة"                                          |
| `aggregate.rowCount`               | "Rows"                                                 | "الصفوف"                                                  |

### 7.2 Locale snapshot

After adding the namespace, run `bun run locale:snapshots` so the
`public/static/locale-snapshots/{en,ar}/dashboard.accounting.expenses.json`
files are produced.

---

## 8. Testing Strategy

### 8.1 Service-layer tests

**File:** `backend/services/expenses/expense.service.test.ts`

Covers:
- `create` happy path (manual) — `Marketing`, value, currency, audit log emitted.
- `createInternal` happy path (Plan 5 simulation) — `Salaries`, `sourceEntity = 'carryover_balances'`, `sourceEntityId` set, no permission check.
- `create` with `Salaries` type → rejected with `EXPENSE_SALARIES_VIA_CARRYOVER_ONLY`.
- Validation rejections (title empty, value negative, paymentDate invalid, expenseDate invalid).
- `update` happy path; rejects type change on `Salaries` (`EXPENSE_TYPE_IMMUTABLE_FOR_SALARIES`).
- `update` rejects value change on `Salaries` (`EXPENSE_VALUE_IMMUTABLE_FOR_SALARIES`).
- `softDelete` happy path (sets `deletedAt` + `deletedByUserId` + `deletedReason` + audit log).
- `softDelete` idempotent when already soft-deleted.
- `softDelete` rejects `Salaries` expense whose carryover `isPaid = true` (`EXPENSE_DELETE_VIA_UNPAY`).
- `softDelete` accepts `Salaries` expense whose carryover `isPaid = false`.
- `bulkDelete` atomic — 1 protected row rolls back whole batch.
- Idempotent re-submit with `clientRequestId`.
- Permission denied → `InsufficientPermissions` on `create` / `update` / `delete` / `bulkDelete` (NOT on `createInternal`).
- `getReport` aggregates (totalValue, dominantCurrency, rowCountByType).
- `getReport` filter combinations (title, types, expenseDate, paymentDate range, includeDeleted).

**File:** `backend/services/expenses/expense-internal.service.test.ts` (Plan 5 cross-call simulation)
- Plan 5 calls `createInternal` inside its own tx → expense row visible after commit.
- Plan 5 rolls back its tx → expense row NOT visible (atomic).
- Plan 5 calls `softDelete` (in `unpayCarryoverBalance`) inside its own tx → expense soft-deleted after commit.
- Plan 5 rolls back its tx → expense NOT soft-deleted (atomic).

### 8.2 Repository tests

**File:** `backend/db/test/repo/expenses/expense.repository.test.ts`

- Filter combinations (title ILIKE, types IN, expenseDate, paymentDate range, includeDeleted).
- Pagination.
- Aggregate totals (totalValue, dominantCurrency, rowCountByType).
- Index usage on the `expenses_type_expense_date_idx` composite.

### 8.3 GraphQL tests

**File:** `backend/graphql/query/expenses/expense.query.test.ts` + `expense.mutation.test.ts`

- Query returns page shape; respects `limit`/`offset`.
- Permission denied → GraphQL error.
- All mutations: argument-coverage per `docs/testing/mutation-argument-coverage.md`.
- `createExpense` rejects `Salaries` type.
- `deleteExpense` on protected `Salaries` expense → `EXPENSE_DELETE_VIA_UNPAY`.
- `bulkDeleteExpenses` atomic — 1 protected row rolls back whole batch.

### 8.4 Frontend tests

- `ExpenseLedgerContainer.test.tsx` — renders rows; filters debounce; empty state; CSV button hits the right URL; toolbar gated on `_MANAGE`.
- `ExpenseFormDialog.test.tsx` — Add New hides `Salaries`; Edit on `Salaries` disables `type` + `expenseValue`; validation blocks invalid submits; double-click absorbed by `clientRequestId`.
- `ExpenseFilterBar.test.tsx` — type multi-select, expense month picker, payment date range, include-deleted toggle, Clear resets.
- `ExpenseSourceChip.test.tsx` — "Manual" chip renders grey; "From Carryover" chip renders blue + clickable; click opens CarryoverDetailDrawer.

### 8.5 Migration tests

- Additive migration applies cleanly on a populated DB.
- New `expenses` table empty after migration.
- Existing scheduling / payroll / teacher-dues flows regression-green.

### 8.6 Quality loops (per file)

Every touched file passes through:

```
bun run scripts/health/sub-loop.ts <file> --lifecycle codescene
```

---

## 9. Cross-Plan Dependencies

| Plan            | Relationship                                                                                              |
|-----------------|----------------------------------------------------------------------------------------------------------|
| **Plan 5** (`carryover-balance-module`) | Plan 5 calls `ExpenseService.createInternal(input, tx, tErrors)` inside its `bulkCarryoverToExpense` transaction to write `Salaries` expense rows with `sourceEntity = 'carryover_balances'` + `sourceEntityId`. Plan 5 calls `ExpenseService.softDelete({ id, actorUserId, tx }, tErrors)` inside its `unpayCarryoverBalance` transaction. Both calls reuse Plan 5's tx — atomic. |
| **Plan 7** (`profit-loss-dashboard`) | Plan 7 reads `expenses` (filtered to `deletedAt IS NULL`) to compute Total Expenses for the P&L. Plan 7 uses `sourceEntity` to break down Salaries vs Operational expenses if needed. |
| Existing `teacher_dues` + `teacher_payments` | Independent — those are accrual + disbursement ledgers; Plan 6 is the canonical expense ledger. They coexist without overlap. |
| Existing `audit_logs` | Plan 6 emits `EXPENSE_*` rows; corrections are made via soft-delete + re-create, never by editing history. |
| Existing FX module | Independent — `expenseValue` is stored in `expenseCurrency`; no FX conversion at write time. |

---

## 10. Risks & Mitigations

| Risk                                                                    | Mitigation                                                                                          |
|-------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| Plan 5 calls `createInternal` with a stale `tx` (e.g., after a savepoint rollback). | `createInternal` always uses the caller's tx directly; never opens its own tx. Plan 5's tests cover the cross-tx atomicity. |
| Manual UI creates `Salaries` expense despite AC-2.5.                       | UI hides the option; server rejects with `EXPENSE_SALARIES_VIA_CARRYVER_ONLY` on the public `createExpense` mutation. |
| Soft-deleted expenses drift in Plan 7's P&L aggregation.                  | AC-6.6: aggregation query filters `deletedAt IS NULL`; the filter is also exposed via `ExpenseFilters.includeDeleted`. |
| Bulk Delete partial failure leaves inconsistent state.                    | AC-3.7: atomic — any AC-3.5-protected row rolls back the whole batch.                                |
| Concurrent edit + soft-delete on the same row.                            | `forUpdate` lock in `softDelete` and `update`; last-writer-wins on `update`, but `softDelete` always wins (a soft-deleted row cannot be updated). |
| `expenseDate` (YYYY-MM) not validated at the DB layer.                    | CHECK constraint added in §2.3: `expense_date ~ '^\d{4}-\d{2}$'` (regex check).                       |
| Permission scope drift (`_VIEW` vs `_MANAGE`).                            | Documented in §2.2; seed groups updated; mutations re-check via `requirePermission`.                |
| `sourceEntity` provenance drift over time (new modules writing rows).     | §2.3 makes the column nullable + free-form varchar; new modules write their own values without schema change. |

---

## 11. Out-of-Scope (Deferred)

- Receipts / attachments upload.
- Approval workflow for expenses above a threshold.
- Recurring expense templates.
- Restore action for soft-deleted expenses (only `deletedAt` is set in v1).
- Per-currency aggregate totals (single dominant currency in v1).
- Multi-currency conversion at write time.
- Admin-extensible `ExpenseType` enum at runtime (fixed at 4 values in v1).
- Notifications on expense creation / deletion.
- Bulk CSV import of expenses.
