import { eq, inArray } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/types";
import { db } from "@/backend/db/drizzleDb";
import { leaveRequests } from "@/backend/db/schema/classes/scheduling";
import type { LeaveRequesterType, LeaveRequestStatus } from "@/backend/enum";

export type LeaveRequestRow = typeof leaveRequests.$inferSelect;

export type CreateLeaveRequestInput = {
  classInstanceId: string;
  requestedByUserId: string;
  requesterType: LeaveRequesterType;
  reason: string;
  status: LeaveRequestStatus;
  createdAt: Date;
  processedAt: Date | null;
  processedByUserId: string | null;
};

export namespace LeaveRequestRepository {
  export async function findByClassInstanceIds(
    classInstanceIds: string[],
    tx?: DBTransaction
  ): Promise<LeaveRequestRow[]> {
    if (classInstanceIds.length === 0) return [];
    const executor = queryDb(tx);
    return executor.select().from(leaveRequests).where(inArray(leaveRequests.classInstanceId, classInstanceIds));
  }

  export async function createManyIfMissing(
    inputs: readonly CreateLeaveRequestInput[],
    tx?: DBTransaction
  ): Promise<LeaveRequestRow[]> {
    if (inputs.length === 0) return [];
    const executor = tx ?? db;
    const classInstanceIds = inputs.map(i => i.classInstanceId);
    const existing = await findByClassInstanceIds(classInstanceIds, tx);
    const existingByClass = new Map(existing.map(r => [r.classInstanceId, r]));
    const results: LeaveRequestRow[] = [...existing];

    const processNext = async (index: number): Promise<void> => {
      if (index >= inputs.length) return;
      const input = inputs[index];
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
  ): Promise<LeaveRequestRow | null> {
    const executor = queryDb(tx);
    const [row] = await executor
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.classInstanceId, classInstanceId))
      .limit(1);
    return row ?? null;
  }
}
