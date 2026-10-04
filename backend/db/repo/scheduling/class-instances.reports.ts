import { and, desc, eq, gte, inArray, isNull, lt, or, type SQL, sql } from "drizzle-orm";
import { caseInsensitiveLike, type QueryDbHandle, queryDb } from "@/backend/db";
import { buildInstanceReportDateConditions } from "@/backend/db/repo/scheduling/report-filters.helpers";
import { classInstances, classSubjects, students, teachers, users } from "@/backend/db/schema";
import { CalculationStatus } from "@/backend/enum";
import { PROFIT_LOSS_MONTH_PATTERN } from "@/backend/lib";
import type * as Types from "@/backend/types";
import { escapeLikeWildcards } from "@/backend/utils";
import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";

/**
 * Shared WHERE conditions for the payroll report. Teacher names live on
 * `users` (via `teachers.userId`); student names live on `students.name`.
 */
function buildPayrollReportConditions(filters: Types.PayrollReportFilters): (SQL | undefined)[] {
  const conditions: (SQL | undefined)[] = [isNull(classInstances.deletedAt)];
  conditions.push(...buildInstanceReportDateConditions(filters));
  if (filters.calculationStatuses != null && filters.calculationStatuses.length > 0) {
    conditions.push(inArray(classInstances.calculationStatus, [...filters.calculationStatuses]));
  }
  const search = filters.search?.trim();
  if (search) {
    const searchPattern = `%${escapeLikeWildcards(search)}%`;
    conditions.push(
      or(caseInsensitiveLike(students.name, searchPattern), caseInsensitiveLike(users.name, searchPattern))
    );
  }
  return conditions;
}

/**
 * Base builder for the payroll report read: a single joined query over
 * `class_instances` + `teachers` → `users` (teacher name) + `students`
 * (student name) + `class_subjects` (subject name). The absence-rule
 * booleans (`isStudentAbsence`, `isTeacherAbsence`) mirror the calculator's
 * branch conditions and are computed in the SELECT clause: student absence
 * requires an absent outcome WITH join telemetry; a row with no join
 * telemetry is a teacher absence whatever the outcome says.
 */
function payrollReportBaseQuery(q: QueryDbHandle | Types.DBTransaction) {
  return q
    .select({
      instanceId: classInstances.id,
      scheduledStartAt: classInstances.scheduledStartAt,
      scheduledEndAt: classInstances.scheduledEndAt,
      actualStartAt: classInstances.actualStartAt,
      actualEndAt: classInstances.actualEndAt,
      calculatedDuration: classInstances.calculatedDuration,
      teacherPaidAmount: classInstances.teacherPaidAmount,
      teacherPaidCurrency: classInstances.teacherPaidCurrency,
      calculationStatus: classInstances.calculationStatus,
      isPartialPercentage: classInstances.isPartialPercentage,
      payrollNote: classInstances.payrollNote,
      teacherId: classInstances.teacherId,
      teacherName: users.name,
      studentId: classInstances.studentId,
      studentName: students.name,
      subjectId: classInstances.subjectId,
      subjectName: classSubjects.name,
      isStudentAbsence:
        sql<boolean>`(${classInstances.outcome} = ${ClassOutcome.ABSENT} AND ${classInstances.actualStartAt} IS NOT NULL)`.mapWith(
          Boolean
        ),
      isTeacherAbsence: sql<boolean>`(${classInstances.actualStartAt} IS NULL)`.mapWith(Boolean),
    })
    .from(classInstances)
    .innerJoin(teachers, eq(classInstances.teacherId, teachers.id))
    .innerJoin(users, eq(teachers.userId, users.id))
    .innerJoin(students, eq(classInstances.studentId, students.id))
    .innerJoin(classSubjects, eq(classInstances.subjectId, classSubjects.id));
}

/**
 * Reads one page of the payroll report. `totalCount` is counted by a
 * parallel query that shares the same joins and filters but no
 * LIMIT/OFFSET, so it always reflects the full filtered set independently
 * of the requested page.
 */
