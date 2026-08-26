# Plan 3 — Teacher Payroll Calculation Engine: Implementation

> Companion to `specs.md`. Describes how the Siraj LMS `class_instances`
> table is extended with payroll calculation columns, a new
> `PayrollCalculationService` is introduced, and the existing
> `teacher_dues` accrual flow is wired through to consume the
> calculated amount.

---

## 1. Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              Next.js 16 App Router                          │
│                                                                            │
│   /accounting/payroll                                                       │
│   ┌───────────────────────────────────────────────────────────┐            │
│   │ PayrollReportsContainer                                    │            │
│   │  - Apollo useQuery(PAYROLL_REPORT, { variables })         │            │
│   │  - MUI DataGrid (filterable by teacher/student/date/status)│            │
│   │  - "Override" row action → OverrideDialog                  │            │
│   │  - "Export CSV" toolbar button                             │            │
│   └────────────────────────────────────────┬─────────────────────┘         │
└─────────────────────────────────────────────┼──────────────────────────────┘
                                              │ GraphQL (Pothos)
                                              ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                          GraphQL Layer (Pothos)                              │
│   Query:    payrollReport(filter)  → PayrollReportPage                     │
│             classInstanceDetail (existing — extended w/ payroll fields)    │
│   Mutation: applyPayrollOverride(input) → PayrollOverrideResult           │
└─────────────────────────────────────────────┬──────────────────────────────┘
                                              │
                                              ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                       Service Layer (PayrollCalculationService)              │
│   calculateForInstance(instanceId, actorUserId, opts) → PayrollCalculation │
│     - resolveGraceSettings()        → reads system_settings (cached)        │
│     - resolveEffectiveRate()         → reuses RateResolverService           │
│     - applyGraceOrProRate()          → minutes → calculatedDuration        │
│     - applyOutcomeRule()             → student-absent / teacher-absent       │
│     - computePaidAmount()            → duration × rate                      │
│   applyOverride(input, actorUserId) → PayrollOverrideResult                │
│     - validateStateTransition()       → REFUND/CALCULATED/NOT_CALCULATED/...│
│     - recomputePartialAmount()        → Partially % branch                 │
│     - emitClassStatusEvent()          → PAYROLL_OVERRIDE audit row         │
└─────────────────────────────────────────────┬──────────────────────────────┘
                                              │ Drizzle ORM
                                              ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                          PostgreSQL                                          │
│   class_instances (EXTENDED)                                                │
│     + calculatedDuration     integer NULL                                   │
│     + teacherPaidAmount       textColumn (stored as text) NULL                             │
│     + teacherPaidCurrency     currency_code NULL                             │
│     + calculationStatus       calculation_status_enum NOT NULL DEFAULT 'NOT_CALCULATED'│
│     + isPartialPercentage     smallint NULL  (0–100, set only when PARTIALLY)│
│     + payrollNote             varcharColumn(2000) NULL                             │
│     + payrollCalculatedAt     timestamptz NULL                              │
│     + payrollCalculatedBy     uuid NULL FK→users.id                          │
│   system_settings (3 new rows)                                              │
│     + payroll.grace_short_minutes       = 3                                  │
│     + payroll.grace_long_minutes        = 6                                  │
│     + payroll.grace_threshold_minutes   = 30                                 │
│   class_status_events (existing — reused for PAYROLL_OVERRIDE rows)         │
│   NEW calculation_status enum: NOT_CALCULATED | CALCULATED | PARTIALLY |    │
│                                 REFUND | WAITING_PAID | PAID                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Design principle:** Extend, do not fork. Every calculation flows through
`PayrollCalculationService` so the existing rate-resolver, `teacher_dues`
accrual, and `teacher_payments` disbursement flows keep working unchanged —
they now consume a pre-computed `teacherPaidAmount` instead of recomputing
on the fly.

---

## 2. Data Model

### 2.1 New enum: `CalculationStatus`

**File:** `backend/enum/teachers/payroll-calculation.enum.ts` 🆕

```ts
export enum CalculationStatus {
  NOT_CALCULATED = "NOT_CALCULATED",
  CALCULATED = "CALCULATED",
  PARTIALLY = "PARTIALLY",
  REFUND = "REFUND",
  WAITING_PAID = "WAITING_PAID",
  PAID = "PAID",
}
```

> ⚠️ The enum **values** follow the codebase-wide SCREAMING_SNAKE_CASE
> convention used by every other PG enum (`CreditReason`, `ClassExecutionState`,
> `TeacherDueStatus`, `ClassOutcome`, etc.). The human-readable labels
> ("Not Calculated", "Calculated", "Partially", "Refund", "Waiting Paid",
> "Paid") live in the i18n namespace `dashboard.billing.payroll.status.*` —
> never in the enum values themselves. The Postgres enum `calculation_status`
> uses these exact SCREAMING_SNAKE_CASE strings.

Mirror this enum in:
- `shared/constants/teachers/payroll-calculation.enum.ts` 🆕 (shared client/server)
- `backend/db/schema/enums.ts` via
  `createPgEnumFromEnum("calculation_status", CalculationStatus)`
- `backend/enum/teachers/index.ts` — add `export * from "./payroll-calculation.enum";`
- `shared/constants/teachers/index.ts` — add `export * from "./payroll-calculation.enum";` (create if missing)
- `backend/graphql/pothos/shared/enum.pothos.ts` — register `CalculationStatusPothosEnum`
  so GraphQL codegen picks it up (per `backend/enum/AGENTS.md` §Adding New Enums step 5).

### 2.2 New permission: `ACCOUNTING_PAYROLL_VIEW` + `ACCOUNTING_PAYROLL_MANAGE`

**File:** `backend/enum/permissions/permission.enum.ts`

```ts
// LMS — Accounting / Payroll (Plan 3)
ACCOUNTING_PAYROLL_VIEW = "accounting.payroll_view",
ACCOUNTING_PAYROLL_MANAGE = "accounting.payroll_manage",
```

Add to the seed `permission-groups` so the "Accounting" / "Finance
Manager" group gets both by default. The `_VIEW` permission is
intentionally separate so read-only auditors can be granted view-only
access without override capability.

### 2.3 Extended table: `class_instances`

**File:** `backend/db/schema/classes/scheduling.ts`

Additive columns only — every existing row gets sensible defaults.

```ts
import { calculationStatusEnum } from "@/backend/db/schema/enums";

export const classInstances = createTable("class_instances", {
  // ... existing columns unchanged ...
  // ── Plan 3 additions ───────────────────────────────────────────────
  calculatedDuration: integerColumn("calculated_duration"), // minutes; null until calc runs
  teacherPaidAmount: textColumn("teacher_paid_amount", { precision: 12, scale: 2 }),
  teacherPaidCurrency: currencyCodeEnum("teacher_paid_currency").$type<CurrencyCode>(),
  calculationStatus: calculationStatusEnum("calculation_status")
    .notNull()
    .default(CalculationStatus.NOT_CALCULATED)
    .$type<CalculationStatus>(),
  isPartialPercentage: smallint("is_partial_percentage"), // 0–100; null unless status=PARTIALLY
  payrollNote: varcharColumn("payroll_note", { length: 2000 }),
  payrollCalculatedAt: timestampColumn("payroll_calculated_at", { withTimezone: true, precision: 3 }),
  payrollCalculatedBy: uuidColumn("payroll_calculated_by").references(() => users.id, {
    onDelete: "set null",
  }),
},
(table) => [
  // ... existing indexes ...
  index("class_instances_calculation_status_idx").on(table.calculationStatus),
  index("class_instances_teacher_paid_amount_idx").on(table.teacherPaidAmount),
  index("class_instances_payroll_calculated_at_idx").on(table.payrollCalculatedAt),
  index("class_instances_teacher_status_scheduled_idx").on(
    table.teacherId, table.calculationStatus, table.scheduledStartAt
  ),
  check(
    "class_instances_partial_percentage_chk",
    sql`(${table.calculationStatus} != 'PARTIALLY' OR ${table.isPartialPercentage} IS NOT NULL) AND
         (${table.calculationStatus} = 'PARTIALLY' OR ${table.isPartialPercentage} IS NULL) AND
         (${table.isPartialPercentage} IS NULL OR (${table.isPartialPercentage} >= 0 AND ${table.isPartialPercentage} <= 100))`
  ),
  check(
    "class_instances_calculated_status_amount_chk",
    sql`(${table.calculationStatus} != 'REFUND' OR ${table.teacherPaidAmount} = 0) AND
         (${table.calculationStatus} != 'CALCULATED' OR ${table.calculatedDuration} IS NOT NULL)`
  ),
]);
```

