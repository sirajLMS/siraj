import { randomInt } from "node:crypto";
import { db } from "@/backend/db/drizzleDb";
import { classInstancePerformance } from "@/backend/db/schema/scheduling";
import logger from "@/backend/lib/logger";
import type { ClassInstanceEntity } from "@/backend/types";

export async function seedOrGet(classInstancesList: ClassInstanceEntity[]) {
  logger.info("Seeding system class performance...");
  const now = new Date();

  if (!classInstancesList || classInstancesList.length === 0) {
    throw new Error("No class instances available to link to performance metrics.");
  }

  const results = [];

  for (const instance of classInstancesList) {
    const [inserted] = await db
      .insert(classInstancePerformance)
      .values({
        classInstanceId: instance.id,
        engagementScore: randomInt(60, 101), // 60-100
        assessmentProgress: 85,
        assessmentTotal: 100,
        focusLevel: "HIGH",
        sessionHealth: "GOOD",
        heatmapData: [1, 2, 3, 4, 5],
        latencyMs: randomInt(20, 121), // 20-120ms
        attendanceRate: 100,
        avgGrade: "A-",
        lastClassDaysAgo: 2,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: classInstancePerformance.classInstanceId,
        set: {
          updatedAt: now,
        },
      })
      .returning();

    results.push(inserted);
  }

  logger.info("System class performance seeded.");
  return results;
}
