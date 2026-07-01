import { spawn } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface, type Interface } from "node:readline";

/**
 * DB Actions Script
 * Converted from dbActions.sh
 */

const ACTIONS: Record<string, { label: string; name: string }> = {
  "1": { label: "Reset Database", name: "reset" },
  "2": { label: "Seed Database", name: "seed" },
  "3": { label: "Generate Drizzle Schema", name: "generate" },
  "4": { label: "Drop Drizzle Schema", name: "drop" },
  "5": { label: "Run Migrations", name: "migrate" },
  "6": { label: "Push Schema to DB", name: "push" },
  "7": { label: "Open Drizzle Studio", name: "studio" },
  "8": { label: "Clean Generate (Reset -> Gen -> Migrate -> Seed)", name: "cleanGenerate" },
};

/**
 * Runs a bun command.
 */
async function runBunCommand(args: string[]): Promise<number> {
  return new Promise(resolve => {
    const process = spawn("bun", args, { stdio: "inherit" });
    process.on("close", code => {
      resolve(code ?? 0);
    });
    process.on("error", err => {
      globalThis.console.error(`Error: ${err.message}`);
      resolve(1);
    });
  });
}

/**
 * Generates a custom migration and populates it with SQL content.
 */
async function generateCustomMigration(sqlFilePath: string, customName: string): Promise<number> {
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
  const sqlContent = readFileSync(sqlFilePath, "utf8");
  writeFileSync(migrationFile, sqlContent);
  globalThis.console.log(`✓ Updated ${migrationFile} with content from ${sqlFilePath}`);
  return 0;
}

/**
 * Performs a clean generation of migrations.
 */
async function cleanGenerate(): Promise<number> {
  // 0. Clear existing migrations for a truly clean start
  globalThis.console.log("Clearing existing migrations in backend/drizzle...");
  const drizzleDir = "./backend/drizzle";
  if (existsSync(drizzleDir)) {
    const rm = spawn(
      "powershell.exe",
      ["-NoProfile", "-Command", `Remove-Item -Path "${drizzleDir}" -Recurse -Force`],
      { stdio: "inherit" }
    );
    await new Promise(resolve => rm.on("close", resolve));
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

/**
 * Dispatches the action based on internal key (1-8).
 */
async function dispatchAction(key: string): Promise<number> {
  switch (key) {
    case "1":
      return runBunCommand(["run", "backend/db/scripts/resetDb.ts"]);
    case "2":
      return runBunCommand(["run", "backend/db/scripts/drizzleSeed.ts"]);
    case "3":
      return runBunCommand(["drizzle-kit", "generate", "--ignore-conflicts"]);
    case "4":
      return runBunCommand(["drizzle-kit", "drop"]);
    case "5":
      return runBunCommand(["run", "backend/db/scripts/migrate.ts"]);
    case "6":
      return runBunCommand(["drizzle-kit", "push", "--force"]);
    case "7":
      return runBunCommand(["drizzle-kit", "studio"]);
    case "8":
      return cleanGenerate();
    default:
      globalThis.console.error(`Invalid action key: "${key}". Please select a valid option.`);
      return 1;
  }
}

/**
 * Displays the interactive menu.
 */
function displayMenu(): void {
  globalThis.console.log("\n--- Database Actions ---");
  for (const [key, action] of Object.entries(ACTIONS)) {
    globalThis.console.log(`${key}. ${action.label}`);
  }
  globalThis.console.log("0. Exit");
}

/**
 * Asks a question to the user.
 */
async function askQuestion(rl: Interface, query: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(query, answer => {
      resolve(answer);
    });
  });
}

/**
 * Displays help information.
 */
function showHelp(): void {
  globalThis.console.log("Usage: bun scripts/dbActions.ts [arg|flag] [--help]");
  globalThis.console.log("\nArguments / Flags (Non-interactive mode):");
  for (const action of Object.values(ACTIONS)) {
    const arg = action.name.padEnd(12);
    const flag = `--${action.name}`.padEnd(12);
    globalThis.console.log(`  ${arg} or ${flag} -> Run ${action.label} and exit`);
  }
  globalThis.console.log("\nInteractive Mode:");
  globalThis.console.log("  Run without arguments to start the interactive numeric menu.");
}

/**
 * Handles the execution of an action by its key (1-7).
 */
async function executeAction(key: string, rl?: Interface): Promise<void> {
  const action = ACTIONS[key];
  if (!action) return;

  globalThis.console.log(`\nRunning: ${action.label}...\n`);
  const code = await dispatchAction(key);
  globalThis.console.log(code === 0 ? "\n✓ Success" : `\n✗ Failed (code ${code})`);

  if (rl) {
    await askQuestion(rl, "\nPress Enter to continue...");
  }
}

/**
 * Main loop for interactive mode.
 */
async function interactiveLoop(): Promise<void> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let active = true;
  while (active) {
    displayMenu();
    const choice = (await askQuestion(rl, "\nChoice: ")).trim();
    if (choice === "0") {
      active = false;
    } else if (ACTIONS[choice]) {
      await executeAction(choice, rl);
    } else {
      globalThis.console.error(`Invalid choice: ${choice}`);
    }
  }

  rl.close();
  globalThis.console.log("Exiting.");
}

/**
 * Finds action key by name or flag.
 */
function findActionKey(input: string): string | undefined {
  const normalized = input.startsWith("--") ? input.slice(2) : input;
  for (const [key, action] of Object.entries(ACTIONS)) {
    if (action.name === normalized) {
      return key;
    }
  }
  return undefined;
}

/**
 * Entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    return;
  }

  if (args.length > 0) {
    const key = findActionKey(args[0]);
    if (key) {
      await executeAction(key);
    } else {
      globalThis.console.error(`Invalid argument: ${args[0]}`);
      showHelp();
    }
    return;
  }

  await interactiveLoop();
}

main().catch((err: unknown) => {
  globalThis.console.error("Fatal:", err);
  process.exit(1);
});
