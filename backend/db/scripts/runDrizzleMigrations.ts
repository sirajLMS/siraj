import { ensureEnumValuesCommitted } from "@/backend/db/scripts/ensureIdempotentMigrations";
import {
  type DrizzleMigrationConfig,
  loadMigrationState,
  logPendingSummary,
  type MigrationRunContext,
  type PgMigratorDatabase,
  runMigrationsSequentially,
} from "@/backend/db/scripts/runDrizzleMigrations.helpers";
import { logger } from "@/backend/lib/logger";

/**
 * Runs pending Drizzle migrations one folder at a time (separate transactions).
 *
 * Drizzle's built-in migrator wraps **all** pending folders in a single transaction.
 * That breaks PostgreSQL enum rules (55P04) when a migration adds an enum value and
 * uses it in the same transaction. We pre-commit enum additions per folder, then apply
 * each migration in its own transaction.
 *
 * Beyond name-based pending detection, already-applied folders whose content changed
 * since they ran (in-place idempotency rewrites, direct file edits) are re-applied and
 * their journal hash refreshed — but only when every statement in the folder is safe to
 * re-run (drift selection lives in the sibling helpers module). Folders carrying
 * destructive or non-idempotent statements (e.g. the drizzle-generated enum
 * drop/recreate dance) are skipped with a warning; their journal hash is left untouched
 * so the drift stays visible.
 */
export async function runDrizzleMigrations(db: PgMigratorDatabase, config: DrizzleMigrationConfig = {}): Promise<void> {
  const state = await loadMigrationState(db, config);
  const { migrationsToRun, driftedMigrations, reApplicableMigrations } = state;

  if (migrationsToRun.length === 0 && driftedMigrations.length === 0) {
    logger.log("No pending Drizzle migrations.");
    return;
  }

  logPendingSummary(migrationsToRun.length, driftedMigrations.length);

  // Pre-commit ALL enum additions from ALL migration folders before running any
  // migration. This ensures enum values referenced by earlier migrations (e.g.
  // INSERT statements casting to app_permission) are available even when the
  // ALTER TYPE ... ADD VALUE migration folder runs later in the sequence.
  await ensureEnumValuesCommitted();

  const context: MigrationRunContext = {
    db,
    migrationsFolder: state.migrationsFolder,
    migrationsTable: state.migrationsTable,
    migrationsSchema: state.migrationsSchema,
  };

  await runMigrationsSequentially(context, migrationsToRun, "insert");
  await runMigrationsSequentially(context, reApplicableMigrations, "update");
}
