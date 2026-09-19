import crypto from "node:crypto";
import { logger } from "@/backend/lib/logger";

// ---------------------------------------------------------------------------
// Key material & strength gate
// ---------------------------------------------------------------------------

const ENCRYPTION_KEY_RAW = process.env.DATABASE_ENCRYPTION_KEY;
if (!ENCRYPTION_KEY_RAW) {
  throw new Error("DATABASE_ENCRYPTION_KEY environment variable is not defined");
}

const nodeEnv = process.env.NODE_ENV ?? "development";

/**
 * Committed fallback constant used by CI workflows. It must never pass the
 * production strength gate — a deployment running on it would encrypt PII
 * under a publicly-known key.
 */
const KNOWN_DEV_KEY_CONSTANT = "development-database-encryption-key-must-be-changed-in-production";

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

if (nodeEnv === "production" && !isProductionEncryptionKeyAccepted(ENCRYPTION_KEY_RAW)) {
  if (ENCRYPTION_KEY_RAW.trim() === KNOWN_DEV_KEY_CONSTANT) {
    throw new Error(
      "DATABASE_ENCRYPTION_KEY is set to the committed development fallback constant — generate a unique 32-byte key (64-char hex or base64) for production"
    );
  }
  throw new Error(
    "DATABASE_ENCRYPTION_KEY must decode to 32 bytes of key material (64-char hex or base64) in production"
  );
}

/**
 * Versioned key: derived with scrypt, which is memory-hard — offline
 * brute-forcing against a DB dump is orders of magnitude more expensive than
 * under the legacy single SHA-256. The salt is derived from the key material
 * itself, so it is unique per deployment without extra config surface; the
 * key's entropy is guaranteed by the production gate requiring 32 decoded
 * random bytes.
 */
const KEY_DERIVATION_SALT = crypto
  .createHash("sha256")
  .update(`siraj:field-encryption:v1:${ENCRYPTION_KEY_RAW}`)
  .digest();
const ENCRYPTION_KEY = crypto.scryptSync(ENCRYPTION_KEY_RAW, KEY_DERIVATION_SALT, 32);

/**
 * Legacy key: single unsalted SHA-256 of the raw variable. Kept ONLY so
 * un-prefixed pre-versioning ciphertext keeps decrypting during the migration
 * window (see {@link decryptField}); never used for new ciphertext.
 */
const LEGACY_ENCRYPTION_KEY = crypto.createHash("sha256").update(ENCRYPTION_KEY_RAW).digest();

// ---------------------------------------------------------------------------
// Versioned ciphertext (v1) with row-context AAD
// ---------------------------------------------------------------------------

const IV_LENGTH = 12;
const VERSION_PREFIX = "v1:";

/**
 * Row context bound into v1 ciphertext as GCM additional authenticated data.
 * When provided, a ciphertext can only be decrypted (or spliced into) the same
 * table/column/row it was encrypted for. Optional: call sites that cannot reach
 * the row identity (the schema-level `encryptedText` driver mapping, which only
 * sees the stored value) omit it.
 */
export interface FieldEncryptionContext {
  table: string;
  column: string;
  rowId: string;
}

function buildAad(context: FieldEncryptionContext): string {
  return `${context.table}:${context.column}:${context.rowId}`;
}

/**
 * Encrypts a value with AES-256-GCM under the scrypt-derived key. When a row
 * context is provided it is bound into the ciphertext as additional
 * authenticated data, so the value can only be decrypted at the same
 * table/column/row.
 */
export function encryptField(text: string, context?: FieldEncryptionContext): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  if (context) {
    cipher.setAAD(buildAad(context));
  }

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  // Format: v1:iv:cipherText:authTag
  return `${VERSION_PREFIX}${iv.toString("hex")}:${encrypted}:${authTag}`;
}

// ---------------------------------------------------------------------------
// Plaintext passthrough migration window
// ---------------------------------------------------------------------------

