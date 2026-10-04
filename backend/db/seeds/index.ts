import {
  type RunStep,
  runGroupClassSeeds,
  runLmsWorkflowSeeds,
  runScheduleSeeds,
  type SeedContext,
  seedBooksAndCategories,
  seedClassInstanceArtifacts,
  seedPermissionGroups,
  seedReferenceData,
  seedStudentsAndCredits,
  seedSystemSettings,
  seedTeachersAndParents,
  seedTimezones,
  seedUserConfigs,
  seedUsersAndActor,
  seedWhatsappConfig,
} from "@/backend/db/seeds/index.core.parts";
import {
  runAuditLogSeeds,
  runBillingSeeds,
  runCommunicationsSeeds,
  seedDstMigrations,
  seedLeaveRequests,
  seedStudentProgress,
  seedStudentStatusHistory,
  seedTeacherPayments,
  seedTeacherScheduleWindows,
} from "@/backend/db/seeds/index.workflow.parts";
import { loadSeedConfig, logFailedSeedSteps, runSeedStep, type SeedStepResult } from "@/backend/db/seeds/lib";
import { verifySeedCoverage } from "@/backend/db/seeds/shared";
import { logger } from "@/backend/lib/logger";

export type { SeedContext };

export async function runAllSeeds(context: SeedContext = {}): Promise<SeedContext> {
  logger.log("Starting master seed process...");
  const stepResults: SeedStepResult[] = [];

  const step: RunStep = async <T>(name: string, fn: () => Promise<T>): Promise<T | undefined> => {
    const outcome = await runSeedStep(name, fn);
    stepResults.push(outcome);
    return outcome.ok ? outcome.value : undefined;
  };

  if (!context.config) {
    context.config = loadSeedConfig();
    logger.log(`Seed profile: ${context.config.profile} (anchor: ${context.config.anchorDate.toISOString()})`);
  }

  const config = context.config;

  await seedSystemSettings(context, step);
  await seedTimezones(context, step);
  await seedReferenceData(context, step);
  await seedBooksAndCategories(context, step);
  await seedPermissionGroups(context, step);
  await seedUsersAndActor(context, step, config);
  await seedWhatsappConfig(context, step);
  await seedTeachersAndParents(context, step, config);
  await seedUserConfigs(context, step, config);
  await seedStudentsAndCredits(context, step, config);

  await runScheduleSeeds(context, step, config);
  await seedClassInstanceArtifacts(context, step, config);

  await runLmsWorkflowSeeds(context, step, config);
  await runGroupClassSeeds(context, step, config);

  await seedTeacherScheduleWindows(context, step, config);
  await seedLeaveRequests(context, step, config);
  await seedStudentProgress(context, step, config);
  await seedStudentStatusHistory(context, step, config);
  await seedDstMigrations(context, step, config);
  await seedTeacherPayments(context, step, config);

  await runBillingSeeds(context, step, config);
  await runCommunicationsSeeds(context, step, config);
  await runAuditLogSeeds(context, step, config);

  const failedSteps = stepResults.filter(result => !result.ok).map(result => result.name);
  context.failedSteps = failedSteps;
  logFailedSeedSteps(stepResults);

  logger.log("Verifying seed coverage...");
  await verifySeedCoverage(failedSteps);

  logger.log("Master seed process completed.");
  return context;
}
