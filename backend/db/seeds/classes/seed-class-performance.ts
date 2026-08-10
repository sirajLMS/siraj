import {
  ALL_FOCUS_LEVELS,
  ALL_GRADES,
  ALL_SESSION_HEALTH,
  cycleAtIndex,
  daysBetween,
  getFakerForIndex,
  loadSeedConfig,
  type SeedConfig,
  startOfDay,
} from "@/backend/db/seeds/lib";
import { logger } from "@/backend/lib/logger";
import { ClassPerformanceService } from "@/backend/services/performance/class-performance.service";
import type { ClassInstancePerformanceInsertType, ClassInstanceSelectType } from "@/backend/types";

function buildPerformanceRow(
  instance: ClassInstanceSelectType,
  config: SeedConfig,
  rowIndex: number,
  now: Date
): ClassInstancePerformanceInsertType {
  const faker = getFakerForIndex(config.fakerSeed, instance.id.length);

  return {
    classInstanceId: instance.id,
    engagementScore: faker.number.int({ min: 60, max: 100 }),
    assessmentProgress: faker.number.int({ min: 70, max: 100 }),
    assessmentTotal: 100,
    focusLevel: cycleAtIndex(ALL_FOCUS_LEVELS, rowIndex),
    sessionHealth: cycleAtIndex(ALL_SESSION_HEALTH, rowIndex),
    heatmapData: Array.from({ length: 5 }, () => faker.number.int({ min: 1, max: 5 })),
    latencyMs: faker.number.int({ min: 20, max: 120 }),
    attendanceRate: instance.outcome === "TAKEN" ? 100 : faker.number.int({ min: 0, max: 50 }),
    avgGrade: cycleAtIndex(ALL_GRADES, rowIndex),
    lastClassDaysAgo: Math.max(0, daysBetween(startOfDay(instance.scheduledStartAt), startOfDay(config.anchorDate))),
    createdAt: instance.actualEndAt ?? instance.scheduledEndAt,
    updatedAt: now,
  };
}

export async function seedOrGet(classInstancesList: ClassInstanceSelectType[], config?: SeedConfig) {
  logger.info("Seeding system class performance...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!classInstancesList?.length) {
    throw new Error("No class instances available to link to performance metrics.");
  }

  const specs: ClassInstancePerformanceInsertType[] = [];
  let rowIndex = 0;
  for (const instance of classInstancesList) {
    if (instance.outcome !== "TAKEN") continue;
    specs.push(buildPerformanceRow(instance, seedConfig, rowIndex, now));
    rowIndex++;
  }

  const results = await ClassPerformanceService.upsertManyPerformance(specs);
  logger.info(`System class performance seeded (${results.length} rows).`);
  return results;
}
