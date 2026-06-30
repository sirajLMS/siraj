import { createHash } from "node:crypto";

/**
 * Hash a session ID using SHA-256 for secure storage.
 * The plaintext session ID is only ever stored in the user's cookie —
 * the database and Redis always store the hash instead.
 * This ensures that a database compromise does not leak usable session IDs.
 */
export function hashSessionId(sessionId: string): string {
  return createHash("sha256").update(sessionId).digest("hex");
}
