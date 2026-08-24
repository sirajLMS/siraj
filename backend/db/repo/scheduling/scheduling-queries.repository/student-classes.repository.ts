import { and, eq, gte, inArray, isNull } from "drizzle-orm";
import { db, queryDb, withForUpdate } from "@/backend/db";
import { classInstances, classSubjects, recurringSchedules, teachers, users } from "@/backend/db/schema";
import { resolveClassAvatarUrl } from "@/backend/lib/avatar";
import type { DBTransaction, UpcomingClassRow } from "@/backend/types";
import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";

const VALID_EXECUTION_STATES = new Set(Object.values(ClassExecutionState) as string[]);
const VALID_OUTCOMES = new Set(Object.values(ClassOutcome) as string[]);

function isClassExecutionState(value: string): value is ClassExecutionState {
  return VALID_EXECUTION_STATES.has(value);
}

function isClassOutcome(value: string): value is ClassOutcome {
  return VALID_OUTCOMES.has(value);
}

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
  const BATCH_SIZE = 500;

  const conditions = and(
    eq(classInstances.studentId, studentId),
    isNull(classInstances.deletedAt),
    gte(classInstances.scheduledStartAt, fromDate),
    extraPredicate
  );

  const runner = async (t: DBTransaction): Promise<number> => {
    const processNextBatch = async (totalUpdated: number): Promise<number> => {
      const batch = await withForUpdate(
        t.select({ id: classInstances.id }).from(classInstances).where(conditions).limit(BATCH_SIZE)
      );

      if (batch.length === 0) return totalUpdated;

      await t
        .update(classInstances)
        .set({ isFrozen, updatedAt: new Date() })
        .where(
          inArray(
            classInstances.id,
            batch.map(b => b.id)
          )
        );

      const newTotal = totalUpdated + batch.length;
      if (batch.length < BATCH_SIZE) return newTotal;
      return processNextBatch(newTotal);
    };

    return processNextBatch(0);
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
    executionState: isClassExecutionState(r.executionState) ? r.executionState : ClassExecutionState.NOT_ACTIVATED,
    outcome: isClassOutcome(r.outcome) ? r.outcome : ClassOutcome.PENDING,
    isFrozen: r.isFrozen,
    instructor: r.instructor,
    teacherId: r.teacherId,
    teacherAvatarUrl: r.teacherAvatarUrl ?? null,
    subjectId: r.subjectId ?? null,
    subjectName: r.subjectName ?? null,
    avatarUrl: resolveClassAvatarUrl(r.recurringAvatarUrl, r.subjectAvatarUrl),
  }));
};
