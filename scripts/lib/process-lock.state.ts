/**
 * PROCESS LOCK — per-namespace state, path helpers and exit handlers.
 *
 * Extracted from `scripts/lib/process-lock.ts`. Holds the in-process
 * re-entrancy/release tracking state, the per-namespace lock/queue path
 * helpers, and the process signal/exit handlers that clean up locks on
 * termination.
 */

import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { LOCK_BASE_DIR } from "@/scripts/lib/process-lock.constants";

// ─── Per-namespace path helpers ──────────────────────────────────────────────

export function getLockDir(namespace: string): string {
  return join(LOCK_BASE_DIR, namespace);
}

export function getQueueDir(namespace: string): string {
  return join(getLockDir(namespace), "queue");
}

export function getActiveLockFile(namespace: string): string {
  return join(getLockDir(namespace), "active.json");
}

// ─── State (per-namespace) ───────────────────────────────────────────────────

// Reentry tracking: namespace → count
const reentryCountByNs = new Map<string, number>();
// Release callbacks: namespace → Set<() => void>
const activeReleasesByNs = new Map<string, Set<() => void>>();
let exitHandlersAttached = false;

export function getReentryCount(ns: string): number {
  return reentryCountByNs.get(ns) ?? 0;
}

export function setReentryCount(ns: string, val: number): void {
  reentryCountByNs.set(ns, val);
}

export function getReleases(ns: string): Set<() => void> {
  let set = activeReleasesByNs.get(ns);
  if (!set) {
    set = new Set();
    activeReleasesByNs.set(ns, set);
  }
  return set;
}

/** All release-callback sets across namespaces (for global exit cleanup). */
export function getAllReleaseSets(): IterableIterator<Set<() => void>> {
  return activeReleasesByNs.values();
}

/**
 * Ensure lock directories exist for a given namespace.
 */
export function ensureLockDirs(ns: string): void {
  const lockDir = getLockDir(ns);
  const queueDir = getQueueDir(ns);
  if (!existsSync(lockDir)) {
    mkdirSync(lockDir, { recursive: true });
  }
  if (!existsSync(queueDir)) {
    mkdirSync(queueDir, { recursive: true });
  }
}

/**
 * Attach process exit handlers to clean up all active locks and tickets on crash/exit/signals.
 * `cleanupTickets` unlinks the queue ticket paths owned by this process.
 */
export function attachExitHandlers(cleanupTickets: () => void): void {
  if (exitHandlersAttached) return;
  exitHandlersAttached = true;

  const cleanupAll = () => {
    for (const releases of activeReleasesByNs.values()) {
      for (const release of releases) {
        try {
          release();
        } catch {
          /* ignore process exit cleanup error */
        }
      }
    }
    cleanupTickets();
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
  process.on("SIGHUP", () => {
    cleanupAll();
    process.exit(129);
  });
  process.on("SIGQUIT", () => {
    cleanupAll();
    process.exit(131);
  });
  process.on("SIGBREAK", () => {
    cleanupAll();
    process.exit(130);
  });
}
