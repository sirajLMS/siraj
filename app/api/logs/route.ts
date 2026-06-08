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
const logBuffers = new Map<
	string,
	{ entries: LogEntry[]; nextSequence: number; writeLock: Promise<void> }
>();

async function cleanupOldClientLogs(
	logsDir: string,
	sessionId: string,
): Promise<void> {
	// Check if cleanup is enabled (default: false to keep logs)
	if (!CLEANUP_ENABLED) return;

	// Only cleanup once per session
	if (cleanedSessions.has(sessionId)) return;

	try {
		// Ensure logs directory exists
		await mkdir(logsDir, { recursive: true });

		// Read all files in the logs directory
		const files = await readdir(logsDir);

		// Find all client log files (files starting with 'client_')
		const clientLogFiles = files.filter((file) => file.startsWith("client_"));

		// Delete all previous client log files
		const deletePromises = clientLogFiles.map((file) =>
			unlink(join(logsDir, file)).catch(() => {
				// Silently ignore deletion errors
			}),
		);

		await Promise.all(deletePromises);

		// Mark this session as cleaned up
		cleanedSessions.add(sessionId);
	} catch {
		// Silently fail to avoid infinite loops
	}
}

async function writeLogEntry(
	logEntry: LogEntry,
	logsDir: string,
): Promise<void> {
	const { sessionId } = logEntry;

	// Get or create buffer for this session
	let buffer = logBuffers.get(sessionId);
	if (!buffer) {
		logBuffers.set(sessionId, {
			entries: [],
			nextSequence: 1,
			writeLock: Promise.resolve(),
		});
	}

	buffer = logBuffers.get(sessionId);
	if (!buffer) return;

	// Add entry to buffer
	buffer.entries.push(logEntry);

	// Sort buffer by sequence number
	buffer.entries.sort((a, b) => a.sequence - b.sequence);

	// Wait for any pending writes to complete
	await buffer.writeLock;

	// Create a new write lock promise
	let resolveWriteLock: (() => void) | undefined;
	buffer.writeLock = new Promise((resolve) => {
		resolveWriteLock = resolve;
	});

	try {
		// Write all consecutive entries starting from nextSequence
		const logFileName = `client_${sessionId}.log`;
		const logFilePath = join(logsDir, logFileName);

		while (buffer.entries.length > 0) {
			const entry = buffer.entries.shift();
			if (!entry) break;

			// If the sequence is newer (gap detected or server restarted), fast-forward nextSequence to match it
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
		if (resolveWriteLock) resolveWriteLock();
	}
}

async function writeBatchLogs(
	logs: LogEntry[],
	logsDir: string,
): Promise<void> {
	// Group logs by sessionId
	const logsBySession = new Map<string, LogEntry[]>();

	for (const log of logs) {
		if (!logsBySession.has(log.sessionId)) {
			logsBySession.set(log.sessionId, []);
		}
		logsBySession.get(log.sessionId)?.push(log);
	}

	// Write each session's logs
	for (const [sessionId, sessionLogs] of logsBySession) {
		// Clean up old logs for this session
		await cleanupOldClientLogs(logsDir, sessionId);

		// Write all logs for this session
		for (const log of sessionLogs) {
			await writeLogEntry(log, logsDir);
		}
	}
}

export async function POST(request: NextRequest) {
	// Only allow in development
	if (process.env.NODE_ENV !== "development") {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	try {
		const body = (await request.json()) as BatchLogRequest;

		// Check if this is a batch request
		if (Array.isArray(body.logs)) {
			// Validate that all entries have required fields
			for (const logEntry of body.logs) {
				if (
					!logEntry.sessionId ||
					!logEntry.level ||
					!logEntry.message ||
					typeof logEntry.sequence !== "number"
				) {
					return NextResponse.json(
						{ error: "Missing required fields in log entry" },
						{ status: 400 },
					);
				}
			}

			// Create logs directory if it doesn't exist
			const logsDir = join(process.cwd(), "logs");
			try {
				await mkdir(logsDir, { recursive: true });
			} catch {
				// Directory might already exist, ignore error
			}

			// Write batch logs
			await writeBatchLogs(body.logs, logsDir);

			return NextResponse.json({ success: true, count: body.logs.length });
		}

		// If not a batch request, return error
		return NextResponse.json(
			{ error: "Invalid request format. Expected { logs: LogEntry[] }" },
			{ status: 400 },
		);
	} catch {
		// Use a simple error response without logging to avoid potential issues
		return NextResponse.json(
			{ error: "Failed to write logs" },
			{ status: 500 },
		);
	}
}
