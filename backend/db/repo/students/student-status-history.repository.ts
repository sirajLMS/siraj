import { eq, inArray } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import { studentStatusHistory } from "@/backend/db/schema";
import type { CreateInitialStatusHistoryInput, DBTransaction, StudentStatusHistorySelectType } from "@/backend/types";
export namespace StudentStatusHistoryRepository {
  export async function findByStudentIds(
    studentIds: string[],
    tx?: DBTransaction
  ): Promise<StudentStatusHistorySelectType[]> {
    if (studentIds.length === 0) return [];
    const q = queryDb(tx);
    return q.select().from(studentStatusHistory).where(inArray(studentStatusHistory.studentId, studentIds));
  }

  export async function createManyIfMissing(
    inputs: readonly CreateInitialStatusHistoryInput[],
    tx?: DBTransaction
  ): Promise<StudentStatusHistorySelectType[]> {
    if (inputs.length === 0) return [];
    const executor = tx ?? db;
    const studentIds = inputs.map(i => i.studentId);
    const existing = await findByStudentIds(studentIds, tx);
    const existingStudentIds = new Set(existing.map(r => r.studentId));
    const toInsert = inputs.filter(input => !existingStudentIds.has(input.studentId));

    const inserted: StudentStatusHistorySelectType[] = [];

    async function processNext(index: number): Promise<void> {
      if (index >= toInsert.length) return;
      const input = toInsert[index];
      const [row] = await executor
        .insert(studentStatusHistory)
        .values({
          studentId: input.studentId,
          oldStatus: null,
          newStatus: input.newStatus,
          changedByUserId: input.changedByUserId,
          createdAt: input.createdAt,
        })
        .returning();
      if (row) inserted.push(row);
      return processNext(index + 1);
    }

    await processNext(0);

    return [...existing, ...inserted];
  }

  export async function findFirstByStudentId(
    studentId: string,
    tx?: DBTransaction
  ): Promise<StudentStatusHistorySelectType | null> {
    const q = queryDb(tx);
    const [row] = await q
      .select()
      .from(studentStatusHistory)
      .where(eq(studentStatusHistory.studentId, studentId))
      .limit(1);
    return row ?? null;
  }
}
