/**
 * Shared heartbeat computation — used by BOTH the pg-boss adapter (seconds)
 * and the cron worker runtime (milliseconds).
 *
 * The formula `floor(timeoutSeconds / 4)` capped at 60s ensures ~4 heartbeat
 * checks per timeout window, giving the reconciliation ticker enough signal
 * to detect stuck runs without flooding the database.
 *
 * Previously this formula was duplicated:
 * - `pgboss.adapter.ts` (seconds): `Math.min(60, Math.floor(timeoutSeconds / 4))`
 * - `cron-worker.runtime.ts` (ms):    `Math.min(60_000, Math.floor((timeoutSeconds * 1000) / 4))`
 *
 * Both now import and use `computeHeartbeatSeconds` / `computeHeartbeatMs`.
 */

/** Divisor: heartbeat fires ~4× per timeout window. */
const HEARTBEAT_DIVISOR = 4;

/** Cap: never heartbeat more frequently than once per 60 seconds. */
const HEARTBEAT_MAX_SECONDS = 60;

/**
 * Compute the heartbeat interval in **seconds** (used by pg-boss queue options).
 *
 * @param timeoutSeconds - job timeout in seconds
 * @returns heartbeat interval in seconds, capped at 60
 */
export function computeHeartbeatSeconds(timeoutSeconds: number): number {
  return Math.min(HEARTBEAT_MAX_SECONDS, Math.floor(timeoutSeconds / HEARTBEAT_DIVISOR));
}

/**
 * Compute the heartbeat interval in **milliseconds** (used by the worker runtime's
 * `setTimeout` ticker).
 *
 * @param timeoutSeconds - job timeout in seconds
 * @returns heartbeat interval in milliseconds, capped at 60_000
 */
export function computeHeartbeatMs(timeoutSeconds: number): number {
  return computeHeartbeatSeconds(timeoutSeconds) * 1000;
}
