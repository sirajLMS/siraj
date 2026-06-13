import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

interface LogEntry {
  sessionId: string;
  level: string;
  message: string;
  timestamp: string;
  caller?: string;
  sequence: number;
}

interface BatchLogRequest {
  logs: LogEntry[];
}

const CLEANUP_ENABLED = process.env.CLEANUP_ENABLED === "true";

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
    const logFilePath = join(logsDir, `client_${sessionId}.log`);

    while (buffer.entries.length > 0) {
      const entry = buffer.entries.shift();
      if (!entry) break;

      // Fast-forward sequence if needed
      if (entry.sequence > buffer.nextSequence) {
        buffer.nextSequence = entry.sequence;
      }

      const logLine = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [SEQ:${entry.sequence}] [${
        entry.caller || "unknown"
      }] ${entry.message}\n`;

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

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
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

    const logsDir = join(process.cwd(), "logs");
    await mkdir(logsDir, { recursive: true }).catch(() => {});

    await writeBatchLogs(body.logs, logsDir);

    return NextResponse.json({ success: true, count: body.logs.length });
  } catch {
    return NextResponse.json({ error: "Failed to write logs" }, { status: 500 });
  }
}
