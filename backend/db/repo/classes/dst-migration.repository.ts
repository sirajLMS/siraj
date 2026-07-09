import { and, eq, isNull } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import {
  dstMigrationEntries,
  dstMigrationRuns,
  recurringSchedules,
  students,
  teachers,
  users,
} from "@/backend/db/schema";

export namespace DstMigrationRepository {
  export type RecurringScheduleRow = {
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
}