**Migration policy (see `docs/DATABASE_MIGRATIONS.md`):**
- New columns are nullable OR have a non-null default → safe additive migration.
- New enum value set added via `CREATE TYPE` (a fresh enum, not `ALTER TYPE ADD VALUE`) — fully transactional.
- New `system_settings` rows inserted via `INSERT ... ON CONFLICT (key) DO NOTHING`.
- Zero downtime for existing scheduling / state-machine flows.

### 2.4 `system_settings` seed entries

**File:** `backend/db/seeds/shared/system-settings.ts` (extend existing)

```ts
{
  key: "payroll.grace_short_minutes",
  value: "3",
  dataType: SystemSettingDataType.Integer,
  description: "Grace period (minutes) for sessions ≤ payroll.grace_threshold_minutes.",
  category: SystemSettingCategory.Payroll,
},
{
  key: "payroll.grace_long_minutes",
  value: "6",
  dataType: SystemSettingDataType.Integer,
  description: "Grace period (minutes) for sessions > payroll.grace_threshold_minutes.",
  category: SystemSettingCategory.Payroll,
},
{
  key: "payroll.grace_threshold_minutes",
  value: "30",
  dataType: SystemSettingDataType.Integer,
  description: "Scheduled-duration cutoff (minutes) that picks short vs long grace threshold.",
  category: SystemSettingCategory.Payroll,
},
```

If `SystemSettingCategory.Payroll` does not yet exist, add it to
`shared/constants/settings/system-settings.enum.ts` (additive enum value).

### 2.5 Cross-plan handoff to `teacher_dues` (existing module)

When a lesson report is approved, the existing
`TeacherDueService.createDueEntry(instanceId, actorUserId, …)` flow already
inserts a `teacher_dues` row using the rate-resolver snapshot. After
Plan 3 lands, that accrual call shall:

1. Read `class_instances.calculationStatus` first.
2. If `CALCULATED`, `PARTIALLY`, or `REFUND` — use
   `class_instances.teacherPaidAmount` / `teacherPaidCurrency` as the
   authoritative due amount (no re-resolution).
3. If `NOT_CALCULATED` — log a warning and fall back to the legacy
   rate-resolver path so the existing flow does not break.
4. Set `class_instances.calculationStatus = WAITING_PAID` in the same
   transaction.

When the existing `markTeacherDuesPaid` GraphQL mutation runs (which calls
`TeacherDueService.markAsPaid(actorUserId, dueIds, teacherPaymentId, locale)`
under the hood), it shall also flip the linked `class_instances.calculationStatus`
to `PAID` in the same transaction (AC-9.5).

### 2.6 Backfill migration (one-shot, out-of-band)

A separate, idempotent backfill script (NOT run by the application at
boot) computes `calculatedDuration` + `teacherPaidAmount` for all
historical `COMPLETED` rows that predate the migration. The script
reuses `PayrollCalculationService.calculateForInstance` in a `dryRun`
mode so accounting can preview before applying.

```sql
-- Idempotent: only touches rows still at the default NOT_CALCULATED state.
UPDATE class_instances
SET calculation_status = 'Calculated',
    calculated_duration = sub.calc_duration,
    teacher_paid_amount = sub.calc_amount,
    teacher_paid_currency = sub.calc_currency,
    payroll_calculated_at = now(),
    payroll_calculated_by = '<system-user-id>'
FROM (
  SELECT id,
         /* …reuse service logic via a SQL mirror or a node script… */
         0 AS calc_duration, 0 AS calc_amount, 'USD' AS calc_currency
  FROM class_instances
  WHERE execution_state = 'COMPLETED'
    AND calculation_status = 'Not Calculated'
    AND deleted_at IS NULL
) AS sub
WHERE class_instances.id = sub.id;
```

In practice this runs as a Node script (`bun run scripts/payroll-backfill.ts`)
so the same TypeScript calculator is reused for backfill and runtime.
The backfill script must use the SCREAMING_SNAKE_CASE enum values in SQL
(`'NOT_CALCULATED'`, `'CALCULATED'`) — NOT the human-readable labels.

---

## 3. Service Layer

**File:** `backend/services/teachers/payroll-calculation.service.ts`

### 3.1 New input/output types

**File:** `backend/types/teachers/payroll.types.ts`

```ts
import type { CalculationStatus } from "@/backend/enum";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

export interface PayrollCalculationInput {
  instanceId: string;
  actorUserId: string;
  /** When true, an ON_DEMAND_* terminal state triggered the calc. */
  isOnDemand?: boolean;
  /** When true, allow recalc even if status is PARTIALLY/REFUND/WAITING_PAID. */
  forceRecalc?: boolean;
}

export interface PayrollCalculationResult {
  instanceId: string;
  calculatedDuration: number;        // minutes
  teacherPaidAmount: string;          // numeric as string (precision-safe)
  teacherPaidCurrency: CurrencyCode;
  calculationStatus: CalculationStatus;
  /** True when the absence-rule branch fired as student-absent. */
  isStudentAbsence: boolean;
  /** True when the absence-rule branch fired as teacher-absent. */
  isTeacherAbsence: boolean;
  /** True when the grace-window branch fired (i.e. on-time). */
  isWithinGrace: boolean;
  /** True when pro-rating fired (late entry beyond grace). */
  isProRated: boolean;
}

export interface PayrollOverrideInput {
  instanceId: string;
  actorUserId: string;
  targetStatus: CalculationStatus;
  /** Required when targetStatus === Partially. Integer 0–100. */
  partialPercentage?: number | null;
  /** Operator note. Required for Partially + Refund; optional otherwise. */
  note?: string | null;
  /** Bypass WAITING_PAID guard. Requires ACCOUNTING_PAYROLL_MANAGE. */
  force?: boolean;
  /** Absorbs double-clicks; same value within 30s = idempotent. */
  clientRequestId?: string | null;
}

export interface PayrollOverrideResult {
  instanceId: string;
  calculationStatus: CalculationStatus;
  teacherPaidAmount: string | null;
  teacherPaidCurrency: CurrencyCode | null;
  calculatedDuration: number | null;
  isPartialPercentage: number | null;
  payrollNote: string | null;
  /** The class_status_events row id emitted for this override. */
  auditEventId: string;
}

export interface PayrollReportFilters {
  teacherId?: string | null;
  studentId?: string | null;
  dateFrom?: string | null;        // ISO date
  dateTo?: string | null;
  calculationStatuses?: readonly CalculationStatus[] | null;
  search?: string | null;          // teacher/student name LIKE
}

export interface PayrollReportRow {
  instanceId: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  scheduledDurationMinutes: number;
  actualStartAt: string | null;
  actualEndAt: string | null;
  calculatedDuration: number | null;
  teacherPaidAmount: string | null;
  teacherPaidCurrency: CurrencyCode | null;
  calculationStatus: CalculationStatus;
  isPartialPercentage: number | null;
  payrollNote: string | null;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  subjectId: string;
  subjectName: string;
  isStudentAbsence: boolean;
  isTeacherAbsence: boolean;
}

export interface PayrollReportPage {
  rows: PayrollReportRow[];
  totalCount: number;
  aggregates: {
    totalPaidAmount: string;
    totalPaidCurrency: CurrencyCode;
    rowCountByStatus: Record<CalculationStatus, number>;
  };
}
```

