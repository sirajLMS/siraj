import { and, eq, gte, ilike, inArray, isNull, lt, or, sql } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { classInstances, classSubjects, recurringSchedules, students, teachers, users } from "@/backend/db/schema";
import type { ClassExecutionState } from "@/backend/enum";
import { resolveClassAvatarUrl } from "@/backend/lib/avatar";
import type { DailyScheduleResult } from "@/backend/types/scheduling/scheduling.types";
import { parseIanaTimezoneOrNull } from "@/shared/lib/enum";

export function buildDailyScheduleDayConditions(
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

export async function hydrateDailyScheduleRows(
  t: DBTransaction,
  instances: (typeof classInstances.$inferSelect)[]
): Promise<DailyScheduleResult[]> {
  const studentIds = Array.from(new Set(instances.map(instance => instance.studentId)));
  const teacherIds = Array.from(new Set(instances.map(instance => instance.teacherId)));
  const subjectIds = Array.from(
    new Set(instances.map(instance => instance.subjectId).filter((id): id is string => Boolean(id)))
  );
  const recurringScheduleIds = Array.from(
    new Set(instances.map(instance => instance.recurringScheduleId).filter((id): id is string => Boolean(id)))
  );

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
  const subjectsData =
    subjectIds.length > 0 ? await t.select().from(classSubjects).where(inArray(classSubjects.id, subjectIds)) : [];
  const recurringData =
    recurringScheduleIds.length > 0
      ? await t.select().from(recurringSchedules).where(inArray(recurringSchedules.id, recurringScheduleIds))
      : [];

  const studentMap = new Map(studentsData.map(student => [student.id, student]));
  const teacherMap = new Map(
    teachersData.map(teacherRow => [teacherRow.teacher.id, { ...teacherRow.teacher, user: teacherRow.user }])
  );
  const subjectMap = new Map(subjectsData.map(subject => [subject.id, subject]));
  const recurringMap = new Map(recurringData.map(schedule => [schedule.id, schedule]));

  return instances.map((instance): DailyScheduleResult => {
    const student = studentMap.get(instance.studentId);
    const teacher = teacherMap.get(instance.teacherId);
    const subject = instance.subjectId ? subjectMap.get(instance.subjectId) : undefined;
    const recurring = instance.recurringScheduleId ? recurringMap.get(instance.recurringScheduleId) : undefined;
    const avatarUrl = resolveClassAvatarUrl(recurring?.avatarUrl, subject?.avatarUrl);

    return {
      ...instance,
      courseName: subject?.name ?? null,
      avatarUrl,
      instanceId: instance.id,
      scheduledDate: instance.scheduledStartAt.toISOString().split("T")[0],
      startTime: instance.scheduledStartAt.toISOString(),
      endTime: instance.scheduledEndAt.toISOString(),
      durationMinutes: Math.round(
        (instance.scheduledEndAt.getTime() - instance.scheduledStartAt.getTime()) / (1000 * 60)
      ),
      status: instance.executionState as ClassExecutionState,
      remarks: instance.remarks ?? null,
      hasTimezoneMismatch: false,
      studentTimezone: null,
      teacherTimezone: parseIanaTimezoneOrNull(teacher?.user?.timezone ?? null),
      performance: null,
      ...(student ? { student } : {}),
      ...(teacher ? { teacher } : {}),
    };
  });
}

export async function fetchDailyScheduleBaseRows(
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
  );
}

export async function applyViewerTimezoneFormatting(
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
