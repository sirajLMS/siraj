import { logger } from "@/backend/lib/logger";

const TRANSIENT_ERROR_CODES = new Set(["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED"]);

const TRANSIENT_ERROR_PATTERNS = [
  "timeout",
  "connection",
  "websocket",
  "pool",
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

export function isTransientError(error: unknown): boolean {
  if (error === null || error === undefined) return false;

  if (error instanceof Error) {
    const code = (error as Error & { code?: string }).code;
    if (code && TRANSIENT_ERROR_CODES.has(code)) return true;

    const message = error.message.toLowerCase();
    if (TRANSIENT_ERROR_PATTERNS.some(pattern => message.includes(pattern))) return true;
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

    return new Promise<T>(resolve => {
      setTimeout(resolve, delay);
    }).then(() => attemptWithRetry(fn, maxRetries, attempt + 1, Math.round(delay * MULTIPLIER)));
  }
}

export async function retryTransient<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
  const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelayMs = options?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  return attemptWithRetry(fn, maxRetries, 0, baseDelayMs);
}
