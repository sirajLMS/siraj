import { db, getDrizzleDbPool } from "@/backend/db/drizzleDb";
import { applyCustomMigrations } from "@/backend/db/scripts/applyCustomMigrations";
import { ensureIdempotentMigrations } from "@/backend/db/scripts/ensureIdempotentMigrations";
import { runDrizzleMigrations } from "@/backend/db/scripts/runDrizzleMigrations";
import { getEnv } from "@/backend/lib/env";
import logger from "@/backend/lib/logger";

/**
 * Run migrations programmatically
 * This is useful for running migrations in production or in CI/CD pipelines
 */
export async function runMigrations(closePool: boolean) {
  const provider = getEnv("DB_PROVIDER", "postgres");

  logger.log(`Running migrations with provider: ${provider}`);

  // Auto-bundle any new/changed custom SQL files from backend/db/migration/ into
  // incremental drizzle migration folders before invoking the drizzle migrator.
  // This makes `bun db migrate` apply custom SQL automatically without requiring
  // the (policy-disabled) `cleanGenerate`.
  try {
    const newFolders = applyCustomMigrations();
    if (newFolders.length > 0) {
      logger.log(`Auto-bundled ${newFolders.length} custom migration folder(s): ${newFolders.join(", ")}`);
    }
  } catch (err) {
    logger.error("Custom migration auto-bundle failed:", err);
    throw err;
  }

  // Ensure all migration SQL files in backend/drizzle/ are fully idempotent for PostgreSQL
  // before running Drizzle's migration runner. This prevents failures on existing DBs
  // when type/column/constraint already exists.
  ensureIdempotentMigrations();

  // Per-folder transactions + enum pre-commit (avoids PG 55P04 on fresh and cloud DBs).
  if (provider === "postgres") {
    logger.warn("⚠️  Pool will be closed after migrations complete");
  }
  await runDrizzleMigrations(db, {
    migrationsFolder: "./backend/drizzle",
  });

  logger.log("Migrations completed successfully!");

  if (!closePool) {
    logger.warn("⚠️  Pool closure skipped as per argument");
    return;
  }

  if (provider === "postgres") {
    const pool = getDrizzleDbPool();
    if (pool) {
      logger.warn("🔴 Closing database pool now...");
      await pool.end();
      logger.warn("🔴 Database pool has been closed!");
      logger.warn("⚠️  Any subsequent database operations will fail with 'Cannot use a pool after calling end'");
    }
  }
}

if (require.main === module) {
  runMigrations(true).catch((err: unknown) => {
    logger.error("Migration failed:", err);
    process.exit(1);
  });
}
