import { getBooleanEnv } from "@/backend/lib/env";

export interface LogEntry {
  sessionId: string;
  level: string;
  message: string;
  timestamp: string;
  caller?: string;
  sequence: number;
}

export interface BatchLogRequest {
  logs: LogEntry[];
}

// Regex intentionally excludes underscores and special characters to prevent
// path traversal attacks when using sessionId in filesystem operations.
// Client-side logger (frontend/lib/logger/index.ts) must generate session IDs
// that match this regex — it uses the format YYYY-MM-DD-HH-mm-ss (hyphens only).
export const SAFE_SESSION_ID_REGEX = /^[a-zA-Z0-9-]+$/;

/**
 * Disk-write DoS bounds (security review M1): cap the number of log entries
 * accepted per POST and the length of each message/caller field.
 */
export const MAX_LOG_ENTRIES_PER_BATCH = 100;
export const MAX_LOG_MESSAGE_LENGTH = 4000;
export const MAX_LOG_BATCH_BYTES = 262144; // 256 KiB total batch cap

/**
 * Per-user daily byte budget: caps the total client-log payload accepted per
 * user per day (256 KiB). Tracked in the shared cache keyed per userId with a
 * TTL anchored to end-of-day, so the running total resets each day.
 */
export const MAX_DAILY_LOG_BYTES = 262144;
export const DAILY_BYTES_CACHE_PREFIX = "client-logs-bytes:";

// Cleanup is opt-in (default: false) so diagnostic logs survive for triage.
export const CLEANUP_ENABLED = getBooleanEnv("CLEANUP_ENABLED");
