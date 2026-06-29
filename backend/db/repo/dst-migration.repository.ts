import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
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
import type { DstMigrationResult } from "@/shared/lib/enum";

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

  export const getRecentMigrationRun = async (offsetMinutes: number, tx?: DBTransaction) => {
    const queryDb = tx ?? db;
    const rows = await queryDb
      .select()
      .from(dstMigrationRuns)
      .where(
        and(
          eq(dstMigrationRuns.offsetMinutes, offsetMinutes),
          gte(dstMigrationRuns.createdAt, sql`NOW() - INTERVAL '7 days'`)
        )
      )
      .orderBy(desc(dstMigrationRuns.createdAt))
      .limit(1);
    return rows[0] ?? null;
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

  export const recordMigrationEntries = async (
    entries: Array<{
      runId: string;
      recurringScheduleId: string;
      result: DstMigrationResult;
      conflictDetail: string | null;
    }>,
    tx?: DBTransaction
  ) => {
    const queryDb = tx ?? db;
    if (entries.length === 0) return;
    await queryDb.insert(dstMigrationEntries).values(entries);
  };

  export const updateRecurringScheduleTimesBatch = async (
    updates: Array<{ scheduleId: string; newStartTime: string; newOffset: number }>,
    tx?: DBTransaction
  ) => {
    const queryDb = tx ?? db;
    const now = new Date();
    for (const update of updates) {
      await queryDb
        .update(recurringSchedules)
        .set({
          defaultStartTime: update.newStartTime,
          utcOffsetSnapshot: update.newOffset,
          updatedAt: now,
        })
        .where(eq(recurringSchedules.id, update.scheduleId));
    }
  };

  export const acquireMigrationLock = async (offsetMinutes: number, tx: DBTransaction): Promise<void> => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('dst_migration_' || ${offsetMinutes}::text))`);
  };

  export const runTransaction = async <T>(cb: (tx: DBTransaction) => Promise<T>): Promise<T> => {
    return await db.transaction(cb);
  };
}
