import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { leaveQuotaUsage } from "@/backend/db/schema/scheduling";
import { loadSeedConfig, type SeedConfig } from "@/backend/db/seeds/lib";
import logger from "@/backend/lib/logger";
import type { StudentEntity } from "@/backend/types";

type LeaveRequestRow = {
  createdAt: Date;
};

export async function seedOrGet(
  leaveRequestsList: LeaveRequestRow[],
  studentsList: StudentEntity[],
  config?: SeedConfig
) {
  logger.info("Seeding leave quota usage...");
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableExtendedScheduling || !leaveRequestsList?.length || !studentsList?.length) {
    return [];
  }

  const student = studentsList[0];
  const results = [];
  const periodCounts = new Map<string, number>();

  for (const lr of leaveRequestsList) {
    const year = lr.createdAt.getFullYear();
    const month = lr.createdAt.getMonth() + 1;
    const key = `${year}-${month}`;
    periodCounts.set(key, Math.min((periodCounts.get(key) ?? 0) + 1, 2));
  }

  for (const [periodKey, count] of periodCounts) {
    const [yearStr, monthStr] = periodKey.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);

    const [existing] = await db
      .select()
      .from(leaveQuotaUsage)
      .where(
        and(
          eq(leaveQuotaUsage.studentId, student.id),
          eq(leaveQuotaUsage.periodYear, year),
          eq(leaveQuotaUsage.periodMonth, month),
          isNull(leaveQuotaUsage.teacherId)
        )
      )
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(leaveQuotaUsage)
        .set({ usedCount: count })
        .where(eq(leaveQuotaUsage.id, existing.id))
        .returning();
      results.push(updated);
      continue;
    }

    const [inserted] = await db
      .insert(leaveQuotaUsage)
      .values({
        studentId: student.id,
        teacherId: null,
        periodYear: year,
        periodMonth: month,
        usedCount: count,
      })
      .returning();
    results.push(inserted);
  }

  logger.info(`Leave quota usage seeded (${results.length} rows).`);
  return results;
}
