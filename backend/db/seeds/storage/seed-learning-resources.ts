import {
  buildResourceDisplayName,
  LEARNING_RESOURCE_SPECS,
  loadSeedConfig,
  type SeedConfig,
  seedEntityFile,
  shouldSeedExtendedFiles,
} from "@/backend/db/seeds/lib";
import { logger } from "@/backend/lib/logger";
import { LearningResourceService } from "@/backend/services";
import type { LearningResourceReturnType, UserSelectType } from "@/backend/types";

export async function seedOrGet(usersList: UserSelectType[], config?: SeedConfig) {
  logger.info("Seeding learning resources...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableCommunications || !usersList?.length) {
    return [];
  }

  const uploader = usersList.find(u => u.email === "teacher@siraj.local") ?? usersList[0];
  const specs = seedConfig.profile === "standard" ? LEARNING_RESOURCE_SPECS : LEARNING_RESOURCE_SPECS.slice(0, 2);
  const seedExtendedFiles = shouldSeedExtendedFiles(seedConfig);

  const results = await Array.from(specs).reduce(async (prevPromise, spec, i) => {
    const acc = await prevPromise;
    const bucketPath = `public/resources/${spec.slug}.pdf`;
    const displayName = buildResourceDisplayName(seedConfig, i);

    const existing = await LearningResourceService.findByFilePath(bucketPath);
    if (existing) {
      acc.push(existing);
      return acc;
    }

    const inserted = await LearningResourceService.insertResource({
      displayName,
      filePath: bucketPath,
      uploadedByUserId: uploader.id,
      createdAt: now,
    });

    if (seedExtendedFiles) {
      try {
        await seedEntityFile({
          assetRelativePath: spec.asset,
          bucketPath,
          referenceTable: "learning_resources",
          referenceId: inserted.id,
          usageType: "document",
          ensureParentDirs: ["public/resources"],
        });
      } catch (error) {
        logger.error(`Failed to seed learning resource file for ${inserted.id}:`, error);
      }
    }

    acc.push(inserted);
    return acc;
  }, Promise.resolve<LearningResourceReturnType[]>([]));

  logger.info(`Learning resources seeded (${results.length} rows).`);
  return results;
}
