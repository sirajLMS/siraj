import { runMigrations } from "@/backend/db/scripts/migrate";
import { logger } from "@/backend/lib/logger";
import { baselineDrizzleMigrations } from "@/scripts/baseline-drizzle-migrations";

/**
 * Ensures drizzle migrations (permissions, groups, RLS, custom functions) are
 * applied before seeding. After `db push`, schema exists without a journal —
 * baseline records already-applied schema folders, then migrate runs pending
 * custom-logic migrations.
 */
export async function ensureMigrationsBeforeSeed(): Promise<void> {
  logger.log("Ensuring migrations are applied before seed...");
  await baselineDrizzleMigrations();
  await runMigrations(false);
  logger.log("Migrations ready for seed.");
}
