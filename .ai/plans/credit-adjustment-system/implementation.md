# Plan 2 — Credit Adjustment System: Implementation

> Companion to `specs.md`. Describes how the Siraj LMS credit ledger is extended
> to support Add / Subtract / Subtract-With-Carryover adjustments.

---

## 1. Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              Next.js 16 App Router                          │
│                                                                            │
│   /accounting/credits            /accounting/credits/adjust                 │
│   ┌─────────────────────┐        ┌──────────────────────────────────┐       │
│   │ StudentCreditsList   │───────▶│ CreditAdjustForm                │       │
│   │  - Apollo useQuery   │        │  - RadioGroup (3 options)       │       │
│   │  - MUI DataGrid      │        │  - StudentPicker                │       │
│   │  - "Adjust" action   │        │  - HoursField                   │       │
│   └─────────────────────┘        │  - RichText (Reason)             │       │
│                                  │  - Conditional CarryoverBanner  │       │
│                                  │  - TeacherAutocomplete           │       │
│                                  │  - FromDate / ToDate / PayDate   │       │
│                                  │  - Apollo useMutation            │       │
│                                  └────────────┬────────────────────┘       │
└───────────────────────────────────────────────┼───────────────────────────┘
                                                │ GraphQL (Pothos)
                                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          GraphQL Layer (Pothos)                            │
│   Mutation: recordCreditAdjustment(input: CreditAdjustmentInput!)         │
│   Query:    studentCreditTransactions (existing — extended)                │
└───────────────────────────────────────────────┬────────────────────────────┘
                                                │
                                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          Service Layer (CreditService)                    │
│   addCredit(...)              → CreditTransactionReturnType              │
│   subtractCredit(...)         → CreditTransactionReturnType              │
│   subtractWithCarryover(...)  → CreditAdjustmentWithCarryoverReturnType   │
│   - requirePermission(ACCOUNTING_CREDITS_MANAGE)                          │
│   - db.transaction { ledger insert + student balance + (carryover) }      │
│   - idempotency key = sha256(studentId, type, hours, teacherId?, dates)   │
└───────────────────────────────────────────────┬────────────────────────────┘
                                                │ Drizzle ORM
                                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          PostgreSQL                                        │
│   credit_transactions (EXTENDED)                                           │
│     + adjustmentType     credit_adjustment_type_enum NOT NULL DEFAULT 'Add'│
│     + carryoverTeacherId uuid NULL FK→teachers.id                         │
│     + carryoverFromDate  date NULL                                        │
│     + carryoverToDate    date NULL                                        │
│     + carryoverPaymentDate date NULL                                      │
│   credit_reason enum EXTENDED:                                             │
│     + CREDIT_ADJUSTMENT_ADD                                                │
│     + CREDIT_ADJUSTMENT_SUBTRACT                                           │
│     + CREDIT_ADJUSTMENT_CARRYOVER                                          │
│   NEW credit_adjustment_type enum: 'Add' | 'Subtract' | 'Subtract With Carryover' │
└───────────────────────────────────────────────────────────────────────────┘
```

**Design principle:** Extend, do not fork. Every adjustment flows through the
existing `credit_transactions` ledger so the existing balance / history /
reporting reads keep working unchanged.

---

## 2. Data Model

### 2.1 New enum: `CreditAdjustmentType`

**File:** `backend/enum/billing/credit-adjustment.enum.ts` 🆕 (separate file to keep `credit.enum.ts` focused on `CreditReason`)

```ts
export enum CreditAdjustmentType {
  ADD = "ADD",
  SUBTRACT = "SUBTRACT",
  SUBTRACT_WITH_CARRYOVER = "SUBTRACT_WITH_CARRYOVER",
}
```

> ⚠️ The enum **values** follow the codebase-wide SCREAMING_SNAKE_CASE
> convention used by every other PG enum (`CreditReason`, `ClassExecutionState`,
> `TeacherDueStatus`, etc.). The human-readable labels ("Add", "Subtract",
> "Subtract With Carryover") live in the i18n namespace
> (`dashboard.billing.creditAdjustment.adjustmentType.*`) — never in the enum
> values themselves. The Postgres enum `credit_adjustment_type` will use these
> exact SCREAMING_SNAKE_CASE strings.

Mirror this enum in:
- `shared/constants/billing/credit-adjustment.enum.ts` 🆕 (shared client/server)
- `backend/db/schema/enums.ts` via `createPgEnumFromEnum("credit_adjustment_type", CreditAdjustmentType)`

Also register the enum in `backend/graphql/pothos/shared/enum.pothos.ts` (see §4.1).

### 2.2 Extended enum: `CreditReason`

**File:** `shared/constants/billing/credit.enum.ts` (extend existing) + `shared/constants/billing/credit.enum.ts` (extend existing) + `shared/constants/credit.enum.ts` (extend existing — both shared mirrors must stay in sync)

```ts
export enum CreditReason {
  PURCHASE = "PURCHASE",
  DEDUCTION = "DEDUCTION",
  REFUND = "REFUND",
  ADJUSTMENT = "ADJUSTMENT",
  // ── Plan 2 additions ──────────────────────────────────────────
  CREDIT_ADJUSTMENT_ADD = "CREDIT_ADJUSTMENT_ADD",
  CREDIT_ADJUSTMENT_SUBTRACT = "CREDIT_ADJUSTMENT_SUBTRACT",
  CREDIT_ADJUSTMENT_CARRYOVER = "CREDIT_ADJUSTMENT_CARRYOVER",
}
```

The Postgres enum `credit_reason` gets three new values via an additive
`ALTER TYPE ... ADD VALUE` migration (safe for non-transactional DDL on PG).
The existing `creditReasonEnum` in `backend/db/schema/enums.ts` calls
`createPgEnumFromEnum("credit_reason", CreditReason)` and will pick up the new
values automatically once the enum is extended (no `enums.ts` change required).

### 2.3 New permission: `ACCOUNTING_CREDITS_MANAGE`

**File:** `backend/enum/permissions/permission.enum.ts`

```ts
// LMS — Accounting / Credit adjustments (Plan 2)
ACCOUNTING_CREDITS_MANAGE = "accounting.credits_manage",
```

Add to the seed `permission-groups` so the "Accounting" / "Finance Manager"
group gets it by default. Existing `CREDITS_MANAGE` stays scoped to the
student-portal purchase flow.

> **Rationale for a separate permission:** the existing `CREDITS_MANAGE` is
> granted to staff who record purchases and read balances. Subtract With
> Carryover moves real money-equivalent value to teachers — that needs a
> narrower, audit-heavier gate.

### 2.4 Extended table: `credit_transactions`

**File:** `backend/db/schema/billing/credit-transactions.ts`

Additive columns only — every existing row gets sensible defaults.

```ts
import { date as pgDate } from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { teachers } from "@/backend/db/schema/teachers/teachers";
import { creditAdjustmentTypeEnum } from "@/backend/db/schema/enums";

