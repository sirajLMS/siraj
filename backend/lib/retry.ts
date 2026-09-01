import { randomInt } from "node:crypto";
import { DatabaseUnavailableError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";

const TRANSIENT_ERROR_CODES = new Set(["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED"]);

const TRANSIENT_ERROR_PATTERNS = [
  "timeout",
  "connection reset",
  "connection terminated",
  "connection refused",
  "websocket",
  "the pool is full",
  "pool exhausted",
  "connect etimedout",
  "connect econnreset",
  "termination",
  "shutting down",
] as const;

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 200;
const MULTIPLIER = 2.5;

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
}

const MAX_CAUSE_DEPTH = 5;

export function isTransientError(error: unknown): boolean {
  return isTransientErrorAtDepth(error, 0);
}

function isTransientErrorAtDepth(error: unknown, depth: number): boolean {
  if (error === null || error === undefined) return false;

  // Already classified by the pool-layer translation — callers wrapping DB
  // operations with `retryTransient` keep their cold-start retry behavior.
  if (error instanceof DatabaseUnavailableError) return true;

  if (error instanceof Error) {
    const code = (error as Error & { code?: string }).code;
    if (code && TRANSIENT_ERROR_CODES.has(code)) return true;

    const message = error.message.toLowerCase();
    if (TRANSIENT_ERROR_PATTERNS.some(pattern => message.includes(pattern))) return true;

    // Driver wrappers (e.g. DrizzleQueryError, GraphQL error chains) nest the
    // real socket/network failure in `cause` — inspect one level at a time,
    // depth-capped so pathological chains stay bounded.
    if (depth < MAX_CAUSE_DEPTH && "cause" in error && error.cause !== error) {
      return isTransientErrorAtDepth(error.cause, depth + 1);
    }
  }

  return false;
}

async function attemptWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  attempt: number,
  delay: number
): Promise<T> {
  try {
    const result = await fn();
    if (attempt > 0) {
      logger.info(`Operation succeeded after ${attempt} ${attempt === 1 ? "retry" : "retries"}`);
    }
    return result;
  } catch (error) {
    if (!isTransientError(error) || attempt === maxRetries) {
      throw error;
    }

    logger.warn(
      `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms: ${error instanceof Error ? error.message : String(error)}`
    );

    const jitter = randomInt(0, 50);
    return new Promise<T>(resolve => {
      setTimeout(resolve, delay + jitter);
    }).then(() => attemptWithRetry(fn, maxRetries, attempt + 1, Math.round(delay * MULTIPLIER)));
  }
}

export async function retryTransient<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
  const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelayMs = options?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  return attemptWithRetry(fn, maxRetries, 0, baseDelayMs);
}

/**
 * Classifies a rejected database operation:
 * - `DatabaseUnavailableError` passes through untouched (already classified),
 * - transient driver/network failures become a `DatabaseUnavailableError`
 *   carrying the original error as `cause`,
 * - anything else returns `null`, meaning the caller must surface the original
 *   error unchanged (non-transient errors such as constraint violations are
 *   never reclassified).
 */
export function toDatabaseUnavailableError(error: unknown): DatabaseUnavailableError | null {
  if (error instanceof DatabaseUnavailableError) return error;
  if (!isTransientError(error)) return null;
  const cause = error instanceof Error ? error : undefined;
  return new DatabaseUnavailableError(undefined, cause ? { cause } : undefined);
}
