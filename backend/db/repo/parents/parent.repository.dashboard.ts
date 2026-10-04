import { and, count, eq, gte, inArray, isNull, lt, or, type SQL, sql } from "drizzle-orm";
import { caseInsensitiveLike, db, queryWithPagination } from "@/backend/db";
import {
  classInstancePerformance,
  classInstances,
  invoices,
  notificationDeliveries,
  parents,
  students,
  teachers,
  users,
} from "@/backend/db/schema";
import { BookingStatus } from "@/backend/enum";
import type {
  DBTransaction,
  PaginationArgs,
  ParentDashboardMetricsType,
  ParentDashboardScheduleRow,
} from "@/backend/types";
import { escapeLikeWildcards, PaginationUtils } from "@/backend/utils";
import { ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import { parseClassExecutionState, parseClassOutcome } from "@/shared/lib/enum";

type ParentDashboardScheduleResult = {
  rows: ParentDashboardScheduleRow[];
  totalCount: number;
  pageInfo: import("@/backend/types").PageInfo | null;
};

async function fetchParentTimezone(t: DBTransaction, parentId: string): Promise<string> {
  const parentRow = await t
    .select({ timezone: users.timezone })
    .from(parents)
    .innerJoin(users, eq(parents.userId, users.id))
    .where(eq(parents.id, parentId))
    .limit(1);
  return parentRow[0]?.timezone ?? "UTC";
}

async function buildScheduleConditions(
  input: { date?: Date | null; search?: string | null },
  studentIds: string[],
  timezone: string
): Promise<SQL | undefined> {
  const conditions: (SQL | undefined)[] = [
    isNull(classInstances.deletedAt),
    inArray(classInstances.studentId, studentIds),
  ];

  if (input.date) {
    const { getDayBoundaries } = await import("@/backend/lib/timezone");
    const { startOfDayUtc, endOfDayUtc } = getDayBoundaries(input.date, timezone);
    conditions.push(
      gte(classInstances.scheduledStartAt, startOfDayUtc),
      lt(classInstances.scheduledStartAt, endOfDayUtc)
    );
  }

  if (input.search) {
    const searchPattern = `%${escapeLikeWildcards(input.search)}%`;
    const searchCondition = or(
      caseInsensitiveLike(students.name, searchPattern),
      caseInsensitiveLike(users.name, searchPattern)
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  return and(...conditions);
}

function buildScheduleDataQuery(t: DBTransaction) {
  return t
    .select({
      id: classInstances.id,
      studentId: classInstances.studentId,
      studentName: students.name,
      studentAvatarUrl: students.avatarUrl,
      teacherId: classInstances.teacherId,
      teacherName: sql<string>`COALESCE(${users.name}, '')`,
      teacherAvatarUrl: users.avatarUrl,
      scheduledStartAt: classInstances.scheduledStartAt,
      scheduledEndAt: classInstances.scheduledEndAt,
      durationMinutes: classInstances.durationMinutes,
      isRescheduled: classInstances.isRescheduled,
      executionState: classInstances.executionState,
      outcome: classInstances.outcome,
      meetingJoinUrl: classInstances.meetingJoinUrl,
      isFrozen: classInstances.isFrozen,
    })
    .from(classInstances)
    .innerJoin(students, eq(classInstances.studentId, students.id))
    .leftJoin(teachers, eq(classInstances.teacherId, teachers.id))
    .leftJoin(users, eq(teachers.userId, users.id));
}

async function fetchScheduleCount(t: DBTransaction, whereClause: SQL | undefined): Promise<number> {
  const [countRow] = await t
    .select({ count: count() })
    .from(classInstances)
    .innerJoin(students, eq(classInstances.studentId, students.id))
    .leftJoin(teachers, eq(classInstances.teacherId, teachers.id))
    .leftJoin(users, eq(teachers.userId, users.id))
    .where(whereClause);
  return countRow?.count ?? 0;
}

async function mapScheduleRows(
  queryRows: Awaited<ReturnType<ReturnType<typeof buildScheduleDataQuery>["execute"]>>,
  viewerTimezone: string,
  locale?: string
): Promise<ParentDashboardScheduleRow[]> {
  const { formatInstantInTimezone } = await import("@/backend/lib/timezone");

  return queryRows.map(r => {
    const studentName = r.studentName ?? "";
    const initials = studentName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w: string) => w[0]?.toUpperCase() ?? "")
      .join("");

    return {
      id: r.id,
      studentId: r.studentId,
      studentName,
      studentInitials: initials,
      studentAvatarUrl: r.studentAvatarUrl ?? null,
      teacherId: r.teacherId,
      teacherName: r.teacherName ?? "",
      teacherAvatarUrl: r.teacherAvatarUrl ?? null,
      scheduledStartAt: r.scheduledStartAt,
      scheduledEndAt: r.scheduledEndAt,
      durationMinutes: r.durationMinutes,
      bookingStatus: r.isRescheduled ? BookingStatus.RESCHEDULED : BookingStatus.CONFIRMED,
      executionState: parseClassExecutionState(r.executionState),
      outcome: parseClassOutcome(r.outcome) ?? ClassOutcome.PENDING,
      meetingJoinUrl: r.meetingJoinUrl ?? null,
      isFrozen: r.isFrozen ?? false,
      classTimeFormatted: formatInstantInTimezone(r.scheduledStartAt, viewerTimezone, locale),
    };
  });
}

export const getParentDashboardScheduleImpl = async (
  parentId: string,
  input: { date?: Date | null; search?: string | null; pagination?: PaginationArgs | null; locale?: string },
  tx?: DBTransaction
): Promise<ParentDashboardScheduleResult> => {
  const runner = async (t: DBTransaction): Promise<ParentDashboardScheduleResult> => {
    const parentStudents = await t.select({ id: students.id }).from(students).where(eq(students.parentId, parentId));
    const studentIds = parentStudents.map(s => s.id);

    if (studentIds.length === 0) {
      const pageInfo = PaginationUtils.buildPageInfoFromArgs(input.pagination, 0, 0);
      return { rows: [], totalCount: 0, pageInfo };
    }

    const timezoneForFormatting = await fetchParentTimezone(t, parentId);
    const viewerTimezone = input.date ? timezoneForFormatting : "UTC";
    const whereClause = await buildScheduleConditions(input, studentIds, viewerTimezone);

    let dataQuery = buildScheduleDataQuery(t).where(whereClause).orderBy(classInstances.scheduledStartAt).$dynamic();

    if (input.pagination) {
      dataQuery = queryWithPagination(dataQuery, input.pagination);
    }

    const [queryRows, totalCount] = await Promise.all([dataQuery, fetchScheduleCount(t, whereClause)]);

    const mappedRows = await mapScheduleRows(queryRows, timezoneForFormatting, input.locale);
    const pageInfo = PaginationUtils.buildPageInfoFromArgs(input.pagination, mappedRows.length, totalCount);

    return { rows: mappedRows, totalCount, pageInfo };
  };

  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};

async function fetchTodaysClassCount(executor: typeof db | DBTransaction, studentIds: string[]): Promise<number> {
  if (studentIds.length === 0) return 0;

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const [classCountRow] = await executor
    .select({ count: count() })
    .from(classInstances)
    .where(
      and(
        inArray(classInstances.studentId, studentIds),
        isNull(classInstances.deletedAt),
        gte(classInstances.scheduledStartAt, todayStart),
        lt(classInstances.scheduledStartAt, todayEnd)
      )
    );
  return classCountRow?.count ?? 0;
}

async function fetchPendingInvoiceSummary(
  executor: typeof db | DBTransaction,
  parentId: string
): Promise<{ count: number; totalAmount: string }> {
  const [invoiceRow] = await executor
    .select({
      count: count(),
      totalAmount: sql<string>`COALESCE(SUM(${invoices.amount}), '0')`,
    })
    .from(invoices)
    .where(and(eq(invoices.parentId, parentId), eq(invoices.status, "UNPAID"), isNull(invoices.deletedAt)));

  return {
    count: invoiceRow?.count ?? 0,
    totalAmount: invoiceRow?.totalAmount ?? "0",
  };
}

async function fetchUnreadMessageCount(executor: typeof db | DBTransaction, parentId: string): Promise<number> {
  const [unreadRow] = await executor
    .select({ count: count() })
    .from(notificationDeliveries)
    .innerJoin(users, eq(notificationDeliveries.userId, users.id))
    .innerJoin(parents, eq(parents.userId, users.id))
    .where(
      and(
        eq(parents.id, parentId),
        eq(notificationDeliveries.status, "DELIVERED"),
        sql`${notificationDeliveries.openedAt} IS NULL`
      )
    );
  return unreadRow?.count ?? 0;
}

async function fetchPerformanceAvg(executor: typeof db | DBTransaction, studentIds: string[]): Promise<number> {
  if (studentIds.length === 0) return 0;

  const [avgRow] = await executor
    .select({
      avgScore: sql<number>`COALESCE(AVG(${classInstancePerformance.engagementScore}), 0)`.mapWith(Number),
    })
    .from(classInstancePerformance)
    .innerJoin(classInstances, eq(classInstancePerformance.classInstanceId, classInstances.id))
    .where(
      and(
        inArray(classInstances.studentId, studentIds),
        isNull(classInstances.deletedAt),
        sql`${classInstancePerformance.engagementScore} IS NOT NULL`
      )
    );
  return avgRow?.avgScore ?? 0;
}

export const getParentDashboardMetricsImpl = async (
  parentId: string,
  tx?: DBTransaction
): Promise<ParentDashboardMetricsType> => {
  const executor = tx ?? db;

  const parentStudents = await executor
    .select({ id: students.id })
    .from(students)
    .where(eq(students.parentId, parentId));
  const studentIds = parentStudents.map(s => s.id);
  const totalStudents = parentStudents.length;

  const [todaysClasses, invoiceSummary, pendingMessages, avgScore] = await Promise.all([
    fetchTodaysClassCount(executor, studentIds),
    fetchPendingInvoiceSummary(executor, parentId),
    fetchUnreadMessageCount(executor, parentId),
    fetchPerformanceAvg(executor, studentIds),
  ]);

  return {
    id: `parent-metrics-${parentId}`,
    totalStudents,
    todaysClasses,
    pendingInvoicesCount: invoiceSummary.count,
    pendingInvoicesAmount: invoiceSummary.totalAmount,
    performanceAvg: Math.round(avgScore),
    performanceAvgMobile: Math.round(avgScore / 10),
    pendingMessages,
  };
};
