import { and, eq, isNull } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { leaveQuotaUsage } from "@/backend/db/schema/classes/scheduling";

export type LeaveQuotaUsageRow = typeof leaveQuotaUsage.$inferSelect;

export type UpsertStudentLeaveQuotaInput = {
  studentId: string;
  periodYear: number;
  periodMonth: number;
  usedCount: number;
};

export namespace LeaveQuotaUsageRepository {
  export async function findStudentPeriodQuota(
    studentId: string,
    periodYear: number,
    periodMonth: number,
    tx?: DBTransaction
  ): Promise<LeaveQuotaUsageRow | null> {
    const executor = tx ?? db;
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
