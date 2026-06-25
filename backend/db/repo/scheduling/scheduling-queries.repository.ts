import { and, eq, gte, inArray, isNull, lt, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/backend/db/drizzleDb";
import {
  classInstances,
  classStatusEvents,
  leaveQuotaUsage,
  leaveRequests,
  students,
  teachers,
  users,
} from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import type * as Types from "@/backend/types";

type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const getDailyMetrics = async (date: Date, teacherId?: string, tx?: DBTransaction) => {
  const runner = async (t: DBTransaction) => {
    const baseConditions = and(
      isNull(classInstances.deletedAt),
      sql`DATE(${classInstances.scheduledStartAt}) = DATE(${date.toISOString()})`,
      teacherId ? eq(classInstances.teacherId, teacherId) : undefined
    );

    const metrics = await t
      .select({
        total: sql<number>`count(*)`.mapWith(Number),
        regular: sql<number>`sum(case when ${classInstances.classType} = 'REGULAR' then 1 else 0 end)`.mapWith(Number),
        trial: sql<number>`sum(case when ${classInstances.classType} = 'TRIAL' then 1 else 0 end)`.mapWith(Number),
        advance: sql<number>`sum(case when ${classInstances.classType} = 'ADVANCE' then 1 else 0 end)`.mapWith(Number),
        rescheduled: sql<number>`sum(case when ${classInstances.isRescheduled} = true then 1 else 0 end)`.mapWith(
          Number
        ),
        suspended: sql<number>`sum(case when ${classInstances.isFrozen} = true then 1 else 0 end)`.mapWith(Number),
        taken: sql<number>`sum(case when ${classInstances.outcome} = 'TAKEN' then 1 else 0 end)`.mapWith(Number),
        pending: sql<number>`sum(case when ${classInstances.outcome} = 'PENDING' then 1 else 0 end)`.mapWith(Number),
        activated: sql<number>`sum(case when ${classInstances.executionState} = 'ACTIVATED' then 1 else 0 end)`.mapWith(
          Number
        ),
        running:
          sql<number>`sum(case when ${classInstances.executionState} = 'ACTIVATED' and ${classInstances.actualStartAt} is not null and ${classInstances.actualEndAt} is null then 1 else 0 end)`.mapWith(
            Number
          ),
        absent: sql<number>`sum(case when ${classInstances.outcome} = 'ABSENT' then 1 else 0 end)`.mapWith(Number),
        leave: sql<number>`sum(case when ${classInstances.outcome} = 'LEAVE' then 1 else 0 end)`.mapWith(Number),
      })
      .from(classInstances)
      .where(baseConditions);

    return (
      metrics[0] ?? {
        total: 0,
        regular: 0,
        trial: 0,
        advance: 0,
        rescheduled: 0,
        suspended: 0,
        taken: 0,
        pending: 0,
        activated: 0,
        running: 0,
        absent: 0,
        leave: 0,
      }
    );
  };

  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};

export type DailyScheduleResult = Types.ClassInstanceEntity & {
  student?: Types.StudentEntity;
  teacher?: Types.TeacherEntity & { user: Types.UserEntity };
  yourTimeFormatted?: string;
};

export const getDailySchedule = async (
  date: Date,
  options?: string | { teacherId?: string; search?: string; viewerTimezone?: string },
  tx?: DBTransaction
): Promise<DailyScheduleResult[]> => {
  const runner = async (t: DBTransaction): Promise<DailyScheduleResult[]> => {
    const teacherId = typeof options === "string" ? options : options?.teacherId;
    const search = typeof options === "object" ? options?.search : undefined;
    const viewerTimezone = typeof options === "object" ? options?.viewerTimezone : undefined;

    const { getDayBoundaries } = await import("@/backend/lib/timezone");
    const { startOfDayUtc, endOfDayUtc } = getDayBoundaries(date, viewerTimezone || "UTC");

    const baseConditions = and(
      isNull(classInstances.deletedAt),
      gte(classInstances.scheduledStartAt, startOfDayUtc),
      lt(classInstances.scheduledStartAt, endOfDayUtc),
      teacherId ? eq(classInstances.teacherId, teacherId) : undefined
    );

    const rows = await t
      .select({
        classInstance: classInstances,
      })
      .from(classInstances)
      .where(baseConditions);

    const studentIds = Array.from(new Set(rows.map(r => r.classInstance.studentId)));
    const teacherIds = Array.from(new Set(rows.map(r => r.classInstance.teacherId)));

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

    const studentMap = new Map(studentsData.map(s => [s.id, s]));
    const teacherMap = new Map(teachersData.map(tc => [tc.teacher.id, { ...tc.teacher, user: tc.user }]));

    let results: DailyScheduleResult[] = rows.map(r => ({
      ...r.classInstance,
      student: studentMap.get(r.classInstance.studentId),
      teacher: teacherMap.get(r.classInstance.teacherId),
    }));

    if (search) {
      const lowerSearch = search.toLowerCase();
      results = results.filter(
        r =>
          r.student?.name?.toLowerCase().includes(lowerSearch) ||
          r.teacher?.user?.name?.toLowerCase().includes(lowerSearch)
      );
    }

    if (viewerTimezone) {
      const { formatInstantInTimezone } = await import("@/backend/lib/timezone");
      return results.map(r => ({
        ...r,
        yourTimeFormatted: formatInstantInTimezone(r.scheduledStartAt, viewerTimezone),
      }));
    }

    return results;
  };

  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};

export const getClassStatusEvents = async (classInstanceId: string, tx?: DBTransaction) => {
  const queryDb = tx ?? db;
  return queryDb
    .select()
    .from(classStatusEvents)
    .where(eq(classStatusEvents.classInstanceId, classInstanceId))
    .orderBy(sql`${classStatusEvents.createdAt} DESC`);
};

export const getTeacherProgressFeed = async (teacherId: string, date: Date, tx?: DBTransaction) => {
  const queryDb = tx ?? db;
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const rows = await queryDb
    .select({
      id: classStatusEvents.id,
      description: classStatusEvents.description,
      eventType: classStatusEvents.eventType,
    })
    .from(classStatusEvents)
    .innerJoin(classInstances, eq(classStatusEvents.classInstanceId, classInstances.id))
    .where(
      and(
        eq(classInstances.teacherId, teacherId),
        sql`${classStatusEvents.createdAt} >= ${startOfDay}`,
        sql`${classStatusEvents.createdAt} <= ${endOfDay}`
      )
    )
    .orderBy(sql`${classStatusEvents.createdAt} DESC`)
    .limit(10);

  return rows.map(r => ({
    id: r.id,
    title: r.description || "Status Updated",
    type: r.eventType === "STATE_CHANGE" ? "SUCCESS" : "UPDATE",
  }));
};

export const getRescheduleTrackingRows = async (
  input: Types.RescheduleTrackingInput,
  tx?: DBTransaction
): Promise<Types.RescheduleTrackingRow[]> => {
  const runner = async (t: DBTransaction): Promise<Types.RescheduleTrackingRow[]> => {
    const originalClass = alias(classInstances, "original_class");
    const baseConditions = and(isNull(classInstances.deletedAt), sql`${classInstances.originalClassId} IS NOT NULL`);

    let conditions = baseConditions;

    if (input.status === "pending_leave") {
      conditions = and(conditions, eq(originalClass.outcome, "LEAVE"));
    } else if (input.status === "rescheduled") {
      conditions = and(conditions, ne(originalClass.outcome, "LEAVE"));
    }

    if (input.search) {
      const searchPattern = `%${input.search}%`;
      conditions = and(
        conditions,
        or(sql`${users.name} ILIKE ${searchPattern}`, sql`${students.name} ILIKE ${searchPattern}`)
      );
    }

    const query = t
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
      .leftJoin(students, eq(classInstances.studentId, students.id))
      .where(conditions);

    let finalQuery = query.orderBy(sql`${classInstances.scheduledStartAt} DESC`);
    if (input.limit !== undefined && input.limit !== null) {
      finalQuery = finalQuery.limit(input.limit) as typeof finalQuery;
    }
    if (input.offset !== undefined && input.offset !== null) {
      finalQuery = finalQuery.offset(input.offset) as typeof finalQuery;
    }

    const queryRows = await finalQuery;

    return queryRows.map(row => {
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
        status: isLeave ? ("pending_leave" as const) : ("rescheduled" as const),
        dateLabel: isLeave ? ("leave_request" as const) : ("new_date" as const),
        remarks: row.remarks,
      };
    });
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
    })
    .from(classInstances)
    .innerJoin(students, eq(classInstances.studentId, students.id))
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
    })
    .from(classInstances)
    .innerJoin(students, eq(classInstances.studentId, students.id))
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

export type StatusTrackingRow = {
  id: string;
  studentId: string;
  studentName: string;
  studentInitials: string;
  studentStatus: string;
  teacherId: string;
  teacherName: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  durationMinutes: number;
  executionState: string;
  outcome: string;
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
      studentStatus: r.studentStatus,
      teacherId: r.teacherId,
      teacherName: r.teacherUserName,
      scheduledStartAt: r.scheduledStartAt,
      scheduledEndAt: r.scheduledEndAt,
      durationMinutes: r.durationMinutes,
      executionState: r.executionState,
      outcome: r.outcome,
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
    const conditions = and(
      eq(classInstances.studentId, studentId),
      isNull(classInstances.deletedAt),
      gte(classInstances.scheduledStartAt, fromDate),
      extraPredicate
    );
    const result = await t
      .update(classInstances)
      .set({ isFrozen, updatedAt: new Date() })
      .where(conditions)
      .returning({ id: classInstances.id });
    return result.length;
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
