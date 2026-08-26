# Plan 4 — Session Event Audit Enhancement: Implementation

> Companion to `specs.md`. Describes how the existing `class_instances`
> data (room entry/exit timestamps, status, payroll columns from
> Plan 3) is exposed through a new GraphQL query layer and rendered
> in a "Full Reports" grid view at `/accounting/reports`.
>
> **Zero schema migrations.** This plan reuses everything Plan 3
> added and every existing column. Its job is purely the read-model
> projection + frontend grid view.

---

## 1. Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              Next.js 16 App Router                          │
│                                                                            │
│   /accounting/reports                                                       │
│   ┌───────────────────────────────────────────────────────────┐            │
│   │ SessionAuditReportsContainer                                │            │
│   │  - Apollo useQuery(SESSION_AUDIT_REPORT, { variables })    │            │
│   │  - MUI DataGrid (filterable by teacher/student/date/status)│            │
│   │  - Row click → /classes/[id]/audit                          │            │
│   │  - "Open audit page" row action → ?openOverride=1           │            │
│   │  - "Export CSV" toolbar button → /api/accounting/reports/  │            │
│   │    export?...filters                                       │            │
│   └────────────────────────────────────────┬─────────────────────┘         │
└─────────────────────────────────────────────┼──────────────────────────────┘
                                              │ GraphQL (Pothos)
                                              ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                          GraphQL Layer (Pothos)                              │
│   Query:    sessionAuditReport(filter, sort, limit, offset)              │
│                 → SessionAuditReportPage                                  │
│   (No mutation — read-only plan.)                                          │
└─────────────────────────────────────────────┬──────────────────────────────┘
                                              │
                                              ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                       Service Layer (SessionAuditService)                    │
│   getReport(actorUserId, filters, sort, pagination) → SessionAuditPage    │
│     - applyFilters()        → Drizzle WHERE builder                       │
│     - applyStatusInverse()  → expands "Absent" → matching predicate        │
│     - joinTeacherStudentSubject()  → single SELECT, no N+1                │
│     - mapToRow()            → applies mapToSessionAuditStatus per row     │
│   (Reuses Plan 3's CalculationStatus enum; no payroll logic duplicated.)  │
└─────────────────────────────────────────────┬──────────────────────────────┘
                                              │ Drizzle ORM
                                              ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                          PostgreSQL (UNCHANGED)                              │
│   class_instances (existing + Plan 3 payroll columns)                      │
│   teachers + users (name join)                                              │
│   students + users (name join)                                              │
│   class_subjects (subject name join)                                        │
│   teacher_dues (optional — for paid-status tooltip)                         │
│   ────────                                                                  │
│   NO new tables. NO new columns. NO new enum values.                         │
│   This plan is a pure read-model projection over existing data.             │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Design principle:** Read-only projection. The grid never writes to
the database — every mutation (override, recalc) is owned by Plan 3's
mutations and triggered from the audit drawer. This plan only reads
and renders.

---

## 2. Data Model

### 2.1 No new columns

This plan introduces **zero** schema changes. It depends on:

1. The existing `class_instances` columns:
   `id`, `scheduled_start_at`, `scheduled_end_at`, `duration_minutes`,
   `actual_start_at`, `actual_end_at`, `execution_state`, `outcome`,
   `teacher_id`, `student_id`, `subject_id`, `rate_amount`,
   `rate_currency`, `payroll_credited`, `is_rescheduled`,
   `is_frozen`, `booking_timezone`, `deleted_at`.

2. The Plan 3 payroll columns:
   `calculated_duration`, `teacher_paid_amount`, `teacher_paid_currency`,
   `calculation_status`, `is_partial_percentage`, `payroll_note`,
   `payroll_calculated_at`.

3. The existing `teachers` (via `users.name`), `students` (via
   `users.name`), `class_subjects.name` join columns.

4. The existing `teacher_dues` (optional LEFT JOIN) for the paid-status
   tooltip showing `teacher_dues.payment_date` when
   `calculation_status = 'PAID'`.

If Plan 3 is not yet deployed, this plan degrades gracefully: the
payroll columns return `null` and the `currentStatus` mapper still
works on the existing `execution_state` + `outcome` pair.

### 2.2 New permission: `ACCOUNTING_REPORTS_VIEW` + `ACCOUNTING_REPORTS_MANAGE`

**File:** `backend/enum/permissions/permission.enum.ts`

```ts
// LMS — Accounting / Reports (Plan 4)
ACCOUNTING_REPORTS_VIEW = "accounting.reports_view",
ACCOUNTING_REPORTS_MANAGE = "accounting.reports_manage",
```

Add to the seed `permission-groups` so the "Accounting" / "Finance
Manager" group gets both by default. The `_MANAGE` permission is
separate so read-only auditors can be granted view-only access.

> **Note:** `ACCOUNTING_REPORTS_MANAGE` does not grant any write
> capability in this plan. It only gates the "Open audit page (with
> override shortcut)" row action. The actual override mutation is
> gated by Plan 3's `ACCOUNTING_PAYROLL_MANAGE`. The two `_MANAGE`
> permissions are intentionally separate so a user could have
> `_REPORTS_MANAGE` (deep-link shortcut) without `_PAYROLL_MANAGE`
> (cannot actually override), in which case the audit drawer's
> Override button stays hidden.

---

## 3. Service Layer

**File:** `backend/services/accounting/session-audit.service.ts`

### 3.1 New types

**File:** `backend/types/billing/session-audit.types.ts`

