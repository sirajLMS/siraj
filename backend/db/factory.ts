import { neonConfig, Pool } from "@neondatabase/serverless";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePostgres } from "drizzle-orm/node-postgres";
import { Pool as PgPool } from "pg";
import ws from "ws";
import {
  type DbConnectionStrategy,
  poolIdleTimeoutMillis,
  poolMax,
  resolveConnectionStrategy,
} from "@/backend/db/connection-strategy";
import { getDbDialect } from "@/backend/db/dialect";
import { createSqliteDb } from "@/backend/db/drivers/sqlite/sqlite.driver";
import { relations } from "@/backend/db/drizzleRelations";
import { getEnvironmentConfig, getStringEnv } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import { toDatabaseUnavailableError } from "@/backend/lib/retry";
import { isVercelRuntime } from "@/backend/lib/runtime";

/**
 * Fail-fast bounds so a database outage surfaces as an error within seconds
 * instead of hanging the request until the OS kills the socket (ECONNRESET).
 * `connectionTimeoutMillis` covers acquiring a connection (the dominant
 * outage mode); `query_timeout` bounds a hung in-flight query while staying
 * generous enough for legitimately slow report queries.
 */
const DB_CONNECT_TIMEOUT_MS = 5_000;
const DB_QUERY_TIMEOUT_MS = 30_000;

type ResilientPool = PgPool | Pool;

/**
 * Translates transient connection failures from pool-level queries into
 * `DatabaseUnavailableError` so every caller (RSC pages, GraphQL resolvers)
 * sees one distinguishable error type. Non-transient rejections (constraint
 * violations, SQL errors) pass through unchanged. Transaction paths
 * (`pool.connect`) are bounded by `connectionTimeoutMillis` instead — wrapping
 * their overloaded callback signatures would be unsound. No implicit retry
 * here — retry policy stays at idempotent call sites (`retryTransient`).
 */
function applyFailFastResilience<TPool extends ResilientPool>(pool: TPool): TPool {
  const originalQuery = pool.query.bind(pool);
  const resilientQuery = (...args: unknown[]) => {
    // Callback-style invocations (legacy node-pg API) pass through untouched;
    // Drizzle always uses the promise form.
    if (typeof args.at(-1) === "function") {
      return Reflect.apply(originalQuery, pool, args);
    }
    return Promise.resolve(Reflect.apply(originalQuery, pool, args)).catch((error: unknown) => {
      throw toDatabaseUnavailableError(error) ?? error;
    });
  };
  pool.query = resilientQuery as TPool["query"];

  return pool;
}

function attachVercelPoolLifecycle(pool: PgPool): void {
  if (!isVercelRuntime()) return;
  attachDatabasePool(pool);
}

let neonWsConfigured = false;

function configureNeonWebSocket(): void {
  if (neonWsConfigured) return;
  neonConfig.webSocketConstructor = ws;
  neonWsConfigured = true;
}

function createPgPool(): PgPool {
  const pool = new PgPool({
    connectionString: getEnvironmentConfig().databaseUrl,
    max: poolMax(),
    idleTimeoutMillis: poolIdleTimeoutMillis(),
    connectionTimeoutMillis: DB_CONNECT_TIMEOUT_MS,
    query_timeout: DB_QUERY_TIMEOUT_MS,
  });

  attachVercelPoolLifecycle(pool);

  return applyFailFastResilience(pool);
}

function createNeonPool(): Pool {
  configureNeonWebSocket();
  const pool = new Pool({
    connectionString: getEnvironmentConfig().databaseUrl,
    max: poolMax(),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: DB_CONNECT_TIMEOUT_MS,
    query_timeout: DB_QUERY_TIMEOUT_MS,
  });
  return applyFailFastResilience(pool);
}

const createNeonDb = (existingPool?: Pool | null) => {
  logger.info("Initializing Neon serverless Pool connection");
  const pool = existingPool ?? createNeonPool();
  const db = drizzleNeon({ client: pool, relations });
  return db;
};

export type NeonDbType = ReturnType<typeof createNeonDb>;

const createPostgresDb = (existingPool?: PgPool | null) => {
  logger.info(
    isVercelRuntime()
      ? "Initializing Vercel Fluid compute PostgreSQL connection pool"
      : "Initializing PostgreSQL connection pool"
  );
  const pool = existingPool ?? createPgPool();
  const db = drizzlePostgres({ client: pool, relations });
  return db;
};

export type PostgresDbType = ReturnType<typeof createPostgresDb>;

function isPostgresDbType(value: unknown): value is PostgresDbType {
  return typeof value === "object" && value !== null;
}

function logConnectionStrategy(strategy: DbConnectionStrategy): void {
  const mode = getStringEnv("DB_CONNECTION_MODE", "auto");
  const provider = getStringEnv("DB_PROVIDER", "postgres");
  logger.info(`Creating database connection (strategy: ${strategy}, mode: ${mode}, provider: ${provider})`);
}

export function createDatabase(pool?: PgPool | Pool | null): NeonDbType | PostgresDbType {
  // SQLite (libsql) path — resolved BEFORE the Postgres env checks so a
  // SQLite-only deployment does not need a valid Postgres DATABASE_URL.
  //
  // TYPE-ERASURE NOTE: the sqlite db is cast to `PostgresDbType` so the entire
  // codebase keeps its PG types unchanged (service/repo layers NOT modified).
  // At runtime, sqlite objects are structurally compatible with Drizzle's query
  // API (.select/.insert/.where/eq/inArray/onConflictDoUpdate/.returning).
  if (getDbDialect() === "sqlite") {
    const provider = getStringEnv("DB_PROVIDER", "sqlite");
    const mode = getStringEnv("DB_CONNECTION_MODE", "auto");
    logger.info(`Creating database connection (dialect: sqlite, provider: ${provider}, mode: ${mode})`);
    const sqliteDb = createSqliteDb({});
    if (isPostgresDbType(sqliteDb)) {
      return sqliteDb;
    }
  }

  const databaseUrl = getEnvironmentConfig().databaseUrl;
  if (!databaseUrl) {
    logger.error("DATABASE_URL is not set in environment variables");
    process.exit(1);
  }

  const strategy = resolveConnectionStrategy();
  logConnectionStrategy(strategy);

  if (strategy === "neon-serverless") {
    return createNeonDb(pool instanceof Pool ? pool : null);
  }
  return createPostgresDb(pool instanceof PgPool ? pool : null);
}

export function createPool(): PgPool | Pool | null {
  // SQLite manages connections internally — no separate pool to expose.
  if (getDbDialect() === "sqlite") {
    return null;
  }
  const strategy = resolveConnectionStrategy();

  if (strategy === "pg-pooled") {
    return createPgPool();
  }

  return createNeonPool();
}
