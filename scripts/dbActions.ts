import { spawn } from "node:child_process";
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
 * Dispatches the action based on internal key (1-7).
 */
async function dispatchAction(key: string): Promise<number> {
  switch (key) {
    case "1":
      return runBunCommand(["run", "backend/db/scripts/resetDb.ts"]);
    case "2":
      return runBunCommand(["run", "backend/db/scripts/drizzleSeed.ts"]);
    case "3":
      return runBunCommand(["drizzle-kit", "generate"]);
    case "4":
      return runBunCommand(["drizzle-kit", "drop"]);
    case "5":
      return runBunCommand(["run", "backend/db/scripts/migrate.ts"]);
    case "6":
      return runBunCommand(["drizzle-kit", "push"]);
    case "7":
      return runBunCommand(["drizzle-kit", "studio"]);
    default:
      return 0;
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