export const creditTransactions = createTable("credit_transactions", {
  // ... existing columns unchanged ...
  id: uuidColumn("id").defaultRandom().primaryKey(),
  studentId: uuidColumn("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  changeAmount: integerColumn("change_amount").notNull(),
  reason: creditReasonEnum("reason").notNull(),
  sourcePaymentId: uuidColumn("source_payment_id").references(() => payments.id, { onDelete: "set null" }),
  classInstanceId: uuidColumn("class_instance_id").references(() => classInstances.id, { onDelete: "set null" }),
  notes: textColumn("notes"),
  creditedByUserId: uuidColumn("credited_by_user_id").notNull().references(() => users.id, { onDelete: "set null" }),
  idempotencyKey: varcharColumn("idempotency_key", { length: 255 }).notNull(),
  createdAt: timestampColumn("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  updatedAt: timestampColumn("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),

  // ── Plan 2 additions ───────────────────────────────────────────
  adjustmentType: creditAdjustmentTypeEnum("adjustment_type")
    .notNull()
    .default(CreditAdjustmentType.ADD)
    .$type<CreditAdjustmentType>(),

  carryoverTeacherId: uuidColumn("carryover_teacher_id").references(() => teachers.id, {
    onDelete: "set null",
  }), // nullable — only set for "Subtract With Carryover"

  carryoverFromDate: pgDate("carryover_from_date"), // nullable
  carryoverToDate: pgDate("carryover_to_date"),     // nullable
  carryoverPaymentDate: pgDate("carryover_payment_date"), // nullable
},
(table) => [
  // ... existing indexes ...
  index("credit_transactions_adjustment_type_idx").on(table.adjustmentType),
  index("credit_transactions_carryover_teacher_id_idx").on(table.carryoverTeacherId),
]);
```

**Migration policy (see `docs/DATABASE_MIGRATIONS.md`):**
- New columns are nullable OR have a non-null default → safe additive migration.
- New enum values added via `ALTER TYPE ... ADD VALUE` — run with
  `--single-transaction=false` (PG enum DDL cannot run inside a transaction).
- Zero downtime for existing `recordPurchase` / `deductForBooking` / `refundOnCancel`.

### 2.5 Plan 5 handoff columns (carryover entry)

Until Plan 5 ships its own `teacher_carryover_balances` table, the carryover
metadata lives entirely on the four `carryover_*` columns of
`credit_transactions`. When Plan 5 activates, it will run a one-time backfill:

```sql
INSERT INTO teacher_carryover_balances (credit_transaction_id, teacher_id, student_id, from_date, to_date, payment_date, hours, status, created_at)
SELECT id, carryover_teacher_id, student_id, carryover_from_date, carryover_to_date, carryover_payment_date, -change_amount, 'PENDING', created_at
FROM credit_transactions
WHERE adjustment_type = 'Subtract With Carryover' AND carryover_teacher_id IS NOT NULL;
```

This keeps Plan 2 self-contained and Plan 5 idempotent.

---

## 3. Service Layer

**File:** `backend/services/billing/credit.service.ts` (extend the existing `CreditService` namespace).

### 3.1 New input/output types

**File:** `backend/types/billing/credit.types.ts`

```ts
import type { CreditAdjustmentType, CreditReason } from "@/backend/enum";

export interface CreditAdjustmentInput {
  studentId: string;
  adjustmentType: CreditAdjustmentType;
  hours: number;                // positive integer; sign derived from type
  notes?: string | null;        // sanitized HTML (rich text Reason)
  // carryover — required when adjustmentType === SUBTRACT_WITH_CARRYOVER
  carryoverTeacherId?: string | null;
  carryoverFromDate?: string | null;  // ISO date YYYY-MM-DD
  carryoverToDate?: string | null;
  carryoverPaymentDate?: string | null;
}

export interface CreditAdjustmentReturnType extends CreditTransactionReturnType {
  adjustmentType: CreditAdjustmentType;
  carryoverTeacherId: string | null;
  carryoverFromDate: string | null;
  carryoverToDate: string | null;
  carryoverPaymentDate: string | null;
}
```

### 3.2 New methods

```ts
export namespace CreditService {
  // ── existing methods unchanged ──
  // recordPurchase / recordPurchaseIfMissing / getStudentBalance /
  // getStudentTransactions / deductForBooking / refundOnCancel / refundOnCancelBatch

  /** Plan 2 — single entrypoint dispatching to addCredit / subtractCredit / subtractWithCarryover. */
  export async function recordAdjustment(
    actorUserId: string,
    input: CreditAdjustmentInput,
    tErrors: ErrorsLabels,
  ): Promise<CreditAdjustmentReturnType> {
    await requirePermission(actorUserId, AppPermission.ACCOUNTING_CREDITS_MANAGE, tErrors);
    validateAdjustmentInput(input, tErrors);

    switch (input.adjustmentType) {
      case CreditAdjustmentType.ADD:
        return addCredit(actorUserId, input, tErrors);
      case CreditAdjustmentType.SUBTRACT:
        return subtractCredit(actorUserId, input, tErrors);
      case CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER:
        return subtractWithCarryover(actorUserId, input, tErrors);
    }
  }
}
```

### 3.3 Idempotency key derivation

```ts
function deriveAdjustmentIdempotencyKey(input: CreditAdjustmentInput): string {
  const parts = [
    "credit-adjustment",
    input.studentId,
    input.adjustmentType,
    String(input.hours),
    input.carryoverTeacherId ?? "",
    input.carryoverFromDate ?? "",
    input.carryoverToDate ?? "",
    input.carryoverPaymentDate ?? "",
    // notes intentionally EXCLUDED so two operators with the same numeric
    // adjustment but different Reasons are treated as distinct (auditable)
    // UNLESS the actor+timestamp window collapses them.
  ];
  return createHash("sha256").update(parts.join(":")).digest("hex");
}
```

> ⚠️ **Idempotency design choice:** notes (the rich-text Reason) are excluded
> from the hash so that legitimate "same numbers, different reason" submissions
> by the same operator within a short window are NOT collapsed. The
> client-side form should still pass a `clientRequestId` (UUIDv4) to absorb
> double-clicks; the server-side hash is the authoritative guard.

### 3.4 Validation

```ts
function validateAdjustmentInput(input: CreditAdjustmentInput, tErrors: ErrorsLabels): void {
  if (!input.studentId?.trim()) throw new ValidationError(tErrors.credit.invalidInput);
  if (!Number.isFinite(input.hours) || input.hours < 1) {
    throw new ValidationError(tErrors.credit.invalidInput);
  }

  if (input.adjustmentType === CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER) {
    if (!input.carryoverTeacherId?.trim()) throw new ValidationError(tErrors.credit.invalidInput);
    if (!input.carryoverFromDate || !input.carryoverToDate || !input.carryoverPaymentDate) {
      throw new ValidationError(tErrors.credit.invalidInput);
    }
    if (new Date(input.carryoverFromDate) > new Date(input.carryoverToDate)) {
      throw new ValidationError(tErrors.credit.invalidInput); // fromDate > toDate
    }
    const maxPaymentDate = new Date(); maxPaymentDate.setDate(maxPaymentDate.getDate() + 1);
    if (new Date(input.carryoverPaymentDate) > maxPaymentDate) {
      throw new ValidationError(tErrors.credit.invalidInput); // paymentDate > +1 day
    }
  }
}
```

### 3.5 `addCredit` implementation

```ts
async function addCredit(
  actorUserId: string,
  input: CreditAdjustmentInput,
  tErrors: ErrorsLabels,
): Promise<CreditAdjustmentReturnType> {
  const idempotencyKey = deriveAdjustmentIdempotencyKey(input);

  try {
    const created = await db.transaction(async (tx) => {
      await assertStudentExists(input.studentId, tErrors);

      const existing = await CreditRepository.findByIdempotencyKeys([idempotencyKey], tx);
      if (existing.length > 0) {
        return mapToAdjustmentReturnType(existing[0]!);
      }

      const ledgerRow = await CreditRepository.createAdjustment(tx, {
        studentId: input.studentId,
        changeAmount: input.hours,                         // POSITIVE
        reason: CreditReason.CREDIT_ADJUSTMENT_ADD,
        adjustmentType: CreditAdjustmentType.ADD,
        notes: sanitizeRichText(input.notes),
        creditedByUserId: actorUserId,
        idempotencyKey,
      });

      await StudentRepository.addClasses(input.studentId, tErrors, input.hours, undefined, tx);
      await QuotaService.refreshStudentOndemandInstances(input.studentId, tx);
      return mapToAdjustmentReturnType(ledgerRow);
    });

    logger.info("Credit adjustment Add recorded", { actorUserId, studentId: input.studentId, hours: input.hours });
    return created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      const resolved = await CreditRepository.findByIdempotencyKeys([idempotencyKey]);
      if (resolved.length > 0) return mapToAdjustmentReturnType(resolved[0]!);
    }
    throw error;
  }
}
```

### 3.6 `subtractCredit` implementation

```ts
async function subtractCredit(
  actorUserId: string,
  input: CreditAdjustmentInput,
  tErrors: ErrorsLabels,
): Promise<CreditAdjustmentReturnType> {
  const idempotencyKey = deriveAdjustmentIdempotencyKey(input);

  try {
    const created = await db.transaction(async (tx) => {
      await assertStudentExists(input.studentId, tErrors);

      // Insufficient-classes guard INSIDE the tx to prevent TOCTOU.
      const balance = await CreditRepository.getBalance(tx, input.studentId);
      if (balance.classesRemaining < input.hours) {
        throw new DomainError("INSUFFICIENT_CLASSES", tErrors.credit.insufficientBalance({
          studentId: input.studentId,
          remaining: balance.classesRemaining,
        }));
      }

      const existing = await CreditRepository.findByIdempotencyKeys([idempotencyKey], tx);
      if (existing.length > 0) return mapToAdjustmentReturnType(existing[0]!);

      const ledgerRow = await CreditRepository.createAdjustment(tx, {
        studentId: input.studentId,
        changeAmount: -input.hours,                        // NEGATIVE
        reason: CreditReason.CREDIT_ADJUSTMENT_SUBTRACT,
        adjustmentType: CreditAdjustmentType.SUBTRACT,
        notes: sanitizeRichText(input.notes),
        creditedByUserId: actorUserId,
        idempotencyKey,
      });

      await StudentRepository.deductClasses(input.studentId, tErrors, input.hours, undefined, tx);
      await QuotaService.refreshStudentOndemandInstances(input.studentId, tx);
      return mapToAdjustmentReturnType(ledgerRow);
    });

    logger.info("Credit adjustment Subtract recorded", { actorUserId, studentId: input.studentId, hours: input.hours });
    return created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      const resolved = await CreditRepository.findByIdempotencyKeys([idempotencyKey]);
      if (resolved.length > 0) return mapToAdjustmentReturnType(resolved[0]!);
    }
    throw error;
  }
}
```

### 3.7 `subtractWithCarryover` implementation

```ts
async function subtractWithCarryover(
  actorUserId: string,
  input: CreditAdjustmentInput,
  tErrors: ErrorsLabels,
): Promise<CreditAdjustmentReturnType> {
  const idempotencyKey = deriveAdjustmentIdempotencyKey(input);

  try {
    const created = await db.transaction(async (tx) => {
      await assertStudentExists(input.studentId, tErrors);
      await assertTeacherExists(input.carryoverTeacherId!, tErrors);

      const balance = await CreditRepository.getBalance(tx, input.studentId);
      if (balance.classesRemaining < input.hours) {
        throw new DomainError("INSUFFICIENT_CLASSES", tErrors.credit.insufficientBalance({
          studentId: input.studentId,
          remaining: balance.classesRemaining,
        }));
      }

      const existing = await CreditRepository.findByIdempotencyKeys([idempotencyKey], tx);
      if (existing.length > 0) return mapToAdjustmentReturnType(existing[0]!);

      const ledgerRow = await CreditRepository.createAdjustment(tx, {
        studentId: input.studentId,
        changeAmount: -input.hours,                        // NEGATIVE
        reason: CreditReason.CREDIT_ADJUSTMENT_CARRYOVER,
        adjustmentType: CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER,
        notes: sanitizeRichText(input.notes),
        creditedByUserId: actorUserId,
        carryoverTeacherId: input.carryoverTeacherId,
        carryoverFromDate: input.carryoverFromDate,
        carryoverToDate: input.carryoverToDate,
        carryoverPaymentDate: input.carryoverPaymentDate,
        idempotencyKey,
      });

      await StudentRepository.deductClasses(input.studentId, tErrors, input.hours, undefined, tx);
      await QuotaService.refreshStudentOndemandInstances(input.studentId, tx);

      // Plan 5 handoff: if the carryover-balances table exists, insert a row now.
      // Otherwise the four carryover_* columns on the ledger row ARE the source
      // of truth (see §2.5 backfill).
      await maybeInsertCarryoverBalanceEntry(tx, {
        creditTransactionId: ledgerRow.id,
        teacherId: input.carryoverTeacherId!,
        studentId: input.studentId,
        fromDate: input.carryoverFromDate!,
        toDate: input.carryoverToDate!,
        paymentDate: input.carryoverPaymentDate!,
        hours: input.hours,
        approvedByUserId: actorUserId,
      });

      return mapToAdjustmentReturnType(ledgerRow);
    });

    logger.info("Credit adjustment Subtract-With-Carryover recorded", {
      actorUserId, studentId: input.studentId, hours: input.hours,
      carryoverTeacherId: input.carryoverTeacherId,
    });
    return created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      const resolved = await CreditRepository.findByIdempotencyKeys([idempotencyKey]);
      if (resolved.length > 0) return mapToAdjustmentReturnType(resolved[0]!);
    }
    throw error;
  }
}
```

### 3.8 Repository extension

**File:** `backend/db/repo/billing/credit.repository.ts`

```ts
export const createAdjustment = async (
  tx: DBTransaction,
  input: CreditAdjustmentInsertInput,
): Promise<CreditTransactionSelectType> => {
  const [row] = await tx.insert(creditTransactions).values({
    studentId: input.studentId,
    changeAmount: input.changeAmount,
    reason: input.reason,
    adjustmentType: input.adjustmentType,
    carryoverTeacherId: input.carryoverTeacherId ?? null,
    carryoverFromDate: input.carryoverFromDate ?? null,
    carryoverToDate: input.carryoverToDate ?? null,
    carryoverPaymentDate: input.carryoverPaymentDate ?? null,
    sourcePaymentId: null,
    classInstanceId: null,
    notes: input.notes ?? null,
    creditedByUserId: input.creditedByUserId,
    idempotencyKey: input.idempotencyKey,
  }).returning();
  if (!row) throw new DomainError("INSERT_FAILED", "credit_transactions insert returned no row");
  return row;
};
```

---

## 4. GraphQL Layer (Pothos)

### 4.1 New input & object types

**File:** `backend/graphql/pothos/billing/credit-adjustment.pothos.ts`

```ts
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CreditAdjustmentType } from "@/backend/enum";

