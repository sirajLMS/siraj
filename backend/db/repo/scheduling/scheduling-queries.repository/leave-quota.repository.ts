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
    await queryDb.execute(sql`
      INSERT INTO leave_quota_usage (teacher_id, period_year, period_month, used_count)
      VALUES (${teacherId}, ${periodYear}, ${periodMonth}, 1)
      ON CONFLICT (teacher_id, period_year, period_month) WHERE teacher_id IS NOT NULL
      DO UPDATE SET used_count = leave_quota_usage.used_count + 1
    `);
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
