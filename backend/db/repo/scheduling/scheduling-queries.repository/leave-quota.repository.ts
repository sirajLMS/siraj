import { and, eq, sql } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import { leaveQuotaUsage, teachers } from "@/backend/db/schema";
import type { DBTransaction } from "@/backend/types";

export async function getTeacherLeaveQuotaUsage(
  teacherId: string,
  periodYear: number,
  periodMonth: number,
  tx?: DBTransaction
): Promise<number> {
  const q = queryDb(tx);
  const [row] = await q
    .select({ usedCount: leaveQuotaUsage.usedCount })
    .from(leaveQuotaUsage)
    .where(
      and(
        eq(leaveQuotaUsage.teacherId, teacherId),
        eq(leaveQuotaUsage.periodYear, periodYear),
        eq(leaveQuotaUsage.periodMonth, periodMonth)
      )
    )
    .limit(1);

  return row?.usedCount ?? 0;
}

export async function incrementTeacherLeaveQuota(teacherId: string, tx: DBTransaction): Promise<void> {
  const now = new Date();
  const periodYear = now.getUTCFullYear();
  const periodMonth = now.getUTCMonth() + 1;

  const dbToQuery = tx ?? db;

  const maxLeavesPerMonth = 2;
  const currentUsage = await getTeacherLeaveQuotaUsage(teacherId, periodYear, periodMonth, tx);
  if (currentUsage >= maxLeavesPerMonth) {
    throw new Error(
      `Leave quota exceeded: ${currentUsage}/${maxLeavesPerMonth} for ${periodYear}-${String(periodMonth).padStart(2, "0")}`
    );
  }

  const [updated] = await dbToQuery
    .update(leaveQuotaUsage)
    .set({ usedCount: sql`${leaveQuotaUsage.usedCount} + 1` })
    .where(
      and(
        eq(leaveQuotaUsage.teacherId, teacherId),
        eq(leaveQuotaUsage.periodYear, periodYear),
        eq(leaveQuotaUsage.periodMonth, periodMonth)
      )
    )
    .returning({ id: leaveQuotaUsage.id });

  if (!updated) {
    await dbToQuery.insert(leaveQuotaUsage).values({
      teacherId,
      periodYear,
      periodMonth,
      usedCount: 1,
    });
  }
}

export async function getTeacherByUserId(
  userId: string,
  tx?: DBTransaction
): Promise<{ id: string; userId: string } | null> {
  const q = queryDb(tx);
  const [row] = await q
    .select({ id: teachers.id, userId: teachers.userId })
    .from(teachers)
    .where(eq(teachers.userId, userId))
    .limit(1);

  return row ?? null;
}
