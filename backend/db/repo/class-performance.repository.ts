import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { classInstancePerformance } from "@/backend/db/schema/scheduling";
import type {
  ClassInstancePerformanceInsertType,
  ClassInstancePerformanceSelectType,
} from "@/backend/types/class-instance-performance.types";

export namespace ClassPerformanceRepository {
  export async function getByClassInstanceId(
    classInstanceId: string,
    tx?: DBTransaction
  ): Promise<ClassInstancePerformanceSelectType | null> {
    const queryDb = tx ?? db;
    const [row] = await queryDb
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
}
