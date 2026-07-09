import { assessDestructiveDbCommandSafety, formatDestructiveDbBlockMessage } from "@/scripts/lib/destructiveDbGuard";

export const DESTRUCTIVE_ACTION_KEYS = new Set(["1", "4", "8"]);
export const DISABLED_ACTION_SUFFIX = " (disabled — cloud/production env)";

export function isDestructiveActionBlocked(key: string): boolean {
  if (!DESTRUCTIVE_ACTION_KEYS.has(key)) {
    return false;
  }

  return assessDestructiveDbCommandSafety().blocked;
}

export function printDestructiveActionBlock(): void {
  const { reasons } = assessDestructiveDbCommandSafety();
  globalThis.console.error(formatDestructiveDbBlockMessage(reasons));
}
