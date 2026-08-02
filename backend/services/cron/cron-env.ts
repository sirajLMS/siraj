/**
 * Shared env-parsing helpers for cron worker configuration.
 *
 * Consolidates the parsing of `CRON_QUEUE_MAX_BATCH`,
 * `CRON_QUEUE_WORKER_CONCURRENCY`, and `CRON_QUEUE_WORKER_TIMEOUT`
 * so the standalone worker script, the cron service, and the worker
 * runtime all use consistent validation and default-handling.
 */
import logger from "@/backend/lib/logger";

/** Default batch size used by the ticker route and worker runtime. */
export const CRON_DEFAULT_BATCH_SIZE = 25;

/** Default standalone-worker batch size (sequential for safety). */
export const CRON_DEFAULT_WORKER_CONCURRENCY = 1;

/** Default worker timeout in ms (4.5 min — 30s margin to Vercel's 300s max). */
export const CRON_DEFAULT_WORKER_TIMEOUT_MS = 270_000;

/** Safety margin subtracted from maxDuration when an explicit value exceeds 60s (REQ-8 AC2). */
export const CRON_SAFETY_MARGIN_MS = 30_000;

/**
 * Parses a positive integer from a raw env string with validation.
 *
 * Returns `undefined` when `raw` is `undefined`, empty, not a finite number,
 * negative, or zero (zero is invalid for these timeout/batch configurators).
 * The caller supplies the fallback default so the logging can report which
 * key and default were used.
 */
export function parsePositiveInt(raw: string | undefined, key: string, fallback: number): number {
  if (raw === undefined || raw === "") {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    logger.warn("cron.env.invalidFallback", { key, raw, fallback });
    return fallback;
  }

  return parsed;
}
