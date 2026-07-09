import type { Interface } from "node:readline";
import { cleanGenerate } from "./cleanGenerate";
import { isDestructiveActionBlocked, printDestructiveActionBlock } from "./destructive";
import { runBunCommand } from "./runCommand";

export const ACTIONS: Record<string, { label: string; name: string }> = {
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
 * Asks a question to the user.
 */
export async function askQuestion(rl: Interface, query: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(query, answer => {
      resolve(answer);
    });
  });
}

/**
 * Dispatches the action based on internal key (1-8).
 */
export async function dispatchAction(key: string): Promise<number> {
  if (isDestructiveActionBlocked(key)) {
    printDestructiveActionBlock();
    return 1;
  }

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
 * Handles the execution of an action by its key (1-7).
 */
export async function executeAction(key: string, rl?: Interface): Promise<void> {
  const action = ACTIONS[key];
  if (!action) return;

  if (isDestructiveActionBlocked(key)) {
    globalThis.console.log(`\nRunning: ${action.label}...\n`);
    printDestructiveActionBlock();
    globalThis.console.log("\n✗ Failed (code 1)");

    if (rl) {
      await askQuestion(rl, "\nPress Enter to continue...");
    }
    return;
  }

  globalThis.console.log(`\nRunning: ${action.label}...\n`);
  const code = await dispatchAction(key);
  globalThis.console.log(code === 0 ? "\n✓ Success" : `\n✗ Failed (code ${code})`);

  if (rl) {
    await askQuestion(rl, "\nPress Enter to continue...");
  }
}

/**
 * Finds action key by name or flag.
 */
export function findActionKey(input: string): string | undefined {
  const normalized = input.startsWith("--") ? input.slice(2) : input;
  for (const [key, action] of Object.entries(ACTIONS)) {
    if (action.name === normalized) {
      return key;
    }
  }
  return undefined;
}
