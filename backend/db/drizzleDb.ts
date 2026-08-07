import { getActiveHttpProvider, resolveConnectionStrategy } from "@/backend/db/connection-strategy";
import { relations } from "@/backend/db/drizzleRelations";
import { createDatabase, createPool } from "@/backend/db/factory";
import { clearHttpClientSingleton, getNeonHttpDb } from "@/backend/db/http-client";
import { ensureEnvironmentValidated, getEnvironmentConfig, getStringEnv } from "@/backend/lib/env";
import { clearGlobalSingleton, getGlobalSingleton, getGlobalSingletonIfExists } from "@/backend/lib/global-singleton";
import { logger } from "@/backend/lib/logger";

const DB_KEY = Symbol.for("siraj.db");
const DB_POOL_KEY = Symbol.for("siraj.dbPool");
const HTTP_DB_KEY = Symbol.for("siraj.httpDb");

export const drizzleLogs: string[] = [];

export function clearDrizzleLogs() {
  drizzleLogs.length = 0;
}

function initDatabase() {
  ensureEnvironmentValidated();

  const { databaseUrl } = getEnvironmentConfig();
  if (!databaseUrl) {
    logger.error("backend/db/drizzleDb.ts:❌ Error: DATABASE_URL is not set in environment variables");
    logger.error("   Please check your .env file");
    process.exit(1);
  }

  const strategy = resolveConnectionStrategy();
  const mode = getStringEnv("DB_CONNECTION_MODE", "auto");
  const provider = getStringEnv("DB_PROVIDER", "postgres");

  logger.debug("backend/db/drizzleDb.ts Environment variables loaded successfully");
  logger.debug(`   DATABASE_URL=${databaseUrl ? "[SET]" : "[NOT SET]"}`);
  logger.debug(`   DB_CONNECTION_MODE=${mode}`);
  logger.debug(`   DB_PROVIDER=${provider}`);
  logger.debug(`   DB_STRATEGY=${strategy}`);

  return createDatabase();
}

export const db = getGlobalSingleton(DB_KEY, initDatabase);

function getStatelessHttpDb() {
  return getGlobalSingleton(HTTP_DB_KEY, () => {
    const provider = getActiveHttpProvider();
    if (provider === "neon") return getNeonHttpDb();
    return null;
  });
}

/**
 * Canonical database query handle for repository read operations.
 * - Prioritizes `tx` if passed (guarantees transaction safety).
 * - Resolves to the cached HTTP database singleton if eligible.
 * - Falls back to default pooled `db` instance.
 */
type QueryDbHandle = ReturnType<typeof getNeonHttpDb> | typeof db;

export function queryDb(): QueryDbHandle;
export function queryDb<T>(tx: T): T extends undefined ? QueryDbHandle : T;
export function queryDb<T>(tx?: T): QueryDbHandle {
  if (tx !== undefined) {
    return tx as QueryDbHandle;
  }
  return getStatelessHttpDb() ?? db;
}

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

/**
 * Clears the in-memory JavaScript global singleton instances for the Drizzle ORM client (`db`),
 * HTTP client handle (`httpDb`), and connection pool (`dbPool`).
 *
 * IMPORTANT NOTE: This function ONLY resets module/process-level connection handles in Node/Bun memory
 * (for example when switching environment files like `.env.vercel` or `.env.mishkah` in DB CLI sessions).
 * It DOES NOT perform any database drops, schema truncations, data deletion, or destructive database operations.
 */
export function clearDbConnectionSingleton(): void {
  clearGlobalSingleton(DB_KEY);
  clearGlobalSingleton(DB_POOL_KEY);
  clearGlobalSingleton(HTTP_DB_KEY);
  clearHttpClientSingleton();
}

export { getActiveHttpProvider, isNeonHttpEligible } from "@/backend/db/connection-strategy";
export { clearHttpClientSingleton, getNeonHttpClient, getNeonHttpDb } from "@/backend/db/http-client";
export { relations };

export type DrizzleRelations = typeof relations;
