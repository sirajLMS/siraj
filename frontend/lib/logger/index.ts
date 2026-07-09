import type { ApiLogOptions, LogEntry, LoggerConfig, LogLevel } from "@/frontend/lib/logger/types";
import { formatTimestamp } from "@/shared/lib/date-utils";

type LogOptions = {
  caller: string;
};

class ClientLogger {
  private readonly config: LoggerConfig;
  private readonly sessionId: string;
  private sequenceNumber: number;
  private logQueue: LogEntry[];
  private batchTimer: NodeJS.Timeout | null;

  constructor() {
    // Enable in development, or when NEXT_PUBLIC_ENABLE_LOGGING is explicitly set to true
    const enabled = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ENABLE_LOGGING === "true";

    this.sessionId = this.generateSessionId();
    this.sequenceNumber = 0;
    this.logQueue = [];
    this.batchTimer = null;
    this.config = {
      enabled,
      apiEndpoint: "/api/logs",
      sessionId: this.sessionId,
      batchInterval: 2000, // 2s
    };
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
      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeObject(value as Record<string, unknown>);
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
          if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
            return JSON.stringify(this.sanitizeObject(parsed as Record<string, unknown>));
          }
          return JSON.stringify(parsed);
        } catch {
          return "[non-serializable]";
        }
      })
      .join(" ");
  }

  private queueLogEntry(options: ApiLogOptions, ...args: unknown[]): void {
    if (!this.config.enabled) return;

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
    this.scheduleBatchSend();
  }

  private scheduleBatchSend(): void {
    if (this.batchTimer !== null) return;

    this.batchTimer = setTimeout(() => {
      this.flushLogs();
    }, this.config.batchInterval);
  }

  private async flushLogs(): Promise<void> {
    if (this.logQueue.length === 0) return;

    const logsToSend = [...this.logQueue];
    this.logQueue = [];
    this.batchTimer = null;

    try {
      await fetch(this.config.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ logs: logsToSend }),
      });
    } catch {
      // Silently fail - don't log errors to avoid infinite loops
    }
  }

  private logToConsole(options: ApiLogOptions, ...args: unknown[]): void {
    if (!this.config.enabled) return;

    const timestamp = formatTimestamp();
    const color = this.getColorCode(options.level);

    // Console output with colors - let browser handle formatting naturally
    const consoleArgs = [
      `%c[${timestamp}] [${options.level.toUpperCase()}] [${options.caller || "unknown"}]`,
      `color: ${color}; font-weight: bold;`,
      ...args,
    ];

    switch (options.level) {
      case "log":
        globalThis.console.log(...consoleArgs);
        break;
      case "info":
        globalThis.console.info(...consoleArgs);
        break;
      case "warn":
        globalThis.console.warn(...consoleArgs);
        break;
      case "error":
        globalThis.console.error(...consoleArgs);
        break;
      case "debug":
        globalThis.console.debug(...consoleArgs);
        break;
    }

    // Queue for batch send
    this.queueLogEntry(options, ...args);
  }

  public log(options: LogOptions, ...args: unknown[]): void {
    const apiOptions: ApiLogOptions = {
      caller: options.caller,
      level: "log",
      sequence: ++this.sequenceNumber,
    };
    this.logToConsole(apiOptions, ...args);
  }

  public info(options: LogOptions, ...args: unknown[]): void {
    const apiOptions: ApiLogOptions = {
      caller: options.caller,
      level: "info",
      sequence: ++this.sequenceNumber,
    };
    this.logToConsole(apiOptions, ...args);
  }

  public warn(options: LogOptions, ...args: unknown[]): void {
    const apiOptions: ApiLogOptions = {
      caller: options.caller,
      level: "warn",
      sequence: ++this.sequenceNumber,
    };
    this.logToConsole(apiOptions, ...args);
  }

  public error(options: LogOptions, ...args: unknown[]): void {
    const apiOptions: ApiLogOptions = {
      caller: options.caller,
      level: "error",
      sequence: ++this.sequenceNumber,
    };
    this.logToConsole(apiOptions, ...args);
  }

  public debug(options: LogOptions, ...args: unknown[]): void {
    const apiOptions: ApiLogOptions = {
      caller: options.caller,
      level: "debug",
      sequence: ++this.sequenceNumber,
    };
    this.logToConsole(apiOptions, ...args);
  }
}

// Create singleton instance
export const logger = new ClientLogger();

export default logger;