export const CreditAdjustmentTypePothosEnum = gqlSchemaBuilder.enumType(CreditAdjustmentType, {
  name: "CreditAdjustmentType",
  description: "Add | Subtract | Subtract With Carryover",
});

export const CreditAdjustmentInputPothos = gqlSchemaBuilder.inputType("CreditAdjustmentInput", {
  fields: (t) => ({
    studentId: t.id({ required: true }),
    adjustmentType: t.field({ type: CreditAdjustmentTypePothosEnum, required: true }),
    hours: t.int({ required: true }),
    notes: t.string({ required: false }),                  // rich-text HTML
    carryoverTeacherId: t.id({ required: false }),
    carryoverFromDate: t.string({ required: false }),       // YYYY-MM-DD
    carryoverToDate: t.string({ required: false }),
    carryoverPaymentDate: t.string({ required: false }),
    clientRequestId: t.string({ required: false }),        // absorbs double-clicks
  }),
});

export const CreditAdjustmentResultPothosObject = gqlSchemaBuilder.objectRef<CreditAdjustmentReturnType>("CreditAdjustmentResult").implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    studentId: t.exposeID("studentId"),
    changeAmount: t.exposeInt("changeAmount"),
    reason: t.exposeString("reason"),
    adjustmentType: t.expose("adjustmentType", { type: CreditAdjustmentTypePothosEnum }),
    notes: t.exposeString("notes", { nullable: true }),
    carryoverTeacherId: t.exposeID("carryoverTeacherId", { nullable: true }),
    carryoverFromDate: t.exposeString("carryoverFromDate", { nullable: true }),
    carryoverToDate: t.exposeString("carryoverToDate", { nullable: true }),
    carryoverPaymentDate: t.exposeString("carryoverPaymentDate", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});
