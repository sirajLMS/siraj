import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { format } from "node:util";

type LogLevel = "log" | "info" | "warn" | "error" | "debug";

export abstract class BaseLogger {
	protected enabled: boolean;
	protected logsDir: string;
	protected logKey: string;
	protected writeToFileEnabled: boolean;

	constructor(logKey: string, writeToFileEnabled = true) {
		// Only enable in development
		this.enabled = process.env.NODE_ENV !== "production";
		this.logsDir = join(process.cwd(), "logs");
		this.logKey = logKey;
		this.writeToFileEnabled = writeToFileEnabled;
	}

	private formatTimestamp(): string {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, "0");
		const day = String(now.getDate()).padStart(2, "0");
		const hours = String(now.getHours()).padStart(2, "0");
		const minutes = String(now.getMinutes()).padStart(2, "0");
		const seconds = String(now.getSeconds()).padStart(2, "0");
		const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
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

			const timestamp = this.formatTimestamp();
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

		const timestamp = this.formatTimestamp();

		// Console output with timestamp
		const consoleArgs = [`[${timestamp}] [${level.toUpperCase()}]`, ...args];

		switch (level) {
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
