import * as fs from "node:fs";
import { resolveAssetPath } from "@/backend/db/seeds/lib/file-seed-helper";
import { logger } from "@/backend/lib/logger";
import { createFileSeedingService } from "@/backend/storage/demo/fileInitializationService";
import { getStorageService } from "@/backend/storage/storage.service";

export type CatalogLogoCategory = "meeting" | "payment" | "subjects";

export function getCatalogLogoAssetPath(category: CatalogLogoCategory, slug: string): string {
  return `logos/${category}/${slug}.png`;
}

export function getCatalogLogoBucketPath(category: CatalogLogoCategory, slug: string): string {
  return `public/logos/${category}/${slug}.png`;
}

export async function seedCatalogLogoUrl(category: CatalogLogoCategory, slug: string): Promise<string | null> {
  const assetRelativePath = getCatalogLogoAssetPath(category, slug);
  const bucketPath = getCatalogLogoBucketPath(category, slug);
  const localFilePath = resolveAssetPath(assetRelativePath);

  if (!fs.existsSync(localFilePath)) {
    logger.warn(`Catalog logo asset missing — skipping: ${assetRelativePath}`);
    return null;
  }

  try {
    const fileSeeder = await createFileSeedingService();
    await fileSeeder.ensureDirectory(`public/logos/${category}`, true);
    await fileSeeder.seedFile({ bucketPath, localFilePath });
    const storageService = await getStorageService();
    const fileInfo = await storageService.fileInfoByPath(bucketPath);
    return fileInfo?.url ?? null;
  } catch (error) {
    logger.error(`Failed to seed catalog logo for ${category}/${slug}:`, error);
    return null;
  }
}

export async function seedCatalogLogoUrls(
  category: CatalogLogoCategory,
  slugs: readonly string[]
): Promise<Map<string, string | null>> {
  const entries = await Promise.all(slugs.map(async slug => [slug, await seedCatalogLogoUrl(category, slug)] as const));
  return new Map<string, string | null>(entries);
}
