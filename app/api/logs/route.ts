import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { getServerUserContext } from "@/backend/lib";
import { getBooleanEnv } from "@/backend/lib/env";
import { checkRateLimit, clientLogsRateLimiter } from "@/backend/lib/ratelimit";
import { getServerTranslations } from "@/shared/locale";

interface LogEntry {
  sessionId: string;
  level: string;
  message: string;
  timestamp: string;
  caller?: string;
  sequence: number;
}

// Regex intentionally excludes underscores and special characters to prevent
// path traversal attacks when using sessionId in filesystem operations.
// Client-side logger (frontend/lib/logger/index.ts) must generate session IDs
// that match this regex — it uses the format YYYY-MM-DD-HH-mm-ss (hyphens only).
const SAFE_SESSION_ID_REGEX = /^[a-zA-Z0-9-]+$/;

/**
 * Disk-write DoS bounds (security review M1): cap the number of log entries
 * accepted per POST and the length of each message/caller field.
 */
const MAX_LOG_ENTRIES_PER_BATCH = 100;
const MAX_LOG_MESSAGE_LENGTH = 4000;
const MAX_LOG_BATCH_BYTES = 262144; // 256 KiB total batch cap

function truncateLogField(value: string): string {
  return value.length > MAX_LOG_MESSAGE_LENGTH ? value.slice(0, MAX_LOG_MESSAGE_LENGTH) : value;
}

function sanitizeSessionId(sessionId: string): string {
  if (!SAFE_SESSION_ID_REGEX.test(sessionId)) {
    throw new Error("Invalid sessionId: must be alphanumeric with hyphens only");
  }
  return sessionId;
}

interface BatchLogRequest {
  logs: LogEntry[];
}

function isBatchLogRequest(value: unknown): value is BatchLogRequest {
  return typeof value === "object" && value !== null && "logs" in value && Array.isArray(value.logs);
}

const CLEANUP_ENABLED = getBooleanEnv("CLEANUP_ENABLED");

// Track if we've already cleaned up old logs for this session
const cleanedSessions = new Set<string>();

// Buffer to store out-of-order log entries per session
const logBuffers = new Map<string, { entries: LogEntry[]; nextSequence: number; writeLock: Promise<void> }>();

async function cleanupOldClientLogs(logsDir: string, sessionId: string): Promise<void> {
  // Check if cleanup is enabled (default: false to keep logs)
  if (!CLEANUP_ENABLED || cleanedSessions.has(sessionId)) return;

  try {
    // Ensure logs directory exists
    await mkdir(logsDir, { recursive: true });

    // Read all files and find client logs
    const files = await readdir(logsDir);
    const clientLogFiles = files.filter(file => file.startsWith("client_"));

    // Delete all previous client log files
    await Promise.all(
      clientLogFiles.map(file =>
        unlink(join(logsDir, file)).catch(() => {
          /* ignore */
        })
      )
    );

    // Mark this session as cleaned up
    cleanedSessions.add(sessionId);
  } catch {
    // Silently fail to avoid infinite loops
  }
}

/**
 * Strip ANSI escape sequences from a string to prevent log injection
 */
function stripAnsiEscapes(str: string): string {
  const ansiRegex = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*[a-zA-Z]`, "g");
  return str.replace(ansiRegex, "");
}

/**
 * Sanitize a string for safe rendering — strips ANSI, replaces newlines, and escapes HTML entities
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

async function writeLogEntry(logEntry: LogEntry, logsDir: string): Promise<void> {
  const { sessionId } = logEntry;

  // Get or create buffer for this session
  let buffer = logBuffers.get(sessionId);
  if (!buffer) {
    buffer = {
      entries: [],
      nextSequence: 1,
      writeLock: Promise.resolve(),
    };
    logBuffers.set(sessionId, buffer);
  }

  // Add entry and sort by sequence
  buffer.entries.push(logEntry);
  buffer.entries.sort((a, b) => a.sequence - b.sequence);

  // Wait for any pending writes to complete
  await buffer.writeLock;

  // Create a new write lock promise
  let resolveWriteLock: (() => void) | undefined;
  buffer.writeLock = new Promise(resolve => {
    resolveWriteLock = resolve;
  });

  try {
    const safeSessionId = sanitizeSessionId(logEntry.sessionId);
    const logFilePath = join(logsDir, `client_${safeSessionId}.log`);

    const entriesToWrite = buffer.entries.splice(0);
    buffer.entries.length = 0;

    // Process entries sequentially — ordered appends to the same file
    await entriesToWrite.reduce(async (prev, entry) => {
      await prev;

      // Fast-forward sequence if needed
      if (entry.sequence > buffer.nextSequence) {
        buffer.nextSequence = entry.sequence;
      }

      const sanitizedMessage = truncateLogField(sanitizeForRendering(entry.message));
      const sanitizedCaller = truncateLogField(entry.caller ? sanitizeForRendering(entry.caller) : "unknown");
      const logLine = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [SEQ:${entry.sequence}] [${sanitizedCaller}] ${sanitizedMessage}\n`;

      await writeFile(logFilePath, logLine, { flag: "a" });

      if (entry.sequence === buffer.nextSequence) {
        buffer.nextSequence++;
      }
    }, Promise.resolve());
  } finally {
    resolveWriteLock?.();
  }
}

