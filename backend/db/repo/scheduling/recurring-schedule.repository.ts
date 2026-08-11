import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/db/db.types";
import { db, type QueryDbHandle } from "@/backend/db/drizzleDb";
import { teachers, users } from "@/backend/db/schema";
import { recurringScheduleDays, recurringSchedules } from "@/backend/db/schema/classes/scheduling";
import { students } from "@/backend/db/schema/students/students";
import type {
  RecurringScheduleDayInsertType,
  RecurringScheduleDaySelectType,
  RecurringScheduleInsertType,
  RecurringScheduleSelectType,
} from "@/backend/types";

export type RecurringScheduleUpsertInput = Omit<
  RecurringScheduleInsertType,
  "id" | "createdAt" | "updatedAt" | "deletedAt"
> & { studentId: string };

export type RecurringScheduleDayUpsertInput = {
  recurringScheduleId: string;
  dayOfWeek: RecurringScheduleDayInsertType["dayOfWeek"];
  startTime: string;
  isActive: boolean;
};

export type ScheduleDayKey = `${string}:${string}`;

function toScheduleDayKey(recurringScheduleId: string, dayOfWeek: string): ScheduleDayKey {
  return `${recurringScheduleId}:${dayOfWeek}`;
}

async function runInTransaction<T>(tx: DBTransaction | undefined, fn: (t: DBTransaction) => Promise<T>): Promise<T> {
  return tx ? fn(tx) : db.transaction(fn);
}

/**
 * Shared inner-join chain from recurringSchedules → students → teachers → users.
 * Callers add their own `.select()` clause before this builder.
 */
function recurringScheduleBaseQuery(q: QueryDbHandle | DBTransaction) {
  return q
    .select({
      schedule: recurringSchedules,
      studentName: students.name,
      teacherUserName: users.name,
    })
    .from(recurringSchedules)
    .innerJoin(students, eq(recurringSchedules.studentId, students.id))
    .innerJoin(teachers, eq(recurringSchedules.teacherId, teachers.id))
    .innerJoin(users, eq(teachers.userId, users.id));
}

