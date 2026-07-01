import { createHash, createHmac } from "node:crypto";

const SESSION_HMAC_KEY = process.env.JWT_SECRET
  ? `siraj-session-hmac:${process.env.JWT_SECRET}`
  : "siraj-session-hmac:fallback-dev-key";

/** HMAC-SHA256 — current secure hash for new sessions. */
export function hashSessionId(sessionId: string): string {
  return createHmac("sha256", SESSION_HMAC_KEY).update(sessionId).digest("hex");
}

/** Legacy unsalted SHA-256 — used only to verify sessions hashed before the HMAC migration. */
export function hashSessionIdLegacy(sessionId: string): string {
  return createHash("sha256").update(sessionId).digest("hex");
}

/** Verify a stored hash and determine if it needs migration from legacy → HMAC. */
export function verifyAndMigrateSessionHash(
  sessionId: string,
  storedHash: string
): { valid: boolean; needsRehash: boolean; newHash?: string } {
  if (hashSessionId(sessionId) === storedHash) return { valid: true, needsRehash: false };
  if (hashSessionIdLegacy(sessionId) === storedHash)
    return { valid: true, needsRehash: true, newHash: hashSessionId(sessionId) };
  return { valid: false, needsRehash: false };
}
