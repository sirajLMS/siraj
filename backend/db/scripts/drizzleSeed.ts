import logger from "@/backend/lib/logger";
import { runAllSeeds } from "../seeds/index";

async function runSeed(): Promise<void> {
  await runAllSeeds();
  logger.log("Database seed completed successfully.");
}

runSeed().catch((err: unknown) => {
  logger.error("Database seed failed:", err);
  process.exit(1);
});