```

### 4.2 New mutation

**File:** `backend/graphql/mutation/billing/credit-adjustment.mutation.ts`

```ts
gqlSchemaBuilder.mutationField("recordCreditAdjustment", (t) =>
  t.field({
    type: CreditAdjustmentResultPothosObject,
    description: "Record a manual credit adjustment (Add / Subtract / Subtract With Carryover).",
    authScopes: { loggedIn: true },
    args: { input: t.arg({ type: CreditAdjustmentInputPothos, required: true }) },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return CreditService.recordAdjustment(actorUserId, args.input, tErrors);
    },
  })
);
```

> **Permission note:** the `authScopes: { loggedIn: true }` only checks
> authentication. The `ACCOUNTING_CREDITS_MANAGE` check happens inside
> `CreditService.recordAdjustment` via `requirePermission`, which throws
> `InsufficientPermissions` (mapped to a GraphQL error code) — consistent with
> the existing `recordCreditPurchase` mutation pattern.

### 4.3 Extended query

The existing `getStudentTransactions` query already returns every ledger row.
Extend its Pothos object to expose the four carryover fields and
`adjustmentType` so the frontend can render them without a new query.

**File:** `backend/graphql/pothos/billing/credit.pothos.ts` (extend existing `CreditTransactionPothosObject`)

```ts
fields: (t) => ({
  // ... existing fields ...
  adjustmentType: t.expose("adjustmentType", { type: CreditAdjustmentTypePothosEnum }),
  carryoverTeacherId: t.exposeID("carryoverTeacherId", { nullable: true }),
  carryoverFromDate: t.exposeString("carryoverFromDate", { nullable: true }),
  carryoverToDate: t.exposeString("carryoverToDate", { nullable: true }),
  carryoverPaymentDate: t.exposeString("carryoverPaymentDate", { nullable: true }),
}),
```

---

## 5. Frontend

### 5.1 Apollo documents

**File:** `frontend/common/graphql/sharedDocuments/billing/credit-adjustment.documents.ts` 🆕

Follows the project's `TypedDocumentNode` + camelCase + `Document` suffix convention (see `frontend/common/graphql/sharedDocuments/AGENTS.md`):

```ts
import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const recordCreditAdjustmentMutationDocument: TypedDocumentNode<
  Operations.RecordCreditAdjustmentMutation,
  Types.MutationRecordCreditAdjustmentArgs
