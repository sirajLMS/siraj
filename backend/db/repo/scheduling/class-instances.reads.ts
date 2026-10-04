import { and, eq, gte, inArray, isNull, notInArray, sql } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import { classInstances, classSubjects, recurringSchedules, students, teachers, users } from "@/backend/db/schema";
import { OnDemandStatus } from "@/backend/enum";
import { resolveClassAvatarUrl } from "@/backend/lib/avatar";
import type * as Types from "@/backend/types";

/**
 * Batch lookup for multiple class instances by ID — eliminates N+1 queries
 * when dispatching notifications for every instance in a recurring schedule.
 * Returns a Map keyed by instance ID. Entries not found are omitted from the
 * map (caller should use `.get(id) ?? null`).
 */
export const getClassInstancesByIds = async (
  ids: readonly string[],
  tx?: Types.DBTransaction
): Promise<Map<string, Awaited<ReturnType<typeof getClassInstanceById>>>> => {
  if (ids.length === 0) return new Map();
  const q = queryDb(tx);
  const rows = await q
    .select()
    .from(classInstances)
    .where(inArray(classInstances.id, [...ids]));
  if (rows.length === 0) return new Map();

  const studentIds = [...new Set(rows.map(r => r.studentId))];
  const teacherIds = [...new Set(rows.map(r => r.teacherId))];
  const subjectIds = [...new Set(rows.map(r => r.subjectId).filter((s): s is string => s != null))];
  const recurringScheduleIds = [...new Set(rows.map(r => r.recurringScheduleId).filter((s): s is string => s != null))];

  const [studentsData, teachersData, subjectsData, recurringData] = await Promise.all([
    q.select().from(students).where(inArray(students.id, studentIds)),
    q
      .select({ teacher: teachers, user: users })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(inArray(teachers.id, teacherIds)),
    subjectIds.length > 0
      ? q.select().from(classSubjects).where(inArray(classSubjects.id, subjectIds))
      : Promise.resolve([]),
    recurringScheduleIds.length > 0
      ? q.select().from(recurringSchedules).where(inArray(recurringSchedules.id, recurringScheduleIds))
      : Promise.resolve([]),
  ]);

  const studentMap = new Map(studentsData.map(s => [s.id, s]));
  const teacherMap = new Map(teachersData.map(tc => [tc.teacher.id, { ...tc.teacher, user: tc.user }]));
  const subjectMap = new Map(subjectsData.map(s => [s.id, s]));
  const recurringMap = new Map(recurringData.map(r => [r.id, r]));

  const result = new Map<string, Awaited<ReturnType<typeof getClassInstanceById>>>();
  for (const row of rows) {
    const subject = row.subjectId ? subjectMap.get(row.subjectId) : undefined;
    const recurring = row.recurringScheduleId ? recurringMap.get(row.recurringScheduleId) : undefined;
    result.set(row.id, {
      ...row,
      subject,
      recurring,
      avatarUrl: resolveClassAvatarUrl(recurring?.avatarUrl, subject?.avatarUrl),
      student: studentMap.get(row.studentId),
      teacher: teacherMap.get(row.teacherId),
    });
  }
  return result;
};

export const getClassInstanceById = async (id: string, tx?: Types.DBTransaction) => {
  const q = queryDb(tx);
  const [row] = await q.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);

  if (!row) return null;

  const studentIds = [row.studentId];
  const teacherIds = [row.teacherId];

  const studentsData = await q.select().from(students).where(inArray(students.id, studentIds));
  const teachersData = await q
    .select({ teacher: teachers, user: users })
    .from(teachers)
    .innerJoin(users, eq(teachers.userId, users.id))
    .where(inArray(teachers.id, teacherIds));

  const studentMap = new Map(studentsData.map(s => [s.id, s]));
  const teacherMap = new Map(teachersData.map(tc => [tc.teacher.id, { ...tc.teacher, user: tc.user }]));

  const subject = row.subjectId
    ? (await q.select().from(classSubjects).where(eq(classSubjects.id, row.subjectId)).limit(1))[0]
    : undefined;
  const recurring = row.recurringScheduleId
    ? (await q.select().from(recurringSchedules).where(eq(recurringSchedules.id, row.recurringScheduleId)).limit(1))[0]
    : undefined;

  return {
    ...row,
    subject,
    recurring,
    avatarUrl: resolveClassAvatarUrl(recurring?.avatarUrl, subject?.avatarUrl),
    student: studentMap.get(row.studentId),
    teacher: teacherMap.get(row.teacherId),
  };
};

/**
 * Returns up to `limit` pending-credit on-demand class instances for a
 * student, ordered by scheduled start time (oldest first). Used by
 * `QuotaService.refreshStudentOndemandInstances` to flip PENDING_CREDIT
 * instances to AVAILABLE after credits/quota are replenished.
 */
export async function getOndemandPendingInstances(
  tx: Types.DBTransaction,
  studentId: string,
  limit: number
): Promise<Types.ClassInstanceSelectType[]> {
  if (limit <= 0) return [];
  return tx
    .select()
    .from(classInstances)
    .where(
      and(
        eq(classInstances.studentId, studentId),
        isNull(classInstances.deletedAt),
        eq(classInstances.ondemandStatus, OnDemandStatus.PENDING_CREDIT)
      )
    )
    .orderBy(classInstances.scheduledStartAt)
    .limit(limit);
}

