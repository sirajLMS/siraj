/**
 * PROCESS LOCK — PID liveness & ancestry inspection helpers.
 *
 * Extracted from `scripts/lib/process-lock.ts`. `isPidRunning` is part of the
 * public API of `@/scripts/lib/process-lock` and is re-exported from there.
 */

import { existsSync, readFileSync } from "node:fs";

export function getErrorCode(err: unknown): string | undefined {
  if (typeof err !== "object" || err === null || !("code" in err)) {
    return undefined;
  }
  const code = Reflect.get(err, "code");
  return typeof code === "string" ? code : undefined;
}

export function asyncSleep(ms: number): Promise<void> {
  return new Promise(done => setTimeout(done, ms));
}

/**
 * Check if a process PID is alive and actively running (not dead, zombie, or stopped).
 * Returns true if process exists and is in an active state, false otherwise.
 */
export function isPidRunning(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }

  // 1. Basic OS signal check (works across all platforms)
  try {
    process.kill(pid, 0);
  } catch (err: unknown) {
    // If error is not EPERM (e.g. ESRCH = no such process), process does not exist
    if (getErrorCode(err) !== "EPERM") {
      return false;
    }
  }

  // 2. Linux /proc inspection for process state & zombie/stopped detection
  try {
    const statPath = `/proc/${pid}/stat`;
    if (existsSync(statPath)) {
      const statContent = readFileSync(statPath, "utf8");
      const lastParen = statContent.lastIndexOf(")");
      if (lastParen !== -1 && lastParen + 2 < statContent.length) {
        const stateChar = statContent.charAt(lastParen + 2);
        // States:
        // 'R' (running), 'S' (sleeping), 'D' (disk sleep), 'I' (idle) -> Running / active
        // 'Z' (zombie), 'T' (stopped by job control/Ctrl+Z), 't' (tracing stop), 'X'/'x' (dead), 'K' (wakekill), 'W' (paging) -> NOT running
        if (stateChar === "Z" || stateChar === "T" || stateChar === "t" || stateChar === "X" || stateChar === "x") {
          return false;
        }
      }
    }

    const cmdlinePath = `/proc/${pid}/cmdline`;
    if (existsSync(cmdlinePath)) {
      const cmdline = readFileSync(cmdlinePath, "utf8");
      if (cmdline.length === 0) {
        return false;
      }
    }
  } catch {
    // If reading /proc fails or on non-Linux, the basic kill(pid, 0) check above stands
  }

  return true;
}

/**
 * Check if the current process is the given PID itself or a descendant of it
 * (up to 5 ancestry levels via /proc). Used to allow re-entrant lock
 * acquisition by processes spawned by the lock owner.
 */
export function isProcessDescendantOf(activePid: number): boolean {
  if (process.pid === activePid) return true;
  let currentPid = process.ppid;
  let depth = 0;
  while (currentPid > 1 && depth < 5) {
    if (currentPid === activePid) return true;
    try {
      const statPath = `/proc/${currentPid}/stat`;
      if (!existsSync(statPath)) break;
      const statContent = readFileSync(statPath, "utf8");
      const lastParen = statContent.lastIndexOf(")");
      if (lastParen === -1) break;
      const rest = statContent.substring(lastParen + 2).split(" ");
      const ppid = Number.parseInt(rest[1], 10);
      if (Number.isNaN(ppid) || ppid <= 1) break;
      currentPid = ppid;
      depth++;
    } catch {
      break;
    }
  }
  return false;
}
