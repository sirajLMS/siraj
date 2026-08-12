import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { format } from "node:util";

import { formatTimestamp } from "@/shared/utils/date-utils";

type LogLevel = "log" | "info" | "warn" | "error" | "debug";

export abstract class BaseLogger {
  protected enabled: boolean;
  protected logsDir: string;
  protected logKey: string;
  protected writeToFileEnabled: boolean;

  constructor(logKey: string, writeToFileEnabled = true) {
    // Enable in non-production, or when ENABLE_LOGGING is explicitly set to true
    this.enabled = process.env.NODE_ENV !== "production" || process.env.ENABLE_LOGGING === "true";
    this.logsDir = join(process.cwd(), "logs");
    this.logKey = logKey;
    this.writeToFileEnabled = writeToFileEnabled;
  }

  protected async writeToFile(level: LogLevel, message: string): Promise<void> {
    if (!this.enabled) return;

    try {
      // Create logs directory if it doesn't exist
      try {
        await mkdir(this.logsDir, { recursive: true });
      } catch {
        // Directory might already exist, ignore error
      }

      const timestamp = formatTimestamp();
      const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

      // Write to single log file based on key
      const logFileName = `${this.logKey}.log`;
      const logFilePath = join(this.logsDir, logFileName);

      await writeFile(logFilePath, logLine, { flag: "a" });
    } catch {
      // Silently fail to avoid infinite loops
    }
  }

  protected logToConsole(level: LogLevel, ...args: unknown[]): void {
    if (!this.enabled) return;

    // Use Node's util.format to handle all types automatically
    const message = format(...args);

    const timestamp = formatTimestamp();

    // Console output with timestamp
    const consoleArgs = [`[${timestamp}] [${level.toUpperCase()}]`, ...args];

    // Dispatch by indexing the console object with the level key.
    const fn = globalThis.console[level];
    if (typeof fn === "function") {
      fn.bind(globalThis.console)(...consoleArgs);
    }

    // Write to file
    if (this.writeToFileEnabled) void this.writeToFile(level, message);
  }

  public log(...args: unknown[]): void {
    this.logToConsole("log", ...args);
  }

  public info(...args: unknown[]): void {
    this.logToConsole("info", ...args);
  }

  public warn(...args: unknown[]): void {
    this.logToConsole("warn", ...args);
  }

  public error(...args: unknown[]): void {
    this.logToConsole("error", ...args);
  }

  public debug(...args: unknown[]): void {
    this.logToConsole("debug", ...args);
  }
}
