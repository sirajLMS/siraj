import { formatTimestamp } from "@/shared/utils/date-utils";
import type { ApiLogOptions, LogEntry, LoggerConfig, LogLevel } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type LogOptions = {
  caller: string;
  /**
   * When true, emit the log to the browser console even in production
   * (bypasses the dev-only `config.enabled` console gate). Forced logs are
   * also queued to `/api/logs`, which accepts them when the operator sets
   * `ENABLE_LOGGING=true` on the server — letting them land in
   * `logs/client_<sessionId>.log` alongside the existing `server.log`.
   */
  force?: boolean;
};

export class ClientLogger {
  private readonly config: LoggerConfig;
  private readonly sessionId: string;
  private sequenceNumber: number;
  private logQueue: LogEntry[];
  private batchTimer: NodeJS.Timeout | null;
  private hasPriorityLog: boolean;
  private readonly beforeunloadHandler: () => void;

  private static readonly MIN_BATCH_SIZE = 5;

  constructor() {
    // Enable in development, or when NEXT_PUBLIC_ENABLE_LOGGING is explicitly set to true
    const enabled = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ENABLE_LOGGING === "true";

    this.sessionId = this.generateSessionId();
    this.sequenceNumber = 0;
    this.logQueue = [];
    this.batchTimer = null;
    this.hasPriorityLog = false;
    this.config = {
      enabled,
      apiEndpoint: "/api/logs",
      sessionId: this.sessionId,
      batchInterval: 30000, // 30s
    };

    this.beforeunloadHandler = () => {
      void this.flushLogs(true, true);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", this.beforeunloadHandler);
    }
  }

