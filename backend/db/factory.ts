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
import { relations } from "@/backend/db/drizzleRelations";
import { getEnvironmentConfig, getStringEnv } from "@/backend/lib/env";
import logger from "@/backend/lib/logger";
import { isVercelRuntime } from "@/backend/lib/runtime";

export type DatabaseProvider = "postgres" | "neon";

function attachVercelPoolLifecycle(pool: PgPool): void {
  if (!isVercelRuntime()) return;
  attachDatabasePool(pool);
}

function configureNeonWebSocket(): void {
  neonConfig.webSocketConstructor = ws;
}

function createPgPool(): PgPool {
  const pool = new PgPool({
    connectionString: getEnvironmentConfig().databaseUrl,
    max: poolMax(),
    idleTimeoutMillis: poolIdleTimeoutMillis(),
  });

  attachVercelPoolLifecycle(pool);

  return pool;
}

const createNeonDb = () => {
  logger.log("Initializing Neon serverless Pool connection");
  configureNeonWebSocket();
  const pool = new Pool({
    connectionString: getEnvironmentConfig().databaseUrl,
    max: poolMax(),
    idleTimeoutMillis: 30_000,
  });
  const db = drizzleNeon({ client: pool, relations });
  return db;
};

export type NeonDbType = ReturnType<typeof createNeonDb>;

const createPostgresDb = () => {
  logger.log(
    isVercelRuntime()
      ? "Initializing Vercel Fluid compute PostgreSQL connection pool"
      : "Initializing PostgreSQL connection pool"
  );
  const pool = createPgPool();
  const db = drizzlePostgres({ client: pool, relations });
  return db;
};

export type PostgresDbType = ReturnType<typeof createPostgresDb>;

function logConnectionStrategy(strategy: DbConnectionStrategy): void {
  const mode = getStringEnv("DB_CONNECTION_MODE", "auto");
  const provider = getStringEnv("DB_PROVIDER", "postgres");
  logger.log(`Creating database connection (strategy: ${strategy}, mode: ${mode}, provider: ${provider})`);
}

export function createDatabase(): NeonDbType | PostgresDbType {
  const databaseUrl = getEnvironmentConfig().databaseUrl;
  if (!databaseUrl) {
    logger.error("DATABASE_URL is not set in environment variables");
    process.exit(1);
  }

  const strategy = resolveConnectionStrategy();
  logConnectionStrategy(strategy);

  if (strategy === "neon-serverless") {
    return createNeonDb();
  }
  return createPostgresDb();
}

export function createPool(): PgPool | Pool {
  const strategy = resolveConnectionStrategy();

  if (strategy === "pg-pooled") {
    return createPgPool();
  }

  configureNeonWebSocket();
  return new Pool({
    connectionString: getEnvironmentConfig().databaseUrl,
    max: poolMax(),
    idleTimeoutMillis: 30_000,
  });
}
