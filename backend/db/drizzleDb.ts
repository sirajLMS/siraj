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

// Lazy pool for PostgreSQL — only created when accessed, avoids wasting
// connections in parallel test processes that never need the raw pool.
let _drizzleDbPool: ReturnType<typeof createPool> | null = null;

export function getDrizzleDbPool(): ReturnType<typeof createPool> | null {
  if (!_drizzleDbPool) {
    try {
      _drizzleDbPool = createPool();
    } catch {
      return null;
    }
  }
  return _drizzleDbPool;
}

export async function closeDrizzleDbPool(): Promise<void> {
  if (_drizzleDbPool) {
    await _drizzleDbPool.end();
    _drizzleDbPool = null;
  }
}

export { relations };

export type DrizzleRelations = typeof relations;
