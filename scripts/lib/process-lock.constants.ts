/**
 * PROCESS LOCK constants, types and tool classification.
 *
 * Extracted from `scripts/lib/process-lock.ts`. The public API of
 * `@/scripts/lib/process-lock` is unchanged — `ActiveLockInfo`,
 * `QueueTicketInfo`, `isTimeoutExempt` are re-exported from there.
 */

import { resolve } from "node:path";

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
export const LOCK_BASE_DIR = resolve(PROJECT_ROOT, ".quality-gate-lock");

/** Maximum age for a lock before considering it stale (5 minutes) */
export const MAX_LOCK_AGE_MS = 5 * 60 * 1000;

/** Queue polling interval in milliseconds */
export const POLL_INTERVAL_MS = 250;

export const YELLOW = "\x1b[33m";
export const GREEN = "\x1b[32m";
export const CYAN = "\x1b[36m";
export const NC = "\x1b[0m";

// ─── Tool Classification ─────────────────────────────────────────────────────

/**
 * Derive the lock namespace (tool class) from the task description.
 * Each namespace gets its own independent lock directory.
 */
export function getLockNamespace(description: string): string {
  const d = description.toLowerCase();
  if (d.includes("tsgo") || d.includes("restore-next-env-dts") || d.includes("typescript")) return "tsgo";
  if (d.includes("biome")) return "biome";
  if (d.includes("oxlint")) return "oxlint";
  if (
    d.includes("lint-service") ||
    d.includes("lint:type-aware") ||
    d.includes("lint:fix") ||
    d === "lint" ||
    d.startsWith("lint ")
  )
    return "lint";
  if (d.includes("codescene")) return "codescene";
  if (d.includes("sonar")) return "sonar";
  if (d.includes("duplicates") || d.includes("jscpd")) return "duplicates";
  if (d.includes("build")) return "build";
  if (d.startsWith("test") || d.includes("test:") || d.includes("test ")) return "test";
  return "default";
}

/**
 * Check if a task description is exempt from the 5-minute timeout.
 */
export function isTimeoutExempt(description: string): boolean {
  const d = description.toLowerCase();
  return (
    d.includes("quality-gate") ||
    d.includes("codescene") ||
    d.includes("sonar") ||
    d.includes("duplicates") ||
    d.includes("jscpd") ||
    d.includes("lint-service") ||
    d.startsWith("test") ||
    d.includes("test:") ||
    d.includes("test ")
  );
}
