import { ensureEnvironmentValidated } from "@/backend/lib/env";
import { clearGlobalSingleton, getGlobalSingleton, getGlobalSingletonIfExists } from "@/backend/lib/global-singleton";
import logger from "@/backend/lib/logger";
import { resolveConnectionStrategy } from "./connection-strategy";
import { relations } from "./drizzleRelations";
import { createDatabase, createPool } from "./factory";

const DB_KEY = Symbol.for("siraj.db");
const DB_POOL_KEY = Symbol.for("siraj.dbPool");

export const drizzleLogs: string[] = [];

export function clearDrizzleLogs() {
  drizzleLogs.length = 0;
}

function initDatabase() {
  ensureEnvironmentValidated();

  if (!process.env.DATABASE_URL) {
    logger.error("backend/db/drizzleDb.ts:❌ Error: DATABASE_URL is not set in environment variables");
    logger.error("   Please check your .env file");
    process.exit(1);
  }

  const strategy = resolveConnectionStrategy();
  const mode = process.env.DB_CONNECTION_MODE || "auto";
  const provider = process.env.DB_PROVIDER || "postgres";

  logger.log("backend/db/drizzleDb.ts Environment variables loaded successfully");
  logger.log(`   DATABASE_URL=${process.env.DATABASE_URL.substring(0, 20)}...`);
  logger.log(`   DB_CONNECTION_MODE=${mode}`);
  logger.log(`   DB_PROVIDER=${provider}`);
  logger.log(`   DB_STRATEGY=${strategy}`);

  return createDatabase();
}

export const db = getGlobalSingleton(DB_KEY, initDatabase);

export function getDrizzleDbPool(): ReturnType<typeof createPool> | null {
  try {
    return getGlobalSingleton(DB_POOL_KEY, () => createPool());
  } catch {
    return null;
  }
}

export async function closeDrizzleDbPool(): Promise<void> {
  const pool = getGlobalSingletonIfExists<ReturnType<typeof createPool>>(DB_POOL_KEY);
  if (pool) {
    await pool.end();
    clearGlobalSingleton(DB_POOL_KEY);
  }
}

export function resetDbSingleton(): void {
  clearGlobalSingleton(DB_KEY);
  clearGlobalSingleton(DB_POOL_KEY);
}

export { relations };

export type DrizzleRelations = typeof relations;
