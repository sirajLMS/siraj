import { and, eq, isNull } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import { db } from "@/backend/db/drizzleDb";
import { leaveQuotaUsage } from "@/backend/db/schema/classes/scheduling";
import type { DBTransaction } from "@/backend/types";
import type { UpsertStudentLeaveQuotaInput } from "@/backend/types/scheduling/scheduling.types";

export type LeaveQuotaUsageRow = typeof leaveQuotaUsage.$inferSelect;

export namespace LeaveQuotaUsageRepository {
  export async function findStudentPeriodQuota(
    studentId: string,
    periodYear: number,
    periodMonth: number,
    tx?: DBTransaction
  ): Promise<LeaveQuotaUsageRow | null> {
    const executor = queryDb(tx);
    const [row] = await executor
      .select()
      .from(leaveQuotaUsage)
      .where(
        and(
          eq(leaveQuotaUsage.studentId, studentId),
          eq(leaveQuotaUsage.periodYear, periodYear),
          eq(leaveQuotaUsage.periodMonth, periodMonth),
          isNull(leaveQuotaUsage.teacherId)
        )
      )
      .limit(1);
    return row ?? null;
  }

  export async function upsertStudentPeriodQuota(
    input: UpsertStudentLeaveQuotaInput,
    tx?: DBTransaction
  ): Promise<LeaveQuotaUsageRow> {
    const executor = tx ?? db;
    const existing = await findStudentPeriodQuota(input.studentId, input.periodYear, input.periodMonth, tx);
    if (existing) {
      const [updated] = await executor
        .update(leaveQuotaUsage)
        .set({ usedCount: input.usedCount })
        .where(eq(leaveQuotaUsage.id, existing.id))
        .returning();
      if (!updated) throw new Error("Leave quota update failed");
      return updated;
    }
    const [inserted] = await executor
      .insert(leaveQuotaUsage)
      .values({
        studentId: input.studentId,
        teacherId: null,
        periodYear: input.periodYear,
        periodMonth: input.periodMonth,
        usedCount: input.usedCount,
      })
      .returning();
    if (!inserted) throw new Error("Leave quota insert failed");
    return inserted;
  }
}
