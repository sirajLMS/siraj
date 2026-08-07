import { access, appendFile, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn, spawnSync } from "bun";
import {
  allocateTestPort,
  clearTestPort,
  getTestDistDir,
  getTestGraphqlUrl,
  getTestPort,
  getTestServerLogPath,
  getTestServerMode,
  releaseAllocatedTestPort,
  releaseTcpPortReservation,
  setTestPort,
} from "@/frontend/common/graphql/test/testPort";
import { restoreCanonicalNextEnvDts } from "@/scripts/lib/restore-next-env-dts";
import { getTestProductionEnv } from "@/scripts/lib/test-build-env";
import { testLogger } from "@/shared/lib/logger/testlogger";

let serverProcess: ReturnType<typeof spawn> | undefined;
let serverRootPid: number | undefined;
let logFilePath: string | undefined;

function getDevTestServerEnv(distDir: string): Record<string, string | undefined> {
  return {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV ?? "test",
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_DIST_DIR: distDir,
    IS_DEMO: "true",
    TEST_SERVER: "1",
  };
}

async function writeNextLog(text: string) {
  if (!logFilePath) return;
  try {
    await appendFile(join(process.cwd(), logFilePath), text);
  } catch {
    // ignore
  }
}

function getChildPids(parentPid: number): number[] {
  try {
    const result = spawnSync(["pgrep", "-P", String(parentPid)], { stdout: "pipe", stderr: "ignore" });
    return result.stdout?.toString().trim().split("\n").filter(Boolean).map(Number) ?? [];
  } catch {
    return [];
  }
}

function killProcessTree(rootPid: number) {
  const visited = new Set<number>();
  const queue = [rootPid];

  while (queue.length > 0) {
    const pid = queue.shift();
    if (pid === undefined || visited.has(pid)) continue;
    visited.add(pid);

    for (const childPid of getChildPids(pid)) {
      queue.push(childPid);
    }

    try {
      process.kill(pid, "SIGKILL");
    } catch {
      // Process may already be dead
    }
  }
}

function pipeStreamLogs(proc: ReturnType<typeof spawn>) {
  if (proc.stderr && typeof proc.stderr === "object" && "getReader" in proc.stderr) {
    const stderrStream = proc.stderr as ReadableStream<Uint8Array>;
    (async () => {
      try {
        const reader = stderrStream.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writeNextLog(`[ERROR] ${decoder.decode(value)}`);
        }
      } catch (err) {
        testLogger.error("Error reading Next.js test server stderr:", err);
      }
    })();
  }

  if (proc.stdout && typeof proc.stdout === "object" && "getReader" in proc.stdout) {
    const stdoutStream = proc.stdout as ReadableStream<Uint8Array>;
    (async () => {
      try {
        const reader = stdoutStream.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writeNextLog(`[DEBUG] ${decoder.decode(value)}`);
        }
      } catch (err) {
        testLogger.error("Error reading Next.js test server stdout:", err);
      }
    })();
  }
}

