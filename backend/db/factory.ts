import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePostgres } from "drizzle-orm/node-postgres";
import { Pool as PgPool } from "pg";
import ws from "ws";
import logger from "@/backend/lib/logger";
import { relations } from "./drizzleRelations";

export type DatabaseProvider = "postgres" | "neon";

function configureNeonWebSocket(): void {
  // Required in Node.js/Bun for Pool-based Neon connections (transaction support).
  neonConfig.webSocketConstructor = ws;
}

const createNeonDb = () => {
  logger.log("Initializing Neon serverless Pool connection");
  configureNeonWebSocket();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzleNeon({ client: pool, relations });
  return db;
};

export type NeonDbType = ReturnType<typeof createNeonDb>;

function isTestEnv(): boolean {
  return !!process.env.BUN_TEST || process.env.NODE_ENV === "test";
}

const defaultPoolMax = () => (isTestEnv() ? 3 : 10);

const createPostgresDb = () => {
  logger.log("Initializing PostgreSQL connection pool");
  const pool = new PgPool({
    connectionString: process.env.DATABASE_URL,
    max: defaultPoolMax(),
  });
  const db = drizzlePostgres({ client: pool, relations });
  return db;
};

export type PostgresDbType = ReturnType<typeof createPostgresDb>;

export function createDatabase(): NeonDbType | PostgresDbType {
  const provider = process.env.DB_PROVIDER || "postgres";

  if (!process.env.DATABASE_URL) {
    logger.error("DATABASE_URL is not set in environment variables");
    process.exit(1);
  }

  logger.log(`Creating database connection with provider: ${provider}`);

  if (provider === "neon") {
    return createNeonDb();
  }
  return createPostgresDb();
}

export function createPool(): PgPool | Pool {
  const provider = process.env.DB_PROVIDER || "postgres";

  if (provider === "neon") {
    configureNeonWebSocket();
    return new Pool({ connectionString: process.env.DATABASE_URL });
  }

  return new PgPool({
    connectionString: process.env.DATABASE_URL,
    max: defaultPoolMax(),
  });
}
