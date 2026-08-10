import { spawnSync } from "node:child_process";
import { withProcessLock } from "@/scripts/lib/process-lock";

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: bun run scripts/lib/run-locked-cmd.ts <lock-name> <cmd> [args...]");
  process.exit(1);
}

const lockName = args[0];
const cmd = args[1];
const cmdArgs = args.slice(2);

const exitCode = await withProcessLock(lockName, async () => {
  const result = spawnSync(cmd, cmdArgs, {
    stdio: "inherit",
    shell: false,
    env: process.env,
  });
  return result.status ?? 1;
});

process.exit(exitCode);
