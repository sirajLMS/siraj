import { loadSeedConfig } from "@/backend/db/seeds/lib/seed-config";
import { validateSeedAssetsOrThrow } from "@/backend/db/seeds/lib/validate-seed-assets";
import logger from "@/backend/lib/logger";
import { runAllSeeds } from "../seeds/index";

process.env.SEED_MODE = "true";

async function runSeed(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    logger.error("Seeding is not allowed in production environment");
    process.exit(1);
  }

  const config = loadSeedConfig();
  if (config.profile === "standard" && process.env.SEED_SKIP_ASSET_CHECK !== "true") {
    logger.log("Validating required seed assets before seed run...");
    validateSeedAssetsOrThrow();
  }

  await runAllSeeds();
  logger.log("Database seed completed successfully.");
}

runSeed().catch((err: unknown) => {
  logger.error("Database seed failed:", err);
  process.exit(1);
});
