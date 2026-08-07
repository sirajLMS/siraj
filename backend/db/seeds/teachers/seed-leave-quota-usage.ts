import { loadSeedConfig, type SeedConfig } from "@/backend/db/seeds/lib";
import { logger } from "@/backend/lib/logger";
import { LeaveRequestSeedService } from "@/backend/services/seed/leave-request-seed.service";
import type { StudentSelectType } from "@/backend/types";

type LeaveRequestRow = {
  createdAt: Date;
};

export async function seedOrGet(
  leaveRequestsList: LeaveRequestRow[],
  studentsList: StudentSelectType[],
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

    const row = await LeaveRequestSeedService.seedStudentLeaveQuota({
      studentId: student.id,
      periodYear: year,
      periodMonth: month,
      usedCount: count,
    });
    results.push(row);
  }

  logger.info(`Leave quota usage seeded (${results.length} rows).`);
  return results;
}
