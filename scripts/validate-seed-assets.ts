import { validateSeedAssetsOrThrow } from "@/backend/db/seeds/lib/validate-seed-assets";
import logger from "@/backend/lib/logger";

try {
  validateSeedAssetsOrThrow();
} catch (error) {
  logger.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