/**
 * Returns non-deleted upcoming class instances (`scheduledStartAt >= now`)
 * for a given recurring schedule ID. Selects only the fields needed by
 * `RecurringClassService.cancelSchedule` and `switchSchedulingMode` to
 * release/refund quota — `id`, `studentId`, and `quotaDeducted`.
 */
export async function findUpcomingInstancesByScheduleId(
  recurringScheduleId: string,
  now: Date,
  tx?: Types.DBTransaction
): Promise<{ id: string; studentId: string; quotaDeducted: boolean }[]> {
  const q = queryDb(tx);
  return q
    .select({
      id: classInstances.id,
      studentId: classInstances.studentId,
      quotaDeducted: classInstances.quotaDeducted,
    })
    .from(classInstances)
    .where(
      and(
        eq(classInstances.recurringScheduleId, recurringScheduleId),
        isNull(classInstances.deletedAt),
        gte(classInstances.scheduledStartAt, now)
      )
    );
}

/**
 * Builds the shared WHERE conditions for overlap detection queries.
 * Both `hasOverlappingInstance` and `findOverlappingInstancesForRange`
 * use this to avoid code duplication.
 */
function buildOverlapConditions(
  studentId: string,
  teacherId: string,
  rangeStart: Date,
  rangeEnd: Date,
  ignoreInstanceIds: string[] = []
) {
  const conditions = [
    isNull(classInstances.deletedAt),
    sql`${classInstances.scheduledStartAt} < ${rangeEnd}`,
    sql`${classInstances.scheduledEndAt} > ${rangeStart}`,
    sql`(${classInstances.studentId} = ${studentId} OR ${classInstances.teacherId} = ${teacherId})`,
  ];
  if (ignoreInstanceIds.length > 0) {
    conditions.push(notInArray(classInstances.id, ignoreInstanceIds));
  }
  return conditions;
}

/**
 * Point-checks whether any non-deleted class instance overlaps the given
 * time range for `studentId` or `teacherId`. Returns `true` if a conflict
 * exists (slot NOT available), `false` otherwise.
 */
export async function hasOverlappingInstance(
  studentId: string,
  teacherId: string,
  startAt: Date,
  endAt: Date,
  ignoreInstanceIds: string[] = [],
  tx?: Types.DBTransaction
): Promise<boolean> {
  const q = queryDb(tx);
  const conditions = buildOverlapConditions(studentId, teacherId, startAt, endAt, ignoreInstanceIds);
  const conflicts = await q
    .select({ id: classInstances.id })
    .from(classInstances)
    .where(and(...conditions))
    .limit(1);
  return conflicts.length > 0;
}

/**
 * Returns the `scheduledStartAt` and `scheduledEndAt` of all non-deleted class
 * instances that overlap the given `[rangeStart, rangeEnd]` window for
 * `studentId` or `teacherId`. Used by `AvailabilityService.assertSchedulePatternAvailable`
 * to pre-fetch overlapping instances in a single query.
 */
export async function findOverlappingInstancesForRange(
  studentId: string,
  teacherId: string,
  rangeStart: Date,
  rangeEnd: Date,
  ignoreInstanceIds: string[] = [],
  tx?: Types.DBTransaction
): Promise<{ scheduledStartAt: Date; scheduledEndAt: Date }[]> {
  const q = queryDb(tx);
  const conditions = buildOverlapConditions(studentId, teacherId, rangeStart, rangeEnd, ignoreInstanceIds);
  return q
    .select({
      scheduledStartAt: classInstances.scheduledStartAt,
      scheduledEndAt: classInstances.scheduledEndAt,
    })
    .from(classInstances)
    .where(and(...conditions));
}

/**
 * Batch-updates the execution state and on-demand status of multiple class
 * instances in a single UPDATE. Used by `QuotaService.refreshStudentOndemandInstances`
 * to flip PENDING_CREDIT instances to AVAILABLE, and by
 * `ClassSessionService.markNoCreditsBatch` for no-credits resolution. The WHERE
 * clause guards on `ondemandStatus = guardOndemandStatus` AND
 * `deletedAt IS NULL` to prevent TOCTOU races (a concurrent transaction may
 * have already flipped an instance or soft-deleted it).
 *
 * @returns Count of rows actually updated.
 */
export async function updateOndemandStatusBatch(
  instanceIds: string[],
  updates: { executionState: string; ondemandStatus: OnDemandStatus; updatedAt: Date },
  guardOndemandStatus: OnDemandStatus,
  tx: Types.DBTransaction
): Promise<number> {
  if (instanceIds.length === 0) return 0;
  return tUpdateOndemandStatusBatch(tx, instanceIds, updates, guardOndemandStatus);
}

// Inline helper to keep the exported function signature clean
async function tUpdateOndemandStatusBatch(
  tx: Types.DBTransaction,
  instanceIds: string[],
  updates: { executionState: string; ondemandStatus: OnDemandStatus; updatedAt: Date },
  guardOndemandStatus: OnDemandStatus
): Promise<number> {
  const updated = await tx
    .update(classInstances)
    .set({
      executionState: updates.executionState,
      ondemandStatus: updates.ondemandStatus,
      updatedAt: updates.updatedAt,
    })
    .where(
      and(
        inArray(classInstances.id, instanceIds),
        eq(classInstances.ondemandStatus, guardOndemandStatus),
        isNull(classInstances.deletedAt)
      )
    )
    .returning({ id: classInstances.id });
  return updated.length;
}
