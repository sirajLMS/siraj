import { and, eq, gte, inArray, isNull } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { classInstances, teachers, users } from "@/backend/db/schema";
import type { UpcomingClassRow } from "@/backend/types/scheduling.types";

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
      teacherId: classInstances.teacherId,
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
