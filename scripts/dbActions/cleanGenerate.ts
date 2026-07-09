import { existsSync, readdirSync, readFileSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runBunCommand } from "./runCommand";
import { withStatementBreakpoints } from "./sqlBreakpoints";

/**
 * Generates a custom migration and populates it with SQL content.
 */
export async function generateCustomMigration(sqlFilePath: string, customName: string): Promise<number> {
  const result = await runBunCommand(["drizzle-kit", "generate", "--custom", `--name=${customName}`]);
  if (result !== 0) return result;

  const drizzleDir = "./backend/drizzle";
  const folders = readdirSync(drizzleDir).filter(f => statSync(join(drizzleDir, f)).isDirectory());

  // Drizzle folders start with timestamp, so sorting alphabetically should give the latest one
  const latestFolder = folders.toSorted((a, b) => a.localeCompare(b)).pop();
  if (!latestFolder?.endsWith(`_${customName}`)) {
    globalThis.console.error(`Could not find generated folder for ${customName}`);
    return 1;
  }

  const migrationFile = join(drizzleDir, latestFolder, "migration.sql");
  const sqlContent = withStatementBreakpoints(readFileSync(sqlFilePath, "utf8"));
  writeFileSync(migrationFile, sqlContent);
  globalThis.console.log(`✓ Updated ${migrationFile} with content from ${sqlFilePath}`);
  return 0;
}

/**
 * Performs a clean generation of migrations.
 */
export async function cleanGenerate(): Promise<number> {
  // 0. Clear existing migrations for a truly clean start
  globalThis.console.log("Clearing existing migrations in backend/drizzle...");
  const drizzleDir = "./backend/drizzle";
  if (existsSync(drizzleDir)) {
    rmSync(drizzleDir, { recursive: true, force: true });
  }

  // 1. Reset Database (Attempted)
  globalThis.console.log("Attempting to reset database (ignoring connection errors)...");
  // We run resetDb.ts but don't check the exit code yet.
  // The user specifically wants to proceed even if it cannot connect.
  await runBunCommand(["run", "backend/db/scripts/resetDb.ts"]);

  // 2. Extensions
  globalThis.console.log("\nGenerating extensions migration...");
  let code = await generateCustomMigration("backend/db/migration/1-extensions.sql", "extensions");
  if (code !== 0) return code;

  // 3. Normal migration
  globalThis.console.log("\nGenerating normal migration...");
  code = await runBunCommand(["drizzle-kit", "generate", "--ignore-conflicts"]);
  if (code !== 0) return code;

  // 4. Combine all other migrations into a single temporary file
  const migrationsDir = "backend/db/migration";
  const customFiles = readdirSync(migrationsDir)
    .filter(f => f.endsWith(".sql") && f !== "1-extensions.sql")
    .sort((a, b) => a.localeCompare(b));

  if (customFiles.length > 0) {
    globalThis.console.log(`\nCombining ${customFiles.length} custom migrations into one...`);
    const tempCombinedFile = join(migrationsDir, "temp_combined_custom.sql_ignore");

    try {
      let combinedContent = "";
      for (const file of customFiles) {
        const content = readFileSync(join(migrationsDir, file), "utf8");
        combinedContent += `-- Source: ${file}\n${content}\n\n`;
      }

      writeFileSync(tempCombinedFile, combinedContent);

      globalThis.console.log("Generating single custom migration for all custom logic...");
      code = await generateCustomMigration(tempCombinedFile, "combined_custom_logic");
      if (code !== 0) return code;
    } finally {
      if (existsSync(tempCombinedFile)) {
        globalThis.console.log("Cleaning up temporary migration file...");
        unlinkSync(tempCombinedFile);
      }
    }
  }

  // 5. Apply migrations
  globalThis.console.log("\nApplying all migrations...");
  code = await runBunCommand(["run", "backend/db/scripts/migrate.ts"]);
  if (code !== 0) {
    globalThis.console.warn("⚠️  Migration failed. Seeding might fail if tables are missing.");
  }

  // 6. Seed
  globalThis.console.log("\nSeeding database...");
  code = await runBunCommand(["run", "backend/db/scripts/drizzleSeed.ts"]);
  if (code !== 0) return code;

  return 0;
}
