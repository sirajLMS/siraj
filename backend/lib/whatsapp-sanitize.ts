/** Maximum length of a persisted failure reason (r10-011). */
const FAILURE_REASON_MAX_LENGTH = 256;

/**
 * Sanitizes a failure reason before persisting to the database (r10-011).
 *
 * Meta error responses can contain internal diagnostic strings, account
 * IDs, cursor tokens, and other sensitive or excessively long data. This
 * helper:
 *  1. Strips patterns matching tokens, account IDs, and bearer tokens.
 *  2. Truncates the result to {@link FAILURE_REASON_MAX_LENGTH} characters.
 */
export function sanitizeFailureReason(reason: string): string {
  let sanitized = reason;

  // Strip bearer tokens and similar credential patterns.
  sanitized = sanitized.replace(/(?:bearer|token|access_token)[=:]\s*\S+/gi, "[redacted]");
  // Strip Meta-style account IDs (e.g., "account_id": "[PHONE_REDACTED]").
  sanitized = sanitized.replace(/(?:account_?id|waba_?id|phone_?number_?id)[=:]\s*"?[\w-]+"?/gi, "[redacted]");
  // Strip cursor tokens (e.g., "cursor=abc123" or "before=...after=...").
  sanitized = sanitized.replace(/(?:cursor|before|after|paging)[=:]\s*"?[\w=%-]+"?/gi, "[redacted]");
  // Collapse whitespace from redaction.
  sanitized = sanitized.replace(/\s{2,}/g, " ").trim();

  if (sanitized.length > FAILURE_REASON_MAX_LENGTH) {
    sanitized = `${sanitized.slice(0, FAILURE_REASON_MAX_LENGTH - 3)}...`;
  }

  return sanitized || "unknown error";
}
