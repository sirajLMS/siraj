/**
 * PROCESS LOCK — Per-Tool Cross-Process Mutual Exclusion & FIFO Queueing
 *
 * Provides cross-process synchronization for resource-heavy operations
 * (tsgo, biome, oxlint, lint-service, sub-loop quality checks).
 *
 * Architecture: PER-TOOL locks (not a single global lock)
 *   Each tool class has its own independent lock namespace:
 *   - `.quality-gate-lock/tsgo/`        → serializes: tsgo, sub-loop tsgo, restore-next-env-dts
 *   - `.quality-gate-lock/biome/`       → serializes: biome:check (per-file & full-repo)
 *   - `.quality-gate-lock/oxlint/`      → serializes: oxlint (per-file & full-repo)
 *   - `.quality-gate-lock/lint/`        → serializes: lint-service (type-aware ESLint)
 *   - `.quality-gate-lock/codescene/`   → serializes: CodeScene scans
 *   - `.quality-gate-lock/sonar/`       → serializes: SonarQube scans
 *   - `.quality-gate-lock/duplicates/`  → serializes: jscpd duplication checks
 *   - `.quality-gate-lock/build/`       → serializes: next build
 *   - `.quality-gate-lock/test/`        → serializes: bun test runs
 *   - `.quality-gate-lock/default/`     → fallback for uncategorized tasks
 *
 * This allows tsgo and biome to run concurrently across parallel subagents,
 * while still serializing same-tool calls to prevent CPU/RAM contention.
 *
 * Features:
 *   - Atomic OS lockfile per tool class (`<tool>/active.json`)
 *   - Guaranteed FIFO queuing via timestamped ticket files in `<tool>/queue/`
 *   - In-process re-entrancy (nested lock calls within the same PID proceed immediately)
 *   - Deadlock recovery (stale lock/ticket cleanup for dead PIDs or expired locks)
 *   - Process signal/exit handlers to clean up locks on termination
 *
 * Implementation is split across sibling modules:
 *   • `process-lock.constants.ts` — types, constants, tool classification
 *   • `process-lock.pid.ts`       — PID liveness & ancestry inspection
 *   • `process-lock.state.ts`     — per-namespace state, paths, exit handlers
 *   • `process-lock.queue.ts`     — queue ticket & active lockfile operations
 */

import { unlinkSync } from "node:fs";
import {
  type ActiveLockInfo,
  CYAN,
  GREEN,
  getLockNamespace,
  isTimeoutExempt,
  NC,
  POLL_INTERVAL_MS,
  type QueueTicketInfo,
  YELLOW,
} from "@/scripts/lib/process-lock.constants";
import { asyncSleep, isProcessDescendantOf } from "@/scripts/lib/process-lock.pid";
import {
  claimActiveLock,
  cleanAllStaleLocks,
  createQueueTicket,
  createReleaseCallback,
  getActiveLock,
  getValidQueueTickets,
} from "@/scripts/lib/process-lock.queue";
import { attachExitHandlers, ensureLockDirs, getReentryCount, setReentryCount } from "@/scripts/lib/process-lock.state";

export { isTimeoutExempt } from "@/scripts/lib/process-lock.constants";
export { isPidRunning } from "@/scripts/lib/process-lock.pid";
export { cleanAllStaleLocks } from "@/scripts/lib/process-lock.queue";
// Public API preserved verbatim for all existing consumers.
export type { ActiveLockInfo, QueueTicketInfo };

// Active queue ticket paths owned by this process
const activeTickets = new Set<string>();

function unlinkAllActiveTickets(): void {
  for (const ticketPath of activeTickets) {
    try {
      unlinkSync(ticketPath);
    } catch {
      /* ignore ticket cleanup error */
    }
  }
  activeTickets.clear();
}

// Attach handlers eagerly on module import (preserved original behaviour)
attachExitHandlers(unlinkAllActiveTickets);

// ─── Queue Logging Helpers ──────────────────────────────────────────────────

function getQueuePosition(ns: string, ticketInfo: QueueTicketInfo): { pos: number; total: number } {
  const validTickets = getValidQueueTickets(ns);
  const myIndex = validTickets.findIndex(t => t.info.ticketId === ticketInfo.ticketId);
  const pos = myIndex >= 0 ? myIndex + 1 : validTickets.length + 1;
  return { pos, total: validTickets.length };
}

function logIfStateChanged(stateStr: string, lastLoggedState: string, message: string): string {
  if (stateStr !== lastLoggedState) {
    console.log(message);
  }
  return stateStr;
}

