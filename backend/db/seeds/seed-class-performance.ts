import { db } from "@/backend/db/drizzleDb";
import { classInstancePerformance } from "@/backend/db/schema/scheduling";
import logger from "@/backend/lib/logger";
import type { ClassInstanceEntity } from "@/backend/types";
import { ClassOutcome } from "@/shared/lib/enum";
import { daysBetween, getFakerForIndex, loadSeedConfig, type SeedConfig, startOfDay } from "./lib";

const FOCUS_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
const SESSION_HEALTH = ["POOR", "FAIR", "GOOD", "EXCELLENT"] as const;
const GRADES = ["A", "A-", "B+", "B", "B-"] as const;

function buildPerformanceRow(instance: ClassInstanceEntity, config: SeedConfig, now: Date) {
  const faker = getFakerForIndex(config.fakerSeed, instance.id.length);
  const lastClassDaysAgo = daysBetween(startOfDay(instance.scheduledStartAt), startOfDay(config.anchorDate));

  return {
    classInstanceId: instance.id,
    engagementScore: faker.number.int({ min: 60, max: 100 }),
    assessmentProgress: faker.number.int({ min: 70, max: 100 }),
    assessmentTotal: 100,
    focusLevel: faker.helpers.arrayElement(FOCUS_LEVELS),
    sessionHealth: faker.helpers.arrayElement(SESSION_HEALTH),
    heatmapData: Array.from({ length: 5 }, () => faker.number.int({ min: 1, max: 5 })),
    latencyMs: faker.number.int({ min: 20, max: 120 }),
    attendanceRate: instance.outcome === ClassOutcome.TAKEN ? 100 : faker.number.int({ min: 0, max: 50 }),
    avgGrade: faker.helpers.arrayElement(GRADES),
    lastClassDaysAgo: Math.max(0, lastClassDaysAgo),
    createdAt: instance.actualEndAt ?? instance.scheduledEndAt,
    updatedAt: now,
  };
}

export async function seedOrGet(classInstancesList: ClassInstanceEntity[], config?: SeedConfig) {
  logger.info("Seeding system class performance...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!classInstancesList?.length) {
    throw new Error("No class instances available to link to performance metrics.");
  }

  const results = [];

  for (const instance of classInstancesList) {
    if (instance.outcome !== ClassOutcome.TAKEN) {
      continue;
    }

    const row = buildPerformanceRow(instance, seedConfig, now);

    const [inserted] = await db
      .insert(classInstancePerformance)
      .values(row)
      .onConflictDoUpdate({
        target: classInstancePerformance.classInstanceId,
        set: {
          engagementScore: row.engagementScore,
          assessmentProgress: row.assessmentProgress,
          focusLevel: row.focusLevel,
          sessionHealth: row.sessionHealth,
          heatmapData: row.heatmapData,
          latencyMs: row.latencyMs,
          attendanceRate: row.attendanceRate,
          avgGrade: row.avgGrade,
          lastClassDaysAgo: row.lastClassDaysAgo,
          updatedAt: now,
        },
      })
      .returning();

    results.push(inserted);
  }

  logger.info(`System class performance seeded (${results.length} rows).`);
  return results;
}
