import { and, asc, desc, eq, isNull, or, type SQL, sql } from "drizzle-orm";
import { caseInsensitiveLike, type QueryDbHandle, queryDb } from "@/backend/db";
import { buildInstanceReportDateConditions } from "@/backend/db/repo/scheduling/report-filters.helpers";
import {
  classInstances,
  classSubjects,
  students,
  teacherDues,
  teacherPayments,
  teachers,
  users,
} from "@/backend/db/schema";
import { CalculationStatus } from "@/backend/enum";
import { expandStatusesToSql } from "@/backend/services/accounting/session-audit-status-predicate";
import type {
  DBTransaction,
  SessionAuditReportFilters,
  SessionAuditReportRow,
  SessionAuditReportSort,
  SessionAuditReportSortField,
} from "@/backend/types";
import { escapeLikeWildcards } from "@/backend/utils";
import { mapToSessionAuditStatus } from "@/shared/constants/classes/session-audit-status";
import { parseClassExecutionState, parseClassOutcome } from "@/shared/lib/enum";

/**
 * Session audit report read model: a single joined SELECT over
 * `class_instances` enriched with teacher / student / subject display names
 * plus the payment date of the linked teacher due. The audit status of each
 * row is derived in application code from the raw execution-state columns so
 * the filtering rule and the displayed value can never drift apart.
 */

/**
 * Free-text search condition. The query is split on whitespace and every
 * token must appear in either the teacher's or the student's name, so
 * multi-word phrases like "smith algebra" still match when the parts live in
 * different display names. Wildcard characters are escaped before wrapping.
 */
function searchTokenConditions(search: string): (SQL | undefined)[] {
  return search
    .trim()
    .split(/\s+/)
    .filter(token => token.length > 0)
    .map(token => {
      const pattern = `%${escapeLikeWildcards(token)}%`;
      return or(caseInsensitiveLike(users.name, pattern), caseInsensitiveLike(students.name, pattern));
    });
}

/** Shared WHERE conditions for the report read, its count twin and any caller. */
function buildSessionAuditConditions(filters: SessionAuditReportFilters): (SQL | undefined)[] {
  const conditions: (SQL | undefined)[] = [expandStatusesToSql(filters.currentStatuses ?? [])];

  if (filters.includeDeleted !== true) {
    conditions.push(isNull(classInstances.deletedAt));
  }
  conditions.push(...buildInstanceReportDateConditions(filters));
  if (filters.search != null) {
    conditions.push(...searchTokenConditions(filters.search));
  }
  return conditions;
}

/**
 * Whitelist of sortable columns. `teacherPaidAmount` is stored as a
 * decimal-as-text column, so it is ordered through a numeric cast to avoid
 * lexicographic surprises ("9.00" sorting after "10.00").
 */
const SORT_COLUMNS: Record<SessionAuditReportSortField, SQL> = {
  scheduledStartAt: sql`${classInstances.scheduledStartAt}`,
  scheduledEndAt: sql`${classInstances.scheduledEndAt}`,
  actualStartAt: sql`${classInstances.actualStartAt}`,
  actualEndAt: sql`${classInstances.actualEndAt}`,
  durationMinutes: sql`${classInstances.durationMinutes}`,
  calculatedDuration: sql`${classInstances.calculatedDuration}`,
  teacherPaidAmount: sql`CAST(${classInstances.teacherPaidAmount} AS NUMERIC)`,
  calculationStatus: sql`${classInstances.calculationStatus}`,
  teacherName: sql`${users.name}`,
  studentName: sql`${students.name}`,
};

/**
 * ORDER BY columns for the requested sort, followed by a stable id
 * tiebreaker so pagination boundaries never overlap between pages. Sorting by
 * the payable amount pins the null (not-yet-calculated) rows to the front for
 * ascending order and to the back for descending order.
 */
function buildSortOrder(sort: SessionAuditReportSort): SQL[] {
  const column = SORT_COLUMNS[sort.field];
  const tiebreaker = asc(classInstances.id);
  if (sort.field === "teacherPaidAmount") {
    const fragment = sort.direction === "asc" ? sql`${column} ASC NULLS FIRST` : sql`${column} DESC NULLS LAST`;
    return [fragment, tiebreaker];
  }
  const ordered = sort.direction === "asc" ? asc(column) : desc(column);
  return [ordered, tiebreaker];
}

/**
 * Base builder for the report page read: one SELECT over `class_instances`
 * with INNER JOINs to `teachers` → `users` (teacher name), `students`
 * (student name), and `class_subjects` (subject name), plus LEFT JOINs to
 * `teacher_dues` → `teacher_payments` for the disbursement date. The due link
 * is unique per class instance, so the LEFT JOINs never fan out extra rows.
 */