function checkQueuePosition(
  ns: string,
  ticketInfo: QueueTicketInfo,
  activePid: number,
  activeDesc: string,
  lastLoggedState: string
): string {
  const { pos, total } = getQueuePosition(ns, ticketInfo);
  const stateStr = `held_by_${activePid}_pos_${pos}_total_${total}`;
  return logIfStateChanged(
    stateStr,
    lastLoggedState,
    `${YELLOW}[process-lock]${NC} Lock held by PID ${activePid} (${activeDesc}). Position in queue: ${pos}/${total}. Waiting...`
  );
}

function checkWaitingPosition(ns: string, ticketInfo: QueueTicketInfo, lastLoggedState: string): string {
  const { pos, total } = getQueuePosition(ns, ticketInfo);
  const stateStr = `waiting_pos_${pos}_total_${total}`;
  return logIfStateChanged(
    stateStr,
    lastLoggedState,
    `${YELLOW}[process-lock]${NC} Waiting for turn in queue. Position: ${pos}/${total}...`
  );
}

// ─── Core Lock API ──────────────────────────────────────────────────────────

/**
 * Acquire cross-process lock for a specific tool namespace.
 * Returns a release function that MUST be called when done.
 */
export async function acquireProcessLock(description: string): Promise<() => void> {
  const ns = getLockNamespace(description);
  ensureLockDirs(ns);
  attachExitHandlers(unlinkAllActiveTickets);

  // Sweep and clean up any stale locks/tickets from dead or stopped processes
  cleanAllStaleLocks();

  // 1. Re-entrancy check (same process or descendant process spawned by lock owner)
  const currentActive = getActiveLock(ns);
  if (currentActive && isProcessDescendantOf(currentActive.pid)) {
    setReentryCount(ns, getReentryCount(ns) + 1);
    return createReleaseCallback(ns, description);
  }

  // 2. Queue registration
  const { ticketPath, ticketInfo } = createQueueTicket(ns, description);
  activeTickets.add(ticketPath);
  console.log(`${CYAN}[process-lock]${NC} Enqueued request for "${description}" (PID: ${process.pid})`);

  const cleanupTicket = () => {
    activeTickets.delete(ticketPath);
    try {
      unlinkSync(ticketPath);
    } catch {
      /* ignore ticket removal error */
    }
  };

  const poll = async (lastState: string): Promise<() => void> => {
    const active = getActiveLock(ns);
    let state = lastState;

    if (active) {
      if (active.pid === process.pid) {
        cleanupTicket();
        setReentryCount(ns, 1);
        return createReleaseCallback(ns, description);
      }
      state = checkQueuePosition(ns, ticketInfo, active.pid, active.description, state);
    } else {
      const validTickets = getValidQueueTickets(ns);
      const isFirst = validTickets.length === 0 || validTickets[0].info.ticketId === ticketInfo.ticketId;

      if (isFirst && claimActiveLock(ns, description)) {
        cleanupTicket();
        setReentryCount(ns, 1);
        console.log(
          `${GREEN}[process-lock]${NC} Acquired lock for "${description}" (PID: ${process.pid}). Executing...`
        );
        return createReleaseCallback(ns, description);
      }
      state = checkWaitingPosition(ns, ticketInfo, state);
    }

    await asyncSleep(POLL_INTERVAL_MS);
    return poll(state);
  };

  // 3. Wait loop via recursive async polling
  try {
    return await poll("");
  } finally {
    // If we exit unexpectedly without returning, ensure ticket is cleaned up
    cleanupTicket();
  }
}

/**
 * Wrap an async function in process lock execution.
 * Enforces a 5-minute timeout for all tasks EXCEPT exempt tasks (CodeScene, Sonar, Tests, Duplicates).
 */
export async function withProcessLock<T>(description: string, fn: () => Promise<T>): Promise<T> {
  const release = await acquireProcessLock(description);

  const exempt = isTimeoutExempt(description);
  const MAX_TASK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  let timedOut = false;

  const timeoutPromise = exempt
    ? null
    : new Promise<never>((_, reject) => {
        timeoutTimer = setTimeout(() => {
          timedOut = true;
          const msg =
            `\n\x1b[31m❌ [process-lock] TASK TIMEOUT EXCEEDED (5 minutes / 300,000ms)\x1b[0m\n` +
            `Task "${description}" took longer than 5 minutes (300000ms) to complete.\n` +
            `This usually indicates an un-excluded build/dist directory, an infinite loop, or resource contention.\n` +
            `Fix the underlying issue before running again.\n`;
          console.error(msg);
          reject(new Error(msg));
        }, MAX_TASK_TIMEOUT_MS);
      });

  try {
    if (timeoutPromise) {
      return await Promise.race([fn(), timeoutPromise]);
    }
    return await fn();
  } catch (error) {
    if (timedOut) {
      throw error;
    }
    throw error;
  } finally {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
    }
    release();
  }
}
