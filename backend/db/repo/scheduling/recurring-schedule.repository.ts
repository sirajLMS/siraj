import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db, type QueryDbHandle, queryDb } from "@/backend/db";
import { recurringScheduleDays, recurringSchedules, students, teachers, users } from "@/backend/db/schema";
import type {
  DBTransaction,
  RecurringScheduleDaySelectType,
  RecurringScheduleDayUpsertInput,
  RecurringScheduleSelectType,
  RecurringScheduleUpsertInput,
} from "@/backend/types";
import { escapeLikeWildcards } from "@/backend/utils";

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

  export async function upsertMany(
    inputs: readonly RecurringScheduleUpsertInput[],
    tx?: DBTransaction
  ): Promise<RecurringScheduleSelectType[]> {
    if (inputs.length === 0) return [];
    const now = new Date();

    return runInTransaction(tx, async t => {
      return inputs.reduce(async (prevPromise, input) => {
        const acc = await prevPromise;
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
          if (updated) acc.push(updated);
        } else {
          const [inserted] = await t
            .insert(recurringSchedules)
            .values({
              ...input,
              createdAt: now,
              updatedAt: now,
            })
            .returning();
          if (inserted) acc.push(inserted);
        }
        return acc;
      }, Promise.resolve<RecurringScheduleSelectType[]>([]));
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

  export async function upsertManyDays(
    inputs: readonly RecurringScheduleDayUpsertInput[],
    tx?: DBTransaction
  ): Promise<RecurringScheduleDaySelectType[]> {
    if (inputs.length === 0) return [];

    return runInTransaction(tx, async t => {
      return inputs.reduce(async (prevPromise, input) => {
        const acc = await prevPromise;
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
        if (row) acc.push(row);
        return acc;
      }, Promise.resolve<RecurringScheduleDaySelectType[]>([]));
    });
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
      const searchPattern = `%${escapeLikeWildcards(options.search)}%`;
      whereConditions.push(sql`(${students.name} ILIKE ${searchPattern} OR ${users.name} ILIKE ${searchPattern})`);
    }

    const [rows, [{ count: totalCount }]] = await Promise.all([
      recurringScheduleBaseQuery(q)
        .where(and(...whereConditions))
        .orderBy(desc(recurringSchedules.createdAt))
        .limit(pageSize)
        .offset(offset),
      q
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
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
