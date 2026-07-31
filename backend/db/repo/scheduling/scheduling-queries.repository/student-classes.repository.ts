import { and, eq, gte, inArray, isNull } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { classInstances, classSubjects, recurringSchedules, teachers, users } from "@/backend/db/schema";
import { resolveClassAvatarUrl } from "@/backend/lib/avatar";
import type { UpcomingClassRow } from "@/backend/types/scheduling/scheduling.types";

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
  const q = queryDb(tx);
  const rows = await q
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

export const getUpcomingClassesForStudent = async (
  studentId: string,
  tx?: DBTransaction
): Promise<UpcomingClassRow[]> => {
  const q = queryDb(tx);
  const fromDate = new Date();
  const rows = await q
    .select({
      id: classInstances.id,
      scheduledStartAt: classInstances.scheduledStartAt,
      scheduledEndAt: classInstances.scheduledEndAt,
      durationMinutes: classInstances.durationMinutes,
      executionState: classInstances.executionState,
      outcome: classInstances.outcome,
      isFrozen: classInstances.isFrozen,
      instructor: users.name,
      teacherId: classInstances.teacherId,
      teacherAvatarUrl: users.avatarUrl,
      subjectId: classInstances.subjectId,
      subjectName: classSubjects.name,
      subjectAvatarUrl: classSubjects.avatarUrl,
      recurringAvatarUrl: recurringSchedules.avatarUrl,
    })
    .from(classInstances)
    .innerJoin(teachers, eq(classInstances.teacherId, teachers.id))
    .innerJoin(users, eq(teachers.userId, users.id))
    .leftJoin(classSubjects, eq(classInstances.subjectId, classSubjects.id))
    .leftJoin(recurringSchedules, eq(classInstances.recurringScheduleId, recurringSchedules.id))
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

  return rows.map(r => ({
    id: r.id,
    scheduledStartAt: r.scheduledStartAt,
    scheduledEndAt: r.scheduledEndAt,
    durationMinutes: r.durationMinutes,
    executionState: r.executionState,
    outcome: r.outcome,
    isFrozen: r.isFrozen,
    instructor: r.instructor,
    teacherId: r.teacherId,
    teacherAvatarUrl: r.teacherAvatarUrl ?? null,
    subjectId: r.subjectId ?? null,
    subjectName: r.subjectName ?? null,
    avatarUrl: resolveClassAvatarUrl(r.recurringAvatarUrl, r.subjectAvatarUrl),
  }));
};
