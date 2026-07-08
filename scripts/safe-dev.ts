import { homedir } from "node:os";
import { join } from "node:path";
import { ensureEnvironmentValidated } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";

type BunSubprocess = ReturnType<typeof Bun.spawn>;

const BUN_BIN = join(homedir(), ".bun", "bin", "bun");
const LINT_QUEUE_PORT = 4777;
const LINT_QUEUE_STATUS_URL = `http://localhost:${LINT_QUEUE_PORT}/status`;
const LINT_QUEUE_SCRIPT = "scripts/lint-queue-server.ts";
const DEV_SERVER_ARGS = ["next", "dev", "--turbopack", "-p", "3000", "-H", "0.0.0.0"];

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

async function lintQueueIsUp(): Promise<boolean> {
  try {
    const res = await fetch(LINT_QUEUE_STATUS_URL);
    if (!res.ok) return false;
    const data = (await res.json()) as { running?: boolean; queueLength?: number };
    return typeof data.running === "boolean";
  } catch {
    return false;
  }
}

async function waitForLintQueue(retries: number, delayMs: number): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    await sleep(delayMs);
    if (await lintQueueIsUp()) return true;
  }
  return false;
}

async function ensureLintQueueRunning(): Promise<BunSubprocess | null> {
  if (await lintQueueIsUp()) {
    logger.info("lint-queue-server is already running — skipping start.");
    return null;
  }

  logger.info("lint-queue-server not detected — starting one in the background...");
  const child = Bun.spawn([BUN_BIN, "run", LINT_QUEUE_SCRIPT], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
    onExit: () => {},
  });

  const ok = await waitForLintQueue(5, 500);
  if (ok) {
    logger.info("lint-queue-server started successfully.");
  } else {
    logger.warn("lint-queue-server did not respond OK after retries — continuing anyway.");
  }
  return child;
}

function killChild(child: BunSubprocess | null): void {
  if (child?.pid === undefined) return;
  try {
    process.kill(child.pid, "SIGTERM");
  } catch {
    // already dead — ignore
  }
}

function registerTeardown(devChild: BunSubprocess, lintChild: BunSubprocess | null): void {
  const teardown = (signal: NodeJS.Signals): void => {
    try {
      killChild(devChild);
      killChild(lintChild);
    } catch (err) {
      logger.error("cleanup failure during teardown:", err instanceof Error ? err.message : String(err));
    }
    if (signal === "SIGINT") {
      process.exit(0);
    }
    if (signal === "SIGTERM") {
      process.exit(128 + 15);
    }
    process.exit(128);
  };

  process.on("SIGINT", teardown);
  process.on("SIGTERM", teardown);
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    logger.error("safe-dev: refusing to launch in production environment.");
    process.exit(1);
  }

  try {
    ensureEnvironmentValidated();
  } catch (err) {
    logger.error("safe-dev: environment validation failed:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  const lintChild = await ensureLintQueueRunning();

  logger.info("safe-dev: launching dev server...");
  const devChild = Bun.spawn([BUN_BIN, "x", ...DEV_SERVER_ARGS], {
    cwd: process.cwd(),
    stdio: ["inherit", "inherit", "inherit"],
    env: process.env,
    onExit: () => {},
  });

  registerTeardown(devChild, lintChild);

  const exitCode = await devChild.exited;
  if (lintChild) killChild(lintChild);
  process.exit(exitCode);
}

main().catch((err: unknown) => {
  logger.error("safe-dev: unexpected error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
