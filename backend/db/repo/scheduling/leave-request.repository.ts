import { eq, inArray } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import { leaveRequests } from "@/backend/db/schema";
import type { CreateLeaveRequestInput, DBTransaction, LeaveRequestSelectType } from "@/backend/types";

export namespace LeaveRequestRepository {
  export async function findByClassInstanceIds(
    classInstanceIds: string[],
    tx?: DBTransaction
  ): Promise<LeaveRequestSelectType[]> {
    if (classInstanceIds.length === 0) return [];
    const executor = queryDb(tx);
    return executor.select().from(leaveRequests).where(inArray(leaveRequests.classInstanceId, classInstanceIds));
  }

  export async function createManyIfMissing(
    inputs: readonly CreateLeaveRequestInput[],
    tx?: DBTransaction
  ): Promise<LeaveRequestSelectType[]> {
    if (inputs.length === 0) return [];
    const executor = tx ?? db;
    const classInstanceIds = inputs.map(i => i.classInstanceId).filter((id): id is string => Boolean(id));
    const existing = await findByClassInstanceIds(classInstanceIds, tx);
    const existingByClass = new Map(existing.map(r => [r.classInstanceId, r]));
    const results: LeaveRequestSelectType[] = [...existing];

    const processNext = async (index: number): Promise<void> => {
      if (index >= inputs.length) return;
      const input = inputs[index];
      if (!input?.classInstanceId) return processNext(index + 1);
      const found = existingByClass.get(input.classInstanceId);
      if (found) {
        if (!results.some(r => r.id === found.id)) results.push(found);
        return processNext(index + 1);
      }
      const [row] = await executor.insert(leaveRequests).values(input).returning();
      if (row) {
        results.push(row);
        existingByClass.set(input.classInstanceId, row);
      }
      return processNext(index + 1);
    };
    await processNext(0);
    return results;
  }

  export async function findByClassInstanceId(
    classInstanceId: string,
    tx?: DBTransaction
  ): Promise<LeaveRequestSelectType | null> {
    const executor = queryDb(tx);
    const [row] = await executor
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.classInstanceId, classInstanceId))
      .limit(1);
    return row ?? null;
  }
}
