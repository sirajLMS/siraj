import { and, count, desc, eq, inArray } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { lessonReports, students, teachers, users } from "@/backend/db/schema";
import { LessonReportStatus } from "@/backend/enum";
import type { LessonReportInsertType, LessonReportSelectType } from "@/backend/types";
import type { PaginationArgs } from "@/backend/types/shared/pagination.types";

export interface PendingReviewFilters {
  teacherId?: string;
  studentId?: string;
}

type LessonReportWithNames = LessonReportSelectType & {
  teacherName: string | null;
  studentName: string | null;
};

function mapReportWithNames(row: {
  report: LessonReportSelectType;
  teacherName: string | null;
  studentName: string | null;
}): LessonReportWithNames {
  return {
    ...row.report,
    teacherName: row.teacherName,
    studentName: row.studentName,
  };
}

export namespace LessonReportRepository {
  export async function findByClassInstanceId(
    classInstanceId: string,
    tx?: DBTransaction
  ): Promise<LessonReportWithNames | null> {
    const queryDb = tx ?? db;
    const [row] = await queryDb
      .select({
        report: lessonReports,
        teacherName: users.name,
        studentName: students.name,
      })
      .from(lessonReports)
      .innerJoin(students, eq(lessonReports.studentId, students.id))
      .innerJoin(teachers, eq(lessonReports.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(eq(lessonReports.classInstanceId, classInstanceId))
      .limit(1);
    return row ? mapReportWithNames(row) : null;
  }

  export async function findById(reportId: string, tx?: DBTransaction): Promise<LessonReportWithNames | null> {
    const queryDb = tx ?? db;
    const [row] = await queryDb
      .select({
        report: lessonReports,
        teacherName: users.name,
        studentName: students.name,
      })
      .from(lessonReports)
      .innerJoin(students, eq(lessonReports.studentId, students.id))
      .innerJoin(teachers, eq(lessonReports.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(eq(lessonReports.id, reportId))
      .limit(1);
    return row ? mapReportWithNames(row) : null;
  }

  export async function findPendingReviews(
    filters: PendingReviewFilters,
    paginationArgs: PaginationArgs,
    tx?: DBTransaction
  ): Promise<LessonReportWithNames[]> {
    const queryDb = tx ?? db;
    const conditions = [eq(lessonReports.status, LessonReportStatus.PENDING_REVIEW)];
    if (filters.teacherId) conditions.push(eq(lessonReports.teacherId, filters.teacherId));
    if (filters.studentId) conditions.push(eq(lessonReports.studentId, filters.studentId));

    const rows = await queryDb
      .select({
        report: lessonReports,
        teacherName: users.name,
        studentName: students.name,
      })
      .from(lessonReports)
      .innerJoin(students, eq(lessonReports.studentId, students.id))
      .innerJoin(teachers, eq(lessonReports.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(and(...conditions))
      .orderBy(lessonReports.submittedAt)
      .limit(paginationArgs.perPage)
      .offset(paginationArgs.offset);
    return rows.map(mapReportWithNames);
  }

  export async function findRecentApproved(limit: number, tx?: DBTransaction): Promise<LessonReportWithNames[]> {
    const queryDb = tx ?? db;
    const rows = await queryDb
      .select({
        report: lessonReports,
        teacherName: users.name,
        studentName: students.name,
      })
      .from(lessonReports)
      .innerJoin(students, eq(lessonReports.studentId, students.id))
      .innerJoin(teachers, eq(lessonReports.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(eq(lessonReports.status, LessonReportStatus.APPROVED))
      .orderBy(desc(lessonReports.reviewedAt))
      .limit(limit);
    return rows.map(mapReportWithNames);
  }

  export async function create(input: LessonReportInsertType, tx?: DBTransaction): Promise<LessonReportSelectType> {
    const queryDb = tx ?? db;
    const [row] = await queryDb.insert(lessonReports).values(input).returning();
    return row;
  }

  export async function updateStatus(
    reportId: string,
    status: LessonReportStatus,
    reviewedByUserId: string,
    rejectionReason: string | null,
    tx?: DBTransaction
  ): Promise<LessonReportSelectType> {
    const queryDb = tx ?? db;
    const [row] = await queryDb
      .update(lessonReports)
      .set({
        status,
        reviewedByUserId,
        reviewedAt: new Date(),
        rejectionReason,
        updatedAt: new Date(),
      })
      .where(eq(lessonReports.id, reportId))
      .returning();
    return row;
  }

  export async function countPendingReviews(filters?: PendingReviewFilters, tx?: DBTransaction): Promise<number> {
    const queryDb = tx ?? db;
    const conditions = [eq(lessonReports.status, LessonReportStatus.PENDING_REVIEW)];
    if (filters?.teacherId) conditions.push(eq(lessonReports.teacherId, filters.teacherId));
    if (filters?.studentId) conditions.push(eq(lessonReports.studentId, filters.studentId));

    const [result] = await queryDb
      .select({ value: count() })
      .from(lessonReports)
      .where(and(...conditions));
    return Number(result?.value ?? 0);
  }

  export async function findByIdempotencyKeys(
    keys: readonly string[],
    tx?: DBTransaction
  ): Promise<LessonReportSelectType[]> {
    if (keys.length === 0) return [];
    const queryDb = tx ?? db;
    return queryDb
      .select()
      .from(lessonReports)
      .where(inArray(lessonReports.idempotencyKey, [...keys]));
  }

  export async function updateStudentNotes(
    classInstanceId: string,
    studentNotes: string,
    tx?: DBTransaction
  ): Promise<LessonReportSelectType | null> {
    const queryDb = tx ?? db;
    const [row] = await queryDb
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
