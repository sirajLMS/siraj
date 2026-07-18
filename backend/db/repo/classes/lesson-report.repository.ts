import { and, count, desc, eq, inArray } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { lessonReports } from "@/backend/db/schema";
import { LessonReportStatus } from "@/backend/enum";
import type { LessonReportInsertType, LessonReportSelectType } from "@/backend/types";
import type { PaginationArgs } from "@/backend/types/shared/pagination.types";

export interface PendingReviewFilters {
  teacherId?: string;
  studentId?: string;
}

export namespace LessonReportRepository {
  export async function findByClassInstanceId(
    classInstanceId: string,
    tx?: DBTransaction
  ): Promise<LessonReportSelectType | null> {
    const queryDb = tx ?? db;
    const [row] = await queryDb
      .select()
      .from(lessonReports)
      .where(eq(lessonReports.classInstanceId, classInstanceId))
      .limit(1);
    return row ?? null;
  }

  export async function findById(reportId: string, tx?: DBTransaction): Promise<LessonReportSelectType | null> {
    const queryDb = tx ?? db;
    const [row] = await queryDb.select().from(lessonReports).where(eq(lessonReports.id, reportId)).limit(1);
    return row ?? null;
  }

  export async function findPendingReviews(
    filters: PendingReviewFilters,
    paginationArgs: PaginationArgs,
    tx?: DBTransaction
  ): Promise<LessonReportSelectType[]> {
    const queryDb = tx ?? db;
    const conditions = [eq(lessonReports.status, LessonReportStatus.PENDING_REVIEW)];
    if (filters.teacherId) conditions.push(eq(lessonReports.teacherId, filters.teacherId));
    if (filters.studentId) conditions.push(eq(lessonReports.studentId, filters.studentId));

    return queryDb
      .select()
      .from(lessonReports)
      .where(and(...conditions))
      .orderBy(lessonReports.submittedAt)
      .limit(paginationArgs.perPage)
      .offset(paginationArgs.offset);
  }

  export async function findRecentApproved(limit: number, tx?: DBTransaction): Promise<LessonReportSelectType[]> {
    const queryDb = tx ?? db;
    return queryDb
      .select()
      .from(lessonReports)
      .where(eq(lessonReports.status, LessonReportStatus.APPROVED))
      .orderBy(desc(lessonReports.reviewedAt))
      .limit(limit);
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
