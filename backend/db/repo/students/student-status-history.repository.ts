import { eq, inArray } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { studentStatusHistory } from "@/backend/db/schema/students/students";
import type { StudentStatus } from "@/backend/enum";
import type { StudentStatusHistorySelectType } from "@/backend/types";

export type StudentStatusHistoryRow = StudentStatusHistorySelectType;

export type CreateInitialStatusHistoryInput = {
  studentId: string;
  newStatus: StudentStatus;
  changedByUserId: string | null;
  createdAt: Date;
};

export namespace StudentStatusHistoryRepository {
  export async function findByStudentIds(studentIds: string[], tx?: DBTransaction): Promise<StudentStatusHistoryRow[]> {
    if (studentIds.length === 0) return [];
    const q = queryDb(tx);
    return q.select().from(studentStatusHistory).where(inArray(studentStatusHistory.studentId, studentIds));
  }

  export async function createManyIfMissing(
    inputs: readonly CreateInitialStatusHistoryInput[],
    tx?: DBTransaction
  ): Promise<StudentStatusHistoryRow[]> {
    if (inputs.length === 0) return [];
    const executor = tx ?? db;
    const studentIds = inputs.map(i => i.studentId);
    const existing = await findByStudentIds(studentIds, tx);
    const existingStudentIds = new Set(existing.map(r => r.studentId));
    const toInsert = inputs.filter(input => !existingStudentIds.has(input.studentId));

    const inserted: StudentStatusHistoryRow[] = [];

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
  ): Promise<StudentStatusHistoryRow | null> {
    const q = queryDb(tx);
    const [row] = await q
      .select()
      .from(studentStatusHistory)
      .where(eq(studentStatusHistory.studentId, studentId))
      .limit(1);
    return row ?? null;
  }
}
