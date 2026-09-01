import { type ChildProcess, spawn } from "node:child_process";
import { openSync } from "node:fs";
import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { restoreCanonicalNextEnvDts } from "@/scripts/lib/restore-next-env-dts";
import { getTestProductionEnv } from "@/scripts/lib/test-build-env";
import { resolveAdminPassword } from "@/shared/demo-users";
import { testLogger } from "@/shared/lib/logger/testlogger";
import {
  allocateTestPort,
  clearTestPort,
  DEV_SERVER_PORT,
  getTestDistDir,
  getTestGraphqlUrl,
  getTestPort,
  getTestServerLogPath,
  getTestServerMode,
  isServerRunningOnPort,
  killListenersOnPort,
  killProcessTree,
  releaseAllocatedTestPort,
  releaseTcpPortReservation,
  setTestPort,
  TEST_SERVER_PORT,
} from "@/test/helpers/test-port";

// DEV/TEST ONLY — admin password injected into the spawned test server.
// TEST_ADMIN_PASSWORD overrides; otherwise we use the same guarded resolver
// (resolveAdminPassword) that graphql-test-helpers uses for TEST_USER_PASSWORD,
// so the server's seeded passwords always match the client-side logins.
// The dev test server is always spawned with TEST_SERVER=1 and the prod-mode
// harness supplies its own ADMIN_PASSWORD via .env.test, so this value can
// never reach a production deployment.
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? resolveAdminPassword();

let serverProcess: ChildProcess | undefined;
let serverRootPid: number | undefined;
let logFilePath: string | undefined;
let reusesExistingDevServer = false;

function getDevTestServerEnv(distDir: string): NodeJS.ProcessEnv {
  // When TEST_ENFORCE_RATE_LIMIT=true is set on the test process, the spawned
  // dev server must enforce rate limiting (not disable it). This is needed for
  // the rate-limit.test.ts integration test.
  const enforceRateLimit = process.env.TEST_ENFORCE_RATE_LIMIT?.toLowerCase() === "true";

  return Object.assign({}, process.env, {
    NODE_ENV: "development",
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_DIST_DIR: distDir,
    IS_DEMO: "true",
    TEST_SERVER: "1",
    ADMIN_PASSWORD: TEST_ADMIN_PASSWORD,
    ...(enforceRateLimit ? { TEST_ENFORCE_RATE_LIMIT: "true" } : { DISABLE_RATE_LIMITING: "true" }),
  });
}

