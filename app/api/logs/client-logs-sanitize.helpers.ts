import {
  type BatchLogRequest,
  DAILY_BYTES_CACHE_PREFIX,
  type LogEntry,
  MAX_DAILY_LOG_BYTES,
  MAX_LOG_MESSAGE_LENGTH,
  SAFE_SESSION_ID_REGEX,
} from "@/app/api/logs/client-logs.constants";
import { CacheDbRepository } from "@/backend/db/repo";

function endOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Accumulate the batch byte size into the per-user daily total and report
 * whether the batch fits within the budget. The last batch that fits within
 * the budget is accepted; a batch that would push the running total past the
 * cap is rejected. The cache read/write is best-effort: on a cache outage the
 * budget check fails open rather than blocking the telemetry channel.
 */
export async function checkDailyByteBudget(userId: string, batchBytes: number): Promise<boolean> {
  const key = `${DAILY_BYTES_CACHE_PREFIX}${userId}`;
  try {
    const existing = await CacheDbRepository.get(key);
    const currentTotal = existing ? Number.parseInt(existing.value, 10) || 0 : 0;
    const newTotal = currentTotal + batchBytes;

    if (newTotal > MAX_DAILY_LOG_BYTES) {
      return false;
    }

    const expiresAt = existing?.expiresAt ?? endOfDay(new Date());
    await CacheDbRepository.set(key, String(newTotal), expiresAt);
    return true;
  } catch {
    return true;
  }
}

export function truncateLogField(value: string): string {
  return value.length > MAX_LOG_MESSAGE_LENGTH ? value.slice(0, MAX_LOG_MESSAGE_LENGTH) : value;
}

export function sanitizeSessionId(sessionId: string): string {
  if (!SAFE_SESSION_ID_REGEX.test(sessionId)) {
    throw new Error("Invalid sessionId: must be alphanumeric with hyphens only");
  }
  return sessionId;
}

export function isBatchLogRequest(value: unknown): value is BatchLogRequest {
  return typeof value === "object" && value !== null && "logs" in value && Array.isArray(value.logs);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isValidLogEntry(log: unknown): log is LogEntry {
  if (!isRecord(log)) {
    return false;
  }
  return (
    typeof log.sessionId === "string" &&
    typeof log.level === "string" &&
    typeof log.message === "string" &&
    typeof log.sequence === "number" &&
    (log.timestamp === undefined || typeof log.timestamp === "string") &&
    (log.caller === undefined || typeof log.caller === "string")
  );
}

// ESC (0x1b) built via char code — keeps control characters out of regex literals.
// Module-level so the pattern is compiled once instead of per log line.
const ANSI_ESCAPE_REGEX = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*[a-zA-Z]`, "g");

/**
 * Strip ANSI escape sequences from a string to prevent log injection
 */
function stripAnsiEscapes(str: string): string {
  return str.replace(ANSI_ESCAPE_REGEX, "");
}

/**
 * Sanitize a string for safe rendering — strips ANSI, neutralizes newlines to prevent log injection, and escapes HTML entities
 */
export function sanitizeForRendering(str: string): string {
  const withoutAnsi = stripAnsiEscapes(str);
  return withoutAnsi
    .replace(/[\r\n]+/g, " ")
    .replaceAll("&", "\x26amp;")
    .replaceAll("<", "\x26lt;")
    .replaceAll(">", "\x26gt;")
    .replaceAll('"', "\x26quot;");
}
