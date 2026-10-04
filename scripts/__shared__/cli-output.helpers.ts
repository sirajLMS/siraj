// ── Shared CLI logging helpers and type guards ─────────────────────────────

const RESET = "\x1b[0m";
const RED = "\x1b[31m";

export function log(msg: string): void {
  console.log(msg);
}

export function logError(msg: string): void {
  console.error(`${RED}${msg}${RESET}`);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
