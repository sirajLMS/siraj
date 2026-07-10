import { eq, inArray } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { studentStatusHistory } from "@/backend/db/schema/students/students";
import type { StudentStatus } from "@/backend/enum";

export type StudentStatusHistoryRow = typeof studentStatusHistory.$inferSelect;

export type CreateInitialStatusHistoryInput = {
  studentId: string;
  newStatus: StudentStatus;
  changedByUserId: string | null;
  createdAt: Date;
};

export namespace StudentStatusHistoryRepository {
  export async function findByStudentIds(studentIds: string[], tx?: DBTransaction): Promise<StudentStatusHistoryRow[]> {
    if (studentIds.length === 0) return [];
    const executor = tx ?? db;
    return executor.select().from(studentStatusHistory).where(inArray(studentStatusHistory.studentId, studentIds));
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
    const results = [...existing];

    for (const input of inputs) {
      if (existingStudentIds.has(input.studentId)) continue;
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
      if (row) results.push(row);
    }
    return results;
  }

  export async function findFirstByStudentId(
    studentId: string,
    tx?: DBTransaction
  ): Promise<StudentStatusHistoryRow | null> {
    const executor = tx ?? db;
    const [row] = await executor
      .select()
      .from(studentStatusHistory)
      .where(eq(studentStatusHistory.studentId, studentId))
      .limit(1);
    return row ?? null;
  }
}
