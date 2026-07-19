import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { classInstances, students, teacherDues, teachers, users } from "@/backend/db/schema";
import { ClassExecutionState, ClassOutcome, CurrencyCode, TeacherDueStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import type {
  TeacherDueInsertType,
  TeacherDueReturnType,
  TeacherDueSelectType,
  TeacherMonthlyReportReturnType,
  TeacherPendingDuesSummaryReturnType,
} from "@/backend/types";

export namespace TeacherDueRepository {
  export async function create(input: TeacherDueInsertType, tx?: DBTransaction): Promise<TeacherDueSelectType> {
    const executor = tx ?? db;
    const [row] = await executor.insert(teacherDues).values(input).returning();
    if (!row) {
      throw new Error("Failed to insert teacher due row");
    }
    return row;
  }

  export async function findByClassInstanceId(
    classInstanceId: string,
    tx?: DBTransaction
  ): Promise<TeacherDueSelectType | null> {
    const executor = tx ?? db;
    const [row] = await executor
      .select()
      .from(teacherDues)
      .where(eq(teacherDues.classInstanceId, classInstanceId))
      .limit(1);
    return row ?? null;
  }

  export async function findByTeacherAndPeriod(
    teacherId: string,
    startDate: Date,
    endDate: Date,
    tx?: DBTransaction
  ): Promise<TeacherDueSelectType[]> {
    const executor = tx ?? db;
    return executor
      .select()
      .from(teacherDues)
      .where(
        and(
          eq(teacherDues.teacherId, teacherId),
          sql`${teacherDues.approvedAt} >= ${startDate}`,
          sql`${teacherDues.approvedAt} < ${endDate}`
        )
      )
      .orderBy(teacherDues.approvedAt);
  }

  export async function getMonthlyReport(
    teacherId: string,
    year: number,
    month: number,
    tx?: DBTransaction
  ): Promise<TeacherMonthlyReportReturnType> {
    const executor = tx ?? db;
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0));

    const [teacherRow] = await executor
      .select({
        teacherId: teachers.id,
        teacherName: users.name,
        currency: teachers.rateCurrency,
      })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(eq(teachers.id, teacherId))
      .limit(1);

    const teacherName = teacherRow?.teacherName ?? "";
    const currency: CurrencyCode = teacherRow?.currency ?? CurrencyCode.SAR;

    const [classAgg] = await executor
      .select({
        lessonsTaught:
          sql<number>`count(*) filter (where ${classInstances.executionState} = ${ClassExecutionState.COMPLETED})`.mapWith(
            Number
          ),
        cancelledCount: sql<number>`count(*) filter (where ${classInstances.outcome} = ${ClassOutcome.LEAVE})`.mapWith(
          Number
        ),
      })
      .from(classInstances)
      .where(
        and(
          eq(classInstances.teacherId, teacherId),
          sql`${classInstances.scheduledStartAt} >= ${startDate}`,
          sql`${classInstances.scheduledStartAt} < ${endDate}`,
          isNull(classInstances.deletedAt)
        )
      );

    const [dueAgg] = await executor
      .select({
        approvedCount: sql<number>`count(*)`.mapWith(Number),
        totalAccruedHours: sql<number>`coalesce(sum(${teacherDues.hours}), 0)`.mapWith(Number),
        totalDueAmount:
          sql<number>`coalesce(sum(${teacherDues.amount}) filter (where ${teacherDues.status} = ${TeacherDueStatus.PENDING}), 0)`.mapWith(
            Number
          ),
        totalPaidAmount:
          sql<number>`coalesce(sum(${teacherDues.amount}) filter (where ${teacherDues.status} = ${TeacherDueStatus.PAID}), 0)`.mapWith(
            Number
          ),
      })
      .from(teacherDues)
      .where(
        and(
          eq(teacherDues.teacherId, teacherId),
          sql`${teacherDues.approvedAt} >= ${startDate}`,
          sql`${teacherDues.approvedAt} < ${endDate}`
        )
      );

    return {
      teacherId,
      teacherName,
      year,
      month,
      lessonsTaught: classAgg?.lessonsTaught ?? 0,
      approvedCount: dueAgg?.approvedCount ?? 0,
      cancelledCount: classAgg?.cancelledCount ?? 0,
      totalAccruedHours: dueAgg?.totalAccruedHours ?? 0,
      totalDueAmount: dueAgg?.totalDueAmount ?? 0,
      totalPaidAmount: dueAgg?.totalPaidAmount ?? 0,
      currency,
    };
  }

  export async function markAsPaid(
    dueIds: string[],
    teacherPaymentId: string,
    tx?: DBTransaction
  ): Promise<TeacherDueSelectType[]> {
    if (dueIds.length === 0) return [];
    const executor = tx ?? db;
    const updated = await executor
      .update(teacherDues)
      .set({
        status: TeacherDueStatus.PAID,
        teacherPaymentId,
        updatedAt: new Date(),
      })
      .where(inArray(teacherDues.id, dueIds))
      .returning();
    logger.info("Marked teacher dues as paid", { count: dueIds.length, teacherPaymentId });
    return updated;
  }

  export async function getPendingDues(
    teacherId: string | undefined,
    tx?: DBTransaction
  ): Promise<TeacherDueReturnType[]> {
    const executor = tx ?? db;
    const conditions = [eq(teacherDues.status, TeacherDueStatus.PENDING)];
    if (teacherId) {
      conditions.push(eq(teacherDues.teacherId, teacherId));
    }
    const rows = await executor
      .select({
        id: teacherDues.id,
        teacherId: teacherDues.teacherId,
        classInstanceId: teacherDues.classInstanceId,
        studentId: teacherDues.studentId,
        hours: teacherDues.hours,
        amount: teacherDues.amount,
        currency: teacherDues.currency,
        status: teacherDues.status,
        approvedByUserId: teacherDues.approvedByUserId,
        approvedAt: teacherDues.approvedAt,
        teacherPaymentId: teacherDues.teacherPaymentId,
        createdAt: teacherDues.createdAt,
        updatedAt: teacherDues.updatedAt,
        teacherName: users.name,
        studentName: students.name,
        classDate: classInstances.scheduledStartAt,
      })
      .from(teacherDues)
      .innerJoin(teachers, eq(teacherDues.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .innerJoin(students, eq(teacherDues.studentId, students.id))
      .innerJoin(classInstances, eq(teacherDues.classInstanceId, classInstances.id))
      .where(and(...conditions))
      .orderBy(teacherDues.approvedAt);

    return rows.map(row => ({
      ...row,
      status: row.status as TeacherDueStatus,
      currency: row.currency as CurrencyCode,
    }));
  }

  export async function getPendingDuesSummary(tx?: DBTransaction): Promise<TeacherPendingDuesSummaryReturnType> {
    const executor = tx ?? db;
    const rows = await executor
      .select({ amount: teacherDues.amount, currency: teacherDues.currency })
      .from(teacherDues)
      .where(eq(teacherDues.status, TeacherDueStatus.PENDING));
    const totalCount = rows.length;
    const totalAmount = rows.reduce((sum, row) => sum + Number.parseFloat(row.amount), 0);
    const currency: CurrencyCode = rows.length > 0 ? (rows[0].currency as CurrencyCode) : CurrencyCode.SAR;
    return { totalCount, totalAmount, currency };
  }
}
