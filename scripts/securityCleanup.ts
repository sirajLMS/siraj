import { RateLimitRepository } from "@/backend/db/repo";
import logger from "@/backend/lib/logger";

/**
 * Security Cleanup Script
 * Runs database-level cleanup for:
 * - Expired auth rate limit records
 * - Expired password reset tokens
 * - Expired cache entries
 */
async function runCleanup() {
  logger.info("[Security Cleanup] Starting cleanup job...");

  try {
    await RateLimitRepository.cleanupExpired();
    logger.info("[Security Cleanup] Cleanup completed successfully.");
    process.exit(0);
  } catch (error) {
    logger.error("[Security Cleanup] Cleanup failed:", error);
    process.exit(1);
  }
}

runCleanup().catch((error: unknown) => {
  logger.error("[Security Cleanup] Unhandled error:", error);
  process.exit(1);
});
