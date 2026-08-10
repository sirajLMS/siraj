/**
 * PROCESS LOCK — Cross-Process Mutual Exclusion & FIFO Queueing
 *
 * Provides cross-process synchronization for resource-heavy operations
 * (tsgo, biome, oxlint, lint-service, sub-loop quality checks).
 *
 * Features:
 *   - Atomic OS lockfile (`.quality-gate-lock/active.json`)
 *   - Guaranteed FIFO queuing via timestamped ticket files in `.quality-gate-lock/queue/`
 *   - In-process re-entrancy (nested lock calls within the same PID proceed immediately)
 *   - Deadlock recovery (stale lock/ticket cleanup for dead PIDs or expired locks)
 *   - Process signal/exit handlers to clean up locks on termination
 */

import { randomUUID } from "node:crypto";
import { closeSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, unlinkSync, writeSync } from "node:fs";
import { join, resolve } from "node:path";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ActiveLockInfo {
  pid: number;
  acquiredAt: number;
  description: string;
  reentryCount: number;
}

export interface QueueTicketInfo {
  pid: number;
  timestamp: number;
  ticketId: string;
  description: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PROJECT_ROOT = process.cwd();
const LOCK_DIR = resolve(PROJECT_ROOT, ".quality-gate-lock");
const QUEUE_DIR = join(LOCK_DIR, "queue");
const ACTIVE_LOCK_FILE = join(LOCK_DIR, "active.json");

/** Maximum age for a lock before considering it stale (30 minutes) */
const MAX_LOCK_AGE_MS = 30 * 60 * 1000;

/** Queue polling interval in milliseconds */
const POLL_INTERVAL_MS = 250;

const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const NC = "\x1b[0m";

// ─── State ──────────────────────────────────────────────────────────────────

let inMemoryReentryCount = 0;
const activeReleases = new Set<() => void>();
let exitHandlersAttached = false;

// ─── Helper Functions ───────────────────────────────────────────────────────

function getErrorCode(err: unknown): string | undefined {
  if (typeof err !== "object" || err === null || !("code" in err)) {
    return undefined;
  }
  const code = Reflect.get(err, "code");
  return typeof code === "string" ? code : undefined;
}

const waitBuffer = new Int32Array(new SharedArrayBuffer(4));
function syncSleep(ms: number): void {
  Atomics.wait(waitBuffer, 0, 0, ms);
}

/**
 * Check if a process PID is alive.
 * Returns true if process exists, false otherwise.
 */
export function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err: unknown) {
    return getErrorCode(err) === "EPERM";
  }
}

/**
 * Ensure lock directories exist.
 */
function ensureLockDirs(): void {
  if (!existsSync(LOCK_DIR)) {
    mkdirSync(LOCK_DIR, { recursive: true });
  }
  if (!existsSync(QUEUE_DIR)) {
    mkdirSync(QUEUE_DIR, { recursive: true });
  }
}

/**
 * Create a timestamped ticket file in the queue directory.
 */
function createQueueTicket(description: string): { ticketPath: string; ticketInfo: QueueTicketInfo } {
  ensureLockDirs();
  const timestamp = Date.now();
  const ticketId = randomUUID().substring(0, 8);
  const fileName = `${timestamp}_${process.pid}_${ticketId}.json`;
  const ticketPath = join(QUEUE_DIR, fileName);

  const ticketInfo: QueueTicketInfo = {
    pid: process.pid,
    timestamp,
    ticketId,
    description,
  };

  try {
    const fd = openSync(ticketPath, "wx");
    writeSync(fd, JSON.stringify(ticketInfo, null, 2));
    closeSync(fd);
  } catch (err: unknown) {
    if (err !== null) {
      // Retry once if file exists (extremely unlikely)
      const altFileName = `${timestamp + 1}_${process.pid}_${ticketId}.json`;
      const altPath = join(QUEUE_DIR, altFileName);
      const fd = openSync(altPath, "wx");
      writeSync(fd, JSON.stringify(ticketInfo, null, 2));
      closeSync(fd);
      return { ticketPath: altPath, ticketInfo };
    }
  }

  return { ticketPath, ticketInfo };
}

