import { createInterface } from "node:readline";
import { ACTIONS, askQuestion, executeAction, findActionKey } from "@/scripts/dbActions/actions";
import {
  DISABLED_ACTION_SUFFIX,
  isDestructiveActionBlocked,
  isPermanentlyDisabled,
  PERMANENTLY_DISABLED_SUFFIX,
} from "@/scripts/dbActions/destructive";

/**
 * Displays the interactive menu.
 */
export function displayMenu(): void {
  globalThis.console.log("\n--- Database Actions ---");
  for (const [key, action] of Object.entries(ACTIONS)) {
    let suffix = "";
    if (isPermanentlyDisabled(key)) {
      suffix = PERMANENTLY_DISABLED_SUFFIX;
    } else if (isDestructiveActionBlocked(key)) {
      suffix = DISABLED_ACTION_SUFFIX;
    }
    globalThis.console.log(`${key}. ${action.label}${suffix}`);
  }
  globalThis.console.log("0. Exit");
}

/**
 * Displays help information.
 */
export function showHelp(): void {
  globalThis.console.log("Usage: bun scripts/dbActions [arg|flag] [--help]");
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
 * Main loop for interactive mode.
 */
export async function interactiveLoop(): Promise<void> {
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
 * Entry point
 */
export async function main(): Promise<void> {
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
