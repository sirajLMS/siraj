import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { ParentRepository } from "@/backend/db/repo/parents/parent.repository";
import { classInstances, creditTransactions, lessonReports, students } from "@/backend/db/schema";
import { AppPermission, AttendanceEvaluation, CreditReason } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { StudentHeader, StudentMonthlyReportReturnType } from "@/backend/types";
import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import { getServerTranslations } from "@/shared/locale";

export namespace StudentMonthlyReportService {
  function throwStudentNotFound(studentId: string, locale?: string): never {
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(tErrors.studentNotFound(studentId));
  }

  async function assertCanViewMonthlyReport(actorUserId: string, studentId: string, locale?: string): Promise<void> {
    const hasMonthlyPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.MONTHLY_REPORTS_VIEW
    );
    if (hasMonthlyPermission) return;

    const [studentRow] = await db
      .select({
        id: students.id,
        userId: students.userId,
        parentId: students.parentId,
      })
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!studentRow) {
      throwStudentNotFound(studentId, locale);
    }

    // Self: student viewing own report
    if (studentRow.userId === actorUserId) return;

    // Parent: parent viewing child's report
    if (studentRow.parentId) {
      const parent = await ParentRepository.findByUserId(actorUserId);
      if (parent?.id === studentRow.parentId) return;
    }

    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(tErrors.unauthorizedAction);
  }

  async function loadStudentHeader(studentId: string, locale?: string): Promise<StudentHeader> {
    const [studentRow] = await db
      .select({
        studentId: students.id,
        studentName: students.name,
        classesRemaining: students.classesRemaining,
      })
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!studentRow) {
      throwStudentNotFound(studentId, locale);
    }

    return {
      studentId,
      studentName: studentRow.studentName ?? "",
      classesRemaining: studentRow.classesRemaining,
    };
  }

  async function aggregateClassInstances(studentId: string, startDate: Date, endDate: Date) {
    const [classAgg] = await db
      .select({
        totalLessons: sql<number>`count(*)`.mapWith(Number),
        completedLessons:
          sql<number>`count(*) filter (where ${classInstances.executionState} = ${ClassExecutionState.COMPLETED})`.mapWith(
            Number
          ),
        cancelledLessons:
          sql<number>`count(*) filter (where ${classInstances.outcome} = ${ClassOutcome.LEAVE})`.mapWith(Number),
        totalMinutes:
          sql<number>`coalesce(sum(${classInstances.durationMinutes}) filter (where ${classInstances.executionState} = ${ClassExecutionState.COMPLETED}), 0)`.mapWith(
            Number
          ),
      })
      .from(classInstances)
      .where(
        and(
          eq(classInstances.studentId, studentId),
          sql`${classInstances.scheduledStartAt} >= ${startDate}`,
          sql`${classInstances.scheduledStartAt} < ${endDate}`,
          isNull(classInstances.deletedAt)
        )
      );
    return classAgg;
  }

  async function aggregateLessonReports(studentId: string, startDate: Date, endDate: Date) {
    const [lessonReportAgg] = await db
      .select({
        presentCount:
          sql<number>`coalesce(count(*) filter (where ${lessonReports.attendanceEvaluation} = ${AttendanceEvaluation.PRESENT}), 0)`.mapWith(
            Number
          ),
        absentCount:
          sql<number>`coalesce(count(*) filter (where ${lessonReports.attendanceEvaluation} = ${AttendanceEvaluation.ABSENT}), 0)`.mapWith(
            Number
          ),
        lateCount:
          sql<number>`coalesce(count(*) filter (where ${lessonReports.attendanceEvaluation} = ${AttendanceEvaluation.LATE}), 0)`.mapWith(
            Number
          ),
      })
      .from(lessonReports)
      .innerJoin(classInstances, eq(lessonReports.classInstanceId, classInstances.id))
      .where(
        and(
          eq(lessonReports.studentId, studentId),
          sql`${classInstances.scheduledStartAt} >= ${startDate}`,
          sql`${classInstances.scheduledStartAt} < ${endDate}`,
          isNull(classInstances.deletedAt)
        )
      );
    return lessonReportAgg;
  }

  async function aggregateCreditTransactions(studentId: string, startDate: Date, endDate: Date) {
    const [creditAgg] = await db
      .select({
        creditsPurchased:
          sql<number>`coalesce(sum(${creditTransactions.changeAmount}) filter (where ${creditTransactions.reason} = ${CreditReason.PURCHASE}), 0)`.mapWith(
            Number
          ),
        creditsDeducted:
          sql<number>`coalesce(sum(${creditTransactions.changeAmount}) filter (where ${creditTransactions.reason} = ${CreditReason.DEDUCTION}), 0)`.mapWith(
            Number
          ),
        creditsRefunded:
          sql<number>`coalesce(sum(${creditTransactions.changeAmount}) filter (where ${creditTransactions.reason} = ${CreditReason.REFUND}), 0)`.mapWith(
            Number
          ),
      })
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.studentId, studentId),
          sql`${creditTransactions.createdAt} >= ${startDate}`,
          sql`${creditTransactions.createdAt} < ${endDate}`
        )
      );
    return creditAgg;
  }

  function buildReport(
    header: StudentHeader,
    year: number,
    month: number,
    classAgg: Awaited<ReturnType<typeof aggregateClassInstances>>,
    lessonReportAgg: Awaited<ReturnType<typeof aggregateLessonReports>>,
    creditAgg: Awaited<ReturnType<typeof aggregateCreditTransactions>>
  ): StudentMonthlyReportReturnType {
    const totalHours = +((classAgg?.totalMinutes ?? 0) / 60).toFixed(2);

    return {
      studentId: header.studentId,
      studentName: header.studentName,
      year,
      month,
      totalLessons: classAgg?.totalLessons ?? 0,
      completedLessons: classAgg?.completedLessons ?? 0,
      cancelledLessons: classAgg?.cancelledLessons ?? 0,
      presentCount: lessonReportAgg?.presentCount ?? 0,
      absentCount: lessonReportAgg?.absentCount ?? 0,
      lateCount: lessonReportAgg?.lateCount ?? 0,
      totalHours,
      creditsPurchased: creditAgg?.creditsPurchased ?? 0,
      creditsDeducted: creditAgg?.creditsDeducted ?? 0,
      creditsRefunded: creditAgg?.creditsRefunded ?? 0,
      creditsBalance: header.classesRemaining,
    };
  }

  export async function getMonthlyReport(
    actorUserId: string,
    studentId: string,
    year: number,
    month: number,
    locale?: string
  ): Promise<StudentMonthlyReportReturnType> {
    logger.info("StudentMonthlyReportService.getMonthlyReport", { actorUserId, studentId, year, month });
    await assertCanViewMonthlyReport(actorUserId, studentId, locale);

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0));

    const header = await loadStudentHeader(studentId, locale);
    const classAgg = await aggregateClassInstances(studentId, startDate, endDate);
    const lessonReportAgg = await aggregateLessonReports(studentId, startDate, endDate);
    const creditAgg = await aggregateCreditTransactions(studentId, startDate, endDate);

    return buildReport(header, year, month, classAgg, lessonReportAgg, creditAgg);
  }
}
