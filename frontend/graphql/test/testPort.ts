import { unlinkSync } from "node:fs";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:net";
import { join } from "node:path";

const PREFERRED_PORT = 3001;
const PORT_RANGE_START = 3020;
const PORT_RANGE_END = 3199;
const LOCK_DIR = join(process.cwd(), ".graphql-test-ports");

let allocatedPort: number | undefined;
let portReservationServer: Server | undefined;
let heldPortLock: number | undefined;

export function clearTestPort(): void {
  allocatedPort = undefined;
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function readLockPid(lockFile: string): Promise<number | undefined> {
  try {
    const raw = (await readFile(lockFile, "utf8")).trim();
    const pid = Number(raw);
    return Number.isInteger(pid) ? pid : undefined;
  } catch {
    return undefined;
  }
}

async function releasePortLock(port: number): Promise<void> {
  if (heldPortLock !== port) return;
  try {
    await unlink(join(LOCK_DIR, `${port}.lock`));
  } catch {
    // ignore
  }
  heldPortLock = undefined;
}

async function tryAcquirePortLock(port: number): Promise<boolean> {
  await mkdir(LOCK_DIR, { recursive: true });
  const lockFile = join(LOCK_DIR, `${port}.lock`);

  const existingPid = await readLockPid(lockFile);
  if (existingPid !== undefined && isProcessAlive(existingPid) && existingPid !== process.pid) {
    return false;
  }

  if (existingPid !== undefined && !isProcessAlive(existingPid)) {
    try {
      await unlink(lockFile);
    } catch {
      // ignore
    }
  }

  try {
    await writeFile(lockFile, String(process.pid), { flag: "wx" });
    heldPortLock = port;
    return true;
  } catch {
    const currentPid = await readLockPid(lockFile);
    if (currentPid === process.pid) {
      heldPortLock = port;
      return true;
    }
    return false;
  }
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

async function reserveLockedPort(port: number): Promise<boolean> {
  if (!(await tryAcquirePortLock(port))) {
    return false;
  }
  if (await reservePort(port)) {
    return true;
  }
  await releasePortLock(port);
  return false;
}

async function reserveFirstAvailablePort(candidates: number[]): Promise<number | undefined> {
  for (const port of candidates) {
    if (await reserveLockedPort(port)) {
      return port;
    }
  }
  return undefined;
}

export function setTestPort(port: number): void {
  allocatedPort = port;
}

export function getTestPort(): number {
  if (allocatedPort === undefined) {
    throw new Error("GraphQL test server port is not set. Call setupTestServerLifecycle() before using testClient.");
  }
  return allocatedPort;
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

export function getTestDistDir(port: number): string {
  return `.next-test-${port}`;
}

export function getTestServerLogPath(port: number): string {
  return `logs/next-dev-server-${port}.log`;
}

function getPidSkewedCandidates(excluded: Set<number>): number[] {
  const rangeSize = PORT_RANGE_END - PORT_RANGE_START + 1;
  const start = PORT_RANGE_START + (process.pid % rangeSize);
  const ordered: number[] = [];

  for (let offset = 0; offset < rangeSize; offset++) {
    const port = PORT_RANGE_START + ((start - PORT_RANGE_START + offset) % rangeSize);
    if (!excluded.has(port)) {
      ordered.push(port);
    }
  }

  return ordered;
}

export async function allocateTestPort(excludePorts: number[] = []): Promise<number> {
  const excluded = new Set(excludePorts);

  const envPort = process.env.GRAPHQL_TEST_PORT;
  if (envPort) {
    const port = Number(envPort);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error(`GRAPHQL_TEST_PORT must be a valid port number, got: ${envPort}`);
    }
    if (excluded.has(port)) {
      throw new Error(`GRAPHQL_TEST_PORT=${port} was excluded after a failed start attempt.`);
    }
    if (!(await reserveLockedPort(port))) {
      throw new Error(`GRAPHQL_TEST_PORT=${port} is not bindable. Choose a free port or stop the conflicting process.`);
    }
    return port;
  }

  const preferredCandidates = [PREFERRED_PORT].filter(port => !excluded.has(port));
  const preferred = await reserveFirstAvailablePort(preferredCandidates);
  if (preferred !== undefined) {
    return preferred;
  }

  const pidSkewed = getPidSkewedCandidates(excluded);
  const fallback = await reserveFirstAvailablePort(pidSkewed);
  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`No bindable port found in range ${PREFERRED_PORT} or ${PORT_RANGE_START}-${PORT_RANGE_END}.`);
}

export async function releaseTcpPortReservation(): Promise<void> {
  releasePortReservation();
}

export async function releaseAllocatedTestPort(): Promise<void> {
  releasePortReservation();
  if (heldPortLock !== undefined) {
    await releasePortLock(heldPortLock);
  }
}

process.on("exit", () => {
  if (heldPortLock !== undefined) {
    try {
      unlinkSync(join(LOCK_DIR, `${heldPortLock}.lock`));
    } catch {
      // ignore
    }
  }
});
