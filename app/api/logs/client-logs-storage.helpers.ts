import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { CLEANUP_ENABLED, type LogEntry } from "@/app/api/logs/client-logs.constants";
import { sanitizeForRendering, sanitizeSessionId, truncateLogField } from "@/app/api/logs/client-logs-sanitize.helpers";

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

      const sanitizedTimestamp = truncateLogField(entry.timestamp ? sanitizeForRendering(entry.timestamp) : "unknown");
      const sanitizedLevel = truncateLogField(entry.level ? sanitizeForRendering(entry.level).toUpperCase() : "INFO");
      const sanitizedMessage = truncateLogField(sanitizeForRendering(entry.message));
      const sanitizedCaller = truncateLogField(entry.caller ? sanitizeForRendering(entry.caller) : "unknown");
      const logLine = `[${sanitizedTimestamp}] [${sanitizedLevel}] [SEQ:${entry.sequence}] [${sanitizedCaller}] ${sanitizedMessage}\n`;

      await writeFile(logFilePath, logLine, { flag: "a" });

      if (entry.sequence === buffer.nextSequence) {
        buffer.nextSequence++;
      }
    }, Promise.resolve());
  } finally {
    resolveWriteLock?.();
  }
}

export async function writeBatchLogs(logs: LogEntry[], logsDir: string): Promise<void> {
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
