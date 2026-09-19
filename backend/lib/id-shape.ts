/**
 * Canonical hyphenated UUID shape. Anything else cannot name a row in the
 * uuid-typed id columns, and letting it through surfaces a raw database
 * syntax error — Drizzle wraps driver failures with the full SQL text and
 * bound params, which must never become an API/service error message.
 */
const UUID_CANONICAL_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuidShape(value: string): boolean {
  return UUID_CANONICAL_PATTERN.test(value);
}

/**
 * Guard a uuid input before it reaches the query layer. A malformed value
 * cannot resolve to a row, so the caller provides the not-found/invalid-input
 * error that is the correct contract for a "no such entity" outcome.
 */
export function assertUuidShape(id: string, makeError: () => Error): void {
  if (!isUuidShape(id)) {
    throw makeError();
  }
}