### 3.2 `resolveGraceSettings`

```ts
async function resolveGraceSettings(): Promise<{
  shortMinutes: number;
  longMinutes: number;
  thresholdMinutes: number;
}> {
  const settings = await SystemSettingsRepository.getMany([
    "payroll.grace_short_minutes",
    "payroll.grace_long_minutes",
    "payroll.grace_threshold_minutes",
  ]);

  const shortMinutes = parsePositiveInt(settings["payroll.grace_short_minutes"], 3);
  const longMinutes = parsePositiveInt(settings["payroll.grace_long_minutes"], 6);
  const thresholdMinutes = parsePositiveInt(settings["payroll.grace_threshold_minutes"], 30);

  if (shortMinutes < 0 || longMinutes < 0 || thresholdMinutes < 1) {
    logger.warn("Payroll grace settings are misconfigured; falling back to defaults", {
      shortMinutes, longMinutes, thresholdMinutes,
    });
    return { shortMinutes: 3, longMinutes: 6, thresholdMinutes: 30 };
  }
  return { shortMinutes, longMinutes, thresholdMinutes };
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}
```

### 3.3 `calculateForInstance`

```ts
export async function calculateForInstance(
  input: PayrollCalculationInput,
  tErrors: ErrorsLabels,
): Promise<PayrollCalculationResult> {
  await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_PAYROLL_MANAGE, tErrors);

  return db.transaction(async (tx) => {
    const instance = await ClassInstanceRepository.getById(input.instanceId, tx, { forUpdate: true });
    if (!instance) throw new DomainError("CLASS_INSTANCE_NOT_FOUND", tErrors.classes.notFound);

    // US-2.6 — never auto-recalc rows in a sticky override state.
    const stickyStates: CalculationStatus[] = [
      CalculationStatus.PARTIALLY,
      CalculationStatus.REFUND,
      CalculationStatus.WAITING_PAID,
      CalculationStatus.PAID,
    ];
    if (stickyStates.includes(instance.calculationStatus) && !input.forceRecalc) {
      return mapToCalculationResult(instance);
    }

    // US-2.1 / US-2.2 — only run on terminal states.
    const terminalStates: ClassExecutionState[] = [
      ClassExecutionState.COMPLETED,
      ClassExecutionState.ON_DEMAND_NO_CREDITS_CANCELLED,
      ClassExecutionState.ON_DEMAND_NO_CREDITS_ABSENT,
      ClassExecutionState.ON_DEMAND_CONFLICT_HELD,
      ClassExecutionState.ON_DEMAND_PENDING_CREDITS,
    ];
    if (!terminalStates.includes(instance.executionState)) {
      throw new DomainError("PAYROLL_NOT_TERMINAL", tErrors.payroll.notTerminal);
    }

    const grace = await resolveGraceSettings();
    // The existing `RateResolverService` is a PURE function `resolveClassRate`
    // (not a method on a service class). Fetch the related entities first,
    // then call it directly — see `backend/services/pricing/rate-resolver.service.ts`.
    const [recurringSchedule, subject, teacher] = await Promise.all([
      instance.recurringScheduleId
        ? RecurringScheduleRepository.findById(instance.recurringScheduleId, tx)
        : Promise.resolve(null),
      ClassSubjectRepository.findById(instance.subjectId, tx),
      TeacherRepository.findByUserId(instance.teacherId, tx),
    ]);
    if (!teacher) throw new DomainError("TEACHER_NOT_FOUND", tErrors.teacherNotFound(instance.teacherId));
    const resolvedRate = resolveClassRate({
      classInstance: instance,
      recurringSchedule,
      subject,
      teacher,
    });
    const rate = { amount: resolvedRate.hourlyRate, currency: resolvedRate.currency };

    let calculatedDuration = 0;
    let isStudentAbsence = false;
    let isTeacherAbsence = false;
    let isWithinGrace = false;
    let isProRated = false;

    const scheduledDurationMin = differenceInMinutes(instance.scheduledEndAt, instance.scheduledStartAt);

    // US-4: student absence — teacher joined, student did not.
    if (instance.outcome === ClassOutcome.ABSENT && instance.actualStartAt != null) {
      isStudentAbsence = true;
      calculatedDuration = scheduledDurationMin;
    }
    // US-5: teacher absence — teacher never joined, session is COMPLETED.
    else if (instance.actualStartAt == null && instance.outcome !== ClassOutcome.ABSENT) {
      isTeacherAbsence = true;
      calculatedDuration = 0;
    }
    // US-3 + US-2.3: grace-period / pro-rating logic.
    else {
      const effectiveStart = instance.actualStartAt ?? instance.scheduledStartAt;
      const latenessMin = differenceInMinutes(effectiveStart, instance.scheduledStartAt);
      const graceThreshold =
        scheduledDurationMin <= grace.thresholdMinutes ? grace.shortMinutes : grace.longMinutes;

      if (latenessMin <= graceThreshold) {
        isWithinGrace = true;
        calculatedDuration = scheduledDurationMin;
      } else {
        isProRated = true;
        const cappedEnd = instance.actualEndAt && isBefore(instance.actualEndAt, instance.scheduledEndAt)
          ? instance.actualEndAt
          : instance.scheduledEndAt;
        calculatedDuration = Math.max(0, differenceInMinutes(cappedEnd, effectiveStart));
      }
    }

    const paidAmount = (calculatedDuration / 60) * Number(rate.amount);
    const paidAmountStr = paidAmount.toFixed(2);

    const [updated] = await tx.update(classInstances)
      .set({
        calculatedDuration,
        teacherPaidAmount: paidAmountStr,
        teacherPaidCurrency: rate.currency,
        calculationStatus: CalculationStatus.CALCULATED,
        isPartialPercentage: null,
        payrollNote: null,
        payrollCalculatedAt: new Date(),
        payrollCalculatedBy: input.actorUserId,
        updatedAt: new Date(),
      })
      .where(eq(classInstances.id, input.instanceId))
      .returning();

    if (!updated) throw new DomainError("UPDATE_FAILED", "class_instances update returned no row");

    logger.info("Payroll calculated", {
      actorUserId: input.actorUserId,
      instanceId: input.instanceId,
      calculatedDuration,
      paidAmount: paidAmountStr,
      currency: rate.currency,
      isStudentAbsence, isTeacherAbsence, isWithinGrace, isProRated,
    });

    return mapToCalculationResult(updated, { isStudentAbsence, isTeacherAbsence, isWithinGrace, isProRated });
  });
}
```

### 3.4 `applyOverride`

