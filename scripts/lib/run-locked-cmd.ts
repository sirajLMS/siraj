import { spawnSync } from "node:child_process";
import { withProcessLock } from "@/scripts/lib/process-lock";

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: bun run scripts/lib/run-locked-cmd.ts <lock-name> [KEY=VAL...] <cmd> [args...]");
  process.exit(1);
}

const lockName = args[0];
let argIdx = 1;
const extraEnv: Record<string, string> = {};

while (argIdx < args.length && /^[A-Za-z0-9_]+=.*/.test(args[argIdx])) {
  const eqIdx = args[argIdx].indexOf("=");
  const key = args[argIdx].slice(0, eqIdx);
  const val = args[argIdx].slice(eqIdx + 1);
  extraEnv[key] = val;
  argIdx++;
}

if (argIdx >= args.length) {
  console.error("Error: No command specified after environment variables.");
  process.exit(1);
}

const cmd = args[argIdx];
const cmdArgs = args.slice(argIdx + 1);
const mergedEnv = { ...process.env, ...extraEnv };

// On Vercel CI / production builds, bypass process lock to prevent build timeouts
if (process.env.VERCEL || process.env.NOW_BUILDER) {
  const result = spawnSync(cmd, cmdArgs, {
    stdio: "inherit",
    shell: false,
    env: mergedEnv,
  });
  process.exit(result.status ?? 1);
}

const exitCode = await withProcessLock(lockName, async () => {
  const result = spawnSync(cmd, cmdArgs, {
    stdio: "inherit",
    shell: false,
    env: mergedEnv,
  });
  return result.status ?? 1;
});

process.exit(exitCode);
