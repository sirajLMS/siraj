import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type NextRequest, NextResponse  } from "next/server";
import { getBooleanEnv } from "@/backend/lib/env";

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

function sanitizeSessionId(sessionId: string): string {
  if (!SAFE_SESSION_ID_REGEX.test(sessionId)) {
    throw new Error("Invalid sessionId: must be alphanumeric with hyphens only");
  }
  return sessionId;
}

interface BatchLogRequest {
  logs: LogEntry[];
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
 * Sanitize a string for safe rendering — strips ANSI and escapes HTML entities
 */
function sanitizeForRendering(str: string): string {
  const withoutAnsi = stripAnsiEscapes(str);
  return withoutAnsi
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

    while (buffer.entries.length > 0) {
      const entry = buffer.entries.shift();
      if (!entry) break;

      // Fast-forward sequence if needed
      if (entry.sequence > buffer.nextSequence) {
        buffer.nextSequence = entry.sequence;
      }

      const sanitizedMessage = sanitizeForRendering(entry.message);
      const sanitizedCaller = entry.caller ? sanitizeForRendering(entry.caller) : "unknown";
      const logLine = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [SEQ:${entry.sequence}] [${sanitizedCaller}] ${sanitizedMessage}\n`;

      await writeFile(logFilePath, logLine, { flag: "a" });

      if (entry.sequence === buffer.nextSequence) {
        buffer.nextSequence++;
      }
    }
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

  for (const [sessionId, sessionLogs] of logsBySession) {
    await cleanupOldClientLogs(logsDir, sessionId);
    for (const log of sessionLogs) {
      await writeLogEntry(log, logsDir);
    }
  }
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
const CLIENT_LOGS_ENABLED =
  process.env.NODE_ENV === "development" || process.env.ENABLE_LOGGING === "true";

export async function POST(request: NextRequest) {
  if (!CLIENT_LOGS_ENABLED) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as BatchLogRequest;

    if (!Array.isArray(body.logs)) {
      return NextResponse.json({ error: "Invalid request format. Expected { logs: LogEntry[] }" }, { status: 400 });
    }

    if (!body.logs.every(isValidLogEntry)) {
      return NextResponse.json({ error: "Missing required fields in log entry" }, { status: 400 });
    }

    // Sanitize all session IDs to prevent path traversal
    for (const log of body.logs) {
      try {
        sanitizeSessionId(log.sessionId);
      } catch {
        return NextResponse.json({ error: "Invalid sessionId in log entry" }, { status: 400 });
      }
    }

    const logsDir = join(process.cwd(), "logs");
    await mkdir(logsDir, { recursive: true }).catch(() => {});

    await writeBatchLogs(body.logs, logsDir);

    return NextResponse.json({ success: true, count: body.logs.length });
  } catch {
    return NextResponse.json({ error: "Failed to write logs" }, { status: 500 });
  }
}
