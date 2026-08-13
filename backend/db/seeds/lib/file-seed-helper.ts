import * as path from "node:path";
import type { SeedConfig } from "@/backend/db/seeds/lib/seed-config";
import { logger } from "@/backend/lib/logger";
import { StorageService } from "@/backend/services";
import { createFileSeedingService } from "@/backend/storage/demo/fileInitializationService";
import { getStorageService } from "@/backend/storage/storage.service";
import type { ValidReferenceTable } from "@/backend/types";

export type FileReferenceTable = ValidReferenceTable;

export interface SeedEntityFileInput {
  assetRelativePath: string;
  bucketPath: string;
  referenceTable: FileReferenceTable;
  referenceId: string;
  usageType: string;
  ensureParentDirs?: string[];
}

export function resolveAssetPath(assetRelativePath: string): string {
  return path.join(__dirname, "..", "assets", assetRelativePath);
}

export function shouldSeedExtendedFiles(config: SeedConfig): boolean {
  return config.profile === "standard";
}

export async function seedEntityFile(input: SeedEntityFileInput): Promise<{ url: string | null; filePath: string }> {
  const fileSeeder = await createFileSeedingService();
  const storageService = await getStorageService();

  if (input.ensureParentDirs) {
    await Promise.all(input.ensureParentDirs.map(dir => fileSeeder.ensureDirectory(dir, true)));
  }

  const localFilePath = resolveAssetPath(input.assetRelativePath);
  await fileSeeder.seedFile({
    bucketPath: input.bucketPath,
    localFilePath,
  });

  const fileInfo = await storageService.fileInfoByPath(input.bucketPath);
  const result = await StorageService.linkFileToEntity({
    referenceTable: input.referenceTable,
    referenceId: input.referenceId,
    usageType: input.usageType,
    filePath: input.bucketPath,
  });

  if (!result.success) {
    logger.warn(`File usage registration warning for ${input.bucketPath}: ${result.message}`);
  }

  return { url: fileInfo?.url ?? null, filePath: input.bucketPath };
}

export function getAvatarFileName(index: number, poolSize: number): string {
  return `${String((index % poolSize) + 1).padStart(2, "0")}.png`;
}
