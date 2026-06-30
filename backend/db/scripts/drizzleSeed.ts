import logger from "@/backend/lib/logger";
import { runAllSeeds } from "../seeds/index";

async function runSeed(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    logger.error("Seeding is not allowed in production environment");
    process.exit(1);
  }

  await runAllSeeds();
  logger.log("Database seed completed successfully.");
}

runSeed().catch((err: unknown) => {
  logger.error("Database seed failed:", err);
  process.exit(1);
});