> = gql`
  mutation RecordCreditAdjustment($input: CreditAdjustmentInput!) {
    recordCreditAdjustment(input: $input) {
      id
      studentId
      changeAmount
      reason
      adjustmentType
      notes
      carryoverTeacherId
      carryoverFromDate
      carryoverToDate
      carryoverPaymentDate
      createdAt
    }
  }
`;
```

Also expose a list query document for the Student Credits list. If the existing
`studentDirectoryQueryDocument` already returns `classesRemaining` +
`classesTotal` (it does — see `frontend/common/graphql/sharedDocuments/students/student-directory.documents.ts`),
**reuse it** instead of creating a new query. If extra columns (last-tx-at)
are needed, extend the existing `StudentDirectoryRow` fragment rather than
forking a separate query.

- Re-export from `frontend/common/graphql/sharedDocuments/billing/index.ts`
  via `export * from "./credit-adjustment.documents";`.
- Re-export the billing barrel from `frontend/common/graphql/sharedDocuments/index.ts`
  (already exported today).
- Run `bun run generate:gqlSchema && bun codegen` after the schema changes land
  so `Operations.RecordCreditAdjustmentMutation` and
  `Types.MutationRecordCreditAdjustmentArgs` are generated.

### 5.2 Routes

| Route                              | File                                                                | Purpose                                  |
|------------------------------------|---------------------------------------------------------------------|------------------------------------------|
| `/accounting/credits`              | `app/(dashboard)/accounting/credits/page.tsx`                       | Student credits list                     |
| `/accounting/credits/adjust`       | `app/(dashboard)/accounting/credits/adjust/page.tsx`                 | Adjustment form (reads `?studentId=`)     |

Both routes register `ACCOUNTING_CREDITS_MANAGE` in the page-permissions map
(`PAGE_PERMISSIONS`) so the server-side auth wrapper enforces it before render.

### 5.3 Student Credits list page

**Component:** `frontend/common/views/dashboard/accounting/credits/StudentCreditsList.tsx` 🆕

- MUI `DataGrid` (v9) showing: name, parent, `classesRemaining`, `classesTotal`, last-tx-at.
- Toolbar: search input (debounced), "Adjust Credits" primary button.
- Per-row action menu → "Adjust Credits" → navigates with `?studentId=`.
- Apollo `useQuery(studentDirectoryQueryDocument, { variables, fetchPolicy: "cache-and-network" })`
  from `@/frontend/common/graphql/sharedDocuments` (reuses the existing
  `studentDirectoryQueryDocument` — already returns `classesRemaining` + `classesTotal`).
- Empty state: "No students with credit history yet." + CTA.

### 5.4 Credit Adjustment form

**Component:** `frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.tsx` 🆕

Layout (top-to-bottom):

1. **Student picker** — reuse the existing `StudentAutocomplete` from
   `@/frontend/common/components/ui/input/userSelect/StudentAutocomplete`.
   Pre-selected when `?studentId=` is present (AC-1.5).
2. **Adjustment Type RadioGroup** — 3 options:
   - `ADD` (positive, green accent)
   - `SUBTRACT` (negative, red accent)
   - `SUBTRACT_WITH_CARRYOVER` (negative + carryover, amber accent)
3. **Hours field** — MUI `TextField` type="number", min=1, step=1.
4. **Reason rich-text editor** — `RichTextEditor` (see §5.6).
   Persisted as sanitized HTML in `notes`.
5. **Conditional Carryover banner** — shown only when
   `adjustmentType === CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER`.
   Green `Alert` with `severity="success"` containing:
   - **Teacher autocomplete** — reuse the existing `TeacherAutocomplete` from
     `@/frontend/common/components/ui/input/userSelect/TeacherAutocomplete`.
   - **From Date** — MUI `DatePicker`.
   - **To Date** — MUI `DatePicker` (must be ≥ From Date).
   - **Payment Date** — MUI `DatePicker` (must be ≤ today + 1 day).
6. **Submit button** — disabled until the form is valid; shows linear progress
   while the mutation is in flight.
7. **Cancel button** — navigates back to `/accounting/credits`.

Form state is held in a Zustand store slice
(`useCreditAdjustFormStore`) so the carryover section can be cleared on type
switch (edge case E3) without losing student/hours selection.

### 5.5 Carryover banner component

**Component:** `frontend/common/views/dashboard/accounting/credits/CarryoverBanner.tsx` 🆕

```tsx
<Alert severity="success" icon={<SwapHorizIcon />} sx={{ backgroundColor: "successContainer" }}>
  <AlertTitle>{t("carryoverTitle")}</AlertTitle>
  <Stack spacing={2} direction={{ xs: "column", md: "row" }}>
    <TeacherAutocomplete value={teacherId} onChange={setTeacherId} sx={{ minWidth: 240 }} />
    <DatePicker label={t("fromDate")} value={fromDate} onChange={setFromDate} />
    <DatePicker label={t("toDate")} value={toDate} minDate={fromDate} onChange={setToDate} />
    <DatePicker label={t("paymentDate")} value={paymentDate} maxDate={dayjs().add(1, "day")} onChange={setPaymentDate} />
  </Stack>
