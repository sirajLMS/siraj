import { and, count, desc, eq, inArray } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
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
import type { LessonReportInsertType, LessonReportSelectType } from "@/backend/types";
import type { PaginationArgs } from "@/backend/types/shared/pagination.types";

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

export namespace LessonReportRepository {
  export async function findByClassInstanceId(
    classInstanceId: string,
    tx?: DBTransaction
  ): Promise<LessonReportWithNames | null> {
    const queryDb = tx ?? db;
    const [row] = await queryDb
      .select(reportSelectFields)
      .from(lessonReports)
      .innerJoin(students, eq(lessonReports.studentId, students.id))
      .innerJoin(teachers, eq(lessonReports.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .innerJoin(classInstances, eq(lessonReports.classInstanceId, classInstances.id))
      .leftJoin(classSubjects, eq(classInstances.subjectId, classSubjects.id))
      .leftJoin(recurringSchedules, eq(classInstances.recurringScheduleId, recurringSchedules.id))
      .where(eq(lessonReports.classInstanceId, classInstanceId))
      .limit(1);
    return row ? mapReportWithNames(row) : null;
  }

  export async function findById(reportId: string, tx?: DBTransaction): Promise<LessonReportWithNames | null> {
    const queryDb = tx ?? db;
    const [row] = await queryDb
      .select(reportSelectFields)
      .from(lessonReports)
      .innerJoin(students, eq(lessonReports.studentId, students.id))
      .innerJoin(teachers, eq(lessonReports.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .innerJoin(classInstances, eq(lessonReports.classInstanceId, classInstances.id))
      .leftJoin(classSubjects, eq(classInstances.subjectId, classSubjects.id))
      .leftJoin(recurringSchedules, eq(classInstances.recurringScheduleId, recurringSchedules.id))
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
      .select(reportSelectFields)
      .from(lessonReports)
      .innerJoin(students, eq(lessonReports.studentId, students.id))
      .innerJoin(teachers, eq(lessonReports.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .innerJoin(classInstances, eq(lessonReports.classInstanceId, classInstances.id))
      .leftJoin(classSubjects, eq(classInstances.subjectId, classSubjects.id))
      .leftJoin(recurringSchedules, eq(classInstances.recurringScheduleId, recurringSchedules.id))
      .where(and(...conditions))
      .orderBy(lessonReports.submittedAt)
      .limit(paginationArgs.perPage)
      .offset(paginationArgs.offset);
    return rows.map(mapReportWithNames);
  }

  export async function findRecentApproved(limit: number, tx?: DBTransaction): Promise<LessonReportWithNames[]> {
    const queryDb = tx ?? db;
    const rows = await queryDb
      .select(reportSelectFields)
      .from(lessonReports)
      .innerJoin(students, eq(lessonReports.studentId, students.id))
      .innerJoin(teachers, eq(lessonReports.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .innerJoin(classInstances, eq(lessonReports.classInstanceId, classInstances.id))
      .leftJoin(classSubjects, eq(classInstances.subjectId, classSubjects.id))
      .leftJoin(recurringSchedules, eq(classInstances.recurringScheduleId, recurringSchedules.id))
      .where(eq(lessonReports.status, LessonReportStatus.APPROVED))
      .orderBy(desc(lessonReports.reviewedAt))
      .limit(limit);
    return rows.map(mapReportWithNames);
  }

  /** Student portal: lesson reports for a single student (newest lesson first). */
  export async function findForStudent(
    studentId: string,
    paginationArgs: PaginationArgs,
    tx?: DBTransaction
  ): Promise<LessonReportWithNames[]> {
    const queryDb = tx ?? db;
    const rows = await queryDb
      .select(reportSelectFields)
      .from(lessonReports)
      .innerJoin(students, eq(lessonReports.studentId, students.id))
      .innerJoin(teachers, eq(lessonReports.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .innerJoin(classInstances, eq(lessonReports.classInstanceId, classInstances.id))
      .leftJoin(classSubjects, eq(classInstances.subjectId, classSubjects.id))
      .leftJoin(recurringSchedules, eq(classInstances.recurringScheduleId, recurringSchedules.id))
      .where(eq(lessonReports.studentId, studentId))
      .orderBy(desc(lessonReports.lessonDate))
      .limit(paginationArgs.perPage)
      .offset(paginationArgs.offset);
    return rows.map(mapReportWithNames);
  }

  export async function countForStudent(studentId: string, tx?: DBTransaction): Promise<number> {
    const queryDb = tx ?? db;
    const [result] = await queryDb
      .select({ value: count() })
      .from(lessonReports)
      .where(eq(lessonReports.studentId, studentId));
    return Number(result?.value ?? 0);
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

  /** Seed/bootstrap helper: re-attribute reviewer without changing status. */
  export async function updateReviewedBy(
    reportId: string,
    reviewedByUserId: string,
    reviewedAt: Date | null,
    tx?: DBTransaction
  ): Promise<LessonReportSelectType> {
    const queryDb = tx ?? db;
    const [row] = await queryDb
      .update(lessonReports)
      .set({
        reviewedByUserId,
        reviewedAt,
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
