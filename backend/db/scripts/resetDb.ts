import { Pool } from "pg";
import logger from "@/backend/lib/logger";
import { assertDestructiveDbCommandAllowed } from "@/scripts/lib/destructiveDbGuard";
import { runMigrations } from "./migrate";

function parseDatabaseUrl(url: string) {
  // Example: postgres://user:password@host:port/dbname or postgresql://user:password@host/dbname?params
  const matchWithPort = /^postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:/]+):(\d+)\/([^?]*)/.exec(url);

  if (matchWithPort) {
    return {
      user: matchWithPort[1],
      password: matchWithPort[2],
      host: matchWithPort[3],
      port: matchWithPort[4],
      database: matchWithPort[5],
    };
  }

  // Try without port: postgres://user:password@host/dbname?params
  const matchWithoutPort = /^postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]*)/.exec(url);
  if (matchWithoutPort) {
    return {
      user: matchWithoutPort[1],
      password: matchWithoutPort[2],
      host: matchWithoutPort[3],
      port: process.env.PGPORT || "5432",
      database: matchWithoutPort[4],
    };
  }

  throw new Error("Invalid DATABASE_URL format");
}

async function resetDatabase() {
  if (!process.env.DATABASE_URL) {
    logger.error("DATABASE_URL is not set in .env");
    process.exit(1);
  }

  try {
    assertDestructiveDbCommandAllowed();
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL;
  logger.debug(`Resetting database: ${dbUrl}`);

  const { user, password, host, port, database } = parseDatabaseUrl(dbUrl);
  logger.log(`Resetting database: ${database}`);

  // Connect to 'postgres' DB to drop/create target DB
  const adminPool = new Pool({
    user,
    password,
    host,
    port: Number(port),
    database: "postgres",
  });
  try {
    // Terminate connections to target DB
    await adminPool.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1;`, [database]);
    // Drop DB
    await adminPool.query(`DROP DATABASE IF EXISTS "${database}";`);
    logger.log(`Dropped database: ${database}`);
    // Create DB
    await adminPool.query(`CREATE DATABASE "${database}";`);
    logger.log(`Created database: ${database}`);
  } catch (err) {
    logger.error("Error resetting database:", err);
    await adminPool.end();
    process.exit(1);
  }
  await adminPool.end();

  // Run migrations
  try {
    await runMigrations(true);
    logger.log("Migration after reset completed successfully!");
  } catch (err) {
    logger.error("Migration after reset failed:", err);
    process.exit(1);
  }
}

resetDatabase().catch((err: unknown) => {
  logger.error("Reset DB failed:", err);
  process.exit(1);
});