```ts
import type { CalculationStatus } from "@/backend/enum";
import type {
  ClassExecutionState,
  ClassOutcome,
} from "@/shared/constants/class-instance-detail.enum";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

/**
 * Video-spec session status. Literal string values match the reference
 * video exactly so the GraphQL enum and frontend chips align with the
 * operator's mental model.
 */
export type SessionAuditStatus = "open" | "end" | "Absent" | "absent_student";

export interface SessionAuditReportFilters {
  teacherId?: string | null;
  studentId?: string | null;
  dateFrom?: string | null;        // ISO date (operator's locale)
  dateTo?: string | null;
  currentStatuses?: readonly SessionAuditStatus[] | null;
  search?: string | null;          // teacher/student name LIKE
  includeDeleted?: boolean | null; // admin-only; defaults to false
}

export interface SessionAuditReportSort {
  field:
    | "scheduledStartAt"
    | "scheduledEndAt"
    | "actualStartAt"
    | "actualEndAt"
    | "durationMinutes"
    | "calculatedDuration"
    | "teacherPaidAmount"
    | "calculationStatus"
    | "teacherName"
    | "studentName";
  direction: "asc" | "desc";
}

export interface SessionAuditReportRow {
  instanceId: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  durationMinutes: number;
  actualStartAt: string | null;        // openSessionTime
  actualEndAt: string | null;          // endSessionTime
  bookingTimezone: string | null;      // for tooltip
  currentStatus: SessionAuditStatus;
  // Plan 3 payroll fields (nullable when Plan 3 is not yet deployed)
  calculatedDuration: number | null;
  teacherPaidAmount: string | null;
  teacherPaidCurrency: CurrencyCode | null;
  calculationStatus: CalculationStatus | null;
  isPartialPercentage: number | null;
  payrollNote: string | null;
  payrollCalculatedAt: string | null;
  // Denormalized joins
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  subjectId: string;
  subjectName: string;
  // Optional LEFT JOIN (null when calculation_status != PAID)
  teacherDuePaymentDate: string | null;
}

export interface SessionAuditReportPage {
  rows: SessionAuditReportRow[];
  totalCount: number;
  aggregates: {
    rowCountByStatus: Record<SessionAuditStatus, number>;
    rowCountByPaid: { paid: number; unpaid: number };
    totalPaidAmount: string;
    totalPaidCurrency: CurrencyCode;
  };
}
```

### 3.2 `mapToSessionAuditStatus` — the single source of truth

**File:** `shared/constants/classes/session-audit-status.ts`

This function lives in `shared/constants` (not `backend/services`) so
both the server (Pothos resolver, repository query builder) and the
client (Storybook fixtures, unit tests, dev tools) can import the same
rule without a circular dependency.

```ts
import type {
  ClassExecutionState,
  ClassOutcome,
} from "@/shared/constants/class-instance-detail.enum";

export type SessionAuditStatus = "open" | "end" | "Absent" | "absent_student";

/**
 * Maps the existing execution_state + outcome + actual_start_at
 * triple into the video-spec currentStatus. Pure function — no side
 * effects, no I/O. Used by the server-side query builder (to expand
 * "Absent" into matching SQL predicates) and by the frontend (to
 * derive the status from any class-instance shape).
 *
 * Rules (matches specs.md AC-2.2 … AC-2.8):
 *   - RUNNING/ACTIVATED + actualStartAt set → "open"
 *   - COMPLETED + TAKEN → "end"
 *   - COMPLETED + ABSENT + actualStartAt null → "Absent" (teacher)
 *   - COMPLETED + ABSENT + actualStartAt set → "absent_student"
 *   - COMPLETED + LEAVE → "absent_student"
 *   - everything else (NOT_ACTIVATED, ON_DEMAND_*, CANCELLED, RESCHEDULED) → "open"
 */
export function mapToSessionAuditStatus(
  executionState: ClassExecutionState | null | undefined,
  outcome: ClassOutcome | null | undefined,
  actualStartAt: Date | string | null | undefined,
): SessionAuditStatus {
  if (executionState === ClassExecutionState.COMPLETED) {
    if (outcome === ClassOutcome.TAKEN) return "end";
    if (outcome === ClassOutcome.ABSENT) {
      return actualStartAt == null ? "Absent" : "absent_student";
    }
    if (outcome === ClassOutcome.LEAVE) return "absent_student";
  }
  // RUNNING, ACTIVATED, NOT_ACTIVATED, ON_DEMAND_*, CANCELLED, RESCHEDULED,
  // and any unmatched combo → "open".
  return "open";
}

/**
 * Inverse mapper: given a target SessionAuditStatus, returns the SQL
 * predicate fragment that selects rows matching that status. Used by
 * the SessionAuditRepository to expand a list of statuses into a
 * disjunction of (execution_state, outcome, actual_start_at IS [NOT] NULL)
 * triples.
 */
export const STATUS_TO_PREDICATE_KEY: Record<SessionAuditStatus, string> = {
  open: "open",
  end: "end",
  Absent: "Absent",
  absent_student: "absent_student",
};
```

### 3.3 `SessionAuditService.getReport`

**File:** `backend/services/accounting/session-audit.service.ts`

```ts
export namespace SessionAuditService {
  export async function getReport(
    actorUserId: string,
    filters: SessionAuditReportFilters,
    sort: SessionAuditReportSort,
    pagination: { limit: number; offset: number },
    tErrors: ErrorsLabels,
  ): Promise<SessionAuditReportPage> {
    await requirePermission(actorUserId, AppPermission.ACCOUNTING_REPORTS_VIEW, tErrors);
    validateFilters(filters, sort, pagination, tErrors);

    const { rows, totalCount } = await SessionAuditRepository.findReportRows(
      filters, sort, pagination,
    );

    // Aggregate totals — single pass over the page (the full-set totals
    // would require a second query; v1 uses page-level aggregates with a
    // note that they reflect the current page only, not the full filter
    // result. The totalCount field gives the full result count for
    // pagination display).
    const rowCountByStatus = countBy(rows, r => r.currentStatus);
    const paidCount = rows.filter(r => r.calculationStatus === CalculationStatus.PAID).length;
    const totalPaidAmount = rows.reduce(
      (sum, r) => sum + Number(r.teacherPaidAmount ?? 0), 0,
    );
    const totalPaidCurrency = pickDominantCurrency(rows);

    return {
      rows,
      totalCount,
      aggregates: {
        rowCountByStatus,
        rowCountByPaid: {
          paid: paidCount,
          unpaid: rows.length - paidCount,
        },
        totalPaidAmount: totalPaidAmount.toFixed(2),
        totalPaidCurrency,
      },
    };
  }
}
```

### 3.4 `SessionAuditRepository.findReportRows`

