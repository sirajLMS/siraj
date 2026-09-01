import { inArray } from "drizzle-orm";
import { db, isSqlite, queryDb } from "@/backend/db";
import { studentStatusHistory } from "@/backend/db/schema";
import type {
  CreateInitialStatusHistoryInput,
  DBTransaction,
  LogStatusTransitionInput,
  StudentStatusHistorySelectType,
} from "@/backend/types";
export namespace StudentStatusHistoryRepository {
  async function findByStudentIds(studentIds: string[], tx?: DBTransaction): Promise<StudentStatusHistorySelectType[]> {
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

  /**
   * App-layer SQLite fallback for the PG-only `trg_log_student_status_history` trigger.
   *
   * On PostgreSQL, the trigger auto-logs status transitions on UPDATE. SQLite cannot
   * register the trigger (it uses `current_user_id()` session var + plpgsql), so the
   * app layer must log the transition explicitly.
   *
   * This is a NO-OP on PostgreSQL (the trigger handles it; avoids double-logging).
   * Service-layer callers should invoke this after a successful student status update
   * when running on SQLite, passing the OLD and NEW status + the acting user.
   */
  export async function logTransitionIfSqlite(input: LogStatusTransitionInput, tx?: DBTransaction): Promise<void> {
    if (!isSqlite()) return;
    if (input.oldStatus === input.newStatus) return;
    const executor = tx ?? db;
    await executor.insert(studentStatusHistory).values({
      studentId: input.studentId,
      oldStatus: input.oldStatus,
      newStatus: input.newStatus,
      changedByUserId: input.changedByUserId,
      createdAt: input.createdAt,
    });
  }
}