</Alert>
```

> `TeacherAutocomplete` is imported from the existing
> `@/frontend/common/components/ui/input/userSelect/TeacherAutocomplete` —
> no new component is created (see §5.3 in `trackable-tasks.md`).

### 5.6 Reason rich-text editor

**Component:** `frontend/common/components/ui/input/richText/RichTextEditor.tsx` 🆕
(follows the `input/<widget>/` convention used by `input/tagInput/`, `input/currencySelect/`, etc.)

- Built on TipTap (`@tiptap/react` + `@tiptap/starter-kit`).
- Toolbar: Bold, Italic, Underline, BulletList, OrderedList.
- Output: HTML string (`editor.getHTML()`).
- Server sanitization via `sanitizeHtml` (DOMPurify on the server via `jsdom`).
- Field-level validation: non-empty after stripping tags.
- Export from `frontend/common/components/ui/input/index.ts` barrel.
- Locale labels live under the existing `ui` namespace — add a `richText`
  sub-namespace if the editor needs >3 strings.

### 5.7 Success / error UX

- On success: Apollo `client.resetStore()` (or targeted cache evict for the
  affected student), then `router.push("/accounting/credits")` + success toast.
- On `INSUFFICIENT_CLASSES`: inline error on Hours field + toast.
- On `INSUFFICIENT_PERMISSIONS`: full-page error boundary (the route guard
  should prevent this in practice).
- On idempotency-duplicate: silent success — treat as if the first call won,
  show success toast, navigate back.

---

## 6. UX & Navigation

### 6.1 Sidebar nav item

**File:** `frontend/common/views/dashboard/config/navigationConfig.ts`

Add to `SIDEBAR_NAV_ITEMS` (under the existing `grp_finance` group — see Q1 in specs):

```ts
{
  key: "accounting-credits",
  labelKey: "accountingCredits",
  iconKey: "accountBalanceWallet",
  href: "/accounting/credits",
  section: "main",
  permission: PAGE_PERMISSIONS.accountingCreditsManage, // = [AppPermission.ACCOUNTING_CREDITS_MANAGE] as PagePermissions
  groupId: "grp_finance",
},
```

Also add `AppPermission.ACCOUNTING_CREDITS_MANAGE` to the `grp_finance` group's
`permission` array so the group header renders for users with only this permission.

**Required locale additions (nav labels live in the `dashboard.core.nav`
namespace, NOT in the new `dashboard.billing.creditAdjustment` namespace):**

- `shared/locale/types/dashboard/core/nav.ts` — add `readonly accountingCredits: string;`
  to `DashboardNavigationLabels`.
- `shared/locale/en/dashboard/core/nav.ts` — add `accountingCredits: "Credits"`.
- `shared/locale/ar/dashboard/core/nav.ts` — add `accountingCredits: "الرصيد"`.
- `navIconKeys.ts` — `accountBalanceWallet` is already in the `NavIconKey` union; no change needed.

### 6.2 Icon registry

**File:** `frontend/common/views/dashboard/config/navIconKeys.ts`

`accountBalanceWallet` is already in the `NavIconKey` union (used by
`student-credits` and `quotas`). No new icon key needed; if a distinct icon
is wanted, add the key to `NavIconKey` and register the MUI icon in the icon
registry (search for `accountBalanceWallet` in `frontend/common/components/`
to find the registry).

### 6.3 Page permissions

**File:** `frontend/common/types/page-permissions.types.ts`

Each entry MUST be a `readonly AppPermission[]` cast to `PagePermissions`
(per existing convention — see all existing entries like `billingManual`,
`quotas`, `paymentCatalogs`). Single-permission values are wrapped in a
one-element array:

```ts
export const PAGE_PERMISSIONS = {
  // ... existing ...
  accountingCreditsManage: [AppPermission.ACCOUNTING_CREDITS_MANAGE] as PagePermissions,
  accountingCreditsAdjust: [AppPermission.ACCOUNTING_CREDITS_MANAGE] as PagePermissions,
} as const;
```

### 6.4 Route middleware

Both routes use the existing `withPageAuth` / `requirePermission` middleware
used by every other `(dashboard)` route. No new middleware code — just
register the permission in the page-permissions map.

---

## 7. i18n

### 7.1 Locale type, namespace, and EN/AR implementations

Per the `shared/AGENTS.md` compile-time i18n rules, every new namespace
requires **four** artifacts (type schema, namespace definition, EN impl, AR impl):

**1. Type schema** — `shared/locale/types/dashboard/billing/creditAdjustment.ts` 🆕

Define a `CreditAdjustmentLabels` interface with all keys (use TypeScript
function-typed fields for interpolation / pluralization, not ICU strings):

```ts
export interface CreditAdjustmentLabels {
  readonly title: string;
  readonly adjustCredits: string;
  readonly adjustmentType: {
    readonly add: string;
    readonly subtract: string;
    readonly subtractWithCarryover: string;
  };
  readonly carryover: {
    readonly bannerTitle: string;
    readonly teacher: string;
    readonly fromDate: string;
    readonly toDate: string;
    readonly paymentDate: string;
  };
  readonly reason: { readonly label: string };
  readonly hours: { readonly label: string };
  readonly validation: {
    readonly fromAfterTo: string;
    readonly paymentTooFar: string;
    readonly insufficientClasses: string;
  };
  readonly success: {
    readonly added: (hours: number) => string;
    readonly subtracted: (hours: number) => string;
    readonly carryover: (hours: number, teacher: string) => string;
  };
}
```

Add `export * from "./creditAdjustment";` to `shared/locale/types/dashboard/billing/index.ts`.
Register the namespace ID in `shared/locale/types/message.ts` (`MessageSchema`).

**2. Namespace** — `shared/locale/namespaces/dashboard/billing/creditAdjustment.namespace.ts` 🆕

```ts
import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { CreditAdjustmentLabels } from "@/shared/locale/types/dashboard/billing/creditAdjustment";

