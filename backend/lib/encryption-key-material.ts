/**
 * Committed fallback constant used by CI workflows. It must never pass the
 * production strength gate — a deployment running on it would encrypt PII
 * under a publicly-known key.
 */
export const KNOWN_DEV_KEY_CONSTANT = "development-database-encryption-key-must-be-changed-in-production";

/**
 * Decodes `DATABASE_ENCRYPTION_KEY` into exactly 32 bytes of key material.
 * Accepts 64-character hex or base64 that decodes to 32 bytes; returns null
 * for anything else (short passphrases, arbitrary text, the blocklisted dev
 * constant).
 *
 * Pure, side-effect free. Exported so the production strength gate is unit-testable.
 */
export function decodeEncryptionKeyMaterial(raw: string): Buffer | null {
  const trimmed = raw.trim();
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, "hex");
  }
  // Strict base64: charset, padding alignment, and decoded length must all match
  // (Node's base64 decoder silently ignores invalid characters, so the shape is
  // validated before decoding).
  if (trimmed.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(trimmed)) {
    const decoded = Buffer.from(trimmed, "base64");
    if (decoded.length === 32) {
      return decoded;
    }
  }
  return null;
}

/**
 * Production strength gate: the key must decode to 32 bytes of entropy and must
 * not be the committed development fallback constant. This replaces a
 * character-count check, which let human passphrases (brute-forceable at hash
 * speed) pass.
 *
 * Exported so the gate is unit-testable; the module load below enforces it.
 */
export function isProductionEncryptionKeyAccepted(raw: string): boolean {
  return raw.trim() !== KNOWN_DEV_KEY_CONSTANT && decodeEncryptionKeyMaterial(raw) !== null;
}
