/**
 * Shared cron utility functions.
 */

import { getServerTranslations } from "@/shared/locale/server-graphql";

/**
 * Safely extract a human-readable message from an unknown error value.
 *
 * Handles both `Error` instances (uses `.message`) and arbitrary thrown values
 * (converts via `String()`).
 */
export function formatError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  return raw
    .replace(/postgres:\/\/[^@\s]+@[^@\s]+/gi, "postgres://[REDACTED]@")
    .replace(/(password|token|secret|api[_-]?key)\s*=\s*[^\s,;]+/gi, "$1=[REDACTED]");
}

/** Extract locale from request Accept-Language header */
export function extractLocale(request: Request): string {
  return request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] || "en";
}

/** Get cron error translations from request */
export function getCronErrorT(request: Request) {
  const locale = extractLocale(request);
  return getServerTranslations(locale).dashboardTranslations.cron.errors;
}