**File:** `backend/db/repo/scheduling/session-audit.repository.ts` 🆕

A single Drizzle query that:

1. Builds the `WHERE` clause from `filters`:
   - `teacherId` → `class_instances.teacher_id = ?`.
   - `studentId` → `class_instances.student_id = ?`.
   - `dateFrom` / `dateTo` → `class_instances.scheduled_start_at`
     between `dateFrom 00:00 (operator tz)` and `dateTo 23:59 (operator tz)`.
   - `currentStatuses` → expand each via the inverse mapper into a
     disjunction:
     ```sql
     (execution_state, outcome, actual_start_at IS NULL) IN (
       ('COMPLETED', 'ABSENT', true),    -- "Absent"
       ('COMPLETED', 'ABSENT', false),   -- "absent_student"
       ('COMPLETED', 'TAKEN', null),      -- "end" (actual_start_at irrelevant)
       ('COMPLETED', 'LEAVE', null),     -- "absent_student" (LEAVE)
     ) OR (
       -- "open" = everything NOT in the above terminal set
       execution_state NOT IN ('COMPLETED')
       OR (execution_state = 'COMPLETED' AND outcome NOT IN ('TAKEN', 'ABSENT', 'LEAVE'))
     )
     ```
   - `search` → `(users.name ILIKE '%?%' OR students.name ILIKE '%?%')`.
   - `includeDeleted` (admin-only) → toggles the existing soft-delete RLS
     filter; defaults to false.
2. Builds the `ORDER BY` clause from `sort`.
3. Applies `LIMIT ? OFFSET ?`.
4. LEFT JOINs:
   - `teachers` + `users` for teacher name.
   - `students` + `users` for student name.
   - `class_subjects` for subject name.
   - `teacher_dues` (LEFT JOIN, single-row) — only present when the
     lesson report has been approved.
   - `teacher_payments` (LEFT JOIN via `teacher_dues.teacher_payment_id`)
     for `payment_date` when `calculation_status = 'PAID'`. The actual
     payment date lives on `teacher_payments.payment_date`, NOT on
     `teacher_dues.approved_at` (which is the approval/accrual timestamp).
5. Returns `rows` + a separate `COUNT(*)` query for `totalCount`.

The `currentStatus` field on each row is computed in TypeScript via
`mapToSessionAuditStatus(...)` — the DB returns the raw triple, the
service applies the mapper. This keeps the SQL simple and the rule in
one place.

```ts
export const SessionAuditRepository = {
  async findReportRows(
    filters: SessionAuditReportFilters,
    sort: SessionAuditReportSort,
    pagination: { limit: number; offset: number },
  ): Promise<{ rows: SessionAuditReportRow[]; totalCount: number }> {
    const where = buildWhereClause(filters);
    const orderBy = buildOrderByClause(sort);

    const [rows, [{ count }]] = await Promise.all([
      db.select({
        instanceId: classInstances.id,
        scheduledStartAt: classInstances.scheduledStartAt,
        scheduledEndAt: classInstances.scheduledEndAt,
        durationMinutes: classInstances.durationMinutes,
        actualStartAt: classInstances.actualStartAt,
        actualEndAt: classInstances.actualEndAt,
        bookingTimezone: classInstances.bookingTimezone,
        executionState: classInstances.executionState,
        outcome: classInstances.outcome,
        calculatedDuration: classInstances.calculatedDuration,
        teacherPaidAmount: classInstances.teacherPaidAmount,
        teacherPaidCurrency: classInstances.teacherPaidCurrency,
        calculationStatus: classInstances.calculationStatus,
        isPartialPercentage: classInstances.isPartialPercentage,
        payrollNote: classInstances.payrollNote,
        payrollCalculatedAt: classInstances.payrollCalculatedAt,
        teacherId: teachers.id,
        teacherName: usersTeacher.name,
        studentId: students.id,
        studentName: usersStudent.name,
        subjectId: classSubjects.id,
        subjectName: classSubjects.name,
        // Pull payment_date from `teacher_payments`, NOT `teacher_dues.approved_at`
        // (which is the approval/accrual timestamp, not the actual payment date).
        teacherDuePaymentDate: teacherPayments.paymentDate,
      })
        .from(classInstances)
        .innerJoin(teachers, eq(teachers.id, classInstances.teacherId))
        .innerJoin(usersTeacher, eq(usersTeacher.id, teachers.userId))
        .innerJoin(students, eq(students.id, classInstances.studentId))
        .innerJoin(usersStudent, eq(usersStudent.id, students.userId))
        .innerJoin(classSubjects, eq(classSubjects.id, classInstances.subjectId))
        .leftJoin(teacherDues, eq(teacherDues.classInstanceId, classInstances.id))
        .leftJoin(teacherPayments, eq(teacherPayments.id, teacherDues.teacherPaymentId))
        .where(where)
        .orderBy(orderBy)
        .limit(pagination.limit)
        .offset(pagination.offset),

      db.select({ count: sql<number>`count(*)` })
        .from(classInstances)
        .where(where),
    ]);

    return {
      rows: rows.map(r => ({
        ...r,
        currentStatus: mapToSessionAuditStatus(r.executionState, r.outcome, r.actualStartAt),
        // …format timestamps as ISO strings for the GraphQL layer…
      })),
      totalCount: Number(count),
    };
  },
};
```

### 3.5 CSV export serialization

**File:** `backend/services/accounting/session-audit-csv.serializer.ts`

A pure function that takes a `readonly SessionAuditReportRow[]` and
returns a CSV string. The header row matches the grid column order
plus extra `teacherId`, `studentId`, `classInstanceId` columns.
CSV escaping uses the project's existing CSV helper (RFC 4180
compliant — wraps cells with embedded commas / quotes / newlines in
double quotes and doubles internal quotes).

---

## 4. GraphQL Layer (Pothos)

### 4.1 New enum + input + object types

**File:** `backend/graphql/pothos/accounting/session-audit.pothos.ts` 🆕

Register `SessionAuditStatusPothosEnum` in `backend/graphql/pothos/shared/enum.pothos.ts`
(per `backend/enum/AGENTS.md` §Adding New Enums step 5) so GraphQL codegen
picks it up. Then build the input + object types in the domain-specific file:

