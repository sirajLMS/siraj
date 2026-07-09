import { spawn } from "node:child_process";

/**
 * Runs a bun command.
 */
export async function runBunCommand(args: string[]): Promise<number> {
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