async function warmUpRoute(route: string, base: string, fetchFn: typeof fetch, routeTimeoutMs: number): Promise<void> {
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

/**
 * Routes visited by E2E tests (see test/ui/e2e/*.test.ts).
 * Pre-compiling these in dev mode eliminates per-test first-visit compilation latency.
 * Public routes can be warmed without auth; protected routes redirect to /login
 * but still compile the route component tree during the redirect cycle.
 */
const E2E_WARMUP_ROUTES = [
  "/",
  "/login",
  "/dashboard",
  "/profile",
  "/quotas",
  "/quotas/new",
  "/quotas/insights",
  "/search-schedule",
  "/students/credits",
  "/lesson-reports",
  "/billing-profile",
  "/teachers/onboarding",
  "/accounting/credits",
  "/accounting/credits/adjust",
] as const;

async function warmUpRouteBatches(
  routes: readonly string[],
  base: string,
  fetchFn: typeof fetch,
  routeTimeoutMs: number,
  batchSize: number
): Promise<void> {
  if (routes.length === 0) return;
  const batch = routes.slice(0, batchSize);
  const remaining = routes.slice(batchSize);
  await Promise.all(batch.map(route => warmUpRoute(route, base, fetchFn, routeTimeoutMs)));
  return warmUpRouteBatches(remaining, base, fetchFn, routeTimeoutMs, batchSize);
}

async function warmUpDevServerRoutes(): Promise<void> {
  const fetchFn = typeof Bun === "undefined" ? fetch : Bun.fetch;
  const base = `http://localhost:${getTestPort()}`;
  const routeTimeoutMs = 240_000;

  testLogger.info(`Warming up ${E2E_WARMUP_ROUTES.length} Next.js dev server routes...`);
  await warmUpRouteBatches(E2E_WARMUP_ROUTES, base, fetchFn, routeTimeoutMs, 12);

  const stabilizing = await waitForServerReady(30_000);
  if (!stabilizing) {
    testLogger.warn("Server did not stabilize after warmup");
  }
}

async function pollServerReady(url: string, fetchFn: typeof fetch, deadline: number): Promise<boolean> {
  if (Date.now() >= deadline) return false;
  try {
    const res = await fetchFn(url, { method: "HEAD" });
    if (res.status === 204) return true;
    testLogger.debug(`Test server responded with status ${res.status} (not ready yet)`);
  } catch (err) {
    testLogger.debug(`Test server not ready yet: ${err instanceof Error ? err.message : String(err)}`);
  }
  await new Promise(resolve => setTimeout(resolve, 500));
  return pollServerReady(url, fetchFn, deadline);
}

async function waitForServerReady(timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  const url = getTestGraphqlUrl();
  const fetchFn = typeof Bun === "undefined" ? fetch : Bun.fetch;
  return pollServerReady(url, fetchFn, deadline);
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

async function spawnServerOnPort(port: number): Promise<ChildProcess> {
  const mode = getTestServerMode();
  const distDir = getTestDistDir();
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

  const bunBin = process.execPath;
  const command =
    mode === "production"
      ? [bunBin, "run", "next", "start", "-p", String(port)]
      : [bunBin, "--env-file=.env.test", "run", "next", "dev", "--turbopack", "-p", String(port)];

  const logFd = openSync(join(process.cwd(), logFilePath), "a");
  const env: NodeJS.ProcessEnv =
    mode === "production"
      ? getTestProductionEnv({ NEXT_DIST_DIR: distDir, TEST_SERVER: "1" })
      : getDevTestServerEnv(distDir);

  const proc = spawn(command[0], command.slice(1), {
    detached: true,
    stdio: ["ignore", logFd, logFd],
    env,
  });

  proc.unref();

  return proc;
}

function shouldWarmUpRoutes(): boolean {
  if (process.env.TEST_E2E_WARMUP === "1") return true;
  return process.argv.some(arg => {
    const norm = arg.replaceAll("\\", "/");
    return norm.endsWith("test/ui/e2e") || norm.endsWith("test/ui/e2e/");
  });
}

async function startServer(): Promise<void> {
  const mode = getTestServerMode();
  const readyTimeoutMs = mode === "production" ? 10_000 : 400_000;
  const port = await allocateTestPort();
  setTestPort(port);

  // If there's an unresponsive listener occupying the test port, kill it first
  if (!(await isTestServerRunning())) {
    killListenersOnPort(port);
  }

  testLogger.info(`Starting Next.js ${mode} test server on port ${port}...`);

  const proc = await spawnServerOnPort(port);
  serverProcess = proc;
  serverRootPid = proc.pid;

  const isReady = await waitForServerReady(readyTimeoutMs);
  if (isReady) {
    testLogger.info(`Next.js ${mode} test server is ready on port ${port}!`);
    await restoreCanonicalNextEnvDts();
    if (mode === "dev" && shouldWarmUpRoutes()) {
      await warmUpDevServerRoutes();
    }
    return;
  }

  testLogger.warn(`Next.js ${mode} test server failed to become ready on port ${port}.`);
  await dumpServerLog(port);
  if (serverRootPid !== undefined) {
    killProcessTree(serverRootPid);
  }
  killListenersOnPort(port);
  serverProcess = undefined;
  serverRootPid = undefined;
  logFilePath = undefined;
  clearTestPort();
  await releaseAllocatedTestPort();

  throw new Error(
    `Next.js ${mode} test server failed to start within ${readyTimeoutMs / 1000} seconds on port ${port}. See ${getTestServerLogPath(port)} for details.`
  );
}

export async function isTestServerRunning(): Promise<boolean> {
  try {
    const fetchFn = typeof Bun === "undefined" ? fetch : Bun.fetch;
    const res = await fetchFn(getTestGraphqlUrl(), { method: "HEAD" });
    return res.status === 204;
  } catch {
    return false;
  }
}

export async function startTestServer() {
  if (await isTestServerRunning()) {
    testLogger.debug("Next.js test server is already running.");
    return;
  }

  // Dev mode: if a dev server is already running on port 3000, reuse it instead
  // of spawning a separate test server. Next.js 16 refuses to start a second dev
  // server using the same dist directory, so we piggyback on the existing one.
  if (
    !process.env.GRAPHQL_TEST_PORT &&
    getTestServerMode() === "dev" &&
    (await isServerRunningOnPort(DEV_SERVER_PORT))
  ) {
    testLogger.info(`Reusing existing Next.js dev server on port ${DEV_SERVER_PORT} for E2E tests.`);
    setTestPort(DEV_SERVER_PORT);
    reusesExistingDevServer = true;
    await ensureDemoUsersForTestsSafe();
    return;
  }

  if (serverProcess || serverRootPid !== undefined) {
    stopTestServer();
  }

  await startServer();
}

/**
 * Wraps ensureDemoUsersForTests in a try/catch so that reusing the existing dev
 * server never fails the test run due to demo-user setup issues.
 */
async function ensureDemoUsersForTestsSafe(): Promise<void> {
  try {
    const { ensureDemoUsersForTests } = await import("@/test/helpers/graphql-test-helpers");
    await ensureDemoUsersForTests();
  } catch (err) {
    testLogger.warn(`Could not ensure demo users for E2E tests: ${err instanceof Error ? err.message : String(err)}`);
  }
}

function stopTestServer() {
  if (reusesExistingDevServer) {
    testLogger.debug("Not stopping server — reusing existing dev server on port 3000.");
    reusesExistingDevServer = false;
    clearTestPort();
    return;
  }

  const port = allocatedPortForShutdown() ?? TEST_SERVER_PORT;
  const mode = getTestServerMode();
  testLogger.info(`Stopping Next.js ${mode} test server on port ${port}...`);

  if (serverRootPid !== undefined) {
    killProcessTree(serverRootPid);
  }
  killListenersOnPort(port);

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

// Clean up server process on manual interrupt
process.on("SIGINT", () => {
  stopTestServer();
  process.exit(0);
});
process.on("SIGTERM", () => {
  stopTestServer();
  process.exit(0);
});
