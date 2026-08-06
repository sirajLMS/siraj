import { and, eq, gte, inArray, isNull, notInArray, sql } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import { db } from "@/backend/db/drizzleDb";
import {
  type ClassInstanceUpsertManyOptions,
  runClassInstanceUpsertMany,
  upsertProductionClassInstance,
  upsertSeedClassInstance,
} from "@/backend/db/repo/scheduling/class-instance-upsert";
import {
  acquireLocks,
  checkOverlaps,
  type DBTransaction,
  getClassInstanceByIdOrThrow,
  validateTeacherAssignment,
} from "@/backend/db/repo/scheduling/shared";
import { updateInstanceState } from "@/backend/db/repo/scheduling/state-changes";
import { SoftDeleteRepository } from "@/backend/db/repo/shared/soft-delete.repository";
import { TeacherAvailabilityRepository } from "@/backend/db/repo/teachers/teacher-availability.repository";
import { classInstances, classSubjects, recurringSchedules, students, teachers, users } from "@/backend/db/schema";
import { OnDemandStatus } from "@/backend/enum";
import { resolveClassAvatarUrl } from "@/backend/lib/avatar";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";
import type * as Types from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";
import { getServerTranslations } from "@/shared/locale";

export { resolveStudentTimezone } from "@/backend/db/repo/scheduling/shared";

/**
 * Batch lookup for multiple class instances by ID — eliminates N+1 queries
 * when dispatching notifications for every instance in a recurring schedule.
 * Returns a Map keyed by instance ID. Entries not found are omitted from the
 * map (caller should use `.get(id) ?? null`).
 */
