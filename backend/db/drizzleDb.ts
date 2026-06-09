import logger from "@/backend/lib/logger";
import { relations } from "./drizzleRelations";
import { createDatabase, createPool } from "./factory";

// Verify DATABASE_URL is loaded
if (process.env.DATABASE_URL) {
  logger.log("backend/db/drizzleDb.ts Environment variables loaded successfully");
  logger.log(`   DATABASE_URL=${process.env.DATABASE_URL.substring(0, 20)}...`);
  logger.log(`   DB_PROVIDER=${process.env.DB_PROVIDER || "postgres"}`);
} else {
  logger.error("backend/db/drizzleDb.ts:❌ Error: DATABASE_URL is not set in environment variables");
  logger.error("   Please check your .env file");
  process.exit(1);
}

export const drizzleLogs: string[] = [];

export function clearDrizzleLogs() {
  drizzleLogs.length = 0;
}

// Create database connection using factory
export const db = createDatabase();

// Create pool for PostgreSQL (throws error for Neon)
export const drizzleDbPool = (() => {
  try {
    return createPool();
  } catch {
    return null; // Neon doesn't support pools
  }
})();

export { relations };

export type DrizzleRelations = typeof relations;
