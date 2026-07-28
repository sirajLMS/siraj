import { spawn } from "node:child_process";
import { getSelectedEnvFile } from "@/scripts/dbActions/envFile";

/**
 * Builds bun CLI args with an isolated env file load for child processes.
 * Uses `--env-file=<path>` (equals form) because `bun --env-file <path> run …` is parsed incorrectly.
 */
export function buildBunCommandArgs(args: string[], envFile: string | null): string[] {
  if (!envFile) {
    return args;
  }

  return ["--no-env-file", `--env-file=${envFile}`, ...args];
}

/**
 * Runs a bun command with the selected env file applied.
 */
export async function runBunCommand(args: string[]): Promise<number> {
  const bunArgs = buildBunCommandArgs(args, getSelectedEnvFile());

  return new Promise(resolve => {
    const child = spawn("bun", bunArgs, { stdio: "inherit" });
    child.on("close", code => {
      resolve(code ?? 0);
    });
    child.on("error", err => {
      globalThis.console.error(`Error: ${err.message}`);
      resolve(1);
    });
  });
}