export namespace RecurringScheduleRepository {
  export async function findById(id: string, tx?: DBTransaction) {
    const q = queryDb(tx);
    const [row] = await recurringScheduleBaseQuery(q)
      .where(and(eq(recurringSchedules.id, id), isNull(recurringSchedules.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  export async function findDaysByScheduleId(recurringScheduleId: string, tx?: DBTransaction) {
    const q = queryDb(tx);
    return q
      .select()
      .from(recurringScheduleDays)
      .where(eq(recurringScheduleDays.recurringScheduleId, recurringScheduleId));
  }

  export async function listByStudentIds(
    studentIds: readonly string[],
    tx?: DBTransaction
  ): Promise<RecurringScheduleSelectType[]> {
    if (studentIds.length === 0) return [];
    const q = queryDb(tx);
    return q
      .select()
      .from(recurringSchedules)
      .where(inArray(recurringSchedules.studentId, [...studentIds]));
  }

  export async function upsertMany(
    inputs: readonly RecurringScheduleUpsertInput[],
    tx?: DBTransaction
  ): Promise<RecurringScheduleSelectType[]> {
    if (inputs.length === 0) return [];
    const now = new Date();

    return runInTransaction(tx, async t => {
      // NOTE: N+1 pattern — per-input SELECT then UPDATE-or-INSERT. Should batch existence check with inArray SELECT
      const results = await Promise.all(
        inputs.map(async input => {
          const [existing] = await t
            .select()
            .from(recurringSchedules)
            .where(eq(recurringSchedules.studentId, input.studentId))
            .limit(1);

          if (existing) {
            const [updated] = await t
              .update(recurringSchedules)
              .set({
                teacherId: input.teacherId,
                subjectId: input.subjectId,
                durationMinutes: input.durationMinutes,
                defaultStartTime: input.defaultStartTime,
                timezone: input.timezone,
                effectiveFrom: input.effectiveFrom,
                effectiveUntil: input.effectiveUntil,
                hourlyRate: input.hourlyRate === undefined ? existing.hourlyRate : input.hourlyRate,
                rateCurrency: input.rateCurrency === undefined ? existing.rateCurrency : input.rateCurrency,
                updatedAt: now,
              })
              .where(eq(recurringSchedules.id, existing.id))
              .returning();
            return updated;
          }

          const [inserted] = await t
            .insert(recurringSchedules)
            .values({
              ...input,
              createdAt: now,
              updatedAt: now,
            })
            .returning();
          return inserted;
        })
      );
      return results;
    });
  }

  export async function updateRate(
    recurringScheduleId: string,
    hourlyRate: string | null,
    rateCurrency: RecurringScheduleSelectType["rateCurrency"],
    tx?: DBTransaction
  ): Promise<RecurringScheduleSelectType | null> {
    const q = queryDb(tx);
    const now = new Date();
    const [updated] = await q
      .update(recurringSchedules)
      .set({ hourlyRate, rateCurrency, updatedAt: now })
      .where(eq(recurringSchedules.id, recurringScheduleId))
      .returning();
    return updated ?? null;
  }

  export async function findDaysByKeys(
    keys: readonly { recurringScheduleId: string; dayOfWeek: RecurringScheduleDayInsertType["dayOfWeek"] }[],
    tx?: DBTransaction
  ): Promise<Map<ScheduleDayKey, RecurringScheduleDaySelectType>> {
    const map = new Map<ScheduleDayKey, RecurringScheduleDaySelectType>();
    if (keys.length === 0) return map;

    const scheduleIds = [...new Set(keys.map(key => key.recurringScheduleId))];
    const q = queryDb(tx);
    const rows = await q
      .select()
      .from(recurringScheduleDays)
      .where(inArray(recurringScheduleDays.recurringScheduleId, scheduleIds));

    const keySet = new Set(keys.map(key => toScheduleDayKey(key.recurringScheduleId, key.dayOfWeek)));
    for (const row of rows) {
      const key = toScheduleDayKey(row.recurringScheduleId, row.dayOfWeek);
      if (keySet.has(key)) {
        map.set(key, row);
      }
    }
    return map;
  }

  export async function upsertManyDays(
    inputs: readonly RecurringScheduleDayUpsertInput[],
    tx?: DBTransaction
  ): Promise<RecurringScheduleDaySelectType[]> {
    if (inputs.length === 0) return [];

    return runInTransaction(tx, async t => {
      const results = await Promise.all(
        inputs.map(async input => {
          const [row] = await t
            .insert(recurringScheduleDays)
            .values(input)
            .onConflictDoUpdate({
              target: [recurringScheduleDays.recurringScheduleId, recurringScheduleDays.dayOfWeek],
              set: {
                startTime: input.startTime,
                isActive: input.isActive,
              },
            })
            .returning();
          return row;
        })
      );
      return results;
    });
  }

  /**
   * V3-021: Soft-delete a recurring schedule by setting `deletedAt` and `updatedAt`.
   */
  export async function softDelete(id: string, tx?: DBTransaction): Promise<void> {
    const now = new Date();
    const q = queryDb(tx);
    await q.update(recurringSchedules).set({ deletedAt: now, updatedAt: now }).where(eq(recurringSchedules.id, id));
  }

  /**
   * V3-021: Update the scheduling mode of a recurring schedule.
   */
  export async function updateSchedulingMode(id: string, mode: string, tx?: DBTransaction): Promise<void> {
    const now = new Date();
    const q = queryDb(tx);
    await q
      .update(recurringSchedules)
      .set({ schedulingMode: mode, updatedAt: now })
      .where(eq(recurringSchedules.id, id));
  }

  export async function findAll(
    tx?: DBTransaction,
    options?: {
      page?: number;
      pageSize?: number;
      search?: string;
    }
  ): Promise<{ rows: RecurringScheduleSelectType[]; totalCount: number }> {
    const q = queryDb(tx);
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const whereConditions = [isNull(recurringSchedules.deletedAt)];

    if (options?.search) {
      const searchPattern = `%${options.search}%`;
      whereConditions.push(sql`(${students.name} ILIKE ${searchPattern} OR ${users.name} ILIKE ${searchPattern})`);
    }

    const [rows, [{ count: totalCount }]] = await Promise.all([
      recurringScheduleBaseQuery(q)
        .where(and(...whereConditions))
        .orderBy(desc(recurringSchedules.createdAt))
        .limit(pageSize)
        .offset(offset),
      q
        .select({ count: sql<number>`count(*)` })
        .from(recurringSchedules)
        .innerJoin(students, eq(recurringSchedules.studentId, students.id))
        .innerJoin(teachers, eq(recurringSchedules.teacherId, teachers.id))
        .innerJoin(users, eq(teachers.userId, users.id))
        .where(and(...whereConditions)),
    ]);

    return {
      rows: rows.map(row =>
        Object.assign(row.schedule, {
          studentName: row.studentName,
          teacherUserName: row.teacherUserName,
        })
      ),
      totalCount: totalCount,
    };
  }
}
