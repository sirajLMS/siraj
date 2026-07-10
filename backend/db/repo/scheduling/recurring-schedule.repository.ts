import { and, eq, inArray, isNull } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { teachers, users } from "@/backend/db/schema";
import { recurringScheduleDays, recurringSchedules } from "@/backend/db/schema/classes/scheduling";
import { students } from "@/backend/db/schema/students/students";
import type {
  RecurringScheduleDayEntity,
  RecurringScheduleDayInsertInput,
  RecurringScheduleEntity,
  RecurringScheduleInsertInput,
} from "@/backend/types";

export type RecurringScheduleUpsertInput = Omit<
  RecurringScheduleInsertInput,
  "id" | "createdAt" | "updatedAt" | "deletedAt"
> & { studentId: string };

export type RecurringScheduleDayUpsertInput = {
  recurringScheduleId: string;
  dayOfWeek: RecurringScheduleDayInsertInput["dayOfWeek"];
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

export namespace RecurringScheduleRepository {
  export async function findById(id: string, tx?: DBTransaction) {
    const queryDb = tx ?? db;
    const [row] = await queryDb
      .select({
        schedule: recurringSchedules,
        studentName: students.name,
        teacherUserName: users.name,
      })
      .from(recurringSchedules)
      .innerJoin(students, eq(recurringSchedules.studentId, students.id))
      .innerJoin(teachers, eq(recurringSchedules.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(and(eq(recurringSchedules.id, id), isNull(recurringSchedules.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  export async function findDaysByScheduleId(recurringScheduleId: string, tx?: DBTransaction) {
    const queryDb = tx ?? db;
    return queryDb
      .select()
      .from(recurringScheduleDays)
      .where(eq(recurringScheduleDays.recurringScheduleId, recurringScheduleId));
  }

  export async function listByStudentIds(
    studentIds: readonly string[],
    tx?: DBTransaction
  ): Promise<RecurringScheduleEntity[]> {
    if (studentIds.length === 0) return [];
    const queryDb = tx ?? db;
    return queryDb
      .select()
      .from(recurringSchedules)
      .where(inArray(recurringSchedules.studentId, [...studentIds]));
  }

  export async function upsertMany(
    inputs: readonly RecurringScheduleUpsertInput[],
    tx?: DBTransaction
  ): Promise<RecurringScheduleEntity[]> {
    if (inputs.length === 0) return [];
    const now = new Date();

    return runInTransaction(tx, async t => {
      const results: RecurringScheduleEntity[] = [];
      for (const input of inputs) {
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
              durationMinutes: input.durationMinutes,
              defaultStartTime: input.defaultStartTime,
              timezone: input.timezone,
              effectiveFrom: input.effectiveFrom,
              effectiveUntil: input.effectiveUntil,
              updatedAt: now,
            })
            .where(eq(recurringSchedules.id, existing.id))
            .returning();
          results.push(updated);
          continue;
        }

        const [inserted] = await t
          .insert(recurringSchedules)
          .values({
            ...input,
            createdAt: now,
            updatedAt: now,
          })
          .returning();
        results.push(inserted);
      }
      return results;
    });
  }

  export async function findDaysByKeys(
    keys: readonly { recurringScheduleId: string; dayOfWeek: RecurringScheduleDayInsertInput["dayOfWeek"] }[],
    tx?: DBTransaction
  ): Promise<Map<ScheduleDayKey, RecurringScheduleDayEntity>> {
    const map = new Map<ScheduleDayKey, RecurringScheduleDayEntity>();
    if (keys.length === 0) return map;

    const scheduleIds = [...new Set(keys.map(key => key.recurringScheduleId))];
    const queryDb = tx ?? db;
    const rows = await queryDb
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
  ): Promise<RecurringScheduleDayEntity[]> {
    if (inputs.length === 0) return [];

    return runInTransaction(tx, async t => {
      const results: RecurringScheduleDayEntity[] = [];
      for (const input of inputs) {
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
        results.push(row);
      }
      return results;
    });
  }
}
