import { createServer, type Server } from "node:net";
import { spawnSync } from "bun";

const FIXED_TEST_PORT = 3066;

/** Ports used by GraphQL/UI test servers — never kill dev (3000) or prod start (4000). */
export const TEST_SERVER_PREFERRED_PORT = FIXED_TEST_PORT;
export const TEST_SERVER_PORT = FIXED_TEST_PORT;
export const PROTECTED_APP_PORTS = [3000, 4000] as const;

/**
 * Terminate all listeners on a given port, guarding against killing protected app ports (3000, 4000).
 */
export function killListenersOnPort(port: number): number {
  if ((PROTECTED_APP_PORTS as readonly number[]).includes(port)) {
    return 0;
  }

  const lsof = spawnSync(["lsof", "-ti", `tcp:${port}`, "-sTCP:LISTEN"], {
    stdout: "pipe",
    stderr: "ignore",
  });
  const pids = lsof.stdout?.toString().trim().split("\n").filter(Boolean) ?? [];
  let killed = 0;

  for (const pidText of pids) {
    const pid = Number(pidText);
    if (!Number.isInteger(pid) || pid <= 0 || pid === process.pid) {
      continue;
    }
    try {
      process.kill(pid, "SIGTERM");
      killed++;
    } catch {
      // already gone
    }
  }

  return killed;
}

/** The standard dev server port. When a dev server is already running here,
 * E2E tests in dev mode will reuse it instead of spawning a separate test server. */
export const DEV_SERVER_PORT = 3000;

export function getTestServerPortCandidates(): number[] {
  return [FIXED_TEST_PORT];
}

let allocatedPort: number | undefined;
let portReservationServer: Server | undefined;

export function clearTestPort(): void {
  allocatedPort = undefined;
}

function releasePortReservation(): void {
  if (!portReservationServer) return;
  portReservationServer.close();
  portReservationServer = undefined;
}

function reservePort(port: number): Promise<boolean> {
  releasePortReservation();

  return new Promise(resolve => {
    const server = createServer();
    server.once("error", () => {
      server.close();
      resolve(false);
    });
    server.once("listening", () => {
      portReservationServer = server;
      resolve(true);
    });
    server.listen(port, "127.0.0.1");
  });
}

export function setTestPort(port: number): void {
  allocatedPort = port;
}

export function getTestPort(): number {
  if (allocatedPort !== undefined) {
    return allocatedPort;
  }
  const envPort = process.env.GRAPHQL_TEST_PORT;
  if (envPort) {
    const parsed = Number(envPort);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return FIXED_TEST_PORT;
}

export function getTestBaseUrl(): string {
  return `http://localhost:${getTestPort()}`;
}

export function getTestGraphqlUrl(): string {
  return `${getTestBaseUrl()}/api/graphql`;
}

export function getTestApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getTestBaseUrl()}${normalizedPath}`;
}

function isUiTestRun(): boolean {
  return process.argv.some(arg => arg.replaceAll("\\", "/").includes("test/ui"));
}

export function getTestDistDir(): string {
  if (getTestServerMode() === "production") {
    return getProductionBuildDistDir();
  }
  return ".next-dev";
}

export function getProductionBuildDistDir(): string {
  return process.env.TEST_SERVER_DIST_DIR ?? ".next-test-prod";
}

export function getTestServerMode(): "dev" | "production" {
  if (process.env.TEST_SERVER_MODE === "production") return "production";
  if (process.env.TEST_SERVER_MODE === "dev") return "dev";
  if (isUiTestRun()) return "production";
  return "dev";
}

export function getTestServerLogPath(port: number): string {
  const mode = getTestServerMode();
  return `logs/next-${mode}-server-${port}.log`;
}

export async function allocateTestPort(): Promise<number> {
  const envPort = process.env.GRAPHQL_TEST_PORT;
  const targetPort = envPort ? Number(envPort) : FIXED_TEST_PORT;

  if (!Number.isInteger(targetPort) || targetPort < 1 || targetPort > 65535) {
    throw new Error(`Invalid test port number: ${envPort}`);
  }

  // Check if we can bind or if it's already reserved
  await reservePort(targetPort);
  return targetPort;
}

export async function releaseTcpPortReservation(): Promise<void> {
  releasePortReservation();
}

export async function releaseAllocatedTestPort(): Promise<void> {
  releasePortReservation();
}

/**
 * Detect whether a dev server is already responding on the given port.
 * Used to decide if E2E tests can reuse the existing dev server instead of
 * spawning a separate test server (which Next.js 16 refuses when the dist
 * directory is shared).
 *
 * Any HTTP response — even a 500 from a compilation error — means the server
 * is running and we should reuse it rather than spawning a conflicting one.
 */
export async function isServerRunningOnPort(port: number): Promise<boolean> {
  try {
    const fetchFn = typeof Bun === "undefined" ? fetch : Bun.fetch;
    const res = await fetchFn(`http://localhost:${port}/`, { method: "GET", redirect: "manual" });
    // Any HTTP response (including errors) means the server is running
    return res.status > 0;
  } catch {
    return false;
  }
}