```ts
export async function applyOverride(
  input: PayrollOverrideInput,
  tErrors: ErrorsLabels,
): Promise<PayrollOverrideResult> {
  await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_PAYROLL_MANAGE, tErrors);
  validateOverrideInput(input, tErrors);

  const idempotencyKey = deriveOverrideIdempotencyKey(input);

  return db.transaction(async (tx) => {
    const instance = await ClassInstanceRepository.getById(input.instanceId, tx, { forUpdate: true });
    if (!instance) throw new DomainError("CLASS_INSTANCE_NOT_FOUND", tErrors.classes.notFound);

    // AC-6.7 / AC-6.8 — state guards.
    if (instance.calculationStatus === CalculationStatus.PAID) {
      throw new DomainError("PAYROLL_ALREADY_PAID", tErrors.payroll.alreadyPaid);
    }
    if (instance.calculationStatus === CalculationStatus.WAITING_PAID && !input.force) {
      throw new DomainError("PAYROLL_AWAITING_SETTLEMENT", tErrors.payroll.awaitingSettlement);
    }

    // Idempotency: if a matching override event already exists within 30s, return it.
    // NOTE: `findRecentByInstanceAndHash` is a NEW repository method to be added
    // to `ClassStatusEventsRepository` (plural — see existing namespace in
    // `backend/db/repo/scheduling/class-status-events.repository.ts`). It looks
    // up rows where `toState->>'idempotencyKey' = $1` and `created_at >= now() - interval '30 seconds'`.
    const existingEvent = await ClassStatusEventsRepository.findRecentByInstanceAndHash(
      input.instanceId, idempotencyKey, /*windowSeconds=*/30, tx
    );
    if (existingEvent) {
      return mapToOverrideResult(instance, existingEvent.id);
    }

    const previousStatus = instance.calculationStatus;
    const sanitizedNote = input.note ? sanitizePlainText(input.note).slice(0, 2000) : null;

    const patch = computeOverridePatch(instance, input, sanitizedNote);

    const [updated] = await tx.update(classInstances)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(classInstances.id, input.instanceId))
      .returning();

    if (!updated) throw new DomainError("UPDATE_FAILED", "class_instances update returned no row");

    const eventRows = await ClassStatusEventsRepository.createMany(
      [{
        classInstanceId: input.instanceId,
        eventType: "PAYROLL_OVERRIDE",
        fromState: { calculationStatus: previousStatus, teacherPaidAmount: instance.teacherPaidAmount ?? null },
        toState: {
          calculationStatus: patch.calculationStatus,
          teacherPaidAmount: patch.teacherPaidAmount ?? null,
          partialPercentage: patch.isPartialPercentage ?? null,
          // idempotencyKey stored inside `toState` jsonb so duplicates collapse
          // (the existing `class_status_events` schema has no `metadata` column).
          idempotencyKey,
        },
        description: sanitizedNote ?? null,
        actorUserId: input.actorUserId,
        createdAt: new Date(),
      }],
      tx
    );
    const event = eventRows[0];
    if (!event) throw new DomainError("INSERT_FAILED", "class_status_events insert returned no row");

    logger.info("Payroll override applied", {
      actorUserId: input.actorUserId,
      instanceId: input.instanceId,
      previousStatus, newStatus: patch.calculationStatus,
      amount: patch.teacherPaidAmount,
    });

    return mapToOverrideResult(updated, event.id);
  });
}
```

### 3.5 `computeOverridePatch` (the four-mode matrix)

```ts
function computeOverridePatch(
  instance: ClassInstanceSelectType,
  input: PayrollOverrideInput,
  sanitizedNote: string | null,
): Partial<ClassInstanceSelectType> {
  const base = {
    payrollNote: sanitizedNote,
    payrollCalculatedAt: new Date(),
    payrollCalculatedBy: input.actorUserId,
  };

  switch (input.targetStatus) {
    case CalculationStatus.REFUND:
      return {
        ...base,
        calculationStatus: CalculationStatus.REFUND,
        teacherPaidAmount: "0.00",
        // keep calculatedDuration / currency as-is for audit
        isPartialPercentage: null,
      };

    case CalculationStatus.NOT_CALCULATED:
      return {
        ...base,
        calculationStatus: CalculationStatus.NOT_CALCULATED,
        teacherPaidAmount: null,
        calculatedDuration: null,
        isPartialPercentage: null,
        // keep currency
      };

    case CalculationStatus.CALCULATED:
      // The caller should re-run calculateForInstance with forceRecalc=true
      // and then re-issue applyOverride(CALCULATED) — but if the operator
      // just wants to "re-mark as Calculated" without rerun, we trust the
      // existing calculatedDuration.
      return {
        ...base,
        calculationStatus: CalculationStatus.CALCULATED,
        isPartialPercentage: null,
      };

    case CalculationStatus.PARTIALLY:
      if (input.partialPercentage == null) {
        throw new DomainError("PAYROLL_PARTIAL_REQUIRES_PERCENTAGE", "partialPercentage required");
      }
      const baseAmount = instance.teacherPaidAmount
        ? Number(instance.teacherPaidAmount)
        : 0; // operator can override even on a NOT_CALCULATED row, treating base as 0
      const partialAmount = (baseAmount * input.partialPercentage) / 100;
      return {
        ...base,
        calculationStatus: CalculationStatus.PARTIALLY,
        teacherPaidAmount: partialAmount.toFixed(2),
        isPartialPercentage: input.partialPercentage,
      };

    // WAITING_PAID / PAID are not user-selectable; they are set by the
    // existing teacher_dues flow.
    default:
      throw new DomainError("PAYROLL_INVALID_TARGET_STATUS", `Cannot override to ${input.targetStatus}`);
  }
}
```

### 3.6 `getReport` (read model)

```ts
export async function getReport(
  actorUserId: string,
  filters: PayrollReportFilters,
  pagination: { limit: number; offset: number },
  tErrors: ErrorsLabels,
): Promise<PayrollReportPage> {
  await requirePermission(actorUserId, AppPermission.ACCOUNTING_PAYROLL_VIEW, tErrors);

  const { rows, totalCount } = await ClassInstanceRepository.findPayrollReportRows(
    filters, pagination,
  );

  // Aggregate totals — server-side single pass, no N+1.
  const totalPaidAmount = rows.reduce((sum, r) => sum + Number(r.teacherPaidAmount ?? 0), 0);
  const rowCountByStatus = countBy(rows, r => r.calculationStatus);
  const totalPaidCurrency = pickDominantCurrency(rows);

  return {
    rows: rows.map(mapToReportRow),
    totalCount,
    aggregates: {
      totalPaidAmount: totalPaidAmount.toFixed(2),
      totalPaidCurrency,
      rowCountByStatus,
    },
  };
}
```

The repository method `findPayrollReportRows` builds a single SQL
query joining `class_instances` + `teachers` (via `users` for name) +
`students` (via `users`) + `class_subjects`, applying the filter
predicates and `LIMIT/OFFSET`. The status-mapping booleans
(`isStudentAbsence`, `isTeacherAbsence`) are computed in the SELECT
clause so they cost nothing extra.

---

## 4. GraphQL Layer (Pothos)

### 4.1 New enum + input + object types

**File:** `backend/graphql/pothos/billing/payroll.pothos.ts`

