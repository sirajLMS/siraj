import * as fs from "node:fs";
import * as path from "node:path";
import { SEED_ASSET_MANIFEST } from "@/backend/db/seeds/lib/asset-manifest";
import logger from "@/backend/lib/logger";

const ASSETS_ROOT = path.join(import.meta.dir, "..", "assets");

export type SeedAssetValidationResult = {
  missingRequired: string[];
  missingOptional: string[];
};

export function validateSeedAssets(): SeedAssetValidationResult {
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];

  for (const entry of SEED_ASSET_MANIFEST) {
    const absolutePath = path.join(ASSETS_ROOT, entry.relativePath);
    if (fs.existsSync(absolutePath)) {
      continue;
    }

    if (entry.required) {
      missingRequired.push(entry.relativePath);
    } else {
      missingOptional.push(entry.relativePath);
    }
  }

  return { missingRequired, missingOptional };
}

export function validateSeedAssetsOrThrow(): void {
  const { missingRequired, missingOptional } = validateSeedAssets();

  if (missingOptional.length > 0) {
    logger.warn(`Optional seed assets missing (${missingOptional.length}): ${missingOptional.join(", ")}`);
  }

  if (missingRequired.length > 0) {
    throw new Error(`Required seed assets missing (${missingRequired.length}): ${missingRequired.join(", ")}`);
  }

  logger.log(`Seed asset validation passed (${SEED_ASSET_MANIFEST.length} manifest entries).`);
}