async function warmUpDevServerRoutes(): Promise<void> {
  const fetchFn = typeof Bun === "undefined" ? fetch : Bun.fetch;
  const base = `http://localhost:${getTestPort()}`;
  // Only warm up the root route — heavier routes (login, dashboard) compile
  // on demand during tests and can cause memory pressure during warmup.
  const routes = ["/"];
  const routeTimeoutMs = 60_000;

  testLogger.info("Warming up Next.js dev server routes...");
  for (const route of routes) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), routeTimeoutMs);
    try {
      await fetchFn(`${base}${route}`, { redirect: "follow", signal: controller.signal });
      testLogger.debug(`Warmed up route: ${route}`);
    } catch (err) {
      testLogger.warn(`Failed to warm up route ${route}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  // Wait for the server to stabilize after warmup (Turbopack may still be
  // recompiling or the server may restart after a compilation crash).
  const stabilizing = await waitForServerReady(30_000);
  if (!stabilizing) {
    testLogger.warn("Server did not stabilize after warmup");
  }
}

async function waitForServerReady(timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  const url = getTestGraphqlUrl();
  const fetchFn = typeof Bun === "undefined" ? fetch : Bun.fetch;
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetchFn(url, { method: "HEAD" });
      if (res.status === 204) {
        return true;
      }
      testLogger.debug(`Test server responded with status ${res.status} (not ready yet)`);
    } catch (err) {
      testLogger.debug(`Test server not ready yet: ${err instanceof Error ? err.message : String(err)}`);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return false;
}

async function dumpServerLog(port: number): Promise<void> {
  const path = getTestServerLogPath(port);
  const mode = getTestServerMode();
  try {
    const content = await readFile(join(process.cwd(), path), "utf8");
    if (content.trim()) {
      testLogger.warn(`===== BEGIN Next.js ${mode} test server log (port ${port}) =====`);
      for (const line of content.split("\n")) {
        if (line.trim()) testLogger.warn(line);
      }
      testLogger.warn(`===== END Next.js ${mode} test server log (port ${port}) =====`);
    } else {
      testLogger.warn(`Next.js test server log file is empty (port ${port}): ${path}`);
    }
  } catch (err) {
    testLogger.warn(`Could not read test server log ${path}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function assertProductionBuildExists(distDir: string): Promise<void> {
  try {
    await access(join(process.cwd(), distDir, "BUILD_ID"));
    testLogger.info(`Using production test build at ${distDir}`);
  } catch {
    throw new Error(
      `Production test build not found at ${distDir}. Run "bun run build:test" before running UI/E2E tests.`
    );
  }
}

async function spawnServerOnPort(port: number): Promise<ReturnType<typeof spawn>> {
  const mode = getTestServerMode();
  const distDir = getTestDistDir(port);
  logFilePath = getTestServerLogPath(port);

  try {
    await writeFile(join(process.cwd(), logFilePath), "");
  } catch {
    // ignore
  }

  await releaseTcpPortReservation();

  if (mode === "production") {
    await assertProductionBuildExists(distDir);
  }

  const command =
    mode === "production"
      ? ["bun", "run", "next", "start", "-p", String(port)]
      : ["bun", "--env-file=.env.test", "run", "next", "dev", "-p", String(port)];

  const proc = spawn(command, {
    stdout: "pipe",
    stderr: "pipe",
    env:
      mode === "production"
        ? getTestProductionEnv({ NEXT_DIST_DIR: distDir, TEST_SERVER: "1" })
        : getDevTestServerEnv(distDir),
  });

  pipeStreamLogs(proc);
  return proc;
}

async function startServerWithRetry(): Promise<void> {
  const triedPorts: number[] = [];
  let lastError: Error | undefined;
  const mode = getTestServerMode();
  const readyTimeoutMs = mode === "production" ? 5_000 : 180_000;

  while (triedPorts.length < 2) {
    const port = await allocateTestPort(triedPorts);
    triedPorts.push(port);
    setTestPort(port);
    testLogger.info(`Starting Next.js ${mode} test server on port ${port}...`);

    const proc = await spawnServerOnPort(port);
    serverProcess = proc;
    serverRootPid = proc.pid;

    const isReady = await waitForServerReady(readyTimeoutMs);
    if (isReady) {
      testLogger.info(`Next.js ${mode} test server is ready on port ${port}!`);
      await restoreCanonicalNextEnvDts();
      if (mode === "dev") {
        await warmUpDevServerRoutes();
      }
      return;
    }

    testLogger.warn(`Next.js ${mode} test server failed to become ready on port ${port}.`);
    await dumpServerLog(port);
    killProcessTree(serverRootPid);
    serverProcess = undefined;
    serverRootPid = undefined;
    logFilePath = undefined;
    clearTestPort();
    await releaseAllocatedTestPort();
    lastError = new Error(
      `Next.js ${mode} test server failed to start within ${readyTimeoutMs / 1000} seconds on port ${port}. See ${getTestServerLogPath(port)} for details.`
    );

    if (process.env.GRAPHQL_TEST_PORT) {
      break;
    }
  }

  throw lastError ?? new Error(`Next.js ${mode} test server failed to start.`);
}

export async function isTestServerRunning(): Promise<boolean> {
  if (!serverProcess && serverRootPid === undefined) {
    return false;
  }

  try {
    const fetchFn = typeof Bun === "undefined" ? fetch : Bun.fetch;
    const res = await fetchFn(getTestGraphqlUrl(), { method: "HEAD" });
    return res.status === 204;
  } catch {
    return false;
  }
}

export async function startTestServer() {
  if (serverProcess && (await isTestServerRunning())) {
    testLogger.warn("Next.js test server is already running.");
    return;
  }

  if (serverProcess || serverRootPid !== undefined) {
    stopTestServer();
  }

  await startServerWithRetry();
}

export function stopTestServer() {
  if (!serverProcess && serverRootPid === undefined) {
    return;
  }

  const port = allocatedPortForShutdown();
  const mode = getTestServerMode();
  testLogger.info(`Stopping Next.js ${mode} test server on port ${port ?? "unknown"}...`);

  if (serverRootPid !== undefined) {
    killProcessTree(serverRootPid);
  } else if (serverProcess) {
    try {
      serverProcess.kill();
    } catch {
      // Process may already be dead
    }
  }

  serverProcess = undefined;
  serverRootPid = undefined;
  logFilePath = undefined;
  clearTestPort();
  void restoreCanonicalNextEnvDts();
  void releaseAllocatedTestPort();
}

function allocatedPortForShutdown(): number | undefined {
  try {
    return getTestPort();
  } catch {
    return undefined;
  }
}

// Ensure the Next.js test server process is killed when the main test runner process exits
process.on("exit", () => {
  stopTestServer();
});
process.on("SIGINT", () => {
  stopTestServer();
  process.exit(0);
});
process.on("SIGTERM", () => {
  stopTestServer();
  process.exit(0);
});