```ts
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CalculationStatus } from "@/backend/enum";

export const CalculationStatusPothosEnum = gqlSchemaBuilder.enumType(CalculationStatus, {
  name: "CalculationStatus",
  description: "Not Calculated | Calculated | Partially | Refund | Waiting Paid | Paid",
});

export const PayrollReportFilterPothosInput = gqlSchemaBuilder.inputType("PayrollReportFilter", {
  fields: (t) => ({
    teacherId: t.id({ required: false }),
    studentId: t.id({ required: false }),
    dateFrom: t.string({ required: false }),       // ISO date
    dateTo: t.string({ required: false }),
    calculationStatuses: t.field({
      type: [CalculationStatusPothosEnum],
      required: false,
    }),
    search: t.string({ required: false }),
  }),
});

export const PayrollReportRowPothosObject = gqlSchemaBuilder
  .objectRef<PayrollReportRow>("PayrollReportRow")
  .implement({
    fields: (t) => ({
      instanceId: t.exposeID("instanceId"),
      scheduledStartAt: t.expose("scheduledStartAt", { type: "DateTime" }),
      scheduledEndAt: t.expose("scheduledEndAt", { type: "DateTime" }),
      scheduledDurationMinutes: t.exposeInt("scheduledDurationMinutes"),
      actualStartAt: t.expose("actualStartAt", { type: "DateTime", nullable: true }),
      actualEndAt: t.expose("actualEndAt", { type: "DateTime", nullable: true }),
      calculatedDuration: t.exposeInt("calculatedDuration", { nullable: true }),
      teacherPaidAmount: t.exposeString("teacherPaidAmount", { nullable: true }),
      teacherPaidCurrency: t.expose("teacherPaidCurrency", { type: CurrencyCodePothosObject, nullable: true }),
      calculationStatus: t.expose("calculationStatus", { type: CalculationStatusPothosEnum }),
      isPartialPercentage: t.exposeInt("isPartialPercentage", { nullable: true }),
      payrollNote: t.exposeString("payrollNote", { nullable: true }),
      teacherId: t.exposeID("teacherId"),
      teacherName: t.exposeString("teacherName"),
      studentId: t.exposeID("studentId"),
      studentName: t.exposeString("studentName"),
      subjectId: t.exposeID("subjectId"),
      subjectName: t.exposeString("subjectName"),
      isStudentAbsence: t.exposeBoolean("isStudentAbsence"),
      isTeacherAbsence: t.exposeBoolean("isTeacherAbsence"),
    }),
  });

export const PayrollReportPagePothosObject = gqlSchemaBuilder
  .objectRef<PayrollReportPage>("PayrollReportPage")
  .implement({
    fields: (t) => ({
      rows: t.field({ type: [PayrollReportRowPothosObject], resolve: p => p.rows }),
      totalCount: t.exposeInt("totalCount"),
      totalPaidAmount: t.exposeString("totalPaidAmount"),   // path through aggregates
      totalPaidCurrency: t.expose("totalPaidCurrency", { type: CurrencyCodePothosObject }),
      rowCountByStatus: t.field({
        type: "JSON",
        resolve: p => p.aggregates.rowCountByStatus,
      }),
    }),
  });

export const PayrollOverrideInputPothos = gqlSchemaBuilder.inputType("PayrollOverrideInput", {
  fields: (t) => ({
    instanceId: t.id({ required: true }),
    targetStatus: t.field({ type: CalculationStatusPothosEnum, required: true }),
    partialPercentage: t.int({ required: false }),
    note: t.string({ required: false }),
    force: t.booleanColumn({ required: false }),
    clientRequestId: t.string({ required: false }),
  }),
});

export const PayrollOverrideResultPothosObject = gqlSchemaBuilder
  .objectRef<PayrollOverrideResult>("PayrollOverrideResult")
  .implement({
    fields: (t) => ({
      instanceId: t.exposeID("instanceId"),
      calculationStatus: t.expose("calculationStatus", { type: CalculationStatusPothosEnum }),
      teacherPaidAmount: t.exposeString("teacherPaidAmount", { nullable: true }),
      teacherPaidCurrency: t.expose("teacherPaidCurrency", { type: CurrencyCodePothosObject, nullable: true }),
      calculatedDuration: t.exposeInt("calculatedDuration", { nullable: true }),
      isPartialPercentage: t.exposeInt("isPartialPercentage", { nullable: true }),
      payrollNote: t.exposeString("payrollNote", { nullable: true }),
      auditEventId: t.exposeID("auditEventId"),
    }),
  });
```

### 4.2 Extend `ClassInstanceDetailPothosObject`

**File:** `backend/graphql/pothos/billing/class-session-payroll.pothos.ts` (additive)

```ts
fields: (t) => ({
  // ... existing fields ...
  calculatedDuration: t.exposeInt("calculatedDuration", { nullable: true }),
  teacherPaidAmount: t.exposeString("teacherPaidAmount", { nullable: true }),
  teacherPaidCurrency: t.expose("teacherPaidCurrency", { type: CurrencyCodePothosObject, nullable: true }),
  calculationStatus: t.expose("calculationStatus", { type: CalculationStatusPothosEnum }),
  isPartialPercentage: t.exposeInt("isPartialPercentage", { nullable: true }),
  payrollNote: t.exposeString("payrollNote", { nullable: true }),
  payrollCalculatedAt: t.expose("payrollCalculatedAt", { type: "DateTime", nullable: true }),
}),
```

### 4.3 New query + mutation

**File:** `backend/graphql/query/billing/payroll.query.ts`

```ts
gqlSchemaBuilder.queryField("payrollReport", (t) =>
  t.field({
    type: PayrollReportPagePothosObject,
    description: "Paginated payroll report across class instances.",
    authScopes: { permission: AppPermission.ACCOUNTING_PAYROLL_VIEW },
    args: {
      filter: t.arg({ type: PayrollReportFilterPothosInput, required: false }),
      limit: t.arg.int({ required: false, defaultValue: 50 }),
      offset: t.arg.int({ required: false, defaultValue: 0 }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return PayrollCalculationService.getReport(
        actorUserId,
        args.filter ?? {},
        { limit: args.limit ?? 50, offset: args.offset ?? 0 },
        tErrors,
      );
    },
  })
);
```

**File:** `backend/graphql/mutation/billing/payroll.mutation.ts`

```ts
gqlSchemaBuilder.mutationField("applyPayrollOverride", (t) =>
  t.field({
    type: PayrollOverrideResultPothosObject,
    description: "Apply an operator override to a class instance's payroll calculation.",
    authScopes: { permission: AppPermission.ACCOUNTING_PAYROLL_MANAGE },
    args: { input: t.arg({ type: PayrollOverrideInputPothos, required: true }) },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return PayrollCalculationService.applyOverride(
        { ...args.input, actorUserId },
        tErrors,
      );
    },
  })
);
```

### 4.4 CSV export endpoint

**File:** `app/api/payroll/export/route.ts`

A thin Next.js Route Handler that:
1. Calls `requireAuth` + `requirePermission(ACCOUNTING_PAYROLL_VIEW)`.
2. Calls `PayrollCalculationService.getReport(...)` with `limit: 10_000`.
3. Serializes to CSV (using the existing CSV helper).
4. Sets `Content-Type: text/csv; charset=utf-8` +
   `Content-Disposition: attachment; filename="payroll-report.csv"`.
5. Sets `X-Export-Truncated: true` when `totalCount > 10_000`.

---

## 5. Frontend

### 5.1 Apollo documents

**File:** `frontend/common/graphql/sharedDocuments/billing/payroll.documents.ts` 🆕

Follows the project's `TypedDocumentNode` + camelCase + `Document` suffix convention (see `frontend/common/graphql/sharedDocuments/AGENTS.md`):

```ts
import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const payrollReportQueryDocument: TypedDocumentNode<
  Operations.PayrollReportQuery,
  Types.QueryPayrollReportArgs
> = gql`
  query PayrollReport(
    $filter: PayrollReportFilter
    $limit: Int
    $offset: Int
  ) {
    payrollReport(filter: $filter, limit: $limit, offset: $offset) {
      rows {
        instanceId
        scheduledStartAt
        scheduledEndAt
        scheduledDurationMinutes
        actualStartAt
        actualEndAt
        calculatedDuration
        teacherPaidAmount
        teacherPaidCurrency
        calculationStatus
        isPartialPercentage
        payrollNote
        teacherId
        teacherName
        studentId
        studentName
        subjectId
        subjectName
        isStudentAbsence
        isTeacherAbsence
      }
      totalCount
      totalPaidAmount
      totalPaidCurrency
      rowCountByStatus
    }
  }
