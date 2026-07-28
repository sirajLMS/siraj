import * as fs from "node:fs";
import { type FileReferenceTable, resolveAssetPath, seedEntityFile } from "@/backend/db/seeds/lib/file-seed-helper";
import logger from "@/backend/lib/logger";
import { UserSeedService } from "@/backend/services/seed/user-seed.service";
import { createFileSeedingService } from "@/backend/storage/demo/fileInitializationService";
import { getStorageService } from "@/backend/storage/storage.service";

export type SeedAvatarEntityLink = {
  readonly id: string;
  readonly userId?: string;
};

export type SeedAvatarPoolInput = {
  assetDir: string;
  bucketDir: string;
  poolFiles: readonly string[];
  referenceTable: FileReferenceTable;
  entities: readonly SeedAvatarEntityLink[];
};

export async function seedAvatarForEntity(input: {
  index: number;
  poolFiles: readonly string[];
  assetDir: string;
  bucketDir: string;
  referenceTable: FileReferenceTable;
  referenceId: string;
}): Promise<string | null> {
  const avatarFile = input.poolFiles[input.index % input.poolFiles.length];
  if (!avatarFile) {
    return null;
  }

  const assetRelativePath = `${input.assetDir}/${avatarFile}`;
  const localFilePath = resolveAssetPath(assetRelativePath);

  if (!fs.existsSync(localFilePath)) {
    logger.warn(`Avatar asset missing — skipping: ${assetRelativePath}`);
    return null;
  }

  try {
    const { url } = await seedEntityFile({
      assetRelativePath,
      bucketPath: `${input.bucketDir}/${avatarFile}`,
      referenceTable: input.referenceTable,
      referenceId: input.referenceId,
      usageType: "avatar",
      ensureParentDirs: [input.bucketDir],
    });
    return url;
  } catch (error) {
    logger.error(`Failed to seed avatar for ${input.referenceTable} ${input.referenceId}:`, error);
    return null;
  }
}

export async function seedAvatarPool(input: SeedAvatarPoolInput): Promise<Map<string, string | null>> {
  const avatarUrls = new Map<string, string | null>();

  for (const avatarFile of input.poolFiles) {
    const assetRelativePath = `${input.assetDir}/${avatarFile}`;
    const localFilePath = resolveAssetPath(assetRelativePath);
    const bucketPath = `${input.bucketDir}/${avatarFile}`;

    if (!fs.existsSync(localFilePath)) {
      logger.warn(`Avatar asset missing — skipping pool upload: ${assetRelativePath}`);
      avatarUrls.set(avatarFile, null);
      continue;
    }

    try {
      const fileSeeder = await createFileSeedingService();
      await fileSeeder.ensureDirectory(input.bucketDir, true);
      await fileSeeder.seedFile({ bucketPath, localFilePath });
      const storageService = await getStorageService();
      const fileInfo = await storageService.fileInfoByPath(bucketPath);
      avatarUrls.set(avatarFile, fileInfo?.url ?? null);
    } catch (error) {
      logger.error(`Failed to seed avatar pool file ${avatarFile}:`, error);
      avatarUrls.set(avatarFile, null);
    }
  }

  return avatarUrls;
}

async function syncUserAvatarUrl(userId: string, avatarUrl: string | null): Promise<void> {
  if (!avatarUrl) {
    return;
  }

  try {
    await UserSeedService.seedAvatarUrl(userId, avatarUrl);
  } catch (error) {
    logger.error(`Failed to sync users.avatarUrl for ${userId}:`, error);
  }
}

export async function linkAvatarsToEntities(input: SeedAvatarPoolInput): Promise<void> {
  for (let i = 0; i < input.entities.length; i++) {
    const entity = input.entities[i];
    if (!entity) continue;

    const avatarUrl = await seedAvatarForEntity({
      index: i,
      poolFiles: input.poolFiles,
      assetDir: input.assetDir,
      bucketDir: input.bucketDir,
      referenceTable: input.referenceTable,
      referenceId: entity.id,
    });

    if (entity.userId) {
      await syncUserAvatarUrl(entity.userId, avatarUrl);
    }
  }
}
