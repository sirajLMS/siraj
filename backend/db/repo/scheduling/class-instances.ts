import { and, eq, inArray, isNull } from "drizzle-orm";
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
  const subjectIds = [...new Set(rows.map(r => r.subjectId).filter((s): s is string => s !== null))];
  const recurringScheduleIds = [
    ...new Set(rows.map(r => r.recurringScheduleId).filter((s): s is string => s !== null)),
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
  input: Omit<Types.ClassInstanceInsertInput, "createdAt" | "updatedAt">,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels
): Promise<Types.ClassInstanceEntity> => {
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
  input: Partial<Omit<Types.ClassInstanceInsertInput, "createdAt" | "updatedAt">>,
  tx?: DBTransaction,
  tErrors?: ErrorsLabels
): Promise<Types.ClassInstanceEntity> => {
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
): Promise<Types.ClassInstanceEntity> => {
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
): Promise<Map<string, Types.ClassInstanceEntity>> {
  const map = new Map<string, Types.ClassInstanceEntity>();
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
  instances: Types.ClassInstanceInsertInput[],
  options?: ClassInstanceUpsertManyOptions
): Promise<Types.ClassInstanceEntity[]> {
  return runClassInstanceUpsertMany(instances, upsertProductionClassInstance, options);
}

export async function upsertManyForSeed(
  instances: Types.ClassInstanceInsertInput[],
  options?: ClassInstanceUpsertManyOptions
): Promise<Types.ClassInstanceEntity[]> {
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
): Promise<Types.ClassInstanceEntity[]> {
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
