import { and, eq, sql } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { leaveQuotaUsage, teachers } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";

export async function getTeacherLeaveQuotaUsage(
  teacherId: string,
  periodYear: number,
  periodMonth: number,
  tx?: DBTransaction
): Promise<number> {
  const queryDb = tx ?? db;
  const [row] = await queryDb
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

export async function incrementTeacherLeaveQuota(
  teacherId: string,
  tx?: DBTransaction,
  locale?: string
): Promise<void> {
  const now = new Date();
  const periodYear = now.getUTCFullYear();
  const periodMonth = now.getUTCMonth() + 1;

  const queryDb = tx ?? db;

  try {
    const [updated] = await queryDb
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
      await queryDb.insert(leaveQuotaUsage).values({
        teacherId,
        periodYear,
        periodMonth,
        usedCount: 1,
      });
    }
  } catch (error) {
    if (error instanceof Error && (error as { code?: string }).code === "P0001") {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("leaveQuotaExceeded", { maxLeaves: "2" }), { cause: error });
    }
    throw error;
  }
}

export async function getTeacherByUserId(
  userId: string,
  tx?: DBTransaction
): Promise<{ id: string; userId: string } | null> {
  const queryDb = tx ?? db;
  const [row] = await queryDb
    .select({ id: teachers.id, userId: teachers.userId })
    .from(teachers)
    .where(eq(teachers.userId, userId))
    .limit(1);

  return row ?? null;
}
