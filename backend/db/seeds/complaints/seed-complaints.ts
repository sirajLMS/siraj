import {
  buildComplaintBody,
  loadSeedConfig,
  pickComplaintCategory,
  pickComplaintStatus,
  type SeedConfig,
  seedEntityFile,
  shouldSeedExtendedFiles,
} from "@/backend/db/seeds/lib";
import { logger } from "@/backend/lib/logger";
import { ComplaintService } from "@/backend/services";
import type { ParentSelectType, StudentSelectType, UserSelectType } from "@/backend/types";

export async function seedOrGet(
  parentsList: ParentSelectType[],
  studentsList: StudentSelectType[],
  usersList: UserSelectType[],
  config?: SeedConfig
) {
  logger.info("Seeding complaints...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableCommunications || !parentsList?.length) {
    return [];
  }

  const count = seedConfig.profile === "standard" ? 8 : 2;
  const inputs = [];

  for (let i = 0; i < count; i++) {
    const parent = parentsList[i % parentsList.length];
    const parentUser = usersList.find(u => u.id === parent.userId);
    const student = studentsList.find(s => s.parentId === parent.id);

    inputs.push({
      parentId: parent.id,
      studentId: student?.id ?? null,
      category: pickComplaintCategory(i),
      submitterEmail: parentUser?.email ?? `parent-${i}@seed.siraj.local`,
      body: buildComplaintBody(seedConfig, i),
      status: pickComplaintStatus(i),
      createdAt: now,
      updatedAt: now,
    });
  }

  const results = await ComplaintService.createManyComplaints(inputs);

  if (shouldSeedExtendedFiles(seedConfig)) {
    const evenResults = results.filter((_, i) => i % 2 === 0);
    await evenResults.reduce<Promise<void>>(async (prev, inserted) => {
      await prev;
      try {
        await seedEntityFile({
          assetRelativePath: "documents/sample-attachment.pdf",
          bucketPath: `public/complaints/seed_${inserted.id}.pdf`,
          referenceTable: "complaints",
          referenceId: inserted.id,
          usageType: "attachment",
          ensureParentDirs: ["public/complaints"],
        });
      } catch (error) {
        logger.error(`Failed to seed complaint file for ${inserted.id}:`, error);
      }
    }, Promise.resolve());
  }

  logger.info(`Complaints seeded (${results.length} rows).`);
  return results;
}
