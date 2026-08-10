import { unlinkSync } from "node:fs";
import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

const HEARTBEAT_DIR = join(process.cwd(), ".graphql-test-heartbeats");
const HEARTBEAT_INTERVAL_MS = 2_000;
const STALE_HEARTBEAT_MS = 10_000;
const HEARTBEAT_FILE = join(HEARTBEAT_DIR, `worker-${process.pid}.hb`);

let heartbeatTimer: Timer | null = null;
let registered = false;

async function ensureDir(): Promise<void> {
  await mkdir(HEARTBEAT_DIR, { recursive: true });
}

async function writeHeartbeat(): Promise<void> {
  await ensureDir();
  await writeFile(HEARTBEAT_FILE, String(Date.now()));
}

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

const HEARTBEAT_FILE_REGEX = /^worker-(\d+)\.hb$/;

function heartbeatFilePid(filename: string): number | null {
  const match = HEARTBEAT_FILE_REGEX.exec(filename);
  return match ? Number(match[1]) : null;
}

/**
 * Register this worker as an active GraphQL test consumer. Writes a heartbeat
 * file every {@link HEARTBEAT_INTERVAL_MS}. The shared test server owner uses
 * {@link anyPeerHeartbeatsAlive} to decide whether it is safe to stop the
 * server (i.e. when no peer workers are still running tests).
 */
export async function registerWorkerHeartbeat(): Promise<void> {
  if (registered) return;
  registered = true;
  await writeHeartbeat();
  heartbeatTimer = setInterval(() => {
    void writeHeartbeat();
  }, HEARTBEAT_INTERVAL_MS);
  if (typeof heartbeatTimer.unref === "function") heartbeatTimer.unref();
  process.on("exit", () => {
    releaseHeartbeatSync();
  });
}

/**
 * Stop writing heartbeats and remove this worker's heartbeat file. Called by
 * the lifecycle holder's `afterAll` once its suites finish.
 */
export function releaseHeartbeatSync(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  try {
    unlinkSync(HEARTBEAT_FILE);
  } catch {
    // ignore — file may not exist
  }
}

/**
 * True when at least one non-owner worker has a live heartbeat file backed by a
 * running process. Used by the owner to avoid killing the shared server while
 * peer workers still have tests in flight.
 */
export async function anyPeerHeartbeatsAlive(ownerPid: number): Promise<boolean> {
  try {
    const entries = await readdir(HEARTBEAT_DIR);
    const now = Date.now();
    const checks = await Promise.all(
      entries.map(async (filename) => {
        if (!filename.endsWith(".hb")) return false;
        const pid = heartbeatFilePid(filename);
        if (pid === null || pid === ownerPid) return false;
        try {
          const raw = await readFile(join(HEARTBEAT_DIR, filename), "utf8");
          const ts = Number.parseInt(raw, 10);
          if (!Number.isFinite(ts) || now - ts > STALE_HEARTBEAT_MS) return false;
          return alive(pid);
        } catch {
          // ignore — file removed concurrently
          return false;
        }
      }),
    );
    return checks.some(Boolean);
  } catch {
    return false;
  }
}

/** For tests: clear heartbeat dir contents so a stale file never leaks in. */
export async function resetHeartbeatsForTest(): Promise<void> {
  try {
    const entries = await readdir(HEARTBEAT_DIR);
    await Promise.all(
      entries
        .filter((filename) => filename.endsWith(".hb"))
        .map((filename) => unlink(join(HEARTBEAT_DIR, filename)).catch(() => {})),
    );
  } catch {
    // dir missing — ignore
  }
}