  /**
   * Remove the beforeunload listener and clear any pending timer.
   * Call this when the logger instance is no longer needed (e.g. in tests).
   */
  public destroy(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("beforeunload", this.beforeunloadHandler);
    }
    if (this.batchTimer !== null) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  private generateSessionId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    // Uses hyphens only (no underscores) to match the server-side
    // SAFE_SESSION_ID_REGEX in app/api/logs/route.ts (path traversal prevention).
    return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
  }

  private getColorCode(level: LogLevel): string {
    const colors = {
      log: "#888",
      info: "#2196F3",
      warn: "#FF9800",
      error: "#F44336",
      debug: "#9C27B0",
    };
    return colors[level] || "#888";
  }

  private readonly PII_KEYS: ReadonlySet<string> = new Set([
    "email",
    "phone",
    "phoneNumber",
    "mobile",
    "address",
    "streetAddress",
    "city",
    "zipCode",
    "postalCode",
    "nationalId",
    "nationalIdNumber",
    "idNumber",
    "passportNumber",
    "ssn",
    "socialSecurityNumber",
    "dateOfBirth",
    "dob",
    "birthDate",
    "creditCard",
    "cardNumber",
    "cvv",
    "password",
    "secret",
    "token",
    "accessToken",
    "refreshToken",
  ]);

  private sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (this.PII_KEYS.has(key)) {
        sanitized[key] = "[REDACTED]";
      } else if (isRecord(value)) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private serializeForAPI(...args: unknown[]): string {
    return args
      .map(arg => {
        if (typeof arg === "string") return arg;
        if (arg instanceof Error) return `${arg.name}: [REDACTED]`;
        try {
          const parsed = structuredClone(arg);
          if (isRecord(parsed)) {
            return JSON.stringify(this.sanitizeObject(parsed));
          }
          return JSON.stringify(parsed);
        } catch {
          return "[non-serializable]";
        }
      })
      .join(" ");
  }

  private queueLogEntry(options: ApiLogOptions, force: boolean, ...args: unknown[]): void {
    // Gate the queue on `config.enabled` UNLESS the caller requested `force: true`,
    // which bypasses the dev-only gate so prod diagnostics are also POSTed to
    // `/api/logs` (the route accepts them when `ENABLE_LOGGING=true` is set on
    // the server).
    if (!force && !this.config.enabled) return;

    const message = this.serializeForAPI(...args);
    const logEntry: LogEntry = {
      sessionId: this.sessionId,
      level: options.level,
      message,
      timestamp: formatTimestamp(),
      caller: options.caller,
      sequence: options.sequence,
    };

    this.logQueue.push(logEntry);
    if (force || options.level === "error" || options.level === "warn") {
      this.hasPriorityLog = true;
    }
    this.scheduleBatchSend();
  }

  private scheduleBatchSend(): void {
    if (this.batchTimer !== null) return;

    this.batchTimer = setTimeout(() => {
      // Timer elapsed — attempt flush (minimum batch size guard still applies).
      void this.flushLogs(false, false);
    }, this.config.batchInterval);
  }

  /**
   * Flush queued logs to the server.
   *
   * @param keepalive - When true, use `keepalive: true` in the fetch options.
   *   This is used by the `beforeunload` handler to ensure logs are sent even
   *   as the page is being destroyed. Do NOT use `navigator.sendBeacon` because
   *   it defaults to `text/plain` content-type, which would break the JSON
   *   parser in `/api/logs`.
   * @param force - When true, bypass the minimum batch size guard. This is
   *   used when the batch timer has elapsed (enough time has passed) or when
   *   the page is being unloaded (beforeunload). Error/warn level logs and
   *   forced logs also bypass the guard via the `hasPriorityLog` flag.
   */
  private async flushLogs(keepalive = false, force = false): Promise<void> {
    if (this.logQueue.length === 0) return;

    // Minimum batch size guard: if queue has fewer than MIN_BATCH_SIZE entries
    // and we're not forcing (beforeunload) and no priority log is queued,
    // skip the POST and re-schedule the timer for the next interval.
    // Priority logs are error/warn level entries or logs sent with force: true.
    if (!force && !this.hasPriorityLog && this.logQueue.length < ClientLogger.MIN_BATCH_SIZE) {
      // Clear the elapsed timer reference so scheduleBatchSend can start a new one
      this.batchTimer = null;
      this.scheduleBatchSend();
      return;
    }

    const logsToSend = [...this.logQueue];
    this.logQueue = [];
    this.hasPriorityLog = false;
    if (this.batchTimer !== null) {
      clearTimeout(this.batchTimer);
    }
    this.batchTimer = null;

    try {
      await fetch(this.config.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ logs: logsToSend }),
        keepalive,
      });
    } catch {
      // Silently fail - don't log errors to avoid infinite loops
    }
  }

  private logToConsole(options: ApiLogOptions, force: boolean, ...args: unknown[]): void {
    // Gate the log on `enabled` UNLESS the caller requested `force: true`,
    // which bypasses the dev-only gate so diagnostics can be visible in the
    // production browser console (e.g. the auth recovery path).
    if (!force && !this.config.enabled) return;

    const timestamp = formatTimestamp();
    const color = this.getColorCode(options.level);

    // Console output with colors - let browser handle formatting naturally
    const consoleArgs = [
      `%c[${timestamp}] [${options.level.toUpperCase()}] [${options.caller || "unknown"}]`,
      `color: ${color}; font-weight: bold;`,
      ...args,
    ];

    // Dispatch to the matching console method dynamically.
    // Previously a 5-case switch/case that was a structural clone of
    // `shared/lib/logger/base-logger.ts` (see D7-2 in deferred-items.md).
    const fn = globalThis.console[options.level];
    if (typeof fn === "function") {
      fn.bind(globalThis.console)(...consoleArgs);
    }

    // Queue for batch send — accepts both regular and forced logs.
    this.queueLogEntry(options, force, ...args);
  }

  public log(options: LogOptions, ...args: unknown[]): void {
    const apiOptions: ApiLogOptions = {
      caller: options.caller,
      level: "log",
      sequence: ++this.sequenceNumber,
    };
    this.logToConsole(apiOptions, options.force === true, ...args);
  }

  public info(options: LogOptions, ...args: unknown[]): void {
    const apiOptions: ApiLogOptions = {
      caller: options.caller,
      level: "info",
      sequence: ++this.sequenceNumber,
    };
    this.logToConsole(apiOptions, options.force === true, ...args);
  }

  public warn(options: LogOptions, ...args: unknown[]): void {
    const apiOptions: ApiLogOptions = {
      caller: options.caller,
      level: "warn",
      sequence: ++this.sequenceNumber,
    };
    this.logToConsole(apiOptions, options.force === true, ...args);
  }

  public error(options: LogOptions, ...args: unknown[]): void {
    const apiOptions: ApiLogOptions = {
      caller: options.caller,
      level: "error",
      sequence: ++this.sequenceNumber,
    };
    this.logToConsole(apiOptions, options.force === true, ...args);
  }

  public debug(options: LogOptions, ...args: unknown[]): void {
    const apiOptions: ApiLogOptions = {
      caller: options.caller,
      level: "debug",
      sequence: ++this.sequenceNumber,
    };
    this.logToConsole(apiOptions, options.force === true, ...args);
  }
}

// Create singleton instance
export const logger = new ClientLogger();