export async function findPayrollReportRows(
  filters: Types.PayrollReportFilters,
  pagination: { limit: number; offset: number },
  tx?: Types.DBTransaction
): Promise<{ rows: Types.PayrollReportRow[]; totalCount: number }> {
  const q = queryDb(tx);
  const conditions = buildPayrollReportConditions(filters);

  const [rows, [{ count: totalCount }]] = await Promise.all([
    payrollReportBaseQuery(q)
      .where(and(...conditions))
      .orderBy(desc(classInstances.scheduledStartAt), classInstances.id)
      .limit(pagination.limit)
      .offset(pagination.offset),
    q
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(classInstances)
      .innerJoin(teachers, eq(classInstances.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .innerJoin(students, eq(classInstances.studentId, students.id))
      .innerJoin(classSubjects, eq(classInstances.subjectId, classSubjects.id))
      .where(and(...conditions)),
  ]);

  return {
    rows: rows.map(row => ({
      instanceId: row.instanceId,
      scheduledStartAt: row.scheduledStartAt.toISOString(),
      scheduledEndAt: row.scheduledEndAt.toISOString(),
      scheduledDurationMinutes: Math.round((row.scheduledEndAt.getTime() - row.scheduledStartAt.getTime()) / 60_000),
      actualStartAt: row.actualStartAt?.toISOString() ?? null,
      actualEndAt: row.actualEndAt?.toISOString() ?? null,
      calculatedDuration: row.calculatedDuration,
      teacherPaidAmount: row.teacherPaidAmount,
      teacherPaidCurrency: row.teacherPaidCurrency,
      calculationStatus: row.calculationStatus,
      isPartialPercentage: row.isPartialPercentage,
      payrollNote: row.payrollNote,
      teacherId: row.teacherId,
      teacherName: row.teacherName,
      studentId: row.studentId,
      studentName: row.studentName,
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      isStudentAbsence: row.isStudentAbsence,
      isTeacherAbsence: row.isTeacherAbsence,
    })),
    totalCount,
  };
}

/**
 * Calculation statuses that mark a completed session as reportable in the
 * P&L payments tab. `NOT_CALCULATED` sessions are excluded — their payroll
 * snapshot (payable minutes and payout amount) has not been produced yet.
 */
const PROFIT_LOSS_CALCULATION_STATUSES = [
  CalculationStatus.CALCULATED,
  CalculationStatus.PARTIALLY,
  CalculationStatus.REFUND,
  CalculationStatus.WAITING_PAID,
  CalculationStatus.PAID,
] as const;

/** First instant (UTC) of a `YYYY-MM` accounting month. */
function startOfUtcMonth(month: string): Date {
  return new Date(`${month}-01T00:00:00.000Z`);
}

/**
 * First instant (UTC) of the month after `month` — the exclusive upper bound
 * of the `YYYY-MM` range filter. Callers must pass a pattern-validated month:
 * `Date.UTC` maps two-digit years to 1900+year, so a malformed input would
 * silently produce a bound in the wrong century.
 */
function startOfNextUtcMonth(month: string): Date {
  const [year, monthNumber] = month.split("-").map(Number);
  // Fail closed: `Date.UTC` remaps years 0-99 to 1900+year, so a malformed
  // month must never reach the boundary computation.
  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new Error(`startOfNextUtcMonth requires a 4-digit year, got ${month}`);
  }
  // Date.UTC takes a 0-based month; passing the 1-based value lands on the
  // 1st of the following month.
  return new Date(Date.UTC(year, monthNumber, 1));
}

/**
 * Reads one page of the P&L payments tab: completed class sessions inside
 * the `YYYY-MM` accounting month whose payroll calculation has been produced
 * (`NOT_CALCULATED` excluded), joined with the teacher, student, and subject
 * display fields. Timestamp bounds are bound as JS Dates so the same SQL
 * runs on PostgreSQL (timestamptz) and SQLite (epoch-millis) without
 * dialect-specific casts. Soft-deleted sessions are excluded like every
 * other read path in this repository. `totalCount` is counted by a parallel
 * single-table query with the same filters and no LIMIT/OFFSET, so it always
 * reflects the full filtered set independently of the requested page.
 *
 * Data-access only: the returned rows carry the raw joined values — the
 * payable-minutes snapshot (`calculatedDuration` with the scheduled duration
 * fallback included by the query) and the raw payroll snapshot columns. The
 * service layer owns every report-facing derivation: mapping the payroll
 * snapshot to the student-side charge, the zero-amount fallback, the house
 * default currency, FX conversion, and the manual credit subtraction.
 */
export async function findProfitLossPayments(
  options: { month: string; limit: number; offset: number },
  tx?: Types.DBTransaction
): Promise<{
  rows: Omit<
    Types.ProfitLossPaymentRepoRow,
    "convertedAmount" | "manualSubtractCredits" | "manualSubtractCreditsCurrency"
  >[];
  totalCount: number;
}> {
  // Malformed months (wildcards, non-calendar months) match nothing — the
  // service validates the month upstream, but the repository must never widen
  // a hostile month into an unbounded scan or fail on an invalid date bound.
  if (!PROFIT_LOSS_MONTH_PATTERN.test(options.month)) {
    return { rows: [], totalCount: 0 };
  }
  const q = queryDb(tx);
  const conditions: (SQL | undefined)[] = [
    eq(classInstances.executionState, ClassExecutionState.COMPLETED),
    inArray(classInstances.calculationStatus, [...PROFIT_LOSS_CALCULATION_STATUSES]),
    gte(classInstances.scheduledStartAt, startOfUtcMonth(options.month)),
    lt(classInstances.scheduledStartAt, startOfNextUtcMonth(options.month)),
    isNull(classInstances.deletedAt),
  ];

  const [rows, [{ count: totalCount }]] = await Promise.all([
    q
      .select({
        instanceId: classInstances.id,
        scheduledStartAt: classInstances.scheduledStartAt,
        calculatedDuration: classInstances.calculatedDuration,
        durationMinutes: classInstances.durationMinutes,
        teacherPaidAmount: classInstances.teacherPaidAmount,
        teacherPaidCurrency: classInstances.teacherPaidCurrency,
        calculationStatus: classInstances.calculationStatus,
        teacherName: users.name,
        studentName: students.name,
        subjectName: classSubjects.name,
      })
      .from(classInstances)
      .innerJoin(teachers, eq(classInstances.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .innerJoin(students, eq(classInstances.studentId, students.id))
      .innerJoin(classSubjects, eq(classInstances.subjectId, classSubjects.id))
      .where(and(...conditions))
      .orderBy(desc(classInstances.scheduledStartAt), classInstances.id)
      .limit(options.limit)
      .offset(options.offset),
    // The filters reference only `class_instances` columns and the report
    // joins are inner joins over enforced NOT NULL foreign keys, so the
    // unjoined count equals the joined row count.
    q
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(classInstances)
      .where(and(...conditions)),
  ]);

  return {
    rows: rows.map(row => ({
      instanceId: row.instanceId,
      scheduledStartAt: row.scheduledStartAt.toISOString(),
      teacherName: row.teacherName,
      studentName: row.studentName,
      subjectName: row.subjectName,
      // Prefers the payable `calculatedDuration` snapshot over the scheduled
      // duration; the raw amount/currency snapshot columns are passed through
      // unchanged for the service layer to map.
      durationMinutes: row.calculatedDuration ?? row.durationMinutes,
      teacherPaidAmount: row.teacherPaidAmount,
      teacherPaidCurrency: row.teacherPaidCurrency,
      calculationStatus: row.calculationStatus,
    })),
    totalCount,
  };
}