async function writeBatchLogs(logs: LogEntry[], logsDir: string): Promise<void> {
  const logsBySession = new Map<string, LogEntry[]>();

  for (const log of logs) {
    if (!logsBySession.has(log.sessionId)) {
      logsBySession.set(log.sessionId, []);
    }
    logsBySession.get(log.sessionId)?.push(log);
  }

  // Sessions are independent — process them in parallel
  await Promise.all(
    [...logsBySession.entries()].map(async ([sessionId, sessionLogs]) => {
      await cleanupOldClientLogs(logsDir, sessionId);
      // Logs within a session must be written sequentially (ordered by sequence)
      await sessionLogs.reduce(async (prev, log) => {
        await prev;
        return writeLogEntry(log, logsDir);
      }, Promise.resolve());
    })
  );
}

function isValidLogEntry(log: LogEntry): boolean {
  return !!(log.sessionId && log.level && log.message && typeof log.sequence === "number");
}

// Gate client log ingestion on the server. Mirrors the server-side
// `BaseLogger` gate at `shared/lib/logger/base-logger.ts:24`: enabled in dev
// by default, and in prod only when the operator explicitly sets
// `ENABLE_LOGGING=true`. This lets prod deployments opt into writing
// `logs/client_<sessionId>.log` files for triaging browser-side diagnostics
// (e.g. the auth recovery path) without requiring the user to copy logs out
// of DevTools.
const CLIENT_LOGS_ENABLED = process.env.NODE_ENV === "development" || process.env.ENABLE_LOGGING === "true";

export async function POST(request: NextRequest) {
  const locale = request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ?? "ar";
  const tErrors = getServerTranslations(locale).errorsTranslations;

  if (!CLIENT_LOGS_ENABLED) {
    return NextResponse.json({ error: tErrors.notFound }, { status: 404 });
  }

  const { userId } = await getServerUserContext();
  if (!userId) {
    return NextResponse.json({ error: tErrors.file.authenticationRequired }, { status: 401 });
  }

  try {
    const rawBody: unknown = await request.json();
    if (!isBatchLogRequest(rawBody)) {
      return NextResponse.json({ error: tErrors.invalidRequestFormat }, { status: 400 });
    }
    const body = rawBody;

    if (body.logs.length > MAX_LOG_ENTRIES_PER_BATCH) {
      return NextResponse.json({ error: tErrors.invalidRequestFormat }, { status: 400 });
    }

    // Total batch byte cap — rejects oversized payloads before disk write
    // (prevent disk-exhaustion via unbounded log batches).
    if (Buffer.byteLength(JSON.stringify(body)) > MAX_LOG_BATCH_BYTES) {
      return NextResponse.json({ error: tErrors.invalidRequestFormat }, { status: 400 });
    }

    // Per-user rate limit on log ingestion (security review M1) — keying on the
    // authenticated userId prevents token-sharing IP rotation from gaining
    // extra buckets.
    const logsRateLimit = await checkRateLimit(`client-logs:${userId}`, clientLogsRateLimiter);
    if (!logsRateLimit.success) {
      return NextResponse.json({ error: tErrors.rateLimitExceeded }, { status: 429 });
    }

    if (!body.logs.every(isValidLogEntry)) {
      return NextResponse.json({ error: tErrors.missingRequiredFields }, { status: 400 });
    }

    // Sanitize all session IDs to prevent path traversal
    for (const log of body.logs) {
      try {
        sanitizeSessionId(log.sessionId);
      } catch {
        return NextResponse.json({ error: tErrors.invalidSessionId }, { status: 400 });
      }
    }

    const logsDir = join(process.cwd(), "logs");
    await mkdir(logsDir, { recursive: true }).catch(() => {});

    await writeBatchLogs(body.logs, logsDir);

    return NextResponse.json({ success: true, count: body.logs.length });
  } catch {
    return NextResponse.json({ error: tErrors.failedToWriteLogs }, { status: 500 });
  }
}