export const DashboardBillingCreditAdjustment = defineNamespace<CreditAdjustmentLabels>(
  "dashboard.billing.creditAdjustment",
  {
    load: {
      en: () => import("@/shared/locale/en/dashboard/billing/creditAdjustment").then(m => m.dashboardBillingCreditAdjustmentEn),
      ar: () => import("@/shared/locale/ar/dashboard/billing/creditAdjustment").then(m => m.dashboardBillingCreditAdjustmentAr),
    },
  }
);
```

Add `export * from "./creditAdjustment.namespace";` to
`shared/locale/namespaces/dashboard/billing/index.ts` (create if missing).

**3. EN implementation** — `shared/locale/en/dashboard/billing/creditAdjustment.ts` 🆕

**4. AR implementation** — `shared/locale/ar/dashboard/billing/creditAdjustment.ts` 🆕

Keys (see type above for shape):

| Key                                | EN                                             | AR                                              |
|------------------------------------|------------------------------------------------|--------------------------------------------------|
| `title`                            | "Student Credits"                              | "رصيد الطلاب"                                     |
| `adjustCredits`                    | "Adjust Credits"                               | "تعديل الرصيد"                                    |
| `adjustmentType.add`               | "Add"                                          | "إضافة"                                          |
| `adjustmentType.subtract`          | "Subtract"                                     | "خصم"                                            |
| `adjustmentType.subtractWithCarryover` | "Subtract With Carryover"                  | "خصم مع الترحيل"                                  |
| `carryover.bannerTitle`            | "Carryover — allocate to teacher"              | "الترحيل — تخصيص للمعلم"                          |
| `carryover.teacher`                | "Teacher"                                      | "المعلم"                                          |
| `carryover.fromDate`               | "From Date"                                    | "من تاريخ"                                        |
| `carryover.toDate`                 | "To Date"                                     | "إلى تاريخ"                                       |
| `carryover.paymentDate`            | "Payment Date"                                 | "تاريخ الدفع"                                     |
| `reason.label`                     | "Reason"                                       | "السبب"                                          |
| `hours.label`                      | "Hours"                                        | "الساعات"                                         |
| `validation.fromAfterTo`           | "From Date cannot be after To Date"            | "لا يمكن أن يكون تاريخ البداية بعد تاريخ النهاية"  |
| `validation.paymentTooFar`        | "Payment Date cannot be more than 1 day ahead" | "لا يمكن أن يتجاوز تاريخ الدفع يوماً واحداً"        |
| `validation.insufficientClasses`   | "Student has insufficient credit hours"        | "لا يوجد رصيد كافٍ للطالب"                         |
| `success.added(hours)`             | `(hours) => \`Added ${hours} credit hours\``    | `(hours) => \`تمت إضافة ${hours} ساعة معتمدة\``    |
| `success.subtracted(hours)`         | `(hours) => \`Subtracted ${hours} credit hours\``| `(hours) => \`تم خصم ${hours} ساعة معتمدة\``         |
| `success.carryover(hours, teacher)`| `(hours, teacher) => \`Subtracted ${hours} hours and allocated carryover to ${teacher}\` | `(hours, teacher) => \`تم خصم ${hours} ساعة وترحيلها إلى ${teacher}\` |

### 7.2 Locale snapshot generation

After adding the namespace, run the locale-snapshot generator so the
`public/static/locale-snapshots/{en,ar}/dashboard.billing.creditAdjustment.json`
files are produced for compile-time i18n.

### 7.3 Nav label additions (separate namespace)

As noted in §6.1, the sidebar item's `labelKey: "accountingCredits"` lives
in the existing `dashboard.core.nav` namespace — add the key to its type
schema + EN + AR files (do NOT duplicate it in `dashboard.billing.creditAdjustment`).

---

## 8. Testing Strategy

### 8.1 Service-layer tests

**File:** `backend/services/billing/credit-adjustment.service.test.ts`

Covers:
- Add happy path → ledger row + balance increment.
- Subtract happy path → ledger row + balance decrement.
- Subtract With Carryover happy path → ledger row + balance decrement + carryover columns set.
- Insufficient classes (Subtract) → `INSUFFICIENT_CLASSES`, no row.
- Insufficient classes (Carryover) → `INSUFFICIENT_CLASSES`, no row, no carryover.
- Idempotent re-submit (same key) → returns first row, no duplicate.
- Concurrent re-submit (unique-violation catch) → returns first row.
- fromDate > toDate → validation error.
- paymentDate > +1 day → validation error.
- Missing teacher (Carryover) → validation error.
- Permission denied (no `ACCOUNTING_CREDITS_MANAGE`) → throws.

### 8.2 GraphQL tests

**File:** `backend/graphql/mutation/billing/credit-adjustment.mutation.test.ts`

- Mutation returns the result object shape.
- Permission denied surfaces as GraphQL error.
- Mutation-argument coverage (per `docs/testing/mutation-argument-coverage.md`).

### 8.3 Frontend tests

- `CreditAdjustForm.test.tsx` — radio switch hides/shows carryover; submit
  calls mutation with correct variables; double-click absorbed by
  `clientRequestId`; success navigates back.
- `StudentCreditsList.test.tsx` — renders rows; "Adjust" action navigates.
- `RichTextEditor.test.tsx` — emits HTML; empty when cleared.

### 8.4 Migration tests

- Additive migration applies cleanly on a populated DB.
- Existing `recordPurchase` / `deductForBooking` / `refundOnCancel` flows
  still pass after migration (regression smoke).

### 8.5 Quality loops (per file)

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
| **Plan 5** (Carryover Balance Module) | Plan 2 **writes** the carryover entry (via `maybeInsertCarryoverBalanceEntry` when the table exists, else via the four `carryover_*` columns on `credit_transactions`). Plan 5 **reads** and **settles** (pays out) those entries. The §2.5 backfill bridges the two. |
| Existing credit ledger | Plan 2 extends, never forks. All existing reads (`getStudentTransactions`, balance, reporting) keep working. |
| Plan 1 (if any — Student Credits portal) | Plan 2's mutations are admin-only; the student-facing portal reads the same ledger rows. |
| Quota system | `QuotaService.refreshStudentOndemandInstances` is called after every balance change, matching existing `recordPurchase` behavior. |

---

## 10. Risks & Mitigations

| Risk                                                                    | Mitigation                                                                                          |
|-------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| Enum DDL fails inside a migration transaction (PG limitation).           | Mark the enum-add migration `--single-transaction=false`; split schema-add and enum-add into two migration files. |
| Operator double-submit creates duplicate carryover entries.             | Idempotency key includes `adjustmentType + hours + teacherId + dates` (excludes notes); `clientRequestId` absorbs double-clicks. |
| Plan 5 not ready — carryover entries "lost".                            | All carryover metadata persists on `credit_transactions` columns; Plan 5 backfills on activation (§2.5). |
| Rich-text XSS via `notes`.                                              | Server-side `sanitizeHtml` (DOMPurify + jsdom) before persist; CSP headers on the response.         |
| Subtract drives balance negative due to a race.                         | Balance check is INSIDE the tx (TOCTOU-safe), matching the existing `deductForBooking` pattern.    |
| Permission scope drift (`CREDITS_MANAGE` vs `ACCOUNTING_CREDITS_MANAGE`). | Documented in §2.3; seed groups updated; mutation re-checks via `requirePermission`.              |
| Sidebar group confusion (Finance vs Accounting).                        | Reuse `grp_finance` (Q1 in specs); new "Credits" item appears under it with its own permission.     |

---

## 11. Out-of-Scope (Deferred)

- Bulk import of adjustments.
- Operator undo / "reverse adjustment" action (use a compensating adjustment instead).
- Carryover currency conversion (Plan 5).
- Notifications to parent/teacher on adjustment (separate notification plan).
- Reporting/dashboard widgets summarizing adjustments (separate reporting plan).