`;

export const applyPayrollOverrideMutationDocument: TypedDocumentNode<
  Operations.ApplyPayrollOverrideMutation,
  Types.MutationApplyPayrollOverrideArgs
> = gql`
  mutation ApplyPayrollOverride($input: PayrollOverrideInput!) {
    applyPayrollOverride(input: $input) {
      instanceId
      calculationStatus
      teacherPaidAmount
      teacherPaidCurrency
      calculatedDuration
      isPartialPercentage
      payrollNote
      auditEventId
    }
  }
`;
```

- Re-export from `frontend/common/graphql/sharedDocuments/billing/index.ts` via `export * from "./payroll.documents";`.
- Run `bun run generate:gqlSchema && bun codegen` after the schema changes land
  so `Operations.PayrollReportQuery` + `Operations.ApplyPayrollOverrideMutation`
  + their `Types.Args` exist.
- Both selection sets include `id`-equivalent fields (`instanceId`, `auditEventId`)
  so Apollo Client can auto-update its cache.

### 5.2 Routes

| Route                  | File                                                  | Purpose                                  |
|------------------------|-------------------------------------------------------|------------------------------------------|
| `/accounting/payroll`  | `app/(dashboard)/accounting/payroll/page.tsx`         | Payroll Reports list                     |

The route registers `ACCOUNTING_PAYROLL_VIEW` in the page-permissions map
(`PAGE_PERMISSIONS.accountingPayrollView`) so the server-side auth
wrapper enforces it before render.

### 5.3 Payroll Reports page

**Component:** `frontend/common/views/dashboard/billing/accounting/payroll/PayrollReportsContainer.tsx` 🆕

- MUI `DataGrid` (v9) with columns from §4.1.
- Toolbar: search input (debounced 300 ms), **reuse the existing `TeacherAutocomplete`**
  from `@/frontend/common/components/ui/input/userSelect/TeacherAutocomplete`, **reuse the existing `StudentAutocomplete`**
  from `@/frontend/common/components/ui/input/userSelect/StudentAutocomplete`, date-range picker,
  status multi-select, "Export CSV" button (anchor to `/api/payroll/export?...filters`).
- Server-driven pagination via Apollo `fetchMore` / `relay-style`
  cursor emulation (use offset+limit for simplicity).
- Per-row "Override" action (only rendered when the user holds
  `ACCOUNTING_PAYROLL_MANAGE`); opens the `<OverrideDialog />`.
- Aggregate footer card: total paid amount + currency, status counts.
- Empty state: "No payroll rows match the current filters."
- Apollo hooks imported from `@apollo/client/react` (per `sharedDocuments/AGENTS.md`).

### 5.4 Override dialog

**Component:** `frontend/common/views/dashboard/billing/accounting/payroll/OverrideDialog.tsx`

Layout (top-to-bottom):

1. **Current calculation summary** — read-only card showing
   `calculatedDuration`, `teacherPaidAmount`, `calculationStatus`,
   `payrollNote` (if any).
2. **Target status RadioGroup** — 4 options
   (`Refund`, `Calculated`, `Not Calculated`, `Partially`) with
   colored accents:
   - `Refund` → red (zeroes pay).
   - `Calculated` → blue (re-run formula).
   - `Not Calculated` → grey (skip).
   - `Partially` → amber (percentage).
3. **Percentage field** — `TextField` type="number", min=0, max=100,
   step=1. Shown only when `Partially` is selected.
4. **Note field** — `TextField` multiline, max 2 000 chars. Required
   for `Refund` + `Partially`; optional for the other two.
5. **`force` checkbox** — only rendered when the current status is
   `WAITING_PAID`. Defaults to off; when on, the warning banner
   explains the consequence.
6. **Submit / Cancel** — Submit disabled until validation passes;
   shows linear progress while the mutation is in flight.

### 5.5 Success / error UX

- On success: Apollo `client.cache.evict({ id: 'ClassInstanceDetail:<id>' })`
  to refresh the audit drawer; the DataGrid row updates in-place via
  the mutation's return shape.
- On `PAYROLL_ALREADY_PAID`: inline banner above the dialog,
  non-dismissable.
- On `PAYROLL_AWAITING_SETTLEMENT` (without `force`): highlight the
  `force` checkbox + show explanatory tooltip.
- On idempotency-duplicate: silent success — treat as if the first
  call won; show success toast; close dialog.

### 5.6 Audit drawer extension (existing `/classes/[id]/audit`)

**File:** `frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard.tsx` (extend)

Add a new "Payroll Calculation" card to the existing audit grid:

- Current `calculationStatus` chip + colored variant per state.
- `calculatedDuration` minutes, `teacherPaidAmount` +
  `teacherPaidCurrency`, `payrollNote` (if any).
- Chronological list of `PAYROLL_OVERRIDE` events (sourced from the
  existing `classStatusEvents` query, filtered to `eventType =
  'PAYROLL_OVERRIDE'`).
- "Override" button visible only with `ACCOUNTING_PAYROLL_MANAGE`.

---

## 6. UX & Navigation

### 6.1 Sidebar nav item

**File:** `frontend/common/views/dashboard/config/navigationConfig.ts`

Add to `SIDEBAR_NAV_ITEMS` under the existing `grp_finance` group:

```ts
{
  key: "accounting-payroll",
  labelKey: "accountingPayroll",
  iconKey: "payments",
  href: "/accounting/payroll",
  section: "main",
  permission: PAGE_PERMISSIONS.accountingPayrollView, // = [AppPermission.ACCOUNTING_PAYROLL_VIEW] as PagePermissions
  groupId: "grp_finance",
},
```

Also add `AppPermission.ACCOUNTING_PAYROLL_VIEW` to the `grp_finance`
group's `permission` array so the group header renders for users with
only this permission.

**Required locale additions (nav labels live in the `dashboard.core.nav`
namespace, NOT in the new `dashboard.billing.payroll` namespace):**

- `shared/locale/types/dashboard/core/nav.ts` — add `readonly accountingPayroll: string;`
  to `DashboardNavigationLabels`.
- `shared/locale/en/dashboard/core/nav.ts` — add `accountingPayroll: "Payroll"`.
- `shared/locale/ar/dashboard/core/nav.ts` — add `accountingPayroll: "الرواتب"`.
- `navIconKeys.ts` — `payments` is already in the `NavIconKey` union; no change needed.

### 6.2 Icon registry

**File:** `frontend/common/views/dashboard/config/navIconKeys.ts`

`payments` is already in the `NavIconKey` union (used by `teacher-dues`).
No new icon key needed.

### 6.3 Page permissions

**File:** `frontend/common/types/page-permissions.types.ts`

```ts
export const PAGE_PERMISSIONS = {
  // ... existing ...
  accountingPayrollView: [AppPermission.ACCOUNTING_PAYROLL_VIEW] as PagePermissions,
  accountingPayrollManage: [AppPermission.ACCOUNTING_PAYROLL_MANAGE] as PagePermissions,
} as const;
```

### 6.4 Route middleware

The route uses the existing `withPageAuth` / `requirePermission`
middleware used by every other `(dashboard)` route. No new middleware
code — just register the permission in the page-permissions map.

---

## 7. i18n

