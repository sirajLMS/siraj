import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/backend/db";
import { recurringSchedules } from "@/backend/db/schema";
import { SchedulingMode } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { MAX_SCHEDULES_PER_RUN } from "@/scripts/ondemand-instance-generator.constants";
import { generateInstancesForSchedule } from "@/scripts/ondemand-instance-generator.parts";

export async function runOndemandInstanceGenerator(): Promise<void> {
  logger.info("[OnDemandInstanceGenerator] Starting on-demand instance generation...");

  try {
    const schedules = await db
      .select()
      .from(recurringSchedules)
      .where(and(eq(recurringSchedules.schedulingMode, SchedulingMode.ON_DEMAND), isNull(recurringSchedules.deletedAt)))
      .limit(MAX_SCHEDULES_PER_RUN);

    logger.info(`[OnDemandInstanceGenerator] Found ${schedules.length} active ON_DEMAND schedules.`);

    const now = new Date();

    // Process schedules in parallel — each schedule runs inside its own tx with
    // SELECT FOR UPDATE on the student's quotas + existing on-demand instances,
    // so concurrent runs for the same student serialize at the DB level.
    const generatedCounts = await Promise.all(schedules.map(schedule => generateInstancesForSchedule(schedule, now)));
    const totalGenerated = generatedCounts.reduce((sum, count) => sum + count, 0);

    logger.info(`[OnDemandInstanceGenerator] Completed generation. Generated ${totalGenerated} instances.`);
  } catch (error) {
    logger.error("[OnDemandInstanceGenerator] Error running on-demand instance generator:", { error });
    throw error;
  }
}

if (import.meta.main) {
  runOndemandInstanceGenerator()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
