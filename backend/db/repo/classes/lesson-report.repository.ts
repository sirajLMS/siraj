import { and, count, desc, eq, inArray, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { db, queryDb } from "@/backend/db";
import {
  classInstances,
  classSubjects,
  lessonReports,
  recurringSchedules,
  students,
  teachers,
  users,
} from "@/backend/db/schema";
import { LessonReportStatus } from "@/backend/enum";
import { resolveClassAvatarUrl } from "@/backend/lib/avatar";
import type { DBTransaction, LessonReportInsertType, LessonReportSelectType, PaginationArgs } from "@/backend/types";

export interface PendingReviewFilters {
  teacherId?: string;
  studentId?: string;
}

type LessonReportWithNames = LessonReportSelectType & {
  teacherName: string | null;
  studentName: string | null;
  subjectName: string | null;
  classAvatarUrl: string | null;
  teacherAvatarUrl: string | null;
  studentAvatarUrl: string | null;
  teacherUserId: string | null;
  studentUserId: string | null;
};

type ReportJoinRow = {
  report: LessonReportSelectType;
  teacherName: string | null;
  studentName: string | null;
  subjectName: string | null;
  subjectAvatarUrl: string | null;
  recurringAvatarUrl: string | null;
  teacherAvatarUrl: string | null;
  studentAvatarUrl: string | null;
  teacherUserId: string | null;
  studentUserId: string | null;
};

const reportSelectFields = {
  report: lessonReports,
  teacherName: users.name,
  studentName: students.name,
  subjectName: classSubjects.name,
  subjectAvatarUrl: classSubjects.avatarUrl,
  recurringAvatarUrl: recurringSchedules.avatarUrl,
  teacherAvatarUrl: users.avatarUrl,
  studentAvatarUrl: students.avatarUrl,
  teacherUserId: users.id,
  studentUserId: students.userId,
} as const;

function mapReportWithNames(row: ReportJoinRow): LessonReportWithNames {
  return {
    ...row.report,
    teacherName: row.teacherName,
    studentName: row.studentName,
    subjectName: row.subjectName,
    classAvatarUrl: resolveClassAvatarUrl(row.recurringAvatarUrl, row.subjectAvatarUrl),
    teacherAvatarUrl: row.teacherAvatarUrl,
    studentAvatarUrl: row.studentAvatarUrl,
    teacherUserId: row.teacherUserId,
    studentUserId: row.studentUserId,
  };
}

type ReportSelectBuilder = ReturnType<typeof db.select<typeof reportSelectFields>>;

function withReportJoins(query: ReportSelectBuilder) {
  return query
    .from(lessonReports)
    .innerJoin(students, eq(lessonReports.studentId, students.id))
    .innerJoin(teachers, eq(lessonReports.teacherId, teachers.id))
    .innerJoin(users, eq(teachers.userId, users.id))
    .innerJoin(classInstances, eq(lessonReports.classInstanceId, classInstances.id))
    .leftJoin(classSubjects, eq(classInstances.subjectId, classSubjects.id))
    .leftJoin(recurringSchedules, eq(classInstances.recurringScheduleId, recurringSchedules.id));
}

function reportsByIdQuery(whereClause: SQL, tx?: DBTransaction) {
  const q = queryDb(tx);
  return withReportJoins(q.select(reportSelectFields)).where(whereClause);
}

function buildPaginatedReportQuery(
  queryBuilder: ReturnType<typeof db.select<typeof reportSelectFields>>,
  whereClause: SQL,
  orderBy: SQL | PgColumn,
  paginationArgs: PaginationArgs
) {
  return withReportJoins(queryBuilder)
    .where(whereClause)
    .orderBy(orderBy)
    .limit(paginationArgs.perPage)
    .offset(paginationArgs.offset);
}

async function findPaginatedReports(
  whereClause: SQL,
  orderBy: SQL | PgColumn,
  paginationArgs: PaginationArgs,
  tx?: DBTransaction
): Promise<LessonReportWithNames[]> {
  const q = queryDb(tx);
  const queryBuilder = q.select(reportSelectFields);
  const rows = await buildPaginatedReportQuery(queryBuilder, whereClause, orderBy, paginationArgs);
  return rows.map(mapReportWithNames);
}

async function findReportByQuery(whereClause: SQL, tx?: DBTransaction): Promise<LessonReportWithNames | null> {
  const [row] = await reportsByIdQuery(whereClause, tx).limit(1);
  return row ? mapReportWithNames(row) : null;
}

async function buildUpdateFields(
  reportId: string,
  fields: Partial<LessonReportInsertType>,
  tx?: DBTransaction
): Promise<LessonReportSelectType> {
  return updateReportFields(reportId, { ...fields, updatedAt: new Date() }, tx);
}

export namespace LessonReportRepository {
  export async function findByClassInstanceId(
    classInstanceId: string,
    tx?: DBTransaction
  ): Promise<LessonReportWithNames | null> {
    return findReportByQuery(eq(lessonReports.classInstanceId, classInstanceId), tx);
  }

  export async function findById(reportId: string, tx?: DBTransaction): Promise<LessonReportWithNames | null> {
    return findReportByQuery(eq(lessonReports.id, reportId), tx);
  }

  export async function findPendingReviews(
    filters: PendingReviewFilters,
    paginationArgs: PaginationArgs,
    tx?: DBTransaction
  ): Promise<LessonReportWithNames[]> {
    const conditions: SQL[] = [eq(lessonReports.status, LessonReportStatus.PENDING_REVIEW)];
    if (filters.teacherId) conditions.push(eq(lessonReports.teacherId, filters.teacherId));
    if (filters.studentId) conditions.push(eq(lessonReports.studentId, filters.studentId));

    const whereClause = and(...conditions);
    return findPaginatedReports(
      whereClause ?? eq(lessonReports.status, LessonReportStatus.PENDING_REVIEW),
      desc(lessonReports.submittedAt),
      paginationArgs,
      tx
    );
  }

  export async function findRecentApproved(
    paginationArgs: PaginationArgs,
    tx?: DBTransaction
  ): Promise<LessonReportWithNames[]> {
    return findPaginatedReports(
      eq(lessonReports.status, LessonReportStatus.APPROVED),
      desc(lessonReports.reviewedAt),
      paginationArgs,
      tx
    );
  }

  export async function countRecentApproved(tx?: DBTransaction): Promise<number> {
    const q = queryDb(tx);
    const [result] = await q
      .select({ value: count() })
      .from(lessonReports)
      .where(eq(lessonReports.status, LessonReportStatus.APPROVED));
    return result?.value ?? 0;
  }

  /** Student portal: lesson reports for a single student (newest lesson first). */
  export async function findForStudent(
    studentId: string,
    paginationArgs: PaginationArgs,
    tx?: DBTransaction
  ): Promise<LessonReportWithNames[]> {
    return findPaginatedReports(
      eq(lessonReports.studentId, studentId),
      desc(lessonReports.lessonDate),
      paginationArgs,
      tx
    );
  }

  export async function countForStudent(studentId: string, tx?: DBTransaction): Promise<number> {
    const q = queryDb(tx);
    const [result] = await q
      .select({ value: count() })
      .from(lessonReports)
      .where(eq(lessonReports.studentId, studentId));
    return result?.value ?? 0;
  }

  export async function create(input: LessonReportInsertType, tx?: DBTransaction): Promise<LessonReportSelectType> {
    const dbToQuery = tx ?? db;
    const [row] = await dbToQuery.insert(lessonReports).values(input).returning();
    return row;
  }

  export async function updateStatus(
    reportId: string,
    status: LessonReportStatus,
    reviewedByUserId: string,
    rejectionReason: string | null,
    tx?: DBTransaction
  ): Promise<LessonReportSelectType> {
    return buildUpdateFields(
      reportId,
      {
        status,
        reviewedByUserId,
        reviewedAt: new Date(),
        rejectionReason,
      },
      tx
    );
  }

  /** Seed/bootstrap helper: re-attribute reviewer without changing status. */
  export async function updateReviewedBy(
    reportId: string,
    reviewedByUserId: string,
    reviewedAt: Date | null,
    tx?: DBTransaction
  ): Promise<LessonReportSelectType> {
    return buildUpdateFields(
      reportId,
      {
        reviewedByUserId,
        reviewedAt,
      },
      tx
    );
  }

  export async function countPendingReviews(filters?: PendingReviewFilters, tx?: DBTransaction): Promise<number> {
    const q = queryDb(tx);
    const conditions = [eq(lessonReports.status, LessonReportStatus.PENDING_REVIEW)];
    if (filters?.teacherId) conditions.push(eq(lessonReports.teacherId, filters.teacherId));
    if (filters?.studentId) conditions.push(eq(lessonReports.studentId, filters.studentId));

    const [result] = await q
      .select({ value: count() })
      .from(lessonReports)
      .where(and(...conditions));
    return result?.value ?? 0;
  }

  export async function findByIdempotencyKeys(
    keys: readonly string[],
    tx?: DBTransaction
  ): Promise<LessonReportSelectType[]> {
    if (keys.length === 0) return [];
    const q = queryDb(tx);
    return q
      .select()
      .from(lessonReports)
      .where(inArray(lessonReports.idempotencyKey, [...keys]));
  }

  export async function updateStudentNotes(
    classInstanceId: string,
    studentNotes: string,
    tx?: DBTransaction
  ): Promise<LessonReportSelectType | null> {
    const dbToQuery = tx ?? db;
    const [row] = await dbToQuery
      .update(lessonReports)
      .set({
        studentNotes,
        updatedAt: new Date(),
      })
      .where(eq(lessonReports.classInstanceId, classInstanceId))
      .returning();
    return row ?? null;
  }
}

async function updateReportFields(
  reportId: string,
  fields: Partial<LessonReportInsertType>,
  tx?: DBTransaction
): Promise<LessonReportSelectType> {
  const dbToQuery = tx ?? db;
  const [row] = await dbToQuery.update(lessonReports).set(fields).where(eq(lessonReports.id, reportId)).returning();
  return row;
}
