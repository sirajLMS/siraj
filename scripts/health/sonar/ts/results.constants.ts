import { COLORS } from "@/scripts/health/sonar/ts/config";

export const SEVERITY_MAP: Record<string, string> = {
  BLOCKER: "error",
  CRITICAL: "error",
  MAJOR: "warning",
  MINOR: "warning",
  INFO: "info",
};

export const SEVERITY_SYMBOLS: Record<string, string> = {
  error: "✖",
  warning: "⚠",
  info: "ℹ",
};

export const SEVERITY_COLORS: Record<string, string> = {
  error: COLORS.RED,
  warning: COLORS.YELLOW,
  info: COLORS.BLUE,
};