function sessionAuditBaseQuery(q: QueryDbHandle | DBTransaction) {
  return q
    .select({
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
      carryoverBalanceId: classInstances.carryoverBalanceId,
      teacherId: classInstances.teacherId,
      teacherName: users.name,
      studentId: classInstances.studentId,
      studentName: students.name,
      subjectId: classInstances.subjectId,
      subjectName: classSubjects.name,
      teacherDuePaymentDate: teacherPayments.paymentDate,
    })
    .from(classInstances)
    .innerJoin(teachers, eq(classInstances.teacherId, teachers.id))
    .innerJoin(users, eq(teachers.userId, users.id))
    .innerJoin(students, eq(classInstances.studentId, students.id))
    .innerJoin(classSubjects, eq(classInstances.subjectId, classSubjects.id))
    .leftJoin(teacherDues, eq(teacherDues.classInstanceId, classInstances.id))
    .leftJoin(teacherPayments, eq(teacherPayments.id, teacherDues.teacherPaymentId));
}

/** COUNT twin of the report read — same filters and name joins, no LEFT JOINs. */
function sessionAuditCountQuery(q: QueryDbHandle | DBTransaction, conditions: (SQL | undefined)[]) {
  return q
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(classInstances)
    .innerJoin(teachers, eq(classInstances.teacherId, teachers.id))
    .innerJoin(users, eq(teachers.userId, users.id))
    .innerJoin(students, eq(classInstances.studentId, students.id))
    .innerJoin(classSubjects, eq(classInstances.subjectId, classSubjects.id))
    .where(and(...conditions));
}

export namespace SessionAuditRepository {
  /**
   * Reads one page of the session audit report alongside the total number of
   * rows matching the filters. The page SELECT and the COUNT share the same
   * joins and WHERE conditions; they are the only two statements issued per
   * call.
   *
   * `limit` and `offset` are normalized to sane values (limit ≥ 1, offset ≥
   * 0); an offset past the end of the result set yields an empty page while
   * `totalCount` still reports the full filtered size so callers can clamp to
   * the last page.
   */
  export async function findReportRows(
    filters: SessionAuditReportFilters,
    sort: SessionAuditReportSort,
    pagination: { limit: number; offset: number },
    tx?: DBTransaction
  ): Promise<{ rows: SessionAuditReportRow[]; totalCount: number }> {
    const q = queryDb(tx);
    const conditions = buildSessionAuditConditions(filters);
    const limit = Math.max(1, Math.floor(pagination.limit));
    const offset = Math.max(0, Math.floor(pagination.offset));

    const [rows, [{ count: totalCount }]] = await Promise.all([
      sessionAuditBaseQuery(q)
        .where(and(...conditions))
        .orderBy(...buildSortOrder(sort))
        .limit(limit)
        .offset(offset),
      sessionAuditCountQuery(q, conditions),
    ]);

    return {
      rows: rows.map(row => ({
        instanceId: row.instanceId,
        scheduledStartAt: row.scheduledStartAt.toISOString(),
        scheduledEndAt: row.scheduledEndAt.toISOString(),
        durationMinutes: row.durationMinutes,
        actualStartAt: row.actualStartAt?.toISOString() ?? null,
        actualEndAt: row.actualEndAt?.toISOString() ?? null,
        bookingTimezone: row.bookingTimezone,
        currentStatus: mapToSessionAuditStatus(
          parseClassExecutionState(row.executionState),
          parseClassOutcome(row.outcome),
          row.actualStartAt
        ),
        calculatedDuration: row.calculatedDuration,
        teacherPaidAmount: row.teacherPaidAmount,
        teacherPaidCurrency: row.teacherPaidCurrency,
        calculationStatus: row.calculationStatus,
        isPartialPercentage: row.isPartialPercentage,
        payrollNote: row.payrollNote,
        payrollCalculatedAt: row.payrollCalculatedAt?.toISOString() ?? null,
        carryoverBalanceId: row.carryoverBalanceId,
        teacherId: row.teacherId,
        teacherName: row.teacherName,
        studentId: row.studentId,
        studentName: row.studentName,
        subjectId: row.subjectId,
        subjectName: row.subjectName,
        teacherDuePaymentDate:
          row.calculationStatus === CalculationStatus.PAID ? (row.teacherDuePaymentDate?.toISOString() ?? null) : null,
      })),
      totalCount,
    };
  }
}