```ts
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { SessionAuditStatus } from "@/shared/constants/classes/session-audit-status";
import { CalculationStatusPothosEnum } from "@/backend/graphql/pothos/billing/payroll.pothos"; // Plan 3

export const SessionAuditStatusPothosEnum = gqlSchemaBuilder.enumType(
  SessionAuditStatus,
  {
    name: "SessionAuditStatus",
    description: "open | end | Absent | absent_student",
  },
);

export const SessionAuditReportFilterPothosInput = gqlSchemaBuilder.inputType(
  "SessionAuditReportFilter",
  {
    fields: (t) => ({
      teacherId: t.id({ required: false }),
      studentId: t.id({ required: false }),
      dateFrom: t.string({ required: false }),
      dateTo: t.string({ required: false }),
      currentStatuses: t.field({
        type: [SessionAuditStatusPothosEnum],
        required: false,
      }),
      search: t.string({ required: false }),
      includeDeleted: t.booleanColumn({ required: false }),
    }),
  },
);

export const SessionAuditReportSortPothosInput = gqlSchemaBuilder.inputType(
  "SessionAuditReportSort",
  {
    fields: (t) => ({
      field: t.field({
        type: gqlSchemaBuilder.enumType(
          [
            "scheduledStartAt",
            "scheduledEndAt",
            "actualStartAt",
            "actualEndAt",
            "durationMinutes",
            "calculatedDuration",
            "teacherPaidAmount",
            "calculationStatus",
            "teacherName",
            "studentName",
          ] as const,
          { name: "SessionAuditReportSortField" },
        ),
        required: true,
      }),
      direction: t.field({
        type: gqlSchemaBuilder.enumType(["asc", "desc"] as const, {
          name: "SortDirection",
        }),
        required: true,
      }),
    }),
  },
);

export const SessionAuditReportRowPothosObject = gqlSchemaBuilder
  .objectRef<SessionAuditReportRow>("SessionAuditReportRow")
  .implement({
    fields: (t) => ({
      instanceId: t.exposeID("instanceId"),
      scheduledStartAt: t.expose("scheduledStartAt", { type: "DateTime" }),
      scheduledEndAt: t.expose("scheduledEndAt", { type: "DateTime" }),
      durationMinutes: t.exposeInt("durationMinutes"),
      actualStartAt: t.expose("actualStartAt", { type: "DateTime", nullable: true }),
      actualEndAt: t.expose("actualEndAt", { type: "DateTime", nullable: true }),
      bookingTimezone: t.exposeString("bookingTimezone", { nullable: true }),
      currentStatus: t.expose("currentStatus", { type: SessionAuditStatusPothosEnum }),
      calculatedDuration: t.exposeInt("calculatedDuration", { nullable: true }),
      teacherPaidAmount: t.exposeString("teacherPaidAmount", { nullable: true }),
      teacherPaidCurrency: t.expose("teacherPaidCurrency", {
        type: CurrencyCodePothosObject,
        nullable: true,
      }),
      calculationStatus: t.expose("calculationStatus", {
        type: CalculationStatusPothosEnum, // from Plan 3
        nullable: true,
      }),
      isPartialPercentage: t.exposeInt("isPartialPercentage", { nullable: true }),
      payrollNote: t.exposeString("payrollNote", { nullable: true }),
      payrollCalculatedAt: t.expose("payrollCalculatedAt", { type: "DateTime", nullable: true }),
      teacherId: t.exposeID("teacherId"),
      teacherName: t.exposeString("teacherName"),
      studentId: t.exposeID("studentId"),
      studentName: t.exposeString("studentName"),
      subjectId: t.exposeID("subjectId"),
      subjectName: t.exposeString("subjectName"),
      teacherDuePaymentDate: t.expose("teacherDuePaymentDate", { type: "DateTime", nullable: true }),
    }),
  });

export const SessionAuditReportPagePothosObject = gqlSchemaBuilder
  .objectRef<SessionAuditReportPage>("SessionAuditReportPage")
  .implement({
    fields: (t) => ({
      rows: t.field({
        type: [SessionAuditReportRowPothosObject],
        resolve: (p) => p.rows,
      }),
      totalCount: t.exposeInt("totalCount"),
      rowCountByStatus: t.field({
        type: "JSON",
        resolve: (p) => p.aggregates.rowCountByStatus,
      }),
      rowCountByPaid: t.field({
        type: "JSON",
        resolve: (p) => p.aggregates.rowCountByPaid,
      }),
      totalPaidAmount: t.exposeString("totalPaidAmount"),
      totalPaidCurrency: t.expose("totalPaidCurrency", { type: CurrencyCodePothosObject }),
    }),
  });
```

### 4.2 New query

**File:** `backend/graphql/query/billing/session-audit.query.ts`

```ts
gqlSchemaBuilder.queryField("sessionAuditReport", (t) =>
  t.field({
    type: SessionAuditReportPagePothosObject,
    description: "Paginated session-event audit report (Full Reports view).",
    authScopes: { permission: AppPermission.ACCOUNTING_REPORTS_VIEW },
    args: {
      filter: t.arg({ type: SessionAuditReportFilterPothosInput, required: false }),
      sort: t.arg({ type: SessionAuditReportSortPothosInput, required: false }),
      limit: t.arg.int({ required: false, defaultValue: 50 }),
      offset: t.arg.int({ required: false, defaultValue: 0 }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return SessionAuditService.getReport(
        actorUserId,
        args.filter ?? {},
        args.sort ?? { field: "scheduledStartAt", direction: "desc" },
        { limit: args.limit ?? 50, offset: args.offset ?? 0 },
        tErrors,
      );
    },
  }),
);
```

### 4.3 CSV export endpoint

**File:** `app/api/accounting/reports/export/route.ts`

A thin Next.js Route Handler that:

1. Calls `requireAuth` + `requirePermission(ACCOUNTING_REPORTS_VIEW)`.
2. Parses the filter / sort / pagination query params (same shape as the GraphQL args).
3. Calls `SessionAuditService.getReport(...)` with `limit: 10_000`.
4. Serializes to CSV via `serializeSessionAuditCsv(rows)`.
5. Sets `Content-Type: text/csv; charset=utf-8` +
   `Content-Disposition: attachment; filename="session-audit-report.csv"`.
