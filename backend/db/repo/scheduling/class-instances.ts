import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { SoftDeleteRepository } from "@/backend/db/repo/soft-delete.repository";
import { TeacherAvailabilityRepository } from "@/backend/db/repo/teacher-availability.repository";
import { classInstances, classSubjects, recurringSchedules, students, teachers, users } from "@/backend/db/schema";
import { resolveClassAvatarUrl } from "@/backend/lib/avatar";
import { getBackendTranslations } from "@/backend/lib/intl";
import type * as Types from "@/backend/types";
import {
  acquireLocks,
  checkOverlaps,
  type DBTransaction,
  getClassInstanceByIdOrThrow,
  validateTeacherAssignment,
} from "./shared";
import { adjustQuotaOnUpdate, updateInstanceState } from "./state-changes";

export { resolveStudentTimezone } from "./shared";

export const getClassInstanceById = async (id: string, tx?: DBTransaction) => {
  const queryDb = tx ?? db;
  const [row] = await queryDb.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);

  if (!row) return null;

  const studentIds = [row.studentId];
  const teacherIds = [row.teacherId];

  const studentsData = await queryDb.select().from(students).where(inArray(students.id, studentIds));
  const teachersData = await queryDb
    .select({ teacher: teachers, user: users })
    .from(teachers)
    .innerJoin(users, eq(teachers.userId, users.id))
    .where(inArray(teachers.id, teacherIds));

  const studentMap = new Map(studentsData.map(s => [s.id, s]));
  const teacherMap = new Map(teachersData.map(tc => [tc.teacher.id, { ...tc.teacher, user: tc.user }]));

  const subject = row.subjectId
    ? (await queryDb.select().from(classSubjects).where(eq(classSubjects.id, row.subjectId)).limit(1))[0]
    : undefined;
  const recurring = row.recurringScheduleId
    ? (await queryDb.select().from(recurringSchedules).where(eq(recurringSchedules.id, row.recurringScheduleId)).limit(1))[0]
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
  locale?: string
): Promise<Types.ClassInstanceEntity> => {
  const runner = async (t: DBTransaction) => {
    await acquireLocks(t, input.teacherId, input.studentId);
    await validateTeacherAssignment(t, input.studentId, input.teacherId, input.scheduledStartAt, locale);
    await TeacherAvailabilityRepository.validateBookingAvailability(
      input.teacherId,
      input.scheduledStartAt,
      input.scheduledEndAt,
      t
    );
    await checkOverlaps(
      t,
      {
        studentId: input.studentId,
        teacherId: input.teacherId,
        startTime: input.scheduledStartAt,
        endTime: input.scheduledEndAt,
        zoomUrl: input.zoomMeetingUrl,
      },
      locale
    );

    if (input.quotaDeducted) {
      const [student] = await t
        .select({ classesRemaining: students.classesRemaining })
        .from(students)
        .where(eq(students.id, input.studentId))
        .limit(1);

      if (!student || student.classesRemaining <= 0) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("outOfQuota"));
      }

      await t
        .update(students)
        .set({ classesRemaining: sql`${students.classesRemaining} - 1` })
        .where(eq(students.id, input.studentId));
    }

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
  locale?: string
): Promise<Types.ClassInstanceEntity> => {
  const runner = async (t: DBTransaction) => {
    const existing = await getClassInstanceByIdOrThrow(t, id, locale);

    const studentId = input.studentId ?? existing.studentId;
    const teacherId = input.teacherId ?? existing.teacherId;
    const startTime = input.scheduledStartAt ?? existing.scheduledStartAt;
    const endTime = input.scheduledEndAt ?? existing.scheduledEndAt;
    const zoomUrl = input.zoomMeetingUrl === undefined ? existing.zoomMeetingUrl : input.zoomMeetingUrl;
    const isBeingSoftDeleted = Boolean(input.deletedAt);

    await acquireLocks(t, teacherId, studentId);

    if (!isBeingSoftDeleted) {
      await validateTeacherAssignment(t, studentId, teacherId, startTime, locale);
      await TeacherAvailabilityRepository.validateBookingAvailability(teacherId, startTime, endTime, t);
      await checkOverlaps(
        t,
        {
          studentId,
          teacherId,
          startTime,
          endTime,
          zoomUrl,
          excludeId: id,
        },
        locale
      );
    }

    await adjustQuotaOnUpdate(t, existing, input, isBeingSoftDeleted);

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
  locale?: string
): Promise<Types.ClassInstanceEntity> => {
  const runner = async (t: DBTransaction) => {
    const existing = await getClassInstanceByIdOrThrow(t, id, locale);

    if (existing.quotaDeducted && existing.deletedAt === null) {
      await t
        .update(students)
        .set({ classesRemaining: sql`${students.classesRemaining} + 1` })
        .where(eq(students.id, existing.studentId));
    }

    const { entity: deleted } = await SoftDeleteRepository.softDeleteClassInstance(id, null, t);
    return deleted;
  };

  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};

export const softDeleteClassInstance = async (id: string, actorUserId: string, tx?: DBTransaction, locale?: string) => {
  const runner = async (t: DBTransaction) => {
    const [existing] = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
    if (!existing) return null;
    const tFuncSession = await getBackendTranslations({ locale, namespace: "session" });

    const updated = await updateInstanceState(
      t,
      id,
      actorUserId,
      { deletedAt: new Date() },
      {
        fromState: { executionState: existing.executionState, outcome: existing.outcome, deleted: false },
        toState: { executionState: existing.executionState, outcome: existing.outcome, deleted: true },
        description: tFuncSession("softDeleteDescription"),
      }
    );

    if (updated) {
      await adjustQuotaOnUpdate(t, existing, { deletedAt: updated.deletedAt }, true, locale);
    }
    return updated;
  };
  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};
