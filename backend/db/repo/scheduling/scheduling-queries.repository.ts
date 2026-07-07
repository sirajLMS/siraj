import { and, eq, gte, ilike, inArray, isNull, lt, ne, or, type SQL, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { queryWithPagination } from "@/backend/db/query.extensions";
import {
  classInstances,
  classStatusEvents,
  classSubjects,
  leaveQuotaUsage,
  leaveRequests,
  students,
  teachers,
  users,
} from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import type * as Types from "@/backend/types";
import { LeaveRequestStatus, RescheduleDateLabel } from "@/shared/lib/enum";
import {
  computeDailyScheduleMetricsFromRows,
  type DailyScheduleMetricsCounts,
  matchesDashboardMetricFilter,
} from "@/shared/lib/schedule-instance-dashboard-status";

export type DailyScheduleMetricFilter =
  | "total"
  | "regular"
  | "trial"
  | "advance"
  | "rescheduled"
  | "suspended"
  | "taken"
  | "pending"
  | "activated"
  | "running"
  | "absent"
  | "leave";

export type DailyScheduleResult = Types.ClassInstanceDetailReturnType & {
  student?: Types.StudentEntity;
  teacher?: Types.TeacherEntity & { user: Types.UserReturnType };
  yourTimeFormatted?: string;
};

export type AdminDashboardScheduleInput = {
  date: Date;
  teacherId?: string;
  search?: string;
  viewerTimezone: string;
  metricFilter?: string;
  pagination?: Types.PaginationArgs | null;
  locale?: string;
};

export type AdminDashboardScheduleResult = {
  metrics: DailyScheduleMetricsCounts;
  rows: DailyScheduleResult[];
  totalCount: number;
  pageInfo: Types.PageInfo | null;
};

function buildDailyScheduleDayConditions(
  date: Date,
  viewerTimezone: string,
  teacherId: string | undefined,
  getDayBoundaries: typeof import("@/backend/lib/timezone").getDayBoundaries
) {
  const { startOfDayUtc, endOfDayUtc } = getDayBoundaries(date, viewerTimezone);

  return and(
    isNull(classInstances.deletedAt),
    gte(classInstances.scheduledStartAt, startOfDayUtc),
    lt(classInstances.scheduledStartAt, endOfDayUtc),
    teacherId ? eq(classInstances.teacherId, teacherId) : undefined
  );
}

async function hydrateDailyScheduleRows(
  t: DBTransaction,
  instances: (typeof classInstances.$inferSelect)[]
): Promise<DailyScheduleResult[]> {
  const studentIds = Array.from(new Set(instances.map(instance => instance.studentId)));
  const teacherIds = Array.from(new Set(instances.map(instance => instance.teacherId)));

  const studentsData =
    studentIds.length > 0 ? await t.select().from(students).where(inArray(students.id, studentIds)) : [];
  const teachersData =
    teacherIds.length > 0
      ? await t
          .select({ teacher: teachers, user: users })
          .from(teachers)
          .innerJoin(users, eq(teachers.userId, users.id))
          .where(inArray(teachers.id, teacherIds))
      : [];

  const studentMap = new Map(studentsData.map(student => [student.id, student]));
  const teacherMap = new Map(
    teachersData.map(teacherRow => [teacherRow.teacher.id, { ...teacherRow.teacher, user: teacherRow.user }])
  );

  return instances.map(instance => {
    const student = studentMap.get(instance.studentId);
    const teacher = teacherMap.get(instance.teacherId);

    return {
      ...instance,
      courseName: null, // No direct mapping from DB
      instanceId: instance.id,
      scheduledDate: instance.scheduledStartAt.toISOString().split("T")[0],
      startTime: instance.scheduledStartAt.toISOString(),
      endTime: instance.scheduledEndAt.toISOString(),
      durationMinutes: Math.round(
        (instance.scheduledEndAt.getTime() - instance.scheduledStartAt.getTime()) / (1000 * 60)
      ),
      classType: instance.classType as Types.ClassType | null,
      status: instance.executionState as Types.ClassExecutionState | null,
      outcome: instance.outcome as Types.ClassOutcome | null,
      executionState: instance.executionState as Types.ClassExecutionState | null,
      rescheduleDateLabel: instance.rescheduleDateLabel as Types.RescheduleDateLabel | null,
      student: student
        ? {
            id: student.id,
            name: student.name,
            grade: null, // No direct mapping
            level: null, // No direct mapping
            avatarUrl: student.avatarUrl,
          }
        : undefined,
      teacher: teacher
        ? {
            ...teacher,
            user: teacher.user,
          }
        : undefined,
      yourTimeFormatted: instance.yourTimeFormatted,
    };
  });
}

async function fetchDailyScheduleBaseRows(
  t: DBTransaction,
  date: Date,
  viewerTimezone: string,
  teacherId?: string,
  search?: string
): Promise<DailyScheduleResult[]> {
  const { getDayBoundaries } = await import("@/backend/lib/timezone");
  const dayConditions = buildDailyScheduleDayConditions(date, viewerTimezone, teacherId, getDayBoundaries);

  if (search) {
    const searchPattern = `%${search}%`;
    const matchedRows = await t
      .select({ classInstance: classInstances })
      .from(classInstances)
      .innerJoin(students, eq(classInstances.studentId, students.id))
      .innerJoin(teachers, eq(classInstances.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(
        and(
          dayConditions,
          or(
            ilike(students.name, searchPattern),
            ilike(users.name, searchPattern),
            ilike(sql`${classInstances.id}::text`, searchPattern)
          )
        )
      )
      .limit(500);

    return hydrateDailyScheduleRows(
      t,
      matchedRows.map(row => row.classInstance)
    );
  }

  // NOTE: Pagination and metric filtering are intentionally handled in JS for now.
  // The bounded LIMIT(500) keeps this safe for current scale. SQL-level pushdown
  // is planned when row counts exceed the comfortable in-memory threshold.
  const rows = await t.select({ classInstance: classInstances }).from(classInstances).where(dayConditions).limit(500);

  return hydrateDailyScheduleRows(
    t,
    rows.map(row => row.classInstance)
  ) as unknown as DailyScheduleResult[];
}

async function applyViewerTimezoneFormatting(
  rows: DailyScheduleResult[],
  viewerTimezone: string,
  locale?: string
): Promise<DailyScheduleResult[]> {
  const { formatInstantInTimezone } = await import("@/backend/lib/timezone");

  return rows.map(row => ({
    ...row,
    yourTimeFormatted: formatInstantInTimezone(row.scheduledStartAt, viewerTimezone, locale),
  }));
}

export const findExpiredPendingInstances = async (
  graceMinutes: number,
  limit: number,
  now: Date,
  tx?: DBTransaction
): Promise<Types.ClassInstanceEntity[]> => {
  const queryDb = tx ?? db;
  const missedDeadline = new Date(now.getTime() - graceMinutes * 60_000);

  return queryDb
    .select()
    .from(classInstances)
    .where(
      and(
        isNull(classInstances.deletedAt),
        eq(classInstances.executionState, "NOT_ACTIVATED"),
        eq(classInstances.outcome, "PENDING"),
        lt(classInstances.scheduledEndAt, missedDeadline)
      )
    )
    .limit(limit);
};

export const getAdminDashboardSchedule = async (
  input: AdminDashboardScheduleInput,
  tx?: DBTransaction
): Promise<AdminDashboardScheduleResult> => {
  if (!tx) {
    const { ClassInstanceExpiryService } = await import("@/backend/services/session/class-instance-expiry.service");
    await ClassInstanceExpiryService.processExpiredInstances({ locale: input.locale });
  }

  const runner = async (t: DBTransaction): Promise<AdminDashboardScheduleResult> => {
    const { SystemSettingsRepository } = await import("@/backend/db/repo/system-settings.repository");
    const { DEFAULT_MISSED_GRACE_MINUTES } = await import("@/shared/lib/schedule-instance-dashboard-status");
    const missedGraceMinutes = await SystemSettingsRepository.getIntValue(
      "session_missed_grace_minutes",
      DEFAULT_MISSED_GRACE_MINUTES,
      t
    );

    const baseRows = await fetchDailyScheduleBaseRows(
      t,
      input.date,
      input.viewerTimezone,
      input.teacherId,
      input.search
    );

    const metricsOptions = { missedGraceMinutes };
    const metrics = computeDailyScheduleMetricsFromRows(baseRows, metricsOptions);

    const filteredRows = input.metricFilter
      ? baseRows.filter(row => matchesDashboardMetricFilter(row, input.metricFilter, metricsOptions))
      : baseRows;

    const totalCount = filteredRows.length;

    const paginatedRows = input.pagination
      ? filteredRows.slice(input.pagination.offset, input.pagination.offset + input.pagination.perPage)
      : filteredRows;

    const pageInfo = input.pagination
      ? {
          count: paginatedRows.length,
          currentPage: input.pagination.currentPage,
          firstItem: paginatedRows.length > 0 ? input.pagination.offset + 1 : null,
          hasMorePages: input.pagination.offset + input.pagination.perPage < totalCount,
          lastItem: paginatedRows.length > 0 ? input.pagination.offset + paginatedRows.length : null,
          lastPage: Math.max(1, Math.ceil(totalCount / input.pagination.perPage)),
          perPage: input.pagination.perPage,
          total: totalCount,
        }
      : null;

    return {
      metrics,
      rows: await applyViewerTimezoneFormatting(paginatedRows, input.viewerTimezone, input.locale),
      totalCount,
      pageInfo,
    };
  };

  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};

export const getDailyMetrics = async (date: Date, teacherId?: string, tx?: DBTransaction, viewerTimezone = "UTC") => {
  const { metrics } = await getAdminDashboardSchedule({ date, teacherId, viewerTimezone }, tx);
  return metrics;
};

export const getDailySchedule = async (
  date: Date,
  options?: string | { teacherId?: string; search?: string; viewerTimezone?: string; metricFilter?: string },
  tx?: DBTransaction
): Promise<DailyScheduleResult[]> => {
  const teacherId = typeof options === "string" ? options : options?.teacherId;
  const search = typeof options === "object" ? options?.search : undefined;
  const viewerTimezone = typeof options === "object" ? options?.viewerTimezone : undefined;
  const metricFilter = typeof options === "object" ? options?.metricFilter : undefined;

  const { rows } = await getAdminDashboardSchedule(
    {
      date,
      teacherId,
      search,
      viewerTimezone: viewerTimezone || "UTC",
      metricFilter,
    },
    tx
  );

  return rows;
};

export const getClassStatusEvents = async (classInstanceId: string, tx?: DBTransaction) => {
  const queryDb = tx ?? db;
  return queryDb
    .select()
    .from(classStatusEvents)
    .where(eq(classStatusEvents.classInstanceId, classInstanceId))
    .orderBy(sql`${classStatusEvents.createdAt} DESC`);
};

export const getTeacherProgressFeed = async (
  teacherId: string,
  date: Date,
  viewerTimezone = "UTC",
  locale?: string,
  tx?: DBTransaction
): Promise<Types.TeacherProgressFeedItem[]> => {
  const queryDb = tx ?? db;
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const rows = await queryDb
    .select({
      id: classStatusEvents.id,
      actorUserId: classStatusEvents.actorUserId,
      fromState: classStatusEvents.fromState,
      toState: classStatusEvents.toState,
      createdAt: classStatusEvents.createdAt,
      studentId: classInstances.studentId,
      studentName: students.name,
      scheduledStartAt: classInstances.scheduledStartAt,
      durationMinutes: classInstances.durationMinutes,
    })
    .from(classStatusEvents)
    .innerJoin(classInstances, eq(classStatusEvents.classInstanceId, classInstances.id))
    .innerJoin(students, eq(classInstances.studentId, students.id))
    .where(
      and(
        eq(classInstances.teacherId, teacherId),
        sql`${classStatusEvents.createdAt} >= ${startOfDay}`,
        sql`${classStatusEvents.createdAt} <= ${endOfDay}`
      )
    )
    .orderBy(sql`${classStatusEvents.createdAt} DESC`)
    .limit(10);

  const { formatInstantInTimezone } = await import("@/backend/lib/timezone");

  return rows.map(row => ({
    id: row.id,
    studentId: row.studentId,
    studentName: row.studentName,
    scheduledTimeFormatted: formatInstantInTimezone(row.scheduledStartAt, viewerTimezone, locale),
    durationMinutes: row.durationMinutes,
    eventKind: resolveTeacherProgressFeedEventKind(row.fromState, row.toState, row.actorUserId),
    occurredAt: row.createdAt,
  }));
};

type ClassStatusEventState = {
  executionState?: string;
  outcome?: string;
};

function resolveTeacherProgressFeedEventKind(
  fromState: unknown,
  toState: unknown,
  actorUserId: string | null
): Types.TeacherProgressFeedEventKind {
  const from = (fromState ?? {}) as ClassStatusEventState;
  const to = (toState ?? {}) as ClassStatusEventState;

  if (to.executionState === "COMPLETED" && to.outcome === "ABSENT") {
    if (from.executionState === "NOT_ACTIVATED" && actorUserId === null) {
      return "auto_missed";
    }
    return "marked_absent";
  }
  if (to.executionState === "ACTIVATED") {
    return "activated";
  }
  if (to.executionState === "RUNNING") {
    return "started";
  }
  if (to.executionState === "COMPLETED" && to.outcome === "TAKEN") {
    return "completed";
  }
  if (to.executionState === "COMPLETED" && to.outcome === "LEAVE") {
    return "leave";
  }
  return "other";
}

function buildRescheduleConditions(
  input: Types.RescheduleTrackingInput,
  originalClass: ReturnType<typeof alias<typeof classInstances, "original_class">>
): SQL | undefined {
  const baseConditions = and(isNull(classInstances.deletedAt), sql`${classInstances.originalClassId} IS NOT NULL`);

  let conditions = baseConditions;

  if (input.status === LeaveRequestStatus.PENDING) {
    conditions = and(conditions, eq(originalClass.outcome, "LEAVE"));
  } else if (input.status === LeaveRequestStatus.RESCHEDULED) {
    conditions = and(conditions, ne(originalClass.outcome, "LEAVE"));
  }

  if (input.search) {
    const searchPattern = `%${input.search}%`;
    conditions = and(
      conditions,
      or(sql`${users.name} ILIKE ${searchPattern}`, sql`${students.name} ILIKE ${searchPattern}`)
    );
  }

  return conditions;
}

function buildRescheduleSelectQuery(
  t: DBTransaction,
  originalClass: ReturnType<typeof alias<typeof classInstances, "original_class">>
) {
  return t
    .select({
      id: classInstances.id,
      originalClassId: classInstances.originalClassId,
      teacherId: classInstances.teacherId,
      teacherName: users.name,
      teacherAvatarUrl: users.avatarUrl,
      studentId: classInstances.studentId,
      studentName: students.name,
      scheduledStartAt: classInstances.scheduledStartAt,
      scheduledEndAt: classInstances.scheduledEndAt,
      remarks: classInstances.remarks,
      originalOutcome: originalClass.outcome,
    })
    .from(classInstances)
    .leftJoin(originalClass, eq(classInstances.originalClassId, originalClass.id))
    .leftJoin(teachers, eq(classInstances.teacherId, teachers.id))
    .leftJoin(users, eq(teachers.userId, users.id))
    .leftJoin(students, eq(classInstances.studentId, students.id));
}

function mapRescheduleRow(row: {
  id: string;
  originalClassId: string | null;
  teacherId: string;
  teacherName: string | null;
  teacherAvatarUrl: string | null;
  studentId: string;
  studentName: string | null;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  remarks: string | null;
  originalOutcome: string | null;
}) {
  const isLeave = row.originalOutcome === "LEAVE";
  return {
    id: row.id,
    originalClassId: row.originalClassId,
    teacherId: row.teacherId,
    teacherName: row.teacherName ?? "",
    teacherAvatarUrl: row.teacherAvatarUrl,
    studentId: row.studentId,
    studentName: row.studentName ?? "",
    scheduledStartAt: row.scheduledStartAt,
    scheduledEndAt: row.scheduledEndAt,
    status: isLeave ? LeaveRequestStatus.PENDING : LeaveRequestStatus.RESCHEDULED,
    dateLabel: isLeave ? RescheduleDateLabel.LEAVE_REQUEST : RescheduleDateLabel.NEW_DATE,
    remarks: row.remarks,
  };
}

export const getRescheduleTrackingRows = async (
  input: Types.RescheduleTrackingInput,
  pagination: Types.PaginationArgs | null = null,
  tx?: DBTransaction
): Promise<Types.RescheduleTrackingPaginatedResult> => {
  const runner = async (t: DBTransaction): Promise<Types.RescheduleTrackingPaginatedResult> => {
    const originalClass = alias(classInstances, "original_class");
    const conditions = buildRescheduleConditions(input, originalClass);

    const query = buildRescheduleSelectQuery(t, originalClass)
      .where(conditions)
      .orderBy(sql`${classInstances.scheduledStartAt} DESC`)
      .$dynamic();

    const dataQuery = queryWithPagination(query, pagination);

    const countQuery = t
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(classInstances)
      .leftJoin(originalClass, eq(classInstances.originalClassId, originalClass.id))
      .leftJoin(teachers, eq(classInstances.teacherId, teachers.id))
      .leftJoin(users, eq(teachers.userId, users.id))
      .leftJoin(students, eq(classInstances.studentId, students.id))
      .where(conditions);

    const [queryRows, [countRow]] = await Promise.all([dataQuery, countQuery]);

    const totalCount = countRow?.count ?? 0;
    const mappedRows = queryRows.map(mapRescheduleRow);

    const pageInfo = pagination
      ? {
          count: mappedRows.length,
          currentPage: pagination.currentPage,
          firstItem: mappedRows.length > 0 ? pagination.offset + 1 : null,
          hasMorePages: pagination.offset + pagination.perPage < totalCount,
          lastItem: mappedRows.length > 0 ? pagination.offset + mappedRows.length : null,
          lastPage: Math.max(1, Math.ceil(totalCount / pagination.perPage)),
          perPage: pagination.perPage,
          total: totalCount,
        }
      : null;

    return { rows: mappedRows, totalCount, pageInfo };
  };

  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};

export const getRescheduleTrackingMetrics = async (tx?: DBTransaction) => {
  const runner = async (t: DBTransaction) => {
    const [lrMetrics] = await t
      .select({
        pending: sql<number>`sum(case when status = 'PENDING' then 1 else 0 end)`.mapWith(Number),
        approved: sql<number>`sum(case when status = 'APPROVED' then 1 else 0 end)`.mapWith(Number),
        rescheduled: sql<number>`sum(case when status = 'RESCHEDULED' then 1 else 0 end)`.mapWith(Number),
        cancelled: sql<number>`sum(case when status = 'CANCELLED' then 1 else 0 end)`.mapWith(Number),
        leave: sql<number>`count(*)`.mapWith(Number),
      })
      .from(leaveRequests);

    const [rescheduledCountRow] = await t
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(classInstances)
      .where(and(isNull(classInstances.deletedAt), sql`${classInstances.originalClassId} IS NOT NULL`));

    return {
      pending: lrMetrics?.pending ?? 0,
      approved: lrMetrics?.approved ?? 0,
      leave: lrMetrics?.leave ?? 0,
      rescheduled: rescheduledCountRow?.count ?? 0,
      cancelled: lrMetrics?.cancelled ?? 0,
    };
  };
  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};

export async function getTeacherLeaveQuotaUsage(
  teacherId: string,
  periodYear: number,
  periodMonth: number,
  tx?: DBTransaction
): Promise<number> {
  const queryDb = tx ?? db;
  const [row] = await queryDb
    .select({ usedCount: leaveQuotaUsage.usedCount })
    .from(leaveQuotaUsage)
    .where(
      and(
        eq(leaveQuotaUsage.teacherId, teacherId),
        eq(leaveQuotaUsage.periodYear, periodYear),
        eq(leaveQuotaUsage.periodMonth, periodMonth)
      )
    )
    .limit(1);

  return row?.usedCount ?? 0;
}

export async function incrementTeacherLeaveQuota(
  teacherId: string,
  tx?: DBTransaction,
  locale?: string
): Promise<void> {
  const now = new Date();
  const periodYear = now.getUTCFullYear();
  const periodMonth = now.getUTCMonth() + 1;

  const queryDb = tx ?? db;

  try {
    await queryDb.execute(sql`
      INSERT INTO leave_quota_usage (teacher_id, period_year, period_month, used_count)
      VALUES (${teacherId}, ${periodYear}, ${periodMonth}, 1)
      ON CONFLICT (teacher_id, period_year, period_month) WHERE teacher_id IS NOT NULL
      DO UPDATE SET used_count = leave_quota_usage.used_count + 1
    `);
  } catch (error) {
    if (error instanceof Error && (error as { code?: string }).code === "P0001") {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("leaveQuotaExceeded", { maxLeaves: "2" }), { cause: error });
    }
    throw error;
  }
}

export async function getTeacherByUserId(
  userId: string,
  tx?: DBTransaction
): Promise<{ id: string; userId: string } | null> {
  const queryDb = tx ?? db;
  const [row] = await queryDb
    .select({ id: teachers.id, userId: teachers.userId })
    .from(teachers)
    .where(eq(teachers.userId, userId))
    .limit(1);

  return row ?? null;
}

export type FutureClassRow = {
  id: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  durationMinutes: number;
  isRescheduled: boolean;
  studentName: string;
  studentId: string;
  classType?: string | null;
  subjectId?: string | null;
  subjectName?: string | null;
  zoomMeetingUrl?: string | null;
};

export async function getTeacherFutureClasses(
  teacherId: string,
  fromDate: Date,
  toDate: Date,
  tx?: DBTransaction
): Promise<FutureClassRow[]> {
  const queryDb = tx ?? db;

  const rows = await queryDb
    .select({
      id: classInstances.id,
      scheduledStartAt: classInstances.scheduledStartAt,
      scheduledEndAt: classInstances.scheduledEndAt,
      durationMinutes: classInstances.durationMinutes,
      isRescheduled: classInstances.isRescheduled,
      studentId: students.id,
      studentName: students.name,
      classType: classInstances.classType,
      subjectId: classInstances.subjectId,
      subjectName: classSubjects.name,
      zoomMeetingUrl: classInstances.zoomMeetingUrl,
    })
    .from(classInstances)
    .innerJoin(students, eq(classInstances.studentId, students.id))
    .leftJoin(classSubjects, eq(classInstances.subjectId, classSubjects.id))
    .where(
      and(
        eq(classInstances.teacherId, teacherId),
        isNull(classInstances.deletedAt),
        gte(classInstances.scheduledStartAt, fromDate),
        lt(classInstances.scheduledStartAt, toDate),
        inArray(classInstances.executionState, ["NOT_ACTIVATED", "ACTIVATED"])
      )
    )
    .orderBy(classInstances.scheduledStartAt);

  return rows;
}

export type WeeklyScheduleGridRow = {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  durationMinutes: number;
  dayOfWeek: string;
  executionState: string;
  outcome: string;
  subjectId?: string | null;
  subjectName?: string | null;
  classType?: string | null;
};

export const getWeeklyScheduleGrid = async (
  teacherId: string,
  weekStart: Date,
  weekEnd: Date,
  tx?: DBTransaction
): Promise<WeeklyScheduleGridRow[]> => {
  const queryDb = tx ?? db;

  const rows = await queryDb
    .select({
      id: classInstances.id,
      studentId: classInstances.studentId,
      studentName: students.name,
      teacherId: classInstances.teacherId,
      scheduledStartAt: classInstances.scheduledStartAt,
      scheduledEndAt: classInstances.scheduledEndAt,
      durationMinutes: classInstances.durationMinutes,
      executionState: classInstances.executionState,
      outcome: classInstances.outcome,
      subjectId: classInstances.subjectId,
      subjectName: classSubjects.name,
      classType: classInstances.classType,
    })
    .from(classInstances)
    .innerJoin(students, eq(classInstances.studentId, students.id))
    .leftJoin(classSubjects, eq(classInstances.subjectId, classSubjects.id))
    .where(
      and(
        eq(classInstances.teacherId, teacherId),
        isNull(classInstances.deletedAt),
        gte(classInstances.scheduledStartAt, weekStart),
        lt(classInstances.scheduledStartAt, weekEnd)
      )
    )
    .orderBy(classInstances.scheduledStartAt);

  return rows.map(row => {
    const dayIndex = row.scheduledStartAt.getUTCDay();
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    return {
      ...row,
      dayOfWeek: dayNames[dayIndex],
    };
  });
};

export type WeeklyWorkloadMetrics = {
  totalMinutes: number;
  totalHoursFormatted: string;
  classCount: number;
};

export const getWeeklyWorkloadMetrics = async (
  teacherId: string,
  weekStart: Date,
  weekEnd: Date,
  tx?: DBTransaction
): Promise<WeeklyWorkloadMetrics> => {
  const queryDb = tx ?? db;

  const [metrics] = await queryDb
    .select({
      totalMinutes: sql<number>`coalesce(sum(${classInstances.durationMinutes}), 0)`.mapWith(Number),
      classCount: sql<number>`count(*)`.mapWith(Number),
    })
    .from(classInstances)
    .where(
      and(
        eq(classInstances.teacherId, teacherId),
        isNull(classInstances.deletedAt),
        gte(classInstances.scheduledStartAt, weekStart),
        lt(classInstances.scheduledStartAt, weekEnd),
        ne(classInstances.executionState, "NOT_ACTIVATED")
      )
    );

  const totalMinutes = metrics?.totalMinutes ?? 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const totalHoursFormatted = `${hours}:${minutes.toString().padStart(2, "0")}`;

  return {
    totalMinutes,
    totalHoursFormatted,
    classCount: metrics?.classCount ?? 0,
  };
};

import type { ClassExecutionState, ClassOutcome, StudentStatus } from "@/shared/lib/enum";

export type StatusTrackingRow = {
  id: string;
  studentId: string;
  studentName: string;
  studentInitials: string;
  studentStatus: StudentStatus;
  teacherId: string;
  teacherName: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  durationMinutes: number;
  executionState: ClassExecutionState;
  outcome: ClassOutcome;
  isFrozen: boolean;
};

export const getStatusTrackingRows = async (
  date: Date,
  options?: { search?: string; viewerTimezone?: string },
  tx?: DBTransaction
): Promise<StatusTrackingRow[]> => {
  const runner = async (t: DBTransaction): Promise<StatusTrackingRow[]> => {
    const { getDayBoundaries } = await import("@/backend/lib/timezone");
    const viewerTimezone = options?.viewerTimezone ?? "UTC";
    const { startOfDayUtc, endOfDayUtc } = getDayBoundaries(date, viewerTimezone);
    const search = options?.search;

    const rows = await t
      .select({
        id: classInstances.id,
        studentId: students.id,
        studentName: students.name,
        studentStatus: students.status,
        teacherId: classInstances.teacherId,
        scheduledStartAt: classInstances.scheduledStartAt,
        scheduledEndAt: classInstances.scheduledEndAt,
        durationMinutes: classInstances.durationMinutes,
        executionState: classInstances.executionState,
        outcome: classInstances.outcome,
        isFrozen: classInstances.isFrozen,
        teacherUserName: users.name,
      })
      .from(classInstances)
      .innerJoin(students, eq(classInstances.studentId, students.id))
      .innerJoin(teachers, eq(classInstances.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(
        and(
          isNull(classInstances.deletedAt),
          gte(classInstances.scheduledStartAt, startOfDayUtc),
          lt(classInstances.scheduledStartAt, endOfDayUtc)
        )
      )
      .orderBy(classInstances.scheduledStartAt);

    let results = rows.map(r => ({
      id: r.id,
      studentId: r.studentId,
      studentName: r.studentName,
      studentInitials: r.studentName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w: string) => w[0]?.toUpperCase() ?? "")
        .join(""),
      studentStatus: r.studentStatus as StudentStatus,
      teacherId: r.teacherId,
      teacherName: r.teacherUserName,
      scheduledStartAt: r.scheduledStartAt,
      scheduledEndAt: r.scheduledEndAt,
      durationMinutes: r.durationMinutes,
      executionState: r.executionState as ClassExecutionState,
      outcome: r.outcome as ClassOutcome,
      isFrozen: r.isFrozen,
    }));

    if (search) {
      const lower = search.toLowerCase();
      results = results.filter(
        r => r.studentName.toLowerCase().includes(lower) || r.teacherName.toLowerCase().includes(lower)
      );
    }

    return results;
  };

  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};

export const bulkFreezeStudentClasses = async (
  studentId: string,
  fromDate: Date,
  tx?: DBTransaction
): Promise<number> => {
  return setStudentClassesFrozenState(studentId, fromDate, true, undefined, tx);
};

export const bulkUnfreezeStudentClasses = async (
  studentId: string,
  fromDate: Date,
  tx?: DBTransaction
): Promise<number> => {
  return setStudentClassesFrozenState(studentId, fromDate, false, eq(classInstances.isFrozen, true), tx);
};

async function setStudentClassesFrozenState(
  studentId: string,
  fromDate: Date,
  isFrozen: boolean,
  extraPredicate: ReturnType<typeof eq> | undefined,
  tx?: DBTransaction
): Promise<number> {
  const runner = async (t: DBTransaction): Promise<number> => {
    const BATCH_SIZE = 500;
    let totalUpdated = 0;

    const conditions = and(
      eq(classInstances.studentId, studentId),
      isNull(classInstances.deletedAt),
      gte(classInstances.scheduledStartAt, fromDate),
      extraPredicate
    );

    while (true) {
      const batch = await t
        .select({ id: classInstances.id })
        .from(classInstances)
        .where(conditions)
        .limit(BATCH_SIZE)
        .for("update");

      if (batch.length === 0) break;

      await t
        .update(classInstances)
        .set({ isFrozen, updatedAt: new Date() })
        .where(
          inArray(
            classInstances.id,
            batch.map(b => b.id)
          )
        );

      totalUpdated += batch.length;

      if (batch.length < BATCH_SIZE) break;
    }

    return totalUpdated;
  };
  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
}

export const getStudentFutureClasses = async (
  studentId: string,
  fromDate: Date,
  tx?: DBTransaction
): Promise<{ id: string; executionState: string; scheduledStartAt: Date }[]> => {
  const queryDb = tx ?? db;
  const rows = await queryDb
    .select({
      id: classInstances.id,
      executionState: classInstances.executionState,
      scheduledStartAt: classInstances.scheduledStartAt,
    })
    .from(classInstances)
    .where(
      and(
        eq(classInstances.studentId, studentId),
        isNull(classInstances.deletedAt),
        gte(classInstances.scheduledStartAt, fromDate),
        inArray(classInstances.executionState, ["NOT_ACTIVATED", "ACTIVATED"])
      )
    )
    .orderBy(classInstances.scheduledStartAt);
  return rows.map(r => ({
    id: r.id,
    executionState: r.executionState,
    scheduledStartAt: r.scheduledStartAt,
  }));
};

export type UpcomingClassRow = {
  id: string;
  instructor: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  durationMinutes: number;
  executionState: string;
  isFrozen: boolean;
};

export const getUpcomingClassesForStudent = async (
  studentId: string,
  tx?: DBTransaction
): Promise<UpcomingClassRow[]> => {
  const queryDb = tx ?? db;
  const fromDate = new Date();
  const rows = await queryDb
    .select({
      id: classInstances.id,
      scheduledStartAt: classInstances.scheduledStartAt,
      scheduledEndAt: classInstances.scheduledEndAt,
      durationMinutes: classInstances.durationMinutes,
      executionState: classInstances.executionState,
      isFrozen: classInstances.isFrozen,
      instructor: users.name,
    })
    .from(classInstances)
    .innerJoin(teachers, eq(classInstances.teacherId, teachers.id))
    .innerJoin(users, eq(teachers.userId, users.id))
    .where(
      and(
        eq(classInstances.studentId, studentId),
        isNull(classInstances.deletedAt),
        gte(classInstances.scheduledStartAt, fromDate),
        inArray(classInstances.executionState, ["NOT_ACTIVATED", "ACTIVATED"])
      )
    )
    .orderBy(classInstances.scheduledStartAt)
    .limit(100);
  return rows;
};

export type TeacherAssignedClassRow = {
  id: string;
  studentName: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  durationMinutes: number;
  executionState: string;
  outcome: string | null;
};

export const getTeacherAssignedClasses = async (
  teacherId: string,
  tx?: DBTransaction
): Promise<TeacherAssignedClassRow[]> => {
  const queryDb = tx ?? db;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 7);

  const rows = await queryDb
    .select({
      id: classInstances.id,
      studentName: students.name,
      scheduledStartAt: classInstances.scheduledStartAt,
      scheduledEndAt: classInstances.scheduledEndAt,
      durationMinutes: classInstances.durationMinutes,
      executionState: classInstances.executionState,
      outcome: classInstances.outcome,
    })
    .from(classInstances)
    .innerJoin(students, eq(classInstances.studentId, students.id))
    .where(
      and(
        eq(classInstances.teacherId, teacherId),
        isNull(classInstances.deletedAt),
        gte(classInstances.scheduledStartAt, fromDate)
      )
    )
    .orderBy(classInstances.scheduledStartAt)
    .limit(200);

  return rows;
};