/**
 * Migration-window flag: while set (`FIELD_ENCRYPTION_ALLOW_PLAINTEXT=1`),
 * non-ciphertext values pass through decryption unchanged so legacy plaintext
 * rows keep resolving until the backfill scripts re-encrypt them. Once the
 * backfills are complete the flag is removed and any non-ciphertext value
 * throws — plaintext planted in an encrypted column is never consumed.
 */
const PLAINTEXT_PASSTHROUGH_ENV = "FIELD_ENCRYPTION_ALLOW_PLAINTEXT";
const PLAINTEXT_PASSTHROUGH_VALUE = "1";

function allowPlaintextPassthrough(): boolean {
  return process.env[PLAINTEXT_PASSTHROUGH_ENV] === PLAINTEXT_PASSTHROUGH_VALUE;
}

// Dedupe key: warn once per process that a legacy plaintext value was encountered.
// Keyed by the value prefix so recurring distinct legacy rows still surface,
// while repeated decrypts of the same row don't spam the log. The value itself is
// never included in the log.
const legacyPlaintextWarned = new Set<string>();
const LEGACY_WARN_SAMPLE_LENGTH = 16;

function warnLegacyPlaintextOnce(encryptedText: string): void {
  const warnKey = encryptedText.slice(0, LEGACY_WARN_SAMPLE_LENGTH);
  if (!legacyPlaintextWarned.has(warnKey)) {
    legacyPlaintextWarned.add(warnKey);
    logger.warn(
      "decryptField received a value that is not ciphertext — treating it as legacy plaintext. Re-encrypt the stored value to migrate it."
    );
  }
}

// ---------------------------------------------------------------------------
// Decryption (version dispatch)
// ---------------------------------------------------------------------------

function decryptLegacy(parts: string[]): string | null {
  const [ivHex, encryptedHex, authTagHex] = parts;
  try {
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", LEGACY_ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    logger.error("Legacy decryption failed — returning null instead of raw ciphertext", { error });
    return null;
  }
}

function decryptV1(encryptedText: string, context?: FieldEncryptionContext): string | null {
  const parts = encryptedText.slice(VERSION_PREFIX.length).split(":");
  if (parts.length !== 3) {
    logger.error("decryptField received a malformed v1-prefixed value — returning null");
    return null;
  }
  const [ivHex, encryptedHex, authTagHex] = parts;
  try {
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    if (context) {
      decipher.setAAD(buildAad(context));
    }

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    logger.error("v1 decryption failed — returning null instead of raw ciphertext", { error });
    return null;
  }
}

/**
 * Decrypts a stored value, dispatching on the version prefix:
 *
 * - `v1:`-prefixed — versioned path under the scrypt-derived key; the row
 *   context (when provided) is verified as GCM additional authenticated data,
 *   so a ciphertext cannot be spliced across rows/columns/tables.
 * - un-prefixed three-part `iv:ct:tag` — legacy path (old key derivation, no
 *   AAD) so pre-versioning rows keep decrypting during the migration window.
 * - anything else — legacy plaintext: passes through ONLY while the plaintext
 *   passthrough migration window is open; once it closes the call throws.
 *
 * Returns null on ciphertext-authentication failure (never the raw ciphertext).
 */
export function decryptField(encryptedText: string, context?: FieldEncryptionContext): string | null {
  if (encryptedText.startsWith(VERSION_PREFIX)) {
    return decryptV1(encryptedText, context);
  }

  const parts = encryptedText.split(":");
  if (parts.length === 3) {
    return decryptLegacy(parts);
  }

  if (allowPlaintextPassthrough()) {
    warnLegacyPlaintextOnce(encryptedText);
    return encryptedText;
  }
  throw new Error(
    "decryptField received a non-ciphertext value while the plaintext passthrough migration window is closed — re-encrypt the stored value or set FIELD_ENCRYPTION_ALLOW_PLAINTEXT=1"
  );
}
