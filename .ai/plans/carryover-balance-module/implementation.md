# Plan 5 — Carryover Balance Module: Implementation

> Companion to `specs.md`. Describes how the Siraj LMS gains a new
> `carryover_balances` table, a `CarryoverBalanceService`, the
> cross-plan wiring to Plan 3 (payroll) and Plan 6 (expenses), and the
> `/accounting/carryover` page.

---

## 1. Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              Next.js 16 App Router                          │
│                                                                            │
│   /accounting/carryover                                                     │
│   ┌───────────────────────────────────────────────────────────┐             │
│   │ CarryoverBalanceContainer                                  │             │
│   │  - Apollo useQuery(CARRYOVER_BALANCES, { variables })     │             │
│   │  - MUI DataGrid (filter: teacher, paid, date, disabled)   │             │
│   │  - Toolbar: Add New | Bulk To Expense | Bulk Delete | CSV  │             │
│   │  - Per-row: Edit | Delete | Unpay | View Sessions          │             │
│   └────────────────────────────────┬──────────────────────────┘             │
└─────────────────────────────────────┼──────────────────────────────────────┘
                                      │ GraphQL (Pothos)
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                          GraphQL Layer (Pothos)                              │
│   Query:    carryoverBalances(filter)   → CarryoverBalancePage            │
│             carryoverBalance(id)         → CarryoverBalance                │
│   Mutation: bulkCreateCarryoverBalances(input) → BulkCreateResult         │
│             bulkCarryoverToExpense(input)      → BulkExpenseResult        │
│             createCarryoverBalance(input)     → CarryoverBalance          │
│             updateCarryoverBalance(input)    → CarryoverBalance          │
│             deleteCarryoverBalance(input)     → DeleteResult              │
│             bulkDeleteCarryoverBalances(input)→ BulkDeleteResult         │
│             unpayCarryoverBalance(input)      → CarryoverBalance          │
└─────────────────────────────────────┬────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                Service Layer (CarryoverBalanceService)                       │
│   bulkCreate(input, actorUserId) → BulkCreateResult                         │
│     - groupInstancesByTeacher()    → map<teacherId, instances[]>          │
│     - validateAllAudited()          → CALCULATED/PARTIALLY/REFUND only     │
│     - validateNotLinked()          → carryover_balance_id IS NULL          │
│     - resolveDominantCurrency()    + FX convert via existing RateResolver │
│     - db.transaction { insert carryover + items + update sessions + audit }│
│   bulkToExpense(input, actorUserId) → BulkExpenseResult                    │
│     - validateAllUnpaid()           → isPaid = false                      │
│     - ExpenseService.create(...)   → Plan 6 (called in same tx)           │
│     - db.transaction { insert expense + mark paid + PAID sessions + audit }│
│   create / update / delete / bulkDelete / unpay                             │
└─────────────────────────────────────┬────────────────────────────────────┘
                                      │ Drizzle ORM
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                          PostgreSQL                                          │
│   carryover_balances (NEW)                                                 │
│     id, teacherId, studentsCount, studentsText, totalDuration,             │
│     payable, teacherCurrency, paid, fromDate, toDate, paymentDate,         │
│     isDisabledTeacher, isPaid, expenseId, note,                            │
│     createdByUserId, createdAt, updatedAt, paidAt, paidByUserId             │
│   carryover_balance_items (NEW)                                            │
│     id, carryoverId, classInstanceId, originalAmount, originalCurrency,    │
│     originalStatus, convertedAmount, convertedCurrency                     │
│   class_instances (EXTENDED — single FK column)                            │
│     + carryover_balance_id  uuid NULL FK→carryover_balances.id              │
│   expenses (Plan 6 — referenced, not owned here)                             │
│   audit_logs (existing — reused for CARRYOVER_* rows)                       │
│   class_status_events (existing — reused for PAYROLL_STATUS_TRANSITION)    │
└────────────────────────────────────────────────────────────────────────────┘
```

**Design principle:** Carryover is an **aggregate settlement artefact**
that sits **on top of** the existing payroll (Plan 3) and teacher-dues
modules. It does **not** re-compute payroll or re-accrue dues; it
groups already-computed sessions into a single payable record per
teacher, then converts that record into an expense (Plan 6) when the
real-world payout happens.

---

## 2. Data Model

### 2.1 New enum: `ExpenseType` (shared with Plan 6)

> Plan 6 owns the canonical `ExpenseType` enum. Plan 5 references it
> via the cross-plan type import. Listed here for clarity only.

```ts
export enum ExpenseType {
  SALARIES = "Salaries",
  MARKETING = "Marketing",
  LOGISTICS = "Logistics",
  TECHNOLOGY = "Technology",
}
```

### 2.2 New permission: `ACCOUNTING_CARRYOVER_VIEW` + `ACCOUNTING_CARRYOVER_MANAGE`

**File:** `backend/enum/permissions/permission.enum.ts`

```ts
// LMS — Accounting / Carryover (Plan 5)
ACCOUNTING_CARRYOVER_VIEW = "accounting.carryover_view",
ACCOUNTING_CARRYOVER_MANAGE = "accounting.carryover_manage",
```

Add to the seed `permission-groups` so the "Accounting" /
"Finance Manager" group gets both by default.

### 2.3 New table: `carryover_balances`

**File:** `backend/db/schema/teachers/carryover-balances.ts`

```ts
import {
  boolean, date, index, numeric, pgTable, text, timestamp, uuid, varchar,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { currencyCodeEnum } from "@/backend/db/schema/enums";
import { classInstances } from "@/backend/db/schema/classes/scheduling";
import { teachers } from "@/backend/db/schema/teachers/teachers";
import { users } from "@/backend/db/schema/users/users";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

export const carryoverBalances = createTable(
  "carryover_balances",
  {
    id: uuidColumn("id").defaultRandom().primaryKey(),
    teacherId: uuidColumn("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "restrict" }),
    studentsCount: integerColumn("students_count"),
    studentsText: varcharColumn("students_text", { length: 500 }),
    // Total billable hours across the aggregated sessions.
    totalDuration: textColumn("total_duration", { precision: 8, scale: 2 }),
    // Aggregate amount owed to the teacher, in teacherCurrency.
    payable: textColumn("payable", { precision: 12, scale: 2 }).notNull(),
    teacherCurrency: currencyCodeEnum("teacher_currency").notNull().$type<CurrencyCode>(),
    // Amount paid so far. Equals `payable` once isPaid = true; 0 otherwise.
    paid: textColumn("paid", { precision: 12, scale: 2 }).notNull().default("0"),
    fromDate: textColumn("from_date"),
    toDate: textColumn("to_date"),
    // Operator-supplied at "Bulk To Expense" time.
    paymentDate: textColumn("payment_date"),
    // Snapshot at creation time — refresh deferred to a future plan.
    isDisabledTeacher: booleanColumn("is_disabled_teacher").notNull().default(false),
    isPaid: booleanColumn("is_paid").notNull().default(false),
    // FK to the expenses row created by "Bulk To Expense" (Plan 6).
    expenseId: uuidColumn("expense_id"),
    note: textColumn("note"),
    createdByUserId: uuidColumn("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "set null" }),
    paidByUserId: uuidColumn("paid_by_user_id")
      .references(() => users.id, { onDelete: "set null" }),
    paidAt: timestampColumn("paid_at", { withTimezone: true, precision: 3 }),
    createdAt: timestampColumn("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  (table) => [
    index("carryover_balances_teacher_id_idx").on(table.teacherId),
    index("carryover_balances_is_paid_idx").on(table.isPaid),
    index("carryover_balances_payment_date_idx").on(table.paymentDate),
    index("carryover_balances_from_to_idx").on(table.fromDate, table.toDate),
    index("carryover_balances_is_disabled_teacher_idx").on(table.isDisabledTeacher),
    index("carryover_balances_expense_id_idx").on(table.expenseId),
    index("carryover_balances_created_by_user_id_idx").on(table.createdByUserId),
    // Partial unique index so a carryover can only be linked to one expense.
    // (Without "WHERE", nulls would defeat uniqueness — Postgres treats distinct NULLs as non-conflicting anyway.)
    index("carryover_balances_expense_id_unique_idx").on(table.expenseId),
  ],
);
```

### 2.4 New table: `carryover_balance_items`

**File:** `backend/db/schema/teachers/carryover-balances.ts` (same file)

```ts
export const carryoverBalanceItems = createTable(
  "carryover_balance_items",
  {
    id: uuidColumn("id").defaultRandom().primaryKey(),
    carryoverId: uuidColumn("carryover_id")
      .notNull()
      .references(() => carryoverBalances.id, { onDelete: "cascade" }),
    classInstanceId: uuidColumn("class_instance_id")
      .notNull()
      .references(() => classInstances.id, { onDelete: "cascade" }),
    // Snapshot of the session's amount + currency at carryover-create time.
    originalAmount: textColumn("original_amount", { precision: 12, scale: 2 }).notNull(),
    originalCurrency: currencyCodeEnum("original_currency").notNull().$type<CurrencyCode>(),
    // Snapshot of the session's calculationStatus at carryover-create time
    // (so delete can revert to the prior state).
    originalStatus: varcharColumn("original_status", { length: 32 }).notNull(),
    // Converted amount in the carryover's dominant currency (NULL when
    // originalCurrency === teacherCurrency — no conversion needed).
    convertedAmount: textColumn("converted_amount", { precision: 12, scale: 2 }),
    convertedCurrency: currencyCodeEnum("converted_currency").$type<CurrencyCode>(),
    createdAt: timestampColumn("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  (table) => [
    index("carryover_balance_items_carryover_id_idx").on(table.carryoverId),
    index("carryover_balance_items_class_instance_id_idx").on(table.classInstanceId),
  ],
);
```

### 2.5 Extended table: `class_instances` (single FK column)

**File:** `backend/db/schema/classes/scheduling.ts` (additive)

```ts
import { carryoverBalances } from "@/backend/db/schema/teachers/carryover-balances";

export const classInstances = createTable("class_instances", {
  // ... existing columns unchanged ...
  // ── Plan 5 additions ───────────────────────────────────────────────
  carryoverBalanceId: uuidColumn("carryover_balance_id").references(
    () => carryoverBalances.id,
    { onDelete: "set null" },
  ),
},
(table) => [
  // ... existing indexes ...
  index("class_instances_carryover_balance_id_idx").on(table.carryoverBalanceId),
]);
```

**Migration policy:**
- New column is nullable → safe additive migration.
- New tables are new (no data migration).
- Existing `class_instances.calculationStatus` transitions (`CALCULATED` →
  `WAITING_PAID` → `PAID`) are wired through Plan 5's service layer, not
  via DB triggers.
- Zero downtime for existing scheduling / payroll flows.

### 2.6 Drizzle relations

**File:** `backend/db/drizzleRelations.ts` (additive)

```ts
import { carryoverBalances, carryoverBalanceItems } from "@/backend/db/schema/teachers/carryover-balances";

export const carryoverBalancesRelations = relations(carryoverBalances, ({ one, many }) => ({
  teacher: one(teachers, { fields: [carryoverBalances.teacherId], references: [teachers.id] }),
  createdByUser: one(users, { fields: [carryoverBalances.createdByUserId], references: [users.id] }),
  paidByUser: one(users, { fields: [carryoverBalances.paidByUserId], references: [users.id] }),
  items: many(carryoverBalanceItems),
}));

export const carryoverBalanceItemsRelations = relations(carryoverBalanceItems, ({ one }) => ({
  carryover: one(carryoverBalances, { fields: [carryoverBalanceItems.carryoverId], references: [carryoverBalances.id] }),
  classInstance: one(classInstances, { fields: [carryoverBalanceItems.classInstanceId], references: [classInstances.id] }),
}));

export const classInstancesRelations = relations(classInstances, ({ one }) => ({
  // ... existing ...
  carryoverBalance: one(carryoverBalances, {
    fields: [classInstances.carryoverBalanceId],
    references: [carryoverBalances.id],
  }),
}));
```

---

## 3. Service Layer

**File:** `backend/services/teachers/carryover-balance.service.ts`

### 3.1 New input/output types

**File:** `backend/types/teachers/carryover-balance.types.ts`

```ts
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import type { CalculationStatus } from "@/backend/enum";

export interface BulkCreateCarryoverInput {
  instanceIds: readonly string[];
  actorUserId: string;
  clientRequestId?: string | null;
  note?: string | null;
}

export interface BulkCreateCarryoverGroupResult {
  teacherId: string;
  carryoverId: string;
  studentsCount: number;
  totalDuration: string; // hours, 2 decimals
  payable: string;
  currency: CurrencyCode;
  instanceIds: string[];
}

export interface BulkCreateCarryoverResult {
  groups: BulkCreateCarryoverGroupResult[];
  totalInstanceIds: string[];
  auditLogIds: string[];
}

export interface BulkToExpenseInput {
  carryoverIds: readonly string[];
  paymentDate: string;        // ISO date
  expenseDate?: string | null; // YYYY-MM; defaults to paymentDate's month
  note?: string | null;
  actorUserId: string;
  clientRequestId?: string | null;
}

export interface BulkToExpenseItemResult {
  carryoverId: string;
  expenseId: string;
  amount: string;
  currency: CurrencyCode;
}

export interface BulkToExpenseResult {
  items: BulkToExpenseItemResult[];
  auditLogIds: string[];
}

export interface CreateCarryoverInput {
  teacherId: string;
  fromDate?: string | null;
  toDate?: string | null;
  payable: string;
  teacherCurrency: CurrencyCode;
  studentsCount?: number | null;
  studentsText?: string | null;
  note?: string | null;
  actorUserId: string;
  clientRequestId?: string | null;
}

export interface UpdateCarryoverInput {
  id: string;
  fromDate?: string | null;
  toDate?: string | null;
  payable?: string | null;
  teacherCurrency?: CurrencyCode | null;
  studentsCount?: number | null;
  studentsText?: string | null;
  note?: string | null;
  actorUserId: string;
}

export interface CarryoverFilters {
  teacherId?: string | null;
  paidStatus?: "Paid" | "Unpaid" | "Both" | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  includeDisabledTeachers?: boolean | null;
  search?: string | null;
}

export interface CarryoverRow {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherAvatarUrl: string | null;
  studentsCount: number | null;
  studentsText: string | null;
  totalDuration: string | null;
  payable: string;
  teacherCurrency: CurrencyCode;
  paid: string;
  fromDate: string | null;
  toDate: string | null;
  paymentDate: string | null;
  isDisabledTeacher: boolean;
  isPaid: boolean;
  expenseId: string | null;
  note: string | null;
  createdAt: string;
  paidAt: string | null;
}

export interface CarryoverPage {
  rows: CarryoverRow[];
  totalCount: number;
  aggregates: {
    totalPayable: string;
    totalPaid: string;
    dominantCurrency: CurrencyCode;
    rowCountByPaid: { paid: number; unpaid: number };
  };
}
```

### 3.2 `bulkCreateCarryoverBalances`

```ts
export async function bulkCreateCarryoverBalances(
  input: BulkCreateCarryoverInput,
  tErrors: ErrorsLabels,
): Promise<BulkCreateCarryoverResult> {
  await requirePermission(
    input.actorUserId,
    AppPermission.ACCOUNTING_CARRYOVER_MANAGE,
    tErrors,
  );

  if (input.instanceIds.length === 0) {
    throw new DomainError("CARRYOVER_NO_INSTANCES", tErrors.carryover.noInstances);
  }

  const idempotencyKey = deriveBulkCreateIdempotencyKey(input);

  return db.transaction(async (tx) => {
    // Idempotency short-circuit.
    const existing = await AuditLogRepository.findRecentByActorAndHash(
      input.actorUserId, "CARRYOVER_CREATE_BULK", idempotencyKey,
      /*windowSeconds=*/60, tx,
    );
    if (existing) {
      return reconstructFromAuditLog(existing);
    }

    // Lock + fetch all instances.
    const instances = await ClassInstanceRepository.getByIdsForUpdate(
      input.instanceIds, tx,
    );
    if (instances.length !== input.instanceIds.length) {
      throw new DomainError("CLASS_INSTANCE_NOT_FOUND", tErrors.classes.notFound);
    }

    // AC-2.3 — all instances must be in an audited state.
    const auditedStates: CalculationStatus[] = [
      CalculationStatus.CALCULATED, CalculationStatus.PARTIALLY, CalculationStatus.REFUND,
    ];
    for (const inst of instances) {
      if (!auditedStates.includes(inst.calculationStatus)) {
        throw new DomainError("CARRYOVER_SESSION_NOT_AUDITED", tErrors.carryover.sessionNotAudited);
      }
    }

    // AC-2.4 — none may already be linked.
    for (const inst of instances) {
      if (inst.carryoverBalanceId != null) {
        throw new DomainError("CARRYOVER_SESSION_ALREADY_LINKED", tErrors.carryover.sessionAlreadyLinked);
      }
    }

    // Group by teacher.
    const groups = groupInstancesByTeacher(instances);

    const results: BulkCreateCarryoverGroupResult[] = [];
    const auditLogIds: string[] = [];

    for (const [teacherId, groupInstances] of groups) {
      const teacher = await TeacherRepository.getById(teacherId, tx);
      if (!teacher) throw new DomainError("TEACHER_NOT_FOUND", tErrors.teachers.notFound);

      const dominantCurrency = resolveDominantCurrency(groupInstances, teacher.rateCurrency);
      const studentNames = await fetchStudentNamesForInstances(groupInstances, tx);
      const studentsText = truncateWithEllipsis(studentNames.join(", "), 500);
      const studentsCount = new Set(groupInstances.map((i) => i.studentId)).size;
      const totalDuration = computeTotalDurationHours(groupInstances);

      // Per-item: convert cross-currency via the existing FX module.
      const items = await Promise.all(groupInstances.map(async (inst) => {
        const originalAmount = inst.teacherPaidAmount ?? "0";
        const originalCurrency = inst.teacherPaidCurrency ?? dominantCurrency;
        let convertedAmount: string | null = null;
        let convertedCurrency: CurrencyCode | null = null;
        if (originalCurrency !== dominantCurrency) {
          const rate = await FxService.getLatestRate(originalCurrency, dominantCurrency, tx);
          if (rate == null) {
            throw new DomainError("CARRYOVER_FX_RATE_MISSING", tErrors.carryover.fxRateMissing);
          }
          convertedAmount = (Number(originalAmount) * Number(rate)).toFixed(2);
          convertedCurrency = dominantCurrency;
        }
        return {
          classInstanceId: inst.id,
          originalAmount,
          originalCurrency,
          originalStatus: inst.calculationStatus,
          convertedAmount,
          convertedCurrency,
        };
      }));

      const payable = items
        .reduce((sum, it) => sum + Number(it.convertedAmount ?? it.originalAmount), 0)
        .toFixed(2);

      const isDisabledTeacher = await TeacherRepository.isDisabled(teacherId, tx);

      const [carryover] = await tx.insert(carryoverBalances)
        .values({
          teacherId,
          studentsCount,
          studentsText,
          totalDuration,
          payable,
          teacherCurrency: dominantCurrency,
          paid: "0",
          fromDate: minDate(groupInstances.map((i) => i.scheduledStartAt)),
          toDate: maxDate(groupInstances.map((i) => i.scheduledStartAt)),
          isDisabledTeacher,
          isPaid: false,
          note: input.note ?? null,
          createdByUserId: input.actorUserId,
        })
        .returning();

      await tx.insert(carryoverBalanceItems).values(
        items.map((it) => ({ carryoverId: carryover.id, ...it })),
      );

      // AC-2.5 — link + transition sessions to WAITING_PAID.
      await tx.update(classInstances)
        .set({
          carryoverBalanceId: carryover.id,
          calculationStatus: CalculationStatus.WAITING_PAID,
          updatedAt: new Date(),
        })
        .where(inArray(classInstances.id, groupInstances.map((i) => i.id)));

      // Emit PAYROLL_STATUS_TRANSITION events (Plan 3 AC-9.4).
      for (const inst of groupInstances) {
        await ClassStatusEventRepository.create(tx, {
          classInstanceId: inst.id,
          eventType: "PAYROLL_STATUS_TRANSITION",
          fromState: { calculationStatus: inst.calculationStatus },
          toState: { calculationStatus: CalculationStatus.WAITING_PAID },
          description: `Linked to carryover ${carryover.id}`,
          actorUserId: input.actorUserId,
          metadata: { carryoverId: carryover.id },
        });
      }

      const auditLog = await AuditLogRepository.create(tx, {
        actorUserId: input.actorUserId,
        action: "CARRYOVER_CREATE",
        entityType: "carryover_balances",
        entityId: carryover.id,
        metadata: {
          idempotencyKey,
          teacherId,
          instanceIds: groupInstances.map((i) => i.id),
          studentsCount,
          totalDuration,
          payable,
          currency: dominantCurrency,
        },
      });
      auditLogIds.push(auditLog.id);

      results.push({
        teacherId,
        carryoverId: carryover.id,
        studentsCount,
        totalDuration,
        payable,
        currency: dominantCurrency,
        instanceIds: groupInstances.map((i) => i.id),
      });
    }

    logger.info("Carryover bulk create", {
      actorUserId: input.actorUserId,
      groupCount: results.length,
      totalInstanceIds: input.instanceIds.length,
    });

    return { groups: results, totalInstanceIds: [...input.instanceIds], auditLogIds };
  });
}
```

### 3.3 `bulkCarryoverToExpense`

```ts
export async function bulkCarryoverToExpense(
  input: BulkToExpenseInput,
  tErrors: ErrorsLabels,
): Promise<BulkToExpenseResult> {
  await requirePermission(
    input.actorUserId,
    AppPermission.ACCOUNTING_CARRYOVER_MANAGE,
    tErrors,
  );

  if (!input.paymentDate) {
    throw new DomainError("PAYMENT_DATE_REQUIRED", tErrors.carryover.paymentDateRequired);
  }
  const expenseDate = input.expenseDate ?? input.paymentDate.slice(0, 7); // YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(expenseDate)) {
    throw new DomainError("EXPENSE_DATE_INVALID", tErrors.carryover.expenseDateInvalid);
  }

  const idempotencyKey = deriveBulkToExpenseIdempotencyKey(input);

  return db.transaction(async (tx) => {
    const existing = await AuditLogRepository.findRecentByActorAndHash(
      input.actorUserId, "CARRYOVER_TO_EXPENSE_BULK", idempotencyKey,
      /*windowSeconds=*/60, tx,
    );
    if (existing) return reconstructFromAuditLog(existing);

    const carryovers = await CarryoverBalanceRepository.getByIdsForUpdate(
      input.carryoverIds, tx,
    );
    if (carryovers.length !== input.carryoverIds.length) {
      throw new DomainError("CARRYOVER_NOT_FOUND", tErrors.carryover.notFound);
    }

    // AC-3.3 — all must be unpaid.
    for (const c of carryovers) {
      if (c.isPaid) throw new DomainError("CARRYOVER_ALREADY_PAID", tErrors.carryover.alreadyPaid);
    }

    const items: BulkToExpenseItemResult[] = [];
    const auditLogIds: string[] = [];

    for (const carryover of carryovers) {
      const teacher = await TeacherRepository.getByIdWithUser(carryover.teacherId, tx);
      const teacherName = teacher?.user?.displayName ?? "Unknown teacher";

      // Plan 6 owns the canonical insert; we call it in the same tx.
      const expense = await ExpenseService.createInternal({
        teacherId: carryover.teacherId,
        teacherName,
        title: `Teacher payout — ${carryover.fromDate ?? "?"} to ${carryover.toDate ?? "?"}`,
        type: ExpenseType.SALARIES,
        expenseValue: carryover.payable,
        expenseCurrency: carryover.teacherCurrency,
        paymentDate: input.paymentDate,
        expenseDate,
        note: input.note ?? null,
        sourceEntity: "carryover_balances",
        sourceEntityId: carryover.id,
        createdByUserId: input.actorUserId,
      }, tx, tErrors);

      const [updated] = await tx.update(carryoverBalances)
        .set({
          isPaid: true,
          paid: carryover.payable,
          paymentDate: input.paymentDate,
          expenseId: expense.id,
          paidAt: new Date(),
          paidByUserId: input.actorUserId,
          updatedAt: new Date(),
        })
        .where(eq(carryoverBalances.id, carryover.id))
        .returning();

      // Transition linked sessions to PAID.
      const linkedInstances = await ClassInstanceRepository.findByCarryoverId(carryover.id, tx);
      for (const inst of linkedInstances) {
        await tx.update(classInstances)
          .set({ calculationStatus: CalculationStatus.PAID, updatedAt: new Date() })
          .where(eq(classInstances.id, inst.id));

        await ClassStatusEventRepository.create(tx, {
          classInstanceId: inst.id,
          eventType: "PAYROLL_STATUS_TRANSITION",
          fromState: { calculationStatus: CalculationStatus.WAITING_PAID },
          toState: { calculationStatus: CalculationStatus.PAID },
          description: `Settled via expense ${expense.id}`,
          actorUserId: input.actorUserId,
          metadata: { carryoverId: carryover.id, expenseId: expense.id },
        });
      }

      const auditLog = await AuditLogRepository.create(tx, {
        actorUserId: input.actorUserId,
        action: "CARRYOVER_TO_EXPENSE",
        entityType: "carryover_balances",
        entityId: carryover.id,
        metadata: {
          idempotencyKey,
          expenseId: expense.id,
          paymentDate: input.paymentDate,
          expenseDate,
          amount: carryover.payable,
          currency: carryover.teacherCurrency,
        },
      });
      auditLogIds.push(auditLog.id);

      items.push({
        carryoverId: carryover.id,
        expenseId: expense.id,
        amount: carryover.payable,
        currency: carryover.teacherCurrency,
      });
    }

    logger.info("Carryover bulk to expense", {
      actorUserId: input.actorUserId,
      carryoverCount: items.length,
      totalAmount: items.reduce((s, i) => s + Number(i.amount), 0),
    });

    return { items, auditLogIds };
  });
}
```

### 3.4 `unpayCarryoverBalance`

```ts
export async function unpayCarryoverBalance(
  input: { id: string; note?: string | null; actorUserId: string },
  tErrors: ErrorsLabels,
): Promise<CarryoverRow> {
  await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_CARRYOVER_MANAGE, tErrors);

  return db.transaction(async (tx) => {
    const [carryover] = await tx.select().from(carryoverBalances)
      .where(eq(carryoverBalances.id, input.id)).forUpdate();
    if (!carryover) throw new DomainError("CARRYOVER_NOT_FOUND", tErrors.carryover.notFound);
    if (!carryover.isPaid) {
      throw new DomainError("CARRYOVER_NOT_PAID", tErrors.carryover.notPaid);
    }

    // Soft-delete the linked expense (Plan 6 owns the soft-delete column).
    if (carryover.expenseId) {
      await ExpenseService.softDelete({
        id: carryover.expenseId, actorUserId: input.actorUserId, tx,
      }, tErrors).catch((err) => {
        // AC-7.4 — if the expense is already deleted, proceed.
        if (err.code !== "EXPENSE_ALREADY_DELETED") throw err;
      });
    }

    const [updated] = await tx.update(carryoverBalances)
      .set({
        isPaid: false, paid: "0", paymentDate: null, expenseId: null,
        paidAt: null, paidByUserId: null, updatedAt: new Date(),
      })
      .where(eq(carryoverBalances.id, input.id))
      .returning();

    // Revert sessions to WAITING_PAID (they were PAID; they cannot return
    // to CALCULATED because the carryover still aggregates them).
    const linkedInstances = await ClassInstanceRepository.findByCarryoverId(input.id, tx);
    for (const inst of linkedInstances) {
      await tx.update(classInstances)
        .set({ calculationStatus: CalculationStatus.WAITING_PAID, updatedAt: new Date() })
        .where(eq(classInstances.id, inst.id));

      await ClassStatusEventRepository.create(tx, {
        classInstanceId: inst.id,
        eventType: "PAYROLL_STATUS_TRANSITION",
        fromState: { calculationStatus: CalculationStatus.PAID },
        toState: { calculationStatus: CalculationStatus.WAITING_PAID },
        description: `Carryover ${input.id} unpaid`,
        actorUserId: input.actorUserId,
        metadata: { carryoverId: input.id, note: input.note ?? null },
      });
    }

    await AuditLogRepository.create(tx, {
      actorUserId: input.actorUserId,
      action: "CARRYOVER_UNPAID",
      entityType: "carryover_balances",
      entityId: input.id,
      metadata: { expenseId: carryover.expenseId, reason: input.note ?? null },
    });

    return mapToCarryoverRow(updated);
  });
}
```

### 3.5 `createCarryoverBalance` / `updateCarryoverBalance` / `deleteCarryoverBalance` / `bulkDeleteCarryoverBalances`

These follow the standard pattern (validate, transaction, audit log). Key points:

- **create** snapshots `isDisabledTeacher` at creation time.
- **update** rejects patches that include `teacherId` (`CARRYOVER_TEACHER_IMMUTABLE`).
- **delete** checks `isPaid = false` (else `CARRYOVER_PAID_CANNOT_DELETE`), then unlinks
  linked sessions (`carryover_balance_id = NULL`, revert `calculationStatus` from
  `originalStatus` stored on `carryover_balance_items`), then hard-deletes the carryover
  + items.
- **bulkDelete** runs each row's delete in the same transaction; any `isPaid = true`
  row rolls back the whole batch (atomic, AC-4.9).

### 3.6 `getReport` (read model)

```ts
export async function getReport(
  actorUserId: string,
  filters: CarryoverFilters,
  pagination: { limit: number; offset: number },
  tErrors: ErrorsLabels,
): Promise<CarryoverPage> {
  await requirePermission(actorUserId, AppPermission.ACCOUNTING_CARRYOVER_VIEW, tErrors);

  const { rows, totalCount } = await CarryoverBalanceRepository.findFiltered(
    filters, pagination,
  );

  const totalPayable = rows.reduce((s, r) => s + Number(r.payable), 0).toFixed(2);
  const totalPaid = rows.reduce((s, r) => s + Number(r.paid), 0).toFixed(2);
  const dominantCurrency = pickDominantCurrency(rows);
  const rowCountByPaid = {
    paid: rows.filter((r) => r.isPaid).length,
    unpaid: rows.filter((r) => !r.isPaid).length,
  };

  return {
    rows: rows.map(mapToCarryoverRow),
    totalCount,
    aggregates: { totalPayable, totalPaid, dominantCurrency, rowCountByPaid },
  };
}
```

### 3.7 Helpers

- `groupInstancesByTeacher(instances)` → `Map<teacherId, instances[]>`.
- `resolveDominantCurrency(instances, fallback)` → currency with most rows; ties
  resolved to `fallback` (the teacher's `rateCurrency`).
- `computeTotalDurationHours(instances)` → `sum(calculatedDuration) / 60`, rounded
  to 2 decimals.
- `truncateWithEllipsis(text, maxLen)` → `text.slice(0, maxLen-3) + "…"` when
  `text.length > maxLen`.
- `deriveBulkCreateIdempotencyKey(input)` → sha256 of (sorted instanceIds, actorUserId).
- `deriveBulkToExpenseIdempotencyKey(input)` → sha256 of (sorted carryoverIds,
  paymentDate, expenseDate, note, actorUserId).

---

## 4. GraphQL Layer (Pothos)

### 4.1 New types

**File:** `backend/graphql/pothos/billing/carryover.pothos.ts`

```ts
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";

export const CarryoverBalancePothosObject = gqlSchemaBuilder
  .objectRef<CarryoverRow>("CarryoverBalance")
  .implement({
    fields: (t) => ({
      id: t.exposeID("id"),
      teacherId: t.exposeID("teacherId"),
      teacherName: t.exposeString("teacherName"),
      teacherAvatarUrl: t.exposeString("teacherAvatarUrl", { nullable: true }),
      studentsCount: t.exposeInt("studentsCount", { nullable: true }),
      studentsText: t.exposeString("studentsText", { nullable: true }),
      totalDuration: t.exposeString("totalDuration", { nullable: true }),
      payable: t.exposeString("payable"),
      teacherCurrency: t.expose("teacherCurrency", { type: CurrencyCodePothosObject }),
      paid: t.exposeString("paid"),
      fromDate: t.exposeString("fromDate", { nullable: true }),
      toDate: t.exposeString("toDate", { nullable: true }),
      paymentDate: t.exposeString("paymentDate", { nullable: true }),
      isDisabledTeacher: t.exposeBoolean("isDisabledTeacher"),
      isPaid: t.exposeBoolean("isPaid"),
      expenseId: t.exposeID("expenseId", { nullable: true }),
      note: t.exposeString("note", { nullable: true }),
      createdAt: t.expose("createdAt", { type: "DateTime" }),
      paidAt: t.expose("paidAt", { type: "DateTime", nullable: true }),
    }),
  });

export const CarryoverPagePothosObject = gqlSchemaBuilder
  .objectRef<CarryoverPage>("CarryoverPage")
  .implement({
    fields: (t) => ({
      rows: t.field({ type: [CarryoverBalancePothosObject], resolve: p => p.rows }),
      totalCount: t.exposeInt("totalCount"),
      totalPayable: t.exposeString("totalPayable"),
      totalPaid: t.exposeString("totalPaid"),
      dominantCurrency: t.expose("dominantCurrency", { type: CurrencyCodePothosObject }),
      rowCountByPaid: t.field({ type: "JSON", resolve: p => p.aggregates.rowCountByPaid }),
    }),
  });

export const CarryoverFilterPothosInput = gqlSchemaBuilder.inputType("CarryoverFilter", {
  fields: (t) => ({
    teacherId: t.id({ required: false }),
    paidStatus: t.string({ required: false }), // "Paid" | "Unpaid" | "Both"
    dateFrom: t.string({ required: false }),
    dateTo: t.string({ required: false }),
    includeDisabledTeachers: t.booleanColumn({ required: false }),
    search: t.string({ required: false }),
  }),
});

export const BulkCreateCarryoverInputPothos = gqlSchemaBuilder.inputType("BulkCreateCarryoverInput", {
  fields: (t) => ({
    instanceIds: t.field({ type: ["ID"], required: true }),
    clientRequestId: t.string({ required: false }),
    note: t.string({ required: false }),
  }),
});

export const BulkToExpenseInputPothos = gqlSchemaBuilder.inputType("BulkToExpenseInput", {
  fields: (t) => ({
    carryoverIds: t.field({ type: ["ID"], required: true }),
    paymentDate: t.string({ required: true }),
    expenseDate: t.string({ required: false }),
    note: t.string({ required: false }),
    clientRequestId: t.string({ required: false }),
  }),
});

export const CreateCarryoverInputPothos = gqlSchemaBuilder.inputType("CreateCarryoverInput", {
  fields: (t) => ({
    teacherId: t.id({ required: true }),
    fromDate: t.string({ required: false }),
    toDate: t.string({ required: false }),
    payable: t.string({ required: true }),
    teacherCurrency: t.field({ type: CurrencyCodePothosObject, required: true }),
    studentsCount: t.int({ required: false }),
    studentsText: t.string({ required: false }),
    note: t.string({ required: false }),
    clientRequestId: t.string({ required: false }),
  }),
});

export const UpdateCarryoverInputPothos = gqlSchemaBuilder.inputType("UpdateCarryoverInput", {
  fields: (t) => ({
    id: t.id({ required: true }),
    fromDate: t.string({ required: false }),
    toDate: t.string({ required: false }),
    payable: t.string({ required: false }),
    teacherCurrency: t.field({ type: CurrencyCodePothosObject, required: false }),
    studentsCount: t.int({ required: false }),
    studentsText: t.string({ required: false }),
    note: t.string({ required: false }),
  }),
});
```

### 4.2 New queries

**File:** `backend/graphql/query/teachers/carryover.query.ts`

```ts
gqlSchemaBuilder.queryField("carryoverBalances", (t) =>
  t.field({
    type: CarryoverPagePothosObject,
    description: "Paginated, filtered carryover balances list.",
    authScopes: { permission: AppPermission.ACCOUNTING_CARRYOVER_VIEW },
    args: {
      filter: t.arg({ type: CarryoverFilterPothosInput, required: false }),
      limit: t.arg.int({ required: false, defaultValue: 50 }),
      offset: t.arg.int({ required: false, defaultValue: 0 }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return CarryoverBalanceService.getReport(
        actorUserId, args.filter ?? {},
        { limit: args.limit ?? 50, offset: args.offset ?? 0 },
        ctx.t().errorsTranslations,
      );
    },
  })
);

gqlSchemaBuilder.queryField("carryoverBalance", (t) =>
  t.field({
    type: CarryoverBalancePothosObject,
    description: "Single carryover balance by id (for drill-down).",
    authScopes: { permission: AppPermission.ACCOUNTING_CARRYOVER_VIEW },
    args: { id: t.arg.id({ required: true }) },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return CarryoverBalanceService.getById(
        actorUserId, args.id, ctx.t().errorsTranslations,
      );
    },
  })
);
```

### 4.3 New mutations

**File:** `backend/graphql/mutation/teachers/carryover.mutation.ts`

Six mutation fields: `bulkCreateCarryoverBalances`, `bulkCarryoverToExpense`,
`createCarryoverBalance`, `updateCarryoverBalance`, `deleteCarryoverBalance`,
`bulkDeleteCarryoverBalances`, `unpayCarryoverBalance`. Each follows the same
shape: `authScopes: { permission: ACCOUNTING_CARRYOVER_MANAGE }`, `args`,
`resolve` that calls the corresponding service method with `actorUserId` from
`requireAuth(ctx)`.

### 4.4 CSV export endpoint

**File:** `app/api/carryover/export/route.ts` — thin Next.js Route Handler
identical in shape to the payroll export (Plan 3 §4.4).

---

## 5. Frontend

### 5.1 Apollo documents

**File:** `frontend/common/graphql/sharedDocuments/teachers/carryover.documents.ts`

Defines: `CARRYOVER_BALANCES_QUERY`, `CARRYOVER_BALANCE_QUERY`,
`BULK_CREATE_CARRYOVER_MUTATION`, `BULK_TO_EXPENSE_MUTATION`,
`CREATE_CARRYOVER_MUTATION`, `UPDATE_CARRYOVER_MUTATION`,
`DELETE_CARRYOVER_MUTATION`, `BULK_DELETE_CARRYOVER_MUTATION`,
`UNPAY_CARRYOVER_MUTATION`.

### 5.2 Routes

| Route                                | File                                                          | Purpose                                  |
|--------------------------------------|---------------------------------------------------------------|------------------------------------------|
| `/accounting/carryover`              | `app/(dashboard)/accounting/carryover/page.tsx`              | Carryover Balance list                   |
| `/accounting/carryover/[id]`         | `app/(dashboard)/accounting/carryover/[id]/page.tsx`        | Detail drawer (linked sessions)          |

### 5.3 Carryover list page

**Component:** `frontend/common/views/dashboard/billing/accounting/carryover/CarryoverContainer.tsx`

- MUI `DataGrid` (v9) with columns: teacher, students count, students text,
  total duration (hours), payable + currency, paid + currency, from / to dates,
  payment date, disabled chip, paid chip, actions (Edit / Delete / Unpay /
  View Sessions).
- Toolbar (gated on `_MANAGE`): Add New, Bulk To Expense (only when
  selected rows are all unpaid), Bulk Delete, Export CSV.
- Aggregate footer: total payable, total paid, paid vs unpaid counts.
- Empty state: "No carryover records match the current filters."

### 5.4 Add New / Edit modal

**Component:** `frontend/common/views/dashboard/billing/accounting/carryover/CarryoverFormDialog.tsx`

Fields per AC-4.1. The `teacher` autocomplete is disabled in edit mode
(AC-4.3). Validation:
- `fromDate <= toDate`.
- `payable >= 0`.
- `teacherCurrency` required.
- `note` max 2 000 chars.

### 5.5 Bulk To Expense modal

**Component:** `frontend/common/views/dashboard/billing/accounting/carryover/BulkToExpenseModal.tsx`

Two required fields: Payment Date (MUI DatePicker), Expense Date
(MUI month picker, `YYYY-MM`). Optional note. Shows a summary of selected
carryovers: total amount + currency + count. Submit button calls
`bulkCarryoverToExpense` mutation.

### 5.6 Filter bar

**Component:** `frontend/common/views/dashboard/billing/accounting/carryover/CarryoverFilterBar.tsx`

Teacher autocomplete, paid-status radio (`Paid` / `Unpaid` / `Both`),
date-range picker (fromDate / toDate on the carryover), disabled-teachers
toggle (default off), search input (debounced 300 ms), Clear-filters
button.

### 5.7 Bulk Carryover action on Plan 4's audit grid

**Component (edit Plan 4):** `frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid.tsx`

Adds a bulk-action button "Carryover Balance" (gated on
`ACCOUNTING_CARRYOVER_MANAGE`) that opens a confirmation dialog showing
the grouped summary before calling `bulkCreateCarryoverBalances`.

### 5.8 Zustand store

**File:** `frontend/common/stores/carryoverFilterStore.ts`

`teacherId`, `paidStatus`, `dateFrom`, `dateTo`, `includeDisabledTeachers`,
`search`, `page`, `pageSize`, `selectedIds`; `reset()`, `clearFilters()`.

---

## 6. UX & Navigation

### 6.1 Sidebar nav item

**File:** `frontend/common/views/dashboard/config/navigationConfig.ts`

Add to `SIDEBAR_NAV_ITEMS` under the existing `grp_finance` group:

```ts
{
  key: "accounting-carryover",
  labelKey: "accountingCarryover",
  iconKey: "accountBalanceWallet",
  href: "/accounting/carryover",
  section: "main",
  permission: PAGE_PERMISSIONS.accountingCarryoverView,
  groupId: "grp_finance",
},
```

### 6.2 Page permissions

**File:** `frontend/common/types/page-permissions.types.ts`

```ts
accountingCarryoverView: [AppPermission.ACCOUNTING_CARRYOVER_VIEW] as PagePermissions,
accountingCarryoverManage: [AppPermission.ACCOUNTING_CARRYOVER_MANAGE] as PagePermissions,
```

---

## 7. i18n

### 7.1 Namespace

**File:** `shared/locale/types/dashboard/billing/carryover.ts`

New namespace `dashboard.accounting.carryover` with keys including:
`title`, `filters.*`, `column.*`, `chip.paid`, `chip.unpaid`,
`chip.disabledTeacher`, `action.addNew`, `action.edit`, `action.delete`,
`action.bulkToExpense`, `action.bulkDelete`, `action.unpay`,
`action.viewSessions`, `modal.bulkToExpense.*`, `modal.form.*`,
`validation.*`, `error.*`, `success.*`, `aggregate.*`.

| Key                                  | EN                                                       | AR                                                       |
|--------------------------------------|----------------------------------------------------------|----------------------------------------------------------|
| `title`                              | "Carryover Balances"                                     | "أرصدة الترحيل"                                          |
| `column.teacher`                     | "Teacher"                                                | "المعلم"                                                  |
| `column.studentsCount`              | "Students"                                              | "الطلاب"                                                 |
| `column.studentsText`               | "Students list"                                          | "قائمة الطلاب"                                          |
| `column.totalDuration`             | "Duration (h)"                                          | "المدة (س)"                                              |
| `column.payable`                    | "Payable"                                                | "المستحق"                                                |
| `column.paid`                       | "Paid"                                                  | "المدفوع"                                                |
| `column.fromDate`                   | "From"                                                  | "من"                                                     |
| `column.toDate`                     | "To"                                                    | "إلى"                                                    |
| `column.paymentDate`                | "Payment date"                                          | "تاريخ الدفع"                                            |
| `chip.paid`                         | "Paid"                                                  | "مدفوع"                                                  |
| `chip.unpaid`                       | "Unpaid"                                                | "غير مدفوع"                                              |
| `chip.disabledTeacher`             | "Disabled"                                              | "موقوف"                                                  |
| `action.addNew`                     | "Add New"                                               | "إضافة جديد"                                            |
| `action.bulkToExpense`             | "Bulk To Expense"                                       | "تحويل إلى مصروفات"                                     |
| `action.bulkDelete`                | "Bulk Delete"                                           | "حذف جماعي"                                              |
| `action.unpay`                     | "Unpay"                                                 | "إلغاء الدفع"                                            |
| `modal.bulkToExpense.title`        | "Convert to expenses"                                   | "التحويل إلى مصروفات"                                   |
| `modal.bulkToExpense.paymentDate`  | "Payment date"                                          | "تاريخ الدفع"                                            |
| `modal.bulkToExpense.expenseDate`  | "Expense month"                                         | "شهر المصروف"                                            |
| `modal.bulkToExpense.summary`      | "{{count}} carryovers totaling {{amount}} {{currency}}"  | "{{count}} أرصدة بإجمالي {{amount}} {{currency}}"      |
| `error.sessionNotAudited`          | "One or more sessions are not audited."                 | "واحدة أو أكثر من الجلسات غير مدققة."                    |
| `error.sessionAlreadyLinked`       | "One or more sessions are already linked."              | "واحدة أو أكثر من الجلسات مرتبطة بالفعل."                |
| `error.alreadyPaid`                | "One or more carryovers are already paid."              | "واحد أو أكثر من الأرصدة مدفوعة بالفعل."                 |
| `error.cannotDeletePaid`          | "Cannot delete a paid carryover. Unpay first."          | "لا يمكن حذف رصيد مدفوع. ألغِ الدفع أولاً."              |
| `error.fxRateMissing`              | "Exchange rate missing for cross-currency aggregation."| "سعر الصرف مفقود للتجميع متعدد العملات."                |
| `success.bulkCreated`              | "{{count}} carryover balances created."                | "تم إنشاء {{count}} أرصدة ترحيل."                       |
| `success.bulkedToExpense`          | "{{count}} expenses created."                           | "تم إنشاء {{count}} مصروفات."                            |
| `success.unpaid`                    | "Carryover unpaid; sessions reverted."                  | "تم إلغاء دفع الرصيد؛ تمت استعادة الجلسات."             |

### 7.2 Locale snapshot

After adding the namespace, run `bun run locale:snapshots` so the
`public/static/locale-snapshots/{en,ar}/dashboard.accounting.carryover.json`
files are produced.

---

## 8. Testing Strategy

### 8.1 Service-layer tests

**File:** `backend/services/teachers/carryover-balance.service.test.ts`

Covers:
- `bulkCreateCarryoverBalances` happy path — 3 teachers, mixed sessions,
  → 3 carryover rows + items + sessions transitioned to `WAITING_PAID`.
- All-not-audited rejection (`CARRYOVER_SESSION_NOT_AUDITED`).
- Already-linked rejection (`CARRYOVER_SESSION_ALREADY_LINKED`).
- Cross-currency aggregation with FX conversion; per-item `originalAmount` preserved.
- FX rate missing rejection (`CARRYOVER_FX_RATE_MISSING`).
- Idempotent re-submit (same `clientRequestId` within 60s).
- `studentsText` truncation at 500 chars.
- Permission denied → `InsufficientPermissions`.

**File:** `backend/services/teachers/carryover-to-expense.service.test.ts`

Covers:
- Happy path — 2 carryovers → 2 expenses (type `Salaries`) + carryovers
  marked paid + sessions transitioned to `PAID`.
- Already-paid rejection (`CARRYOVER_ALREADY_PAID`).
- Missing `paymentDate` (`PAYMENT_DATE_REQUIRED`).
- Invalid `expenseDate` format (`EXPENSE_DATE_INVALID`).
- Default `expenseDate` from `paymentDate` slice.
- Idempotent re-submit.
- Plan 6 `ExpenseService.create` failure rolls back everything.

**File:** `backend/services/teachers/carryover-crud.service.test.ts`

Covers create / update / delete / bulkDelete / unpay happy paths +
all guards (`CARRYOVER_PAID_CANNOT_DELETE`, `CARRYOVER_TEACHER_IMMUTABLE`,
`CARRYOVER_NOT_PAID`, expense already soft-deleted idempotency).

### 8.2 Repository tests

**File:** `backend/db/test/repo/teachers/carryover.repository.test.ts`

- Filter combinations (teacher, paid status, date range, disabled toggle, search).
- Pagination.
- `getByIdsForUpdate` row-level lock correctness.
- Aggregate totals (totalPayable / totalPaid / dominant currency / rowCountByPaid).

### 8.3 GraphQL tests

**File:** `backend/graphql/query/teachers/carryover.query.test.ts` + `carryover.mutation.test.ts`

- Query returns page shape; respects `limit`/`offset`.
- Permission denied → GraphQL error.
- All mutations: argument-coverage per `docs/testing/mutation-argument-coverage.md`.
- Bulk mutations: empty array rejection; oversized array capped.

### 8.4 Frontend tests

- `CarryoverContainer.test.tsx` — renders rows, filters debounce, empty state,
  CSV button hits the right URL, bulk-action toolbar gated on `_MANAGE`.
- `CarryoverFormDialog.test.tsx` — Add New vs Edit (teacher field disabled in Edit);
  validation; double-click absorbed by `clientRequestId`.
- `BulkToExpenseModal.test.tsx` — date pickers required; summary shows count + total.
- `CarryoverFilterBar.test.tsx` — paid-status radio, disabled toggle defaults off,
  Clear resets.
- Plan 4 audit grid extension — bulk-action button visible only with `_MANAGE`;
  calls mutation with selected ids.

### 8.5 Migration tests

- Additive migration applies cleanly on a populated DB.
- New `class_instances.carryover_balance_id` column nullable.
- Existing scheduling / state-machine flows regression-green.

### 8.6 Quality loops (per file)

Every touched file passes through:

```
bun run scripts/health/sub-loop.ts <file> --lifecycle codescene
```

This runs `tsgo → oxlint → biome:check → lint:type-aware → check:duplicates → codescene --file`,
short-circuiting at the first failure. See `scripts/health/sub-loop.ts` header.

---

## 9. Cross-Plan Dependencies

| Plan            | Relationship                                                                                              |
|-----------------|----------------------------------------------------------------------------------------------------------|
| **Plan 3** (`teacher-payroll-engine`) | Plan 5 reads `class_instances.calculationStatus` + `teacherPaidAmount` to aggregate; Plan 5 transitions sessions to `WAITING_PAID` and `PAID` (Plan 3 AC-9.4 / AC-9.5). Plan 5 reuses Plan 3's `class_status_events` for `PAYROLL_STATUS_TRANSITION`. |
| **Plan 4** (`session-event-audit`) | Plan 4's audit grid renders the "Carryover Balance" bulk-action button (gated on `ACCOUNTING_CARRYOVER_MANAGE`). Plan 4 reads the new `carryoverBalanceId` column for display. |
| **Plan 6** (`expense-ledger`) | Plan 5 calls `ExpenseService.createInternal` (Plan 6) inside its `bulkCarryoverToExpense` transaction to write the `expenses` row. Plan 5 sets `expenses.sourceEntity = 'carryover_balances'` + `sourceEntityId`. Plan 6 owns the `expenses` schema + the soft-delete column. |
| Existing `teacher_dues` accrual | Independent — Plan 5 does not touch `teacher_dues`. Carryover is an aggregate settlement on top of `class_instances`; `teacher_dues` remains the per-lesson accrual ledger. |
| Existing `teacher_payments` | Independent — cash disbursement stays in `teacher_payments`. Carryover's `isPaid = true` only marks that an **expense row** was created; the cash disbursement is a separate accounting operation. |
| Existing FX module | Plan 5 reuses `FxService.getLatestRate` for cross-currency aggregation. |
| Existing `audit_logs` | Plan 5 emits `CARRYOVER_*` rows; corrections are made via the Unpay flow, never by deleting history. |

---

## 10. Risks & Mitigations

| Risk                                                                    | Mitigation                                                                                          |
|-------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| Bulk Carryover batches with hundreds of sessions slow the tx.            | NFR-2: < 2 s p95 for 50 sessions; horizontal batch-chunking if needed.                              |
| Cross-currency FX rate missing mid-batch.                                | AC-2.8: whole mutation rolls back with `CARRYOVER_FX_RATE_MISSING`; operator can settle per-currency batches separately. |
| Operator double-submit creates duplicate carryovers.                    | Idempotency via `clientRequestId` + 60-second window + `audit_logs.metadata.idempotencyKey` lookup.|
| Delete on a paid carryover loses the audit trail.                        | AC-4.6: reject with `CARRYOVER_PAID_CANNOT_DELETE`; operator must Unpay first (US-7) which preserves history. |
| Plan 6 `ExpenseService.create` fails mid-batch.                          | AC-3.6: whole `bulkCarryoverToExpense` rolls back; no partial state.                                 |
| Carryover's `payable` snapshot drifts from session overrides (Plan 3).   | Carryover's `payable` is frozen at creation time (E16); operator can delete + recreate to pick up new amounts. |
| Mixed currencies in aggregate produce misleading totals.                 | Per-item `originalAmount` + `originalCurrency` preserved in `carryover_balance_items` for full audit. |
| Permission scope drift (`_VIEW` vs `_MANAGE`).                          | Documented in §2.2; seed groups updated; mutations re-check via `requirePermission`.                |
| Carryover unlinked from a session after edit (Plan 3 US-6 re-run).      | Plan 5 does not auto-sync; once linked, the session's `carryover_balance_id` is immutable until the carryover is deleted (which reverts the session's status). |

---

## 11. Out-of-Scope (Deferred)

- Per-teacher / per-subject carryover templates (recurring settlement profiles).
- Auto-refresh of `isDisabledTeacher` snapshot when the teacher's `users.status` changes.
- Carryover-to-carryover merge action (split / merge carryovers).
- Bulk CSV import of carryover records.
- Notifications to teachers on payout settlement.
- Per-currency aggregate totals (single dominant currency in v1).
- Bulk Carryover action directly from the `/accounting/payroll` page (Plan 3) — only Plan 4's audit grid exposes it in v1.
