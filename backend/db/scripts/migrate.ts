import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { migrate as migrateNeon } from "drizzle-orm/neon-http/migrator";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate as migratePostgres } from "drizzle-orm/node-postgres/migrator";
import logger from "@/backend/lib/logger";
import { db, drizzleDbPool } from "../drizzleDb";

/**
 * Run migrations programmatically
 * This is useful for running migrations in production or in CI/CD pipelines
 */
export async function runMigrations(closePool: boolean) {
  const provider = process.env.DB_PROVIDER || "postgres";

  logger.log(`Running migrations with provider: ${provider}`);

  if (provider === "postgres") {
    logger.warn("⚠️  Pool will be closed after migrations complete");
    await migratePostgres(db as NodePgDatabase, {
      migrationsFolder: "./backend/drizzle",
    });
  } else {
    await migrateNeon(db as NeonHttpDatabase, {
      migrationsFolder: "./backend/drizzle",
    });
  }

  logger.log("Migrations completed successfully!");

  if (!closePool) {
    logger.warn("⚠️  Pool closure skipped as per argument");
    return;
  }

  if (provider === "postgres" && drizzleDbPool) {
    logger.warn("🔴 Closing database pool now...");
    await drizzleDbPool.end();
    logger.warn("🔴 Database pool has been closed!");
    logger.warn("⚠️  Any subsequent database operations will fail with 'Cannot use a pool after calling end'");
  }
}

if (require.main === module) {
  runMigrations(true).catch((err: unknown) => {
    logger.error("Migration failed:", err);
    process.exit(1);
  });
}
