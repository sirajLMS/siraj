/**
 * Shared console-level dispatch helper.
 *
 * Used by both `shared/lib/logger/base-logger.ts` (server) and
 * `frontend/common/lib/logger/index.ts` (client) to avoid duplicating
 * the `log/info/warn/error/debug` switch statement.
 */

export type ConsoleLevel = "log" | "info" | "warn" | "error" | "debug";

/**
 * Emits `consoleArgs` to the appropriate console method for `level`.
 */
export function consoleDispatch(level: ConsoleLevel, consoleArgs: unknown[]): void {
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
}
