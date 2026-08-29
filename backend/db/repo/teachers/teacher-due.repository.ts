import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import { classInstances, students, teacherDues, teachers, users } from "@/backend/db/schema";
import { TeacherDueStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import type {
  DBTransaction,
  TeacherDueInsertType,
  TeacherDueReturnType,
  TeacherDueSelectType,
  TeacherMonthlyReportReturnType,
  TeacherPendingDuesSummaryReturnType,
} from "@/backend/types";
import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { getServerTranslations } from "@/shared/locale/server-graphql";

export namespace TeacherDueRepository {
  export async function create(
    input: TeacherDueInsertType,
    tx?: DBTransaction,
    locale?: string
  ): Promise<TeacherDueSelectType> {
    const executor = tx ?? db;
    const [row] = await executor.insert(teacherDues).values(input).returning();
    if (!row) {
      const i18n = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(i18n.teacherDue.insertFailed);
    }
    return row;
  }

  export async function findByClassInstanceId(
    classInstanceId: string,
    tx?: DBTransaction
  ): Promise<TeacherDueSelectType | null> {
    const q = queryDb(tx);
    const [row] = await q.select().from(teacherDues).where(eq(teacherDues.classInstanceId, classInstanceId)).limit(1);
    return row ?? null;
  }

  export async function findByTeacherAndPeriod(
    teacherId: string,
    startDate: Date,
    endDate: Date,
    tx?: DBTransaction
  ): Promise<TeacherDueSelectType[]> {
    const q = queryDb(tx);
    return q
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

  async function fetchTeacherIdentity(
    teacherId: string,
    executor: DBTransaction | typeof db
  ): Promise<{ teacherName: string; currency: CurrencyCode }> {
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
    return {
      teacherName: teacherRow?.teacherName ?? "",
      currency: teacherRow?.currency ?? CurrencyCode.SAR,
    };
  }

  async function fetchMonthlyClassAggregates(
    teacherId: string,
    startDate: Date,
    endDate: Date,
    executor: DBTransaction | typeof db
  ): Promise<{ lessonsTaught: number; cancelledCount: number }> {
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
    return {
      lessonsTaught: classAgg?.lessonsTaught ?? 0,
      cancelledCount: classAgg?.cancelledCount ?? 0,
    };
  }

  async function fetchMonthlyDueAggregates(
    teacherId: string,
    startDate: Date,
    endDate: Date,
    executor: DBTransaction | typeof db
  ): Promise<{
    approvedCount: number;
    totalAccruedHours: number;
    totalDueAmount: number;
    totalPaidAmount: number;
  }> {
    const [dueAgg] = await executor
      .select({
        approvedCount: sql<number>`count(*)`.mapWith(Number),
        totalAccruedHours: sql<number>`coalesce(sum(CAST(${teacherDues.hours} AS DECIMAL)), 0)`.mapWith(Number),
        totalDueAmount:
          sql<number>`coalesce(sum(CAST(${teacherDues.amount} AS DECIMAL)) filter (where ${teacherDues.status} = ${TeacherDueStatus.PENDING}), 0)`.mapWith(
            Number
          ),
        totalPaidAmount:
          sql<number>`coalesce(sum(CAST(${teacherDues.amount} AS DECIMAL)) filter (where ${teacherDues.status} = ${TeacherDueStatus.PAID}), 0)`.mapWith(
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
      approvedCount: dueAgg?.approvedCount ?? 0,
      totalAccruedHours: dueAgg?.totalAccruedHours ?? 0,
      totalDueAmount: dueAgg?.totalDueAmount ?? 0,
      totalPaidAmount: dueAgg?.totalPaidAmount ?? 0,
    };
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

    const { teacherName, currency } = await fetchTeacherIdentity(teacherId, executor);
    const { lessonsTaught, cancelledCount } = await fetchMonthlyClassAggregates(
      teacherId,
      startDate,
      endDate,
      executor
    );
    const { approvedCount, totalAccruedHours, totalDueAmount, totalPaidAmount } = await fetchMonthlyDueAggregates(
      teacherId,
      startDate,
      endDate,
      executor
    );

    return {
      teacherId,
      teacherName,
      year,
      month,
      lessonsTaught,
      approvedCount,
      cancelledCount,
      totalAccruedHours,
      totalDueAmount,
      totalPaidAmount,
      currency,
    };
  }

  /**
   * Marks a batch of dues as paid through one teacher payment. Only `PENDING`
   * dues transition: an already-settled due keeps its original payment link,
   * so re-submitting settled ids (a double submit) neither re-links them to
   * the newer payment nor returns them — the rows this call actually settled
   * are the ones returned.
   */
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
      .where(and(inArray(teacherDues.id, dueIds), eq(teacherDues.status, TeacherDueStatus.PENDING)))
      .returning();
    logger.info("Marked teacher dues as paid", { count: updated.length, teacherPaymentId });
    return updated;
  }

  export async function getPendingDues(
    teacherId: string | undefined,
    tx?: DBTransaction
  ): Promise<TeacherDueReturnType[]> {
    const q = queryDb(tx);
    const conditions = [eq(teacherDues.status, TeacherDueStatus.PENDING)];
    if (teacherId) {
      conditions.push(eq(teacherDues.teacherId, teacherId));
    }
    const rows = await q
      .select({
        id: teacherDues.id,
        teacherId: teacherDues.teacherId,
        classInstanceId: teacherDues.classInstanceId,
        studentId: teacherDues.studentId,
        hours: teacherDues.hours,
        amount: teacherDues.amount,
        currency: teacherDues.currency,
        rateSource: teacherDues.rateSource,
        status: teacherDues.status,
        approvedByUserId: teacherDues.approvedByUserId,
        approvedAt: teacherDues.approvedAt,
        teacherPaymentId: teacherDues.teacherPaymentId,
        createdAt: teacherDues.createdAt,
        updatedAt: teacherDues.updatedAt,
        teacherName: users.name,
        teacherUserId: users.id,
        teacherAvatarUrl: users.avatarUrl,
        studentName: students.name,
        studentAvatarUrl: students.avatarUrl,
        classDate: classInstances.scheduledStartAt,
      })
      .from(teacherDues)
      .innerJoin(teachers, eq(teacherDues.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .innerJoin(students, eq(teacherDues.studentId, students.id))
      .innerJoin(classInstances, eq(teacherDues.classInstanceId, classInstances.id))
      .where(and(...conditions))
      .orderBy(teacherDues.approvedAt);

    return rows.map(row =>
      Object.assign(row, {
        status: row.status,
        currency: row.currency,
      })
    );
  }

  export async function getPendingDuesSummary(tx?: DBTransaction): Promise<TeacherPendingDuesSummaryReturnType> {
    const q = queryDb(tx);
    const rows = await q
      .select({ amount: teacherDues.amount, currency: teacherDues.currency })
      .from(teacherDues)
      .where(eq(teacherDues.status, TeacherDueStatus.PENDING));
    const totalCount = rows.length;
    const totalAmount = rows.reduce((sum, row) => sum + Number.parseFloat(row.amount), 0);
    const currency: CurrencyCode = rows.length > 0 ? rows[0].currency : CurrencyCode.SAR;
    return { totalCount, totalAmount, currency };
  }
}