/**
 * Scan queue directory, remove stale tickets (dead PID or expired),
 * and return valid tickets sorted by timestamp ascending (FIFO).
 */
function getValidQueueTickets(): { file: string; info: QueueTicketInfo }[] {
  ensureLockDirs();
  try {
    const files = readdirSync(QUEUE_DIR);
    const valid: { file: string; info: QueueTicketInfo }[] = [];

    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const ticketPath = join(QUEUE_DIR, file);
      try {
        const content = readFileSync(ticketPath, "utf8");
        const info: QueueTicketInfo = JSON.parse(content);
        if (!isPidAlive(info.pid) || Date.now() - info.timestamp > MAX_LOCK_AGE_MS) {
          try {
            unlinkSync(ticketPath);
          } catch {
            /* ignore cleanup error */
          }
        } else {
          valid.push({ file, info });
        }
      } catch {
        try {
          unlinkSync(ticketPath);
        } catch {
          /* ignore cleanup error */
        }
      }
    }

    valid.sort((a, b) => {
      if (a.info.timestamp !== b.info.timestamp) {
        return a.info.timestamp - b.info.timestamp;
      }
      return a.file.localeCompare(b.file);
    });

    return valid;
  } catch {
    return [];
  }
}

/**
 * Read the current active lock, cleaning it up if stale.
 */
function getActiveLock(): ActiveLockInfo | null {
  if (!existsSync(ACTIVE_LOCK_FILE)) return null;
  try {
    const content = readFileSync(ACTIVE_LOCK_FILE, "utf8");
    const info: ActiveLockInfo = JSON.parse(content);
    if (!isPidAlive(info.pid) || Date.now() - info.acquiredAt > MAX_LOCK_AGE_MS) {
      console.log(`${YELLOW}[process-lock]${NC} Cleaning up stale lock held by PID ${info.pid} (${info.description})`);
      try {
        unlinkSync(ACTIVE_LOCK_FILE);
      } catch {
        /* ignore stale lock cleanup error */
      }
      return null;
    }
    return info;
  } catch {
    try {
      unlinkSync(ACTIVE_LOCK_FILE);
    } catch {
      /* ignore stale lock cleanup error */
    }
    return null;
  }
}

/**
 * Atomically claim the active lock file (`active.json`).
 */
function claimActiveLock(description: string): ActiveLockInfo | null {
  ensureLockDirs();
  const info: ActiveLockInfo = {
    pid: process.pid,
    acquiredAt: Date.now(),
    description,
    reentryCount: 1,
  };
  try {
    const fd = openSync(ACTIVE_LOCK_FILE, "wx");
    writeSync(fd, JSON.stringify(info, null, 2));
    closeSync(fd);
    return info;
  } catch (err: unknown) {
    if (getErrorCode(err) === "EEXIST") {
      return null;
    }
    throw err;
  }
}

/**
 * Create a release callback that cleans up active lock when count reaches 0.
 */
function createReleaseCallback(description: string): () => void {
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    inMemoryReentryCount--;
    activeReleases.delete(release);
    if (inMemoryReentryCount <= 0) {
      inMemoryReentryCount = 0;
      try {
        unlinkSync(ACTIVE_LOCK_FILE);
      } catch {
        /* ignore active lock release error */
      }
      console.log(`${CYAN}[process-lock]${NC} Released lock for "${description}" (PID: ${process.pid})`);
    }
  };
  activeReleases.add(release);
  return release;
}

/**
 * Attach process exit handlers to clean up active lock on crash/exit.
 */
