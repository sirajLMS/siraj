import { getActiveHttpProvider, resolveConnectionStrategy } from "@/backend/db/connection-strategy";
import { getDbDialect } from "@/backend/db/dialect";
import type { relations } from "@/backend/db/drizzleRelations";
import { createDatabase, createPool } from "@/backend/db/factory";
import { clearHttpClientSingleton, getNeonHttpDb } from "@/backend/db/http-client";
import { ensureEnvironmentValidated, getEnvironmentConfig, getStringEnv } from "@/backend/lib/env";
import { clearGlobalSingleton, getGlobalSingleton } from "@/backend/lib/global-singleton";
import { logger } from "@/backend/lib/logger";

const DB_KEY = Symbol.for("siraj.db");
const DB_POOL_KEY = Symbol.for("siraj.dbPool");
const HTTP_DB_KEY = Symbol.for("siraj.httpDb");

function initDatabase() {
  ensureEnvironmentValidated();

  const dialect = getDbDialect();
  const { databaseUrl } = getEnvironmentConfig();

  // SQLite uses DB_FILE_NAME (or a file:/... DATABASE_URL) — do NOT require
  // a Postgres-style DATABASE_URL for the SQLite path.
  if (dialect === "sqlite") {
    const mode = getStringEnv("DB_CONNECTION_MODE", "auto");
    const provider = getStringEnv("DB_PROVIDER", "sqlite");
    const sqliteUrl =
      databaseUrl && /^(file:|libsql:|https?:|wss?:)/i.test(databaseUrl)
        ? databaseUrl
        : getStringEnv("DB_FILE_NAME", "./siraj.sqlite");
    logger.debug("backend/db/drizzleDb.ts Environment variables loaded successfully");
    logger.debug(`   Dialect=sqlite`);
    logger.debug(`   DB_CONNECTION_MODE=${mode}`);
    logger.debug(`   DB_PROVIDER=${provider}`);
    logger.debug(`   SQLite target=${sqliteUrl}`);
    return createDatabase();
  }

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

  return createDatabase(getDrizzleDbPool());
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
export type QueryDbHandle = ReturnType<typeof getNeonHttpDb> | typeof db;

function isTxDefined<T>(tx: T | undefined): tx is T {
  return tx !== undefined;
}

export function queryDb(): QueryDbHandle;
export function queryDb<T>(tx: T): T extends undefined ? QueryDbHandle : T;
export function queryDb<T>(tx?: T): QueryDbHandle | T {
  return isTxDefined(tx) ? tx : (getStatelessHttpDb() ?? db);
}

export function getDrizzleDbPool(): ReturnType<typeof createPool> | null {
  try {
    return getGlobalSingleton(DB_POOL_KEY, () => createPool());
  } catch {
    return null;
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

export type DrizzleRelations = typeof relations;
