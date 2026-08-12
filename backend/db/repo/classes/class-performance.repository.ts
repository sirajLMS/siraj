import { eq, inArray } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/types";
import { db } from "@/backend/db/drizzleDb";
import { classInstancePerformance } from "@/backend/db/schema/classes/scheduling";
import type {
  ClassInstancePerformanceInsertType,
  ClassInstancePerformanceSelectType,
} from "@/backend/types/classes/class-instance-performance.types";

async function upsertOne(
  t: DBTransaction,
  input: ClassInstancePerformanceInsertType
): Promise<ClassInstancePerformanceSelectType> {
  const [upserted] = await t
    .insert(classInstancePerformance)
    .values(input)
    .onConflictDoUpdate({
      target: classInstancePerformance.classInstanceId,
      set: {
        engagementScore: input.engagementScore,
        assessmentProgress: input.assessmentProgress,
        assessmentTotal: input.assessmentTotal,
        focusLevel: input.focusLevel,
        sessionHealth: input.sessionHealth,
        heatmapData: input.heatmapData,
        latencyMs: input.latencyMs,
        attendanceRate: input.attendanceRate,
        avgGrade: input.avgGrade,
        lastClassDaysAgo: input.lastClassDaysAgo,
        updatedAt: input.updatedAt,
      },
    })
    .returning();
  return upserted;
}

export namespace ClassPerformanceRepository {
  export async function getByClassInstanceId(
    classInstanceId: string,
    tx?: DBTransaction
  ): Promise<ClassInstancePerformanceSelectType | null> {
    const q = queryDb(tx);
    const [row] = await q
      .select()
      .from(classInstancePerformance)
      .where(eq(classInstancePerformance.classInstanceId, classInstanceId))
      .limit(1);

    return row ?? null;
  }

  export async function upsertForClassInstance(
    classInstanceId: string,
    input: Omit<ClassInstancePerformanceInsertType, "classInstanceId" | "createdAt" | "updatedAt">,
    tx?: DBTransaction
  ): Promise<ClassInstancePerformanceSelectType> {
    const runner = async (t: DBTransaction) => {
      const now = new Date();
      const [upserted] = await t
        .insert(classInstancePerformance)
        .values({
          ...input,
          classInstanceId,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: classInstancePerformance.classInstanceId,
          set: {
            ...input,
            updatedAt: now,
          },
        })
        .returning();

      return upserted;
    };

    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  }

  export async function listByClassInstanceIds(
    classInstanceIds: readonly string[],
    tx?: DBTransaction
  ): Promise<Map<string, ClassInstancePerformanceSelectType>> {
    const map = new Map<string, ClassInstancePerformanceSelectType>();
    if (classInstanceIds.length === 0) return map;

    const q = queryDb(tx);
    const rows = await q
      .select()
      .from(classInstancePerformance)
      .where(inArray(classInstancePerformance.classInstanceId, [...classInstanceIds]));

    for (const row of rows) {
      map.set(row.classInstanceId, row);
    }
    return map;
  }

  export async function upsertMany(
    inputs: readonly ClassInstancePerformanceInsertType[],
    tx?: DBTransaction
  ): Promise<ClassInstancePerformanceSelectType[]> {
    if (inputs.length === 0) return [];

    const runner = async (t: DBTransaction): Promise<ClassInstancePerformanceSelectType[]> => {
      const results = await inputs.reduce<Promise<ClassInstancePerformanceSelectType[]>>(async (prev, input) => {
        const accumulated = await prev;
        const upserted = await upsertOne(t, input);
        return [...accumulated, upserted];
      }, Promise.resolve([]));
      return results;
    };

    return tx ? runner(tx) : db.transaction(runner);
  }
}