6. Sets `X-Export-Truncated: true` when `totalCount > 10_000`.

---

## 5. Frontend

### 5.1 Apollo documents

**File:** `frontend/common/graphql/sharedDocuments/billing/session-audit.documents.ts` 🆕

Follows the project's `TypedDocumentNode` + camelCase + `Document` suffix convention (see `frontend/common/graphql/sharedDocuments/AGENTS.md`):

```ts
import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const sessionAuditReportQueryDocument: TypedDocumentNode<
  Operations.SessionAuditReportQuery,
  Types.QuerySessionAuditReportArgs
> = gql`
  query SessionAuditReport(
    $filter: SessionAuditReportFilter
    $sort: SessionAuditReportSort
    $limit: Int
    $offset: Int
  ) {
    sessionAuditReport(filter: $filter, sort: $sort, limit: $limit, offset: $offset) {
      rows {
        instanceId
        scheduledStartAt
        scheduledEndAt
        durationMinutes
        actualStartAt
        actualEndAt
        bookingTimezone
        currentStatus
        calculatedDuration
        teacherPaidAmount
        teacherPaidCurrency
        calculationStatus
        isPartialPercentage
        payrollNote
        payrollCalculatedAt
        teacherId
        teacherName
        studentId
        studentName
        subjectId
        subjectName
        teacherDuePaymentDate
      }
      totalCount
      rowCountByStatus
      rowCountByPaid
      totalPaidAmount
      totalPaidCurrency
    }
  }
`;
```

