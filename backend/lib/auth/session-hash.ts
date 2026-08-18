import { createHash, createHmac, randomBytes } from "node:crypto";
import { logger } from "@/backend/lib/logger";

function resolveSessionHmacKey(): string {
  if (process.env.JWT_SECRET) {
    return `siraj-session-hmac:${process.env.JWT_SECRET}`;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("CRITICAL: JWT_SECRET is not set in production environment. Session hash key cannot be derived.");
  }

  const randomKey = randomBytes(32).toString("hex");
  logger.warn(
    "⚠️  JWT_SECRET not set. Using random ephemeral HMAC key for session hashing. Set JWT_SECRET for production-grade security."
  );
  return `siraj-session-hmac:ephemeral:${randomKey}`;
}

const SESSION_HMAC_KEY = resolveSessionHmacKey();

/** HMAC-SHA256 — current secure hash for new sessions. */
export function hashSessionId(sessionId: string): string {
  return createHmac("sha256", SESSION_HMAC_KEY).update(sessionId).digest("hex");
}

/** Legacy unsalted SHA-256 — kept module-private; only used by verifyAndMigrateSessionHash and computeSessionHashes. */
function hashSessionIdLegacy(sessionId: string): string {
  return createHash("sha256").update(sessionId).digest("hex");
}

/** Compute both HMAC and legacy hashes for a session ID (used by the service for migration lookups). */
export function computeSessionHashes(sessionId: string): { hmacHash: string; legacyHash: string } {
  return {
    hmacHash: hashSessionId(sessionId),
    legacyHash: hashSessionIdLegacy(sessionId),
  };
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
