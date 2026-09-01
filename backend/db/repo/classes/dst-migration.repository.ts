import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/backend/db";
import {
  dstMigrationEntries,
  dstMigrationRuns,
  recurringSchedules,
  students,
  teachers,
  users,
} from "@/backend/db/schema";
import type { DBTransaction } from "@/backend/types";

export namespace DstMigrationRepository {
  type RecurringScheduleRow = {
    id: string;
    studentId: string;
    teacherId: string;
    studentName: string;
    teacherName: string;
    defaultStartTime: string;
    timezone: string;
    utcOffsetSnapshot: number | null;
  };

  export const createMigrationRun = async (
    runByUserId: string,
    offsetMinutes: number,
    description: string,
    tx?: DBTransaction
  ) => {
    const queryDb = tx ?? db;
    const now = new Date();
    const [run] = await queryDb
      .insert(dstMigrationRuns)
      .values({
        runByUserId,
        offsetMinutes,
        description,
        createdAt: now,
      })
      .returning();
    return run;
  };

  export const getActiveRecurringSchedules = async (tx?: DBTransaction): Promise<RecurringScheduleRow[]> => {
    const queryDb = tx ?? db;
    return await queryDb
      .select({
        id: recurringSchedules.id,
        studentId: recurringSchedules.studentId,
        teacherId: recurringSchedules.teacherId,
        studentName: students.name,
        teacherName: users.name,
        defaultStartTime: recurringSchedules.defaultStartTime,
        timezone: recurringSchedules.timezone,
        utcOffsetSnapshot: recurringSchedules.utcOffsetSnapshot,
      })
      .from(recurringSchedules)
      .innerJoin(students, eq(recurringSchedules.studentId, students.id))
      .innerJoin(teachers, eq(recurringSchedules.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(isNull(recurringSchedules.deletedAt));
  };

  export const checkConflictingSchedules = async (
    teacherId: string,
    defaultStartTime: string,
    tx?: DBTransaction
  ): Promise<{ id: string }[]> => {
    const queryDb = tx ?? db;
    return await queryDb
      .select({ id: recurringSchedules.id })
      .from(recurringSchedules)
      .where(
        and(
          eq(recurringSchedules.teacherId, teacherId),
          eq(recurringSchedules.defaultStartTime, defaultStartTime),
          isNull(recurringSchedules.deletedAt)
        )
      );
  };

  export const recordMigrationEntry = async (
    runId: string,
    recurringScheduleId: string,
    result: "UPDATED" | "CONFLICT" | "UNCHANGED",
    conflictDetail: string | null,
    tx?: DBTransaction
  ) => {
    const queryDb = tx ?? db;
    await queryDb.insert(dstMigrationEntries).values({
      runId,
      recurringScheduleId,
      result,
      conflictDetail,
    });
  };

  export const updateRecurringScheduleTime = async (
    scheduleId: string,
    newStartTime: string,
    newOffset: number,
    tx?: DBTransaction
  ) => {
    const queryDb = tx ?? db;
    const now = new Date();
    await queryDb
      .update(recurringSchedules)
      .set({
        defaultStartTime: newStartTime,
        utcOffsetSnapshot: newOffset,
        updatedAt: now,
      })
      .where(eq(recurringSchedules.id, scheduleId));
  };

  export const runTransaction = async <T>(cb: (tx: DBTransaction) => Promise<T>): Promise<T> => {
    return await db.transaction(cb);
  };
  export const findRunByUserId = async (runByUserId: string, tx?: DBTransaction) => {
    const queryDb = tx ?? db;
    const [run] = await queryDb
      .select()
      .from(dstMigrationRuns)
      .where(eq(dstMigrationRuns.runByUserId, runByUserId))
      .limit(1);
    return run ?? null;
  };

  export const findEntriesByScheduleIds = async (scheduleIds: readonly string[], tx?: DBTransaction) => {
    if (scheduleIds.length === 0) return [];
    const queryDb = tx ?? db;
    return queryDb
      .select()
      .from(dstMigrationEntries)
      .where(inArray(dstMigrationEntries.recurringScheduleId, [...scheduleIds]));
  };

  export const createManyEntries = async (
    inputs: {
      runId: string;
      recurringScheduleId: string;
      result: "UPDATED" | "CONFLICT" | "UNCHANGED";
      conflictDetail: string | null;
    }[],
    tx?: DBTransaction
  ) => {
    if (inputs.length === 0) return [];
    const queryDb = tx ?? db;
    return queryDb.insert(dstMigrationEntries).values(inputs).returning();
  };
}