function attachExitHandlers(): void {
  if (exitHandlersAttached) return;
  exitHandlersAttached = true;

  const cleanupAll = () => {
    for (const release of activeReleases) {
      try {
        release();
      } catch {
        /* ignore process exit cleanup error */
      }
    }
  };

  process.on("exit", cleanupAll);
  process.on("SIGINT", () => {
    cleanupAll();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    cleanupAll();
    process.exit(143);
  });
}

function checkQueuePosition(
  ticketInfo: QueueTicketInfo,
  activePid: number,
  activeDesc: string,
  lastLoggedState: string
): string {
  const validTickets = getValidQueueTickets();
  const myIndex = validTickets.findIndex(t => t.info.ticketId === ticketInfo.ticketId);
  const pos = myIndex >= 0 ? myIndex + 1 : validTickets.length + 1;
  const stateStr = `held_by_${activePid}_pos_${pos}_total_${validTickets.length}`;

  if (stateStr !== lastLoggedState) {
    console.log(
      `${YELLOW}[process-lock]${NC} Lock held by PID ${activePid} (${activeDesc}). Position in queue: ${pos}/${validTickets.length}. Waiting...`
    );
  }
  return stateStr;
}

function checkWaitingPosition(ticketInfo: QueueTicketInfo, lastLoggedState: string): string {
  const validTickets = getValidQueueTickets();
  const myIndex = validTickets.findIndex(t => t.info.ticketId === ticketInfo.ticketId);
  const pos = myIndex >= 0 ? myIndex + 1 : validTickets.length + 1;
  const stateStr = `waiting_pos_${pos}_total_${validTickets.length}`;

  if (stateStr !== lastLoggedState) {
    console.log(`${YELLOW}[process-lock]${NC} Waiting for turn in queue. Position: ${pos}/${validTickets.length}...`);
  }
  return stateStr;
}

// ─── Core Lock API ──────────────────────────────────────────────────────────

/**
 * Acquire cross-process lock for a heavy task.
 * Returns a release function that MUST be called when done.
 */
export async function acquireProcessLock(description: string): Promise<() => void> {
  ensureLockDirs();
  attachExitHandlers();

  // 1. Re-entrancy check
  const currentActive = getActiveLock();
  if (currentActive && currentActive.pid === process.pid) {
    inMemoryReentryCount++;
    return createReleaseCallback(description);
  }

  // 2. Queue registration
  const { ticketPath, ticketInfo } = createQueueTicket(description);
  console.log(`${CYAN}[process-lock]${NC} Enqueued request for "${description}" (PID: ${process.pid})`);

  let lastLoggedState = "";
  const cleanupTicket = () => {
    try {
      unlinkSync(ticketPath);
    } catch {
      /* ignore ticket removal error */
    }
  };

  // 3. Wait loop
  while (true) {
    const active = getActiveLock();

    if (active) {
      if (active.pid === process.pid) {
        cleanupTicket();
        inMemoryReentryCount = 1;
        return createReleaseCallback(description);
      }
      lastLoggedState = checkQueuePosition(ticketInfo, active.pid, active.description, lastLoggedState);
    } else {
      const validTickets = getValidQueueTickets();
      const isFirst = validTickets.length === 0 || validTickets[0].info.ticketId === ticketInfo.ticketId;

      if (isFirst && claimActiveLock(description)) {
        cleanupTicket();
        inMemoryReentryCount = 1;
        console.log(
          `${GREEN}[process-lock]${NC} Acquired lock for "${description}" (PID: ${process.pid}). Executing...`
        );
        return createReleaseCallback(description);
      }
      lastLoggedState = checkWaitingPosition(ticketInfo, lastLoggedState);
    }

    syncSleep(POLL_INTERVAL_MS);
  }
}

/**
 * Wrap an async function in process lock execution.
 */
export async function withProcessLock<T>(description: string, fn: () => Promise<T>): Promise<T> {
  const release = await acquireProcessLock(description);
  try {
    return await fn();
  } finally {
    release();
  }
}
