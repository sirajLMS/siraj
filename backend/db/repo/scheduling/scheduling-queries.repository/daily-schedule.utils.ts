import { and, eq, gt, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { caseInsensitiveLike } from "@/backend/db";
import { classInstances, classSubjects, recurringSchedules, students, teachers, users } from "@/backend/db/schema";
import { resolveClassAvatarUrl } from "@/backend/lib/avatar";
import type { ClassInstanceSelectType, DailyScheduleResult, DBTransaction } from "@/backend/types";
import { escapeLikeWildcards } from "@/backend/utils";
import { parseClassExecutionState, parseIanaTimezoneOrNull } from "@/shared/lib/enum";

export function buildDailyScheduleDayConditions(
  date: Date,
  viewerTimezone: string,
  teacherId: string | undefined,
  getDayBoundaries: typeof import("@/backend/lib/timezone").getDayBoundaries
) {
  const { startOfDayUtc, endOfDayUtc } = getDayBoundaries(date, viewerTimezone);

  // Use OVERLAP logic (not start-only filter) so classes that START on an
  // adjacent day but EXTEND into this day are included. The prior filter
  // (`scheduledStartAt >= startOfDayUtc AND scheduledStartAt < endOfDayUtc`)
  // missed classes starting late on day N-1 whose time range extended into day N,
  // causing a discrepancy with the `checkOverlaps` booking-conflict check (which
  // uses `scheduledStartAt < endTime AND scheduledEndAt > startTime`). This
  // discrepancy caused the "Teacher is already booked" test flake —
  // `clearClassesOnDate` didn't list the overlapping class (so it wasn't deleted)
  // but `checkOverlaps` found it (so the create was rejected).
  return and(
    isNull(classInstances.deletedAt),
    lt(classInstances.scheduledStartAt, endOfDayUtc),
    gt(classInstances.scheduledEndAt, startOfDayUtc),
    teacherId ? eq(classInstances.teacherId, teacherId) : undefined
  );
}

export async function hydrateDailyScheduleRows(
  t: DBTransaction,
  instances: ClassInstanceSelectType[]
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
      status: parseClassExecutionState(instance.executionState),
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
    const searchPattern = `%${escapeLikeWildcards(search)}%`;
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
            caseInsensitiveLike(students.name, searchPattern),
            caseInsensitiveLike(users.name, searchPattern),
            caseInsensitiveLike(sql`CAST(${classInstances.id} AS TEXT)`, searchPattern)
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
