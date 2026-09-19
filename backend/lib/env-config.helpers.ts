/**
 * Mask a secret value, exposing only the last 4 characters.
 *
 * - Returns `undefined` for `undefined`/empty input.
 * - For values with length ≤ 4: returns `"••••"`.
 * - For longer values: returns 8 bullets followed by the last 4 chars.
 *
 * Pure, side-effect free.
 */
export function maskSecretValue(value: string | undefined): string | undefined {
  if (value === undefined || value.length === 0) {
    return undefined;
  }
  if (value.length <= 4) {
    return "••••";
  }
  return `••••••••${value.slice(-4)}`;
}

/**
 * Shape of a value produced by `encryptField`: the versioned
 * `v1:iv:cipherText:authTag` format — 12-byte IV (24 hex chars) and 16-byte
 * auth tag (32 hex chars) — or, for rows written before versioning, the same
 * shape without the `v1:` prefix.
 */
const ENCRYPTED_FIELD_PATTERN = /^(v1:)?[0-9a-f]{24}:[0-9a-f]+:[0-9a-f]{32}$/;

/**
 * True when the value matches the `encryptField` ciphertext format (versioned
 * `v1:` prefix or legacy un-prefixed). Used to distinguish rows already
 * encrypted at rest from legacy plaintext rows.
 *
 * Pure, side-effect free.
 */
export function isEncryptedFieldValue(value: string): boolean {
  return ENCRYPTED_FIELD_PATTERN.test(value);
}
