/**
 * Shared ANSI color codes and logging functions for health scripts.
 *
 * Used by both `scripts/health/codescene/config.ts` and
 * `scripts/health/sonar/ts/config.ts` to avoid duplication.
 */

export const COLORS = {
  RED: "\x1b[0;31m",
  GREEN: "\x1b[0;32m",
  YELLOW: "\x1b[1;33m",
  BLUE: "\x1b[0;34m",
  CYAN: "\x1b[0;36m",
  MAGENTA: "\x1b[0;35m",
  NC: "\x1b[0m",
} as const;

export function logInfo(msg: string): void {
  globalThis.console.log(`${COLORS.BLUE}ℹ${COLORS.NC} ${msg}`);
}

export function logSuccess(msg: string): void {
  globalThis.console.log(`${COLORS.GREEN}✓${COLORS.NC} ${msg}`);
}

export function logWarning(msg: string): void {
  globalThis.console.log(`${COLORS.YELLOW}⚠${COLORS.NC} ${msg}`);
}

export function logError(msg: string): void {
  globalThis.console.log(`${COLORS.RED}✖${COLORS.NC} ${msg}`);
}