### 7.1 Locale type, namespace, and EN/AR implementations

Per the `shared/AGENTS.md` compile-time i18n rules, every new namespace
requires **four** artifacts (type schema, namespace definition, EN impl, AR impl).
The payroll namespace lives under `dashboard/billing/payroll` (consistent
with the existing `dashboard/billing/` directory convention used by `main`,
`manual`, `payment`, `exchangeRates`, `currencyHedges`, `supportedCurrencies`,
`quota` — and with Plan 2's `dashboard/billing/creditAdjustment`).

**1. Type schema** — `shared/locale/types/dashboard/billing/payroll.ts` 🆕

Define a `PayrollLabels` interface with all keys (use TypeScript
function-typed fields for interpolation / pluralization, not ICU strings):

```ts
export interface PayrollLabels {
  readonly title: string;
  readonly filters: {
    readonly teacher: string;
    readonly student: string;
    readonly dateRange: string;
    readonly status: string;
    readonly search: string;
  };
  readonly column: {
    readonly scheduledStart: string;
    readonly scheduledDuration: string;
    readonly actualDuration: string;
    readonly calculatedDuration: string;
    readonly paidAmount: string;
    readonly status: string;
    readonly note: string;
  };
  readonly status: {
    readonly NOT_CALCULATED: string;
    readonly CALCULATED: string;
    readonly PARTIALLY: string;
    readonly REFUND: string;
    readonly WAITING_PAID: string;
    readonly PAID: string;
  };
  readonly override: {
    readonly title: string;
    readonly currentStatus: string;
    readonly target: {
      readonly Refund: string;
      readonly Calculated: string;
      readonly NotCalculated: string;
      readonly Partially: string;
    };
    readonly percentage: string;
    readonly note: string;
    readonly force: string;
  };
  readonly validation: {
    readonly percentageRequired: string;
    readonly noteRequired: string;
  };
  readonly error: {
    readonly alreadyPaid: string;
    readonly awaitingSettlement: string;
  };
  readonly success: { readonly overridden: string };
  readonly exportTruncated: string;
  readonly aggregate: {
    readonly totalPaid: string;
    readonly rowCount: string;
  };
}
```

Add `export * from "./payroll";` to `shared/locale/types/dashboard/billing/index.ts`.
Register the namespace ID in `shared/locale/types/message.ts` (`MessageSchema`).

**2. Namespace** — `shared/locale/namespaces/dashboard/billing/payroll.namespace.ts` 🆕

```ts
import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { PayrollLabels } from "@/shared/locale/types/dashboard/billing/payroll";

export const DashboardBillingPayroll = defineNamespace<PayrollLabels>(
  "dashboard.billing.payroll",
  {
    load: {
      en: () => import("@/shared/locale/en/dashboard/billing/payroll").then(m => m.dashboardBillingPayrollEn),
      ar: () => import("@/shared/locale/ar/dashboard/billing/payroll").then(m => m.dashboardBillingPayrollAr),
    },
  }
);
```

Add `export * from "./payroll.namespace";` to
`shared/locale/namespaces/dashboard/billing/index.ts` (create if missing).

**3. EN implementation** — `shared/locale/en/dashboard/billing/payroll.ts` 🆕

**4. AR implementation** — `shared/locale/ar/dashboard/billing/payroll.ts` 🆕

Keys (see type above for shape):

| Key                                  | EN                                                       | AR                                                       |
|--------------------------------------|----------------------------------------------------------|----------------------------------------------------------|
| `title`                              | "Teacher Payroll"                                        | "رواتب المعلمين"                                          |
| `filters.teacher`                    | "Teacher"                                                | "المعلم"                                                  |
| `filters.student`                    | "Student"                                                | "الطالب"                                                  |
| `filters.dateRange`                  | "Date range"                                             | "النطاق الزمني"                                          |
| `filters.status`                     | "Calculation status"                                     | "حالة الاحتساب"                                          |
| `filters.search`                     | "Search teacher / student"                              | "ابحث عن معلم / طالب"                                    |
| `column.scheduledStart`             | "Scheduled start"                                       | "بداية الجلسة"                                            |
| `column.scheduledDuration`          | "Scheduled duration (min)"                              | "مدة الجلسة (دقيقة)"                                    |
| `column.actualDuration`             | "Actual duration (min)"                                 | "المدة الفعلية (دقيقة)"                                  |
| `column.calculatedDuration`          | "Calculated duration (min)"                             | "مدة الاحتساب (دقيقة)"                                   |
| `column.paidAmount`                  | "Paid amount"                                            | "المبلغ المستحق"                                          |
| `column.status`                      | "Status"                                                 | "الحالة"                                                  |
| `column.note`                        | "Note"                                                   | "ملاحظة"                                                  |
| `status.NOT_CALCULATED`              | "Not Calculated"                                         | "غير محسوب"                                               |
| `status.CALCULATED`                  | "Calculated"                                             | "محسوب"                                                   |
| `status.PARTIALLY`                   | "Partially"                                              | "جزئي"                                                    |
| `status.REFUND`                      | "Refund"                                                 | "استرداد"                                                 |
| `status.WAITING_PAID`                | "Waiting Paid"                                           | "بانتظار الصرف"                                           |
| `status.PAID`                        | "Paid"                                                   | "مدفوع"                                                   |
| `override.title`                     | "Override payroll calculation"                           | "تجاوز احتساب الراتب"                                    |
| `override.currentStatus`             | "Current status"                                         | "الحالة الحالية"                                          |
| `override.target.Refund`             | "Refund — set pay to zero"                              | "استرداد — تصفير المبلغ"                                 |
| `override.target.Calculated`         | "Calculated — re-run formula"                            | "محسوب — إعادة التشغيل"                                   |
| `override.target.NotCalculated`      | "Not Calculated — skip"                                  | "غير محسوب — تخطٍّ"                                       |
| `override.target.Partially`          | "Partially — percentage of calculated"                  | "جزئي — نسبة من المحسوب"                                 |
| `override.percentage`               | "Percentage (0–100)"                                    | "النسبة (0–100)"                                          |
| `override.note`                      | "Note"                                                   | "ملاحظة"                                                  |
| `override.force`                     | "Force override even if Awaiting Paid"                   | "التجاوز رغم حالة (بانتظار الصرف)"                       |
| `validation.percentageRequired`      | "Percentage is required for Partially."                  | "النسبة مطلوبة عند اختيار (جزئي)."                       |
| `validation.noteRequired`            | "Note is required for Refund and Partially."             | "الملاحظة مطلوبة عند الاسترداد والجزئي."                 |
| `error.alreadyPaid`                  | "Payroll has already been disbursed; override blocked."  | "تم صرف الراتب؛ لا يمكن التجاوز."                         |
| `error.awaitingSettlement`           | "Payroll is awaiting settlement. Tick 'Force' to proceed." | "الراتب قيد التسوية. فعّل (تجاوز إجباري) للمتابعة."     |
| `success.overridden`                 | "Payroll calculation updated."                           | "تم تحديث احتساب الراتب."                                |
| `exportTruncated`                    | "Export truncated to 10 000 rows."                       | "تم اقتطاع التصدير إلى 10 000 صف."                       |
| `aggregate.totalPaid`                | "Total paid"                                             | "إجمالي المستحق"                                          |
| `aggregate.rowCount`                 | "Rows"                                                  | "الصفوف"                                                  |

### 7.2 Locale snapshot generation

After adding the namespace, run the locale-snapshot generator so the
`public/static/locale-snapshots/{en,ar}/dashboard.billing.payroll.json`
files are produced for compile-time i18n.

### 7.3 Errors namespace extension (separate locale)

The service layer references `tErrors.payroll.notTerminal`, `tErrors.payroll.alreadyPaid`,
`tErrors.payroll.awaitingSettlement`. These error strings live in the existing
`errors` namespace (NOT in `dashboard.billing.payroll`). Extend
`shared/locale/types/errors/index.ts` with a new `PayrollErrors` interface
and `readonly payroll: PayrollErrors;` on `ErrorsLabels`, plus EN/AR
implementations in `shared/locale/{en,ar}/errors/index.ts`.

### 7.4 Nav label additions (separate namespace)

As noted in §6.1, the sidebar item's `labelKey: "accountingPayroll"` lives
in the existing `dashboard.core.nav` namespace — add the key to its type
schema + EN + AR files (do NOT duplicate it in `dashboard.billing.payroll`).

---

## 8. Testing Strategy

### 8.1 Service-layer tests

**File:** `backend/services/teachers/payroll-calculation.service.test.ts`

Covers:
- Auto-trigger on `COMPLETED` → `CALCULATED` + amount set.
- Auto-trigger on `ON_DEMAND_NO_CREDITS_ABSENT` (teacher-absent path).
- Grace-period short-session (≤30 min, 3-min grace) — on-time + late-by-2 + late-by-5.
- Grace-period long-session (>30 min, 6-min grace) — on-time + late-by-5 + late-by-7.
- Late entry pro-rating caps at `scheduledEndAt` (no overtime credit).
- Student-absence (TAKEN→ABSENT, actualStartAt set) → full scheduled pay.
- Teacher-absence (actualStartAt null, outcome != ABSENT) → zero pay.
- Force-recalc on a `PARTIALLY` row succeeds; without force, returns existing.
- Force-recalc blocked on `PAID`.
- Rate-resolution failure → `NOT_CALCULATED` + `payrollNote` set.
- Idempotent re-trigger (same `clientRequestId` within 30s) → returns first.

**File:** `backend/services/teachers/payroll-override.service.test.ts`

Covers:
- Refund happy path → amount zeroed, status `REFUND`, event emitted.
- Calculated happy path → re-run + status flip.
- Not Calculated happy path → amount null, status flip.
- Partially happy path (pct=50) → amount halved, `isPartialPercentage=50`.
- Partially with pct=0 → equivalent to Refund.
- Partially with pct=100 → equivalent to full pay.
- Partially without `partialPercentage` → validation error.
- Refund/Partially without `note` → validation error.
- Override on `PAID` → `PAYROLL_ALREADY_PAID`.
- Override on `WAITING_PAID` without `force` → `PAYROLL_AWAITING_SETTLEMENT`.
- Override on `WAITING_PAID` with `force` → succeeds.
- Idempotent re-submit (same `clientRequestId` within 30s) → returns first.

### 8.2 Repository tests

**File:** `backend/db/test/repo/scheduling/payroll-report.repository.test.ts`

- Filter by teacher, student, date range, status multi-select.
- Pagination (limit/offset).
- Aggregate totals computed correctly across mixed-currency rows
  (currency mismatch falls back to the dominant currency).
- `isStudentAbsence` / `isTeacherAbsence` computed in SQL.

### 8.3 GraphQL tests

**File:** `backend/graphql/query/billing/payroll.query.test.ts` + `payroll.mutation.test.ts`

- Query returns the page shape; respects `limit`/`offset`.
- Permission denied → GraphQL error.
- Mutation returns the result shape; mutation-argument coverage per
  `docs/testing/mutation-argument-coverage.md`.
- Mutation blocked on `PAID` surfaces as GraphQL error.

### 8.4 Frontend tests

- `PayrollReportsContainer.test.tsx` — renders rows, filters debounce,
  empty state, CSV button hits the right URL.
- `OverrideDialog.test.tsx` — RadioGroup toggles percentage field
  visibility; validation blocks invalid submits; double-click absorbed
  by `clientRequestId`; success closes dialog and evicts cache.
- Audit drawer card renders on the existing `/classes/[id]/audit` page.

### 8.5 Migration tests

- Additive migration applies cleanly on a populated DB.
- Existing `SchedulingService` state-machine flows still pass
  (regression smoke).
- Backfill script is idempotent (running it twice produces zero new
  updates the second time).

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
| **Plan 4** (`session-event-audit`) | Plan 3 **writes** the payroll columns; Plan 4 **renders** them in the Full Reports grid view at `/accounting/reports`. Plan 4 depends on Plan 3's GraphQL extensions (`calculationStatus`, `teacherPaidAmount` on `ClassInstanceDetail`). |
| Existing `teacher_dues` accrual | Plan 3's `calculateForInstance` produces the authoritative amount; the existing `TeacherDueService.accrueForApprovedReport` reads it (§2.5) and flips status to `WAITING_PAID`. |
| Existing `teacher_payments` disbursement | The existing `markTeacherDuesPaid` mutation now also flips `class_instances.calculationStatus = PAID` in the same tx (AC-9.5). |
| Existing rate-resolver | Plan 3 reuses `RateResolverService.resolveForInstance` — no rate logic is duplicated. |
| Existing `class_status_events` | Plan 3 reuses the existing table for `PAYROLL_OVERRIDE` + `PAYROLL_STATUS_TRANSITION` rows; no new audit table. |
| Plan 2 (`credit-adjustment-system`) | Independent — Plan 2 writes student-side credit; Plan 3 writes teacher-side payroll. They share no tables. |

---

## 10. Risks & Mitigations

| Risk                                                                    | Mitigation                                                                                          |
|-------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| Calculator runs inside the state-transition tx and slows it down.        | Calculator is single-row + single-rate-resolve; p95 < 50 ms. If perf degrades, move to a deferred job (Q4). |
| Operator double-submit creates duplicate `class_status_events` rows.   | Idempotency via `clientRequestId` + 30-second window + `metadata.idempotencyKey` lookup.             |
| Historical rows left at `NOT_CALCULATED` indefinitely.                  | Backfill script (§2.6) is run out-of-band by accounting; status is visible in the reports grid.       |
| `system_settings` misconfiguration (e.g., negative grace) breaks calc.  | `resolveGraceSettings` falls back to defaults and logs a warning; `system_settings` CHECK rejects negatives. |
| Status `PAID` is flipped by `teacher_dues` flow but operator also tries to override. | `PAYROLL_ALREADY_PAID` guard (AC-6.7) blocks the override; mutation test covers it.                |
| Mixed currencies in aggregate totals produce misleading sums.          | Aggregate falls back to the dominant currency (the one with the most rows); a per-currency breakdown is exposed as `rowCountByStatus` equivalent. Future enhancement: per-currency totals. |
| Permission scope drift (`_VIEW` vs `_MANAGE`).                          | Documented in §2.2; seed groups updated; mutation re-checks via `requirePermission`.                |
| Sidebar group confusion (Finance vs Accounting).                       | Reuse `grp_finance` (Q1 in specs); new "Payroll" item appears under it with its own permission.     |

---

## 11. Out-of-Scope (Deferred)

- Per-teacher / per-subject grace-period overrides (global only in v1).
- Decimal `partialPercentage` (integer 0–100 only).
- Bulk override via CSV upload.
- Operator undo / "reverse override" action (use a new override instead).
- Per-currency aggregate totals (single dominant currency in v1).
- Real-time recalculation when `actualStartAt` is corrected post-completion
  (operator must explicitly re-trigger via `Calculated` override).
- Notifications to teacher on `PAID` (separate notification plan).
- Reporting/dashboard widgets summarizing payroll (separate reporting plan).
