/**
 * PROCESS LOCK — queue ticket & active lockfile operations.
 *
 * Extracted from `scripts/lib/process-lock.ts`. Atomic timestamped ticket
 * creation, stale-ticket/liveness-aware parsing, FIFO queue scanning, active
 * lock claiming and release-callback creation. `cleanAllStaleLocks` is part
 * of the public API of `@/scripts/lib/process-lock` and is re-exported from
 * there.
 */

import { randomUUID } from "node:crypto";
import { closeSync, existsSync, openSync, readdirSync, readFileSync, unlinkSync, writeSync } from "node:fs";
import { join } from "node:path";
import {
  type ActiveLockInfo,
  CYAN,
  isTimeoutExempt,
  LOCK_BASE_DIR,
  MAX_LOCK_AGE_MS,
  NC,
  type QueueTicketInfo,
  YELLOW,
} from "@/scripts/lib/process-lock.constants";
import { getErrorCode, isPidRunning } from "@/scripts/lib/process-lock.pid";
import {
  ensureLockDirs,
  getActiveLockFile,
  getQueueDir,
  getReentryCount,
  getReleases,
  setReentryCount,
} from "@/scripts/lib/process-lock.state";

/**
 * Create a timestamped ticket file in the queue directory for a namespace.
 */
export function createQueueTicket(
  ns: string,
  description: string
): { ticketPath: string; ticketInfo: QueueTicketInfo } {
  ensureLockDirs(ns);
  const queueDir = getQueueDir(ns);
  const timestamp = Date.now();
  const ticketId = randomUUID().substring(0, 8);
  const fileName = `${timestamp}_${process.pid}_${ticketId}.json`;
  const ticketPath = join(queueDir, fileName);

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
      const altPath = join(queueDir, altFileName);
      const fd = openSync(altPath, "wx");
      writeSync(fd, JSON.stringify(ticketInfo, null, 2));
      closeSync(fd);
      return { ticketPath: altPath, ticketInfo };
    }
  }

  return { ticketPath, ticketInfo };
}

function parseTicketFile(queueDir: string, file: string): QueueTicketInfo | null {
  if (!file.endsWith(".json")) return null;
  const ticketPath = join(queueDir, file);
  try {
    const content = readFileSync(ticketPath, "utf8");
    const info: QueueTicketInfo = JSON.parse(content);
    const alive = isPidRunning(info.pid);
    const exempt = isTimeoutExempt(info.description);
    if (!alive || (!exempt && Date.now() - info.timestamp > MAX_LOCK_AGE_MS)) {
      try {
        unlinkSync(ticketPath);
      } catch {
        /* ignore cleanup error */
      }
      return null;
    }
    return info;
  } catch {
    try {
      unlinkSync(ticketPath);
    } catch {
      /* ignore cleanup error */
    }
    return null;
  }
}

/**
 * Scan queue directory for a namespace, remove stale tickets,
 * and return valid tickets sorted by timestamp ascending (FIFO).
 */
export function getValidQueueTickets(ns: string): { file: string; info: QueueTicketInfo }[] {
  ensureLockDirs(ns);
  const queueDir = getQueueDir(ns);
  try {
    const files = readdirSync(queueDir);
    const valid: { file: string; info: QueueTicketInfo }[] = [];

    for (const file of files) {
      const info = parseTicketFile(queueDir, file);
      if (info) {
        valid.push({ file, info });
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
 * Read the current active lock for a namespace, cleaning it up if stale.
 */
export function getActiveLock(ns: string): ActiveLockInfo | null {
  const activeLockFile = getActiveLockFile(ns);
  if (!existsSync(activeLockFile)) return null;
  try {
    const content = readFileSync(activeLockFile, "utf8");
    const info: ActiveLockInfo = JSON.parse(content);
    const alive = isPidRunning(info.pid);
    const exempt = isTimeoutExempt(info.description);
    if (!alive || (!exempt && Date.now() - info.acquiredAt > MAX_LOCK_AGE_MS)) {
      console.log(`${YELLOW}[process-lock]${NC} Cleaning up stale lock held by PID ${info.pid} (${info.description})`);
      try {
        unlinkSync(activeLockFile);
      } catch {
        /* ignore stale lock cleanup error */
      }
      return null;
    }
    return info;
  } catch {
    try {
      unlinkSync(activeLockFile);
    } catch {
      /* ignore stale lock cleanup error */
    }
    return null;
  }
}

/**
 * Clean up all stale active locks and queue tickets across all lock namespaces.
 */
export function cleanAllStaleLocks(): void {
  if (!existsSync(LOCK_BASE_DIR)) return;
  try {
    const entries = readdirSync(LOCK_BASE_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const ns = entry.name;
      // 1. Check active lock in namespace
      getActiveLock(ns);
      // 2. Check queue tickets in namespace
      getValidQueueTickets(ns);
    }
  } catch {
    /* ignore scan errors */
  }
}

/**
 * Atomically claim the active lock file for a namespace.
 */
export function claimActiveLock(ns: string, description: string): ActiveLockInfo | null {
  ensureLockDirs(ns);
  const activeLockFile = getActiveLockFile(ns);
  const info: ActiveLockInfo = {
    pid: process.pid,
    acquiredAt: Date.now(),
    description,
    reentryCount: 1,
  };
  try {
    const fd = openSync(activeLockFile, "wx");
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
 * Create a release callback that cleans up the active lock for a namespace.
 */
export function createReleaseCallback(ns: string, description: string): () => void {
  const activeLockFile = getActiveLockFile(ns);
  const releases = getReleases(ns);
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    const count = getReentryCount(ns) - 1;
    setReentryCount(ns, count);
    releases.delete(release);
    if (count <= 0) {
      setReentryCount(ns, 0);
      try {
        unlinkSync(activeLockFile);
      } catch {
        /* ignore active lock release error */
      }
      console.log(`${CYAN}[process-lock]${NC} Released lock for "${description}" (PID: ${process.pid})`);
    }
  };
  releases.add(release);
  return release;
}