export const getClassInstancesByIds = async (
  ids: readonly string[],
  tx?: DBTransaction
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
  const recurringScheduleIds = [
    ...new Set(rows.map(r => r.recurringScheduleId).filter((s): s is string => s != null)),
  ];

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

export const getClassInstanceById = async (id: string, tx?: DBTransaction) => {
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

export const createClassInstance = async (
  input: Omit<Types.ClassInstanceInsertType, "createdAt" | "updatedAt">,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels
): Promise<Types.ClassInstanceSelectType> => {
  const runner = async (t: DBTransaction) => {
    const tFuncErrors = tErrors ?? getServerTranslations("en").errorsTranslations;
    await acquireLocks(t, input.teacherId, input.studentId);
    await validateTeacherAssignment(t, input.studentId, input.teacherId, input.scheduledStartAt, tFuncErrors);
    await TeacherAvailabilityRepository.validateBookingAvailability(
      input.teacherId,
      input.scheduledStartAt,
      input.scheduledEndAt,
      t,
      "ar"
    );

    const effectiveMeeting = await EffectiveMeetingService.resolveForNewBooking(input.teacherId, {
      recurringScheduleId: input.recurringScheduleId,
      tx: t,
      tErrors: tFuncErrors,
    });

    // Use the meetingJoinUrl from input if provided, otherwise fall back to effective meeting
    const meetingJoinUrl = input.meetingJoinUrl ?? effectiveMeeting.joinUrl;

    await checkOverlaps(
      t,
      {
        studentId: input.studentId,
        teacherId: input.teacherId,
        startTime: input.scheduledStartAt,
        endTime: input.scheduledEndAt,
        meetingJoinUrl,
      },
      tFuncErrors
    );

    // Quota operations handled by QuotaService + quota_ledger at service layer

    const [created] = await t
      .insert(classInstances)
      .values({
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return created;
  };

  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};

export const updateClassInstance = async (
  id: string,
  input: Partial<Omit<Types.ClassInstanceInsertType, "createdAt" | "updatedAt">>,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels
): Promise<Types.ClassInstanceSelectType> => {
  const runner = async (t: DBTransaction) => {
    const tFuncErrors = tErrors ?? getServerTranslations("en").errorsTranslations;
    const existing = await getClassInstanceByIdOrThrow(t, id, tFuncErrors);

    const studentId = input.studentId ?? existing.studentId;
    const teacherId = input.teacherId ?? existing.teacherId;
    const startTime = input.scheduledStartAt ?? existing.scheduledStartAt;
    const endTime = input.scheduledEndAt ?? existing.scheduledEndAt;
    const isBeingSoftDeleted = Boolean(input.deletedAt);
    const effectiveMeeting = await EffectiveMeetingService.resolveForClassInstance(id, tFuncErrors, t);

    await acquireLocks(t, teacherId, studentId);

    if (!isBeingSoftDeleted) {
      await validateTeacherAssignment(t, studentId, teacherId, startTime, tFuncErrors);
      await TeacherAvailabilityRepository.validateBookingAvailability(teacherId, startTime, endTime, t, "ar");
      await checkOverlaps(
        t,
        {
          studentId,
          teacherId,
          startTime,
          endTime,
          meetingJoinUrl: effectiveMeeting.joinUrl,
          excludeId: id,
        },
        tFuncErrors
      );
    }

    // Quota adjustments are handled by QuotaService + quota_ledger

    const [updated] = await t
      .update(classInstances)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(classInstances.id, id))
      .returning();

    return updated;
  };

  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};

export const deleteClassInstance = async (
  id: string,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels
): Promise<Types.ClassInstanceSelectType> => {
  const runner = async (t: DBTransaction) => {
    const tFuncErrors = tErrors ?? getServerTranslations("en").errorsTranslations;
    const [existing] = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
    if (!existing) {
      throw new Error(tFuncErrors.classInstanceNotFound({ id }));
    }

    const { entity: deleted } = await SoftDeleteRepository.softDeleteClassInstance(id, null, t);

    // Quota restoration handled by QuotaService + quota_ledger at service layer

    return deleted;
  };

  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};

export const softDeleteClassInstance = async (id: string, actorUserId: string, tx?: DBTransaction) => {
  const runner = async (t: DBTransaction) => {
    const [existing] = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
    if (!existing) return null;
    const tFuncSession = getServerTranslations("en").sessionTranslations;

    const updated = await updateInstanceState(
      t,
      id,
      actorUserId,
      { deletedAt: new Date() },
      {
        fromState: { executionState: existing.executionState, outcome: existing.outcome, deleted: false },
        toState: { executionState: existing.executionState, outcome: existing.outcome, deleted: true },
        description: tFuncSession.softDeleteDescription,
      }
    );

    // Quota adjustment handled by QuotaService + quota_ledger at service layer
    return updated;
  };
  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};

export async function listByIdempotencyKeys(
  keys: readonly string[],
  tx?: DBTransaction
): Promise<Map<string, Types.ClassInstanceSelectType>> {
  const map = new Map<string, Types.ClassInstanceSelectType>();
  if (keys.length === 0) return map;

  const q = queryDb(tx);
  const rows = await q
    .select()
    .from(classInstances)
    .where(inArray(classInstances.idempotencyKey, [...keys]));
  for (const row of rows) {
    map.set(row.idempotencyKey, row);
  }
  return map;
}

export async function upsertMany(
  instances: Types.ClassInstanceInsertType[],
  options?: ClassInstanceUpsertManyOptions
): Promise<Types.ClassInstanceSelectType[]> {
  return runClassInstanceUpsertMany(instances, upsertProductionClassInstance, options);
}

export async function upsertManyForSeed(
  instances: Types.ClassInstanceInsertType[],
  options?: ClassInstanceUpsertManyOptions
): Promise<Types.ClassInstanceSelectType[]> {
  return runClassInstanceUpsertMany(instances, upsertSeedClassInstance, options);
}

/**
 * Returns up to `limit` pending-credit on-demand class instances for a
 * student, ordered by scheduled start time (oldest first). Used by
 * `QuotaService.refreshStudentOndemandInstances` to flip PENDING_CREDIT
 * instances to AVAILABLE after credits/quota are replenished.
 */
export async function getOndemandPendingInstances(
  tx: DBTransaction,
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
 * V3-021: Soft-delete multiple class instances in a single batch UPDATE.
 */
export const softDeleteBatch = async (ids: string[], tx?: DBTransaction): Promise<void> => {
  if (ids.length === 0) return;
  const now = new Date();
  const q = queryDb(tx);
  await q.update(classInstances).set({ deletedAt: now, updatedAt: now }).where(inArray(classInstances.id, ids));
};

/**
 * Returns non-deleted upcoming class instances (`scheduledStartAt >= now`)
 * for a given recurring schedule ID. Selects only the fields needed by
 * `RecurringClassService.cancelSchedule` and `switchSchedulingMode` to
 * release/refund quota — `id`, `studentId`, and `quotaDeducted`.
 */
export async function findUpcomingInstancesByScheduleId(
  recurringScheduleId: string,
  now: Date,
  tx?: DBTransaction
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
  tx?: DBTransaction
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
  tx?: DBTransaction
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
  updates: { executionState: string; ondemandStatus: string; updatedAt: Date },
  guardOndemandStatus: string,
  tx: DBTransaction
): Promise<number> {
  if (instanceIds.length === 0) return 0;
  return t_updateOndemandStatusBatch(tx, instanceIds, updates, guardOndemandStatus);
}

// Inline helper to keep the exported function signature clean
async function t_updateOndemandStatusBatch(
  tx: DBTransaction,
  instanceIds: string[],
  updates: { executionState: string; ondemandStatus: string; updatedAt: Date },
  guardOndemandStatus: string
): Promise<number> {
  const updated = await tx
    .update(classInstances)
    .set({
      executionState: updates.executionState,
      ondemandStatus: updates.ondemandStatus as OnDemandStatus,
      updatedAt: updates.updatedAt,
    })
    .where(
      and(
        inArray(classInstances.id, instanceIds),
        eq(classInstances.ondemandStatus, guardOndemandStatus as OnDemandStatus),
        isNull(classInstances.deletedAt)
      )
    )
    .returning({ id: classInstances.id });
  return updated.length;
}