- Re-export from `frontend/common/graphql/sharedDocuments/billing/index.ts` via `export * from "./session-audit.documents";` (create the directory + barrel if missing — see `sharedDocuments/AGENTS.md` §Layout).
- Re-export the accounting barrel from `frontend/common/graphql/sharedDocuments/index.ts` via `export * from "./accounting";` (add if it's a new sub-directory).
- Run `bun run generate:gqlSchema && bun codegen` after the schema changes land
  so `Operations.SessionAuditReportQuery` + `Types.QuerySessionAuditReportArgs` exist.
- The selection set includes `instanceId` (id-equivalent) so Apollo Client can auto-update its cache.

### 5.2 Routes

| Route                          | File                                                          | Purpose                                |
|--------------------------------|---------------------------------------------------------------|----------------------------------------|
| `/accounting/reports`          | `app/(dashboard)/accounting/reports/page.tsx`                 | Session Audit Full Reports list        |

The route registers `ACCOUNTING_REPORTS_VIEW` in the page-permissions
map (`PAGE_PERMISSIONS.accountingReportsView`) so the server-side auth
wrapper enforces it before render.

### 5.3 Session Audit Reports page

**Component:** `frontend/common/views/dashboard/billing/accounting/reports/SessionAuditReportsContainer.tsx`

- MUI `DataGrid` (v9) with columns from §4.1.
- Toolbar: search input (debounced 300 ms), teacher autocomplete,
  student autocomplete, date-range picker, status multi-select,
  "Export CSV" button (anchor to `/api/accounting/reports/export?...filters`).
- Server-driven pagination + sorting via Apollo variables.
- Per-row "Open audit page" action (only rendered when the user holds
  `ACCOUNTING_REPORTS_MANAGE`); navigates with `?openOverride=1`.
- Row click (anywhere except action cells) → navigates to
  `/classes/[instanceId]/audit` (no query param).
- Aggregate footer card: total paid amount + currency, status counts,
  paid/unpaid counts.
- Empty state: "No session events match the current filters."

### 5.4 Status chip + payroll-status chip components

**Component:** `frontend/common/views/dashboard/billing/accounting/reports/SessionAuditStatusChip.tsx`

MUI `Chip` with colored variant per `SessionAuditStatus`:
- `open` → blue (with pulse animation when the row is within the last
  24 hours and `actualStartAt` is set + `actualEndAt` is null).
- `end` → green.
- `Absent` → red.
- `absent_student` → amber.

Reuses Plan 3's `CalculationStatusChip` component for the
`calculationStatus` column (no duplication).

### 5.5 Cell formatters

**File:** `frontend/common/views/dashboard/billing/accounting/reports/formatters/sessionAuditCellFormatters.ts`

- `formatOpenSessionTime(actualStartAt, bookingTimezone, locale)` →
  localized date-time string, or "Not joined" muted text.
- `formatEndSessionTime(actualEndAt, locale)` → localized date-time
  string, or "In progress" muted text.
- `formatDurationMinutes(minutes)` → integer minutes.
- `formatPaidAmount(amount, currency, locale)` → currency-formatted
  string per the existing `formatCurrency` helper.
- `formatNoteCell(note)` → small note icon + hover popover (first 200
  chars + ellipsis + "View full" if longer).

### 5.6 Filter bar component

**Component:** `frontend/common/views/dashboard/billing/accounting/reports/SessionAuditFilterBar.tsx` 🆕

- **Reuse the existing `TeacherAutocomplete`** from `@/frontend/common/components/ui/input/userSelect/TeacherAutocomplete` (do NOT create a new component or reference a non-existent `TEACHERS_SEARCH_QUERY` document — the existing component wraps `useTeacherAutocomplete` and is the canonical teacher picker).
- **Reuse the existing `StudentAutocomplete`** from `@/frontend/common/components/ui/input/userSelect/StudentAutocomplete` (do NOT create a new component or reference a non-existent `STUDENTS_SEARCH_QUERY` document — the existing component wraps `useStudentAutocomplete` and is the canonical student picker).
- Date-range picker (MUI `DatePicker` × 2 with `minDate`/`maxDate` coupling) — reuse the existing `AppDateRangePicker` from `@/frontend/common/components/ui/form/date/AppDateRangePicker`.
- Status multi-select (MUI `Autocomplete` multiple, options = `[open, end, Absent, absent_student]` with localized labels from the i18n namespace).
- Search input (debounced 300 ms).
- "Clear filters" affordance (visible only when any non-default filter is active).

### 5.7 Zustand store + URL-state sync

**File:** `frontend/common/stores/sessionAuditFilterStore.ts`

Holds the filter / sort / pagination state. On every change, syncs to
the URL query string via `next/navigation`'s `useRouter().replace`
(so the operator can bookmark / share / use browser back). On mount,
hydrates from the URL query string (AC-9.3).

### 5.8 Success / error UX

- On query error: full-page error boundary with a retry button.
- On 403 (permission denied at the route): the existing
  `withPageAuth` middleware renders the 403 page; no app-level error.
- On CSV export 4xx: inline toast with the server's error message.
- On CSV export truncation: toast warning + the response header is
  logged for observability.

---

## 6. UX & Navigation

### 6.1 Sidebar nav item

**File:** `frontend/common/views/dashboard/config/navigationConfig.ts`

Add to `SIDEBAR_NAV_ITEMS` under the existing `grp_reports` group:

```ts
{
  key: "accounting-reports",
  labelKey: "accountingReports",
  iconKey: "assessment",
  href: "/accounting/reports",
  section: "main",
  permission: PAGE_PERMISSIONS.accountingReportsView, // = [AppPermission.ACCOUNTING_REPORTS_VIEW] as PagePermissions
  groupId: "grp_reports",
},
```

Also add `AppPermission.ACCOUNTING_REPORTS_VIEW` to the `grp_reports`
group's `permission` array so the group header renders for users with
only this permission.

**Required locale additions (nav labels live in the `dashboard.core.nav`
namespace, NOT in the new `dashboard.reports.sessionAudit` namespace):**

- `shared/locale/types/dashboard/core/nav.ts` — add `readonly accountingReports: string;`
  to `DashboardNavigationLabels`.
- `shared/locale/en/dashboard/core/nav.ts` — add `accountingReports: "Full Reports"`.
- `shared/locale/ar/dashboard/core/nav.ts` — add `accountingReports: "التقارير الشاملة"`.
- `navIconKeys.ts` — `assessment` is already in the `NavIconKey` union; no change needed.

### 6.2 Icon registry

**File:** `frontend/common/views/dashboard/config/navIconKeys.ts`

`assessment` is already in the `NavIconKey` union (used by `reports` and
`monthly-reports`). No new icon key needed.

### 6.3 Page permissions

**File:** `frontend/common/types/page-permissions.types.ts`

```ts
export const PAGE_PERMISSIONS = {
  // ... existing ...
  accountingReportsView: [AppPermission.ACCOUNTING_REPORTS_VIEW] as PagePermissions,
  accountingReportsManage: [AppPermission.ACCOUNTING_REPORTS_MANAGE] as PagePermissions,
} as const;
```

### 6.4 Route middleware

The route uses the existing `withPageAuth` / `requirePermission`
middleware. No new middleware code — just register the permission in
the page-permissions map.

### 6.5 Drill-down to audit page (existing)

The existing `/classes/[id]/audit` page already exists. Plan 4 only
adds the `?openOverride=1` query param consumption (which Plan 3
reads to auto-open the Override dialog from the audit drawer's
Payroll card). This is a one-line addition to the audit page's
container component.

---

## 7. i18n

### 7.1 Locale type, namespace, and EN/AR implementations

Per the `shared/AGENTS.md` compile-time i18n rules, every new namespace
requires **four** artifacts (type schema, namespace definition, EN impl, AR impl).
The session-audit namespace lives under `dashboard/reports/sessionAudit`
(consistent with the existing `dashboard/reports/` directory used by `main`,
and with the nav item's `groupId: "grp_reports"`).

**1. Type schema** — `shared/locale/types/dashboard/reports/sessionAudit.ts` 🆕

Define a `SessionAuditLabels` interface with all keys (use TypeScript
function-typed fields for interpolation / pluralization, not ICU strings):

```ts
export interface SessionAuditLabels {
  readonly title: string;
  readonly filters: {
    readonly teacher: string;
    readonly student: string;
    readonly dateRange: string;
    readonly status: string;
    readonly search: string;
    readonly clear: string;
  };
  readonly column: {
    readonly scheduledStart: string;
    readonly openSessionTime: string;
    readonly endSessionTime: string;
    readonly durationAssumed: string;
    readonly calculatedDuration: string;
    readonly paidAmount: string;
    readonly calculationStatus: string;
    readonly note: string;
  };
  readonly status: {
    readonly open: string;
    readonly end: string;
    readonly Absent: string;
    readonly absent_student: string;
  };
  readonly cell: {
    readonly notJoined: string;
    readonly inProgress: string;
    readonly notCalculated: string;
  };
  readonly aggregate: {
    readonly totalPaid: string;
    readonly paidRows: string;
    readonly unpaidRows: string;
  };
  readonly action: {
    readonly openAuditPage: string;
    readonly exportCsv: string;
  };
  readonly exportTruncated: string;
  readonly tooltip: {
    readonly rawUtc: (value: string) => string;
    readonly bookingTimezone: (value: string) => string;
  };
  readonly error: { readonly dateRangeInvalid: string };
  readonly emptyState: {
    readonly title: string;
    readonly cta: string;
  };
}
```

Add `export * from "./sessionAudit";` to `shared/locale/types/dashboard/reports/index.ts`
(create if missing).
Register the namespace ID in `shared/locale/types/message.ts` (`MessageSchema`).

**2. Namespace** — `shared/locale/namespaces/dashboard/reports/sessionAudit.namespace.ts` 🆕

```ts
import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { SessionAuditLabels } from "@/shared/locale/types/dashboard/reports/sessionAudit";

export const DashboardReportsSessionAudit = defineNamespace<SessionAuditLabels>(
  "dashboard.reports.sessionAudit",
  {
    load: {
      en: () => import("@/shared/locale/en/dashboard/reports/sessionAudit").then(m => m.dashboardReportsSessionAuditEn),
      ar: () => import("@/shared/locale/ar/dashboard/reports/sessionAudit").then(m => m.dashboardReportsSessionAuditAr),
    },
  }
);
```

Add `export * from "./sessionAudit.namespace";` to
`shared/locale/namespaces/dashboard/reports/index.ts` (create if missing).

**3. EN implementation** — `shared/locale/en/dashboard/reports/sessionAudit.ts` 🆕

**4. AR implementation** — `shared/locale/ar/dashboard/reports/sessionAudit.ts` 🆕

Keys (see type above for shape):

| Key                                  | EN                                                       | AR                                                       |
|--------------------------------------|----------------------------------------------------------|----------------------------------------------------------|
| `title`                              | "Full Reports — Session Audit"                           | "التقارير الشاملة — مراجعة الجلسات"                       |
| `filters.teacher`                    | "Teacher"                                                | "المعلم"                                                  |
| `filters.student`                    | "Student"                                                | "الطالب"                                                  |
| `filters.dateRange`                  | "Date range"                                             | "النطاق الزمني"                                          |
| `filters.status`                     | "Session status"                                         | "حالة الجلسة"                                            |
| `filters.search`                     | "Search teacher / student"                              | "ابحث عن معلم / طالب"                                    |
| `filters.clear`                     | "Clear filters"                                          | "مسح الفلاتر"                                            |
| `column.scheduledStart`             | "Scheduled start"                                       | "بداية الجلسة"                                            |
| `column.openSessionTime`            | "Room entry"                                            | "وقت الدخول"                                              |
| `column.endSessionTime`             | "Room exit"                                             | "وقت الخروج"                                              |
| `column.durationAssumed`            | "Scheduled duration (min)"                              | "مدة الجلسة (دقيقة)"                                    |
| `column.calculatedDuration`          | "Calculated duration (min)"                             | "مدة الاحتساب (دقيقة)"                                   |
| `column.paidAmount`                  | "Paid amount"                                            | "المبلغ المستحق"                                          |
| `column.calculationStatus`          | "Calculation status"                                    | "حالة الاحتساب"                                          |
| `column.note`                        | "Note"                                                   | "ملاحظة"                                                  |
| `status.open`                        | "Open"                                                   | "مفتوحة"                                                  |
| `status.end`                         | "Ended"                                                  | "منتهية"                                                  |
| `status.Absent`                      | "Teacher absent"                                         | "غيب المعلم"                                              |
| `status.absent_student`              | "Student absent"                                         | "غاب الطالب"                                              |
| `cell.notJoined`                     | "Not joined"                                             | "لم ينضم"                                                  |
| `cell.inProgress`                    | "In progress"                                            | "قيد التقدم"                                              |
| `cell.notCalculated`                 | "—"                                                      | "—"                                                       |
| `aggregate.totalPaid`                | "Total paid"                                             | "إجمالي المستحق"                                          |
| `aggregate.paidRows`                 | "Paid rows"                                              | "الصفوف المدفوعة"                                         |
| `aggregate.unpaidRows`               | "Unpaid rows"                                            | "الصفوف غير المدفوعة"                                     |
| `action.openAuditPage`              | "Open audit page"                                       | "افتح صفحة المراجعة"                                      |
| `action.exportCsv`                   | "Export CSV"                                             | "تصدير CSV"                                               |
| `exportTruncated`                    | "Export truncated to 10 000 rows."                       | "تم اقتطاع التصدير إلى 10 000 صف."                       |
| `tooltip.rawUtc(value)`               | `(value) => \`Raw UTC: ${value}\``                          | `(value) => \`التوقيت العالمي: ${value}\``                          |
| `tooltip.bookingTimezone(value)`      | `(value) => \`Booking timezone: ${value}\``                 | `(value) => \`توقيت الحجز: ${value}\``                            |
| `error.dateRangeInvalid`              | "From date cannot be after To date."                    | "لا يمكن أن يكون تاريخ البداية بعد تاريخ النهاية."       |
| `emptyState.title`                  | "No session events match the current filters."          | "لا توجد جلسات تطابق الفلاتر الحالية."                  |
| `emptyState.cta`                     | "Clear filters"                                          | "مسح الفلاتر"                                            |

### 7.2 Locale snapshot generation

After adding the namespace, run the locale-snapshot generator so the
`public/static/locale-snapshots/{en,ar}/dashboard.reports.sessionAudit.json`
files are produced for compile-time i18n.

### 7.3 Nav label additions (separate namespace)

As noted in §6.1, the sidebar item's `labelKey: "accountingReports"` lives
in the existing `dashboard.core.nav` namespace — add the key to its type
schema + EN + AR files (do NOT duplicate it in `dashboard.reports.sessionAudit`).

---

## 8. Testing Strategy

### 8.1 Mapper tests (the heart of the plan)

**File:** `shared/constants/classes/session-audit-status.test.ts`

Covers every `mapToSessionAuditStatus` branch (specs AC-2.2 … AC-2.8):
- `RUNNING + actualStartAt set` → `"open"`.
- `ACTIVATED + actualStartAt set` → `"open"`.
- `COMPLETED + TAKEN` → `"end"`.
- `COMPLETED + ABSENT + actualStartAt null` → `"Absent"`.
- `COMPLETED + ABSENT + actualStartAt set` → `"absent_student"`.
- `COMPLETED + LEAVE` → `"absent_student"`.
- `NOT_ACTIVATED` → `"open"`.
- `ON_DEMAND_NO_CREDITS_ABSENT + actualStartAt null` → `"open"` (per AC-2.7).
- `ON_DEMAND_NO_CREDITS_ABSENT + actualStartAt set` → `"open"` (per AC-2.7).
- `CANCELLED` → `"open"`.
- `RESCHEDULED` → `"open"`.
- `null executionState / outcome` → `"open"` (defensive).

### 8.2 Service-layer tests

**File:** `backend/services/accounting/session-audit.service.test.ts`

- `getReport` happy path — returns page + aggregates.
- Filter by teacher / student / date range / status multi-select.
- Sort by every sortable field (asc + desc).
- Pagination (limit/offset); clamp beyond last page.
- `includeDeleted=true` (admin) includes soft-deleted rows.
- `search` matches teacher name + student name (case-insensitive).
- Permission denied → throws `InsufficientPermissions`.
- Graceful degradation when Plan 3 payroll columns are null (Plan 3
  not yet deployed) — payroll fields return null, status still maps.

### 8.3 Repository tests

**File:** `backend/db/test/repo/scheduling/session-audit.repository.test.ts`

- The single SQL query joins correctly (teacher/student/subject names
  populated; no N+1).
- `currentStatuses = ["Absent"]` filter expands to the correct SQL
  predicate (verified via `EXPLAIN` or row inspection).
- Soft-delete RLS filter excludes deleted rows by default.
- Sort by `teacherPaidAmount` puts nulls first (asc) / last (desc).
- Aggregate `totalCount` matches the row count when filters narrow
  the result set.

### 8.4 GraphQL tests

**File:** `backend/graphql/query/billing/session-audit.query.test.ts`

- Query returns the page shape; respects `limit`/`offset`/`sort`.
- Permission denied → GraphQL error.
- Mutation-argument coverage N/A (no mutations in this plan).
- Returns null payroll fields gracefully when Plan 3 is not deployed
  (simulate by mocking `calculationStatus` as null).

### 8.5 Frontend tests

- `SessionAuditReportsContainer.test.tsx` — renders rows; filters
  debounce; empty state; CSV button hits the right URL; row click
  navigates; "Open audit page" action navigates with `?openOverride=1`.
- `SessionAuditFilterBar.test.tsx` — every filter control works;
  "Clear filters" resets to defaults; URL-state sync (mock
  `useRouter`).
- `SessionAuditStatusChip.test.tsx` — renders correct color + label
  per status; pulse animation only when within 24 hours + running.
- `formatters/sessionAuditCellFormatters.test.ts` — every formatter
  handles null/empty cases; localized output.
- Axe-core accessibility assertions on the grid + filter bar.

### 8.6 CSV export tests

**File:** `app/api/accounting/reports/export/route.test.ts`

- Happy path returns CSV with the expected header + rows.
- 401 when unauthenticated.
- 403 when authenticated without `ACCOUNTING_REPORTS_VIEW`.
- Truncation header set when `totalCount > 10_000`.
- Date-range validation error returns 400.
- CSV escaping: cells with commas, quotes, newlines are wrapped
  correctly (RFC 4180).

### 8.7 Quality loops (per file)

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
| **Plan 3** (`teacher-payroll-engine`) | Plan 3 **writes** the payroll columns; Plan 4 **reads** them via the existing `ClassInstanceDetailPothosObject` extension. Plan 4 reuses Plan 3's `CalculationStatusPothosEnum` and `CalculationStatusChip` component. Plan 4 degrades gracefully when Plan 3 is not yet deployed (payroll fields return null). |
| Existing `class_instances` table | Plan 4 reads every column it needs from the existing schema; zero migrations. |
| Existing `class_status_events` + `audit_logs` | Plan 4 reads these only in the drill-down audit drawer (existing `/classes/[id]/audit` page) — not in the grid. |
| Existing `teacher_dues` | Plan 4 LEFT JOINs `teacher_dues` for the `payment_date` tooltip when `calculation_status = 'PAID'`. |
| Existing rate-resolver + meeting adapters | Plan 4 reads the snapshots they captured at booking / activation time; no direct calls. |
| Plan 2 (`credit-adjustment-system`) | Independent — Plan 2 writes student-side credit; Plan 4 reads teacher-side session telemetry. They share no tables. |

---

## 10. Risks & Mitigations

| Risk                                                                    | Mitigation                                                                                          |
|-------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| The `currentStatus` mapper diverges between server and client.            | Mapper lives in `shared/constants/classes/session-audit-status.ts`; both server (Pothos resolver) and client (Storybook fixtures) import the same function. |
| Plan 3 not yet deployed; payroll columns missing from the live DB.       | Repository query uses `LEFT JOIN` semantics (the columns are nullable); the mapper still works on `execution_state + outcome`; the grid renders `null` payroll cells as `—`. A feature-flag check could gate the payroll columns if needed. |
| N+1 queries for teacher/student/subject names.                            | Single SQL query with `INNER JOIN` on `teachers + users + students + users + class_subjects`. The repository test asserts no extra queries fire. |
| `currentStatuses = ["open"]` filter expands to a `NOT IN` predicate that's slow on large tables. | The `class_instances_execution_state_idx` index supports the `NOT IN ('COMPLETED')` branch; for the `IN ('COMPLETED') AND outcome IN (...)` branch, the `class_instances_state_start_idx` (state + scheduled_start_at) compound index covers it. Query plan reviewed in the repository test. |
| CSV export on a 10 000-row result set blocks the event loop.              | The serializer is a pure function operating on a pre-fetched array; serialization is O(n) with no awaits. p95 < 3 s on the dev machine. |
| URL-state sync causes an infinite render loop.                            | The Zustand store uses a `useEffect` debounced by 100 ms to push state → URL; the URL → state hydration runs once on mount. Tests cover the round-trip. |
| Permission scope drift (`_VIEW` vs `_MANAGE`).                          | Documented in §2.2; seed groups updated; query re-checks via `requirePermission`. |
| Mixed currencies in aggregate totals produce misleading sums.            | Aggregate falls back to the dominant currency (the one with the most rows); a per-currency breakdown is exposed as `rowCountByStatus` equivalent. |
| Sidebar group confusion (Reports vs Accounting).                       | Reuse `grp_reports` (existing); new "Full Reports" item appears under it with its own permission. |

---

## 11. Out-of-Scope (Deferred)

- New database columns (Plan 3 owns all schema additions).
- Real-time room telemetry / webinar attendance feeds.
- Computing payroll amounts (Plan 3 owns the calculator).
- XLSX export (CSV only in v1).
- Saved "favorite filters" per operator (URL-state bookmarking suffices in v1).
- A fifth `currentStatus` value like `"pending"` for `NOT_ACTIVATED` (treated as `"open"` in v1).
- Notifications on session events (separate notification plan).
- Reporting/dashboard widgets summarizing session events (separate reporting plan).
- Per-session video playback / recording review (separate LMS plan).
- Display-currency toggle (FX conversion at grid render time).
