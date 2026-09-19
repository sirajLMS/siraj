import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import crypto from "node:crypto";
import {
  decodeEncryptionKeyMaterial,
  decryptField,
  encryptField,
  type FieldEncryptionContext,
  isProductionEncryptionKeyAccepted,
} from "@/backend/lib/field-encryption";

const PASSTHROUGH_ENV = "FIELD_ENCRYPTION_ALLOW_PLAINTEXT";

const CONTEXT_A: FieldEncryptionContext = { table: "system_settings", column: "value", rowId: "env::KEY_A" };
const CONTEXT_B: FieldEncryptionContext = { table: "system_settings", column: "value", rowId: "env::KEY_B" };

const originalEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  originalEnv[PASSTHROUGH_ENV] = process.env[PASSTHROUGH_ENV];
});

afterEach(() => {
  if (originalEnv[PASSTHROUGH_ENV] === undefined) {
    Reflect.deleteProperty(process.env, PASSTHROUGH_ENV);
  } else {
    process.env[PASSTHROUGH_ENV] = originalEnv[PASSTHROUGH_ENV];
  }
});

/** Builds a legacy-format (`iv:ct:tag`, unsalted SHA-256 key) ciphertext fixture. */
function buildLegacyCiphertext(plaintext: string): string {
  const rawKey = process.env.DATABASE_ENCRYPTION_KEY ?? "";
  const key = crypto.createHash("sha256").update(rawKey).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}:${cipher.getAuthTag().toString("hex")}`;
}

describe("field-encryption — versioned ciphertext (v1)", () => {
  test("encryptField produces versioned ciphertext and decryptField round-trips it", () => {
    const ciphertext = encryptField("round-trip-secret");

    expect(ciphertext.startsWith("v1:")).toBe(true);
    expect(ciphertext.split(":")).toHaveLength(4);
    expect(decryptField(ciphertext)).toBe("round-trip-secret");
  });

  test("fresh random IV per record — identical plaintexts produce distinct ciphertexts", () => {
    const first = encryptField("same-input");
    const second = encryptField("same-input");

    expect(first).not.toBe(second);
    expect(decryptField(first)).toBe("same-input");
    expect(decryptField(second)).toBe("same-input");
  });

  test("malformed v1-prefixed value returns null, never raw ciphertext", () => {
    expect(decryptField("v1:not-a-ciphertext")).toBeNull();
    expect(decryptField("v1:")).toBeNull();
  });
});

describe("field-encryption — row-context AAD", () => {
  test("ciphertext bound to a context decrypts only with the SAME context", () => {
    const ciphertext = encryptField("row-bound-secret", CONTEXT_A);

    expect(decryptField(ciphertext, CONTEXT_A)).toBe("row-bound-secret");
    // A ciphertext spliced into a different row fails GCM authentication.
    expect(decryptField(ciphertext, CONTEXT_B)).toBeNull();
    // Reading a context-bound ciphertext without context fails closed.
    expect(decryptField(ciphertext)).toBeNull();
  });

  test("ciphertext written without context decrypts without context and fails with one", () => {
    const ciphertext = encryptField("unbound-secret");

    expect(decryptField(ciphertext)).toBe("unbound-secret");
    expect(decryptField(ciphertext, CONTEXT_A)).toBeNull();
  });
});

describe("field-encryption — legacy dual-read", () => {
  test("un-prefixed legacy ciphertext keeps decrypting under the legacy derivation", () => {
    const legacyCiphertext = buildLegacyCiphertext("legacy-row-value");

    expect(legacyCiphertext.startsWith("v1:")).toBe(false);
    expect(decryptField(legacyCiphertext)).toBe("legacy-row-value");
  });

  test("corrupt legacy ciphertext returns null, never raw ciphertext", () => {
    expect(decryptField("0123456789abcdef01234567:0123:0123456789abcdef0123456789abcdef")).toBeNull();
  });
});

describe("field-encryption — plaintext passthrough migration window", () => {
  test("non-ciphertext value passes through while the migration-window flag is set", () => {
    process.env[PASSTHROUGH_ENV] = "1";

    expect(decryptField("legacy-plaintext-value")).toBe("legacy-plaintext-value");
  });

  test("non-ciphertext value throws once the migration-window flag is removed", () => {
    Reflect.deleteProperty(process.env, PASSTHROUGH_ENV);

    expect(() => decryptField("planted-plaintext")).toThrow("plaintext passthrough migration window is closed");
  });

  test("other flag values do not open the passthrough window", () => {
    process.env[PASSTHROUGH_ENV] = "true";
    expect(() => decryptField("planted-plaintext")).toThrow();
    process.env[PASSTHROUGH_ENV] = "";
    expect(() => decryptField("planted-plaintext")).toThrow();
  });
});

describe("field-encryption — production strength gate", () => {
  test("decodeEncryptionKeyMaterial decodes 64-char hex and 32-byte base64 keys", () => {
    expect(decodeEncryptionKeyMaterial(crypto.randomBytes(32).toString("hex"))?.length).toBe(32);
    expect(decodeEncryptionKeyMaterial(crypto.randomBytes(32).toString("base64"))?.length).toBe(32);
  });

  test("decodeEncryptionKeyMaterial rejects short passphrases, bad shapes, and the dev constant", () => {
    expect(decodeEncryptionKeyMaterial("short-passphrase")).toBeNull();
    expect(decodeEncryptionKeyMaterial("a".repeat(32))).toBeNull();
    expect(decodeEncryptionKeyMaterial("a".repeat(64) + "zz")).toBeNull();
    expect(decodeEncryptionKeyMaterial("development-database-encryption-key-must-be-changed-in-production")).toBeNull();
    expect(decodeEncryptionKeyMaterial("")).toBeNull();
  });

  test("isProductionEncryptionKeyAccepted requires 32-byte decoded entropy and blocklists the dev constant", () => {
    expect(isProductionEncryptionKeyAccepted(crypto.randomBytes(32).toString("hex"))).toBe(true);
    expect(isProductionEncryptionKeyAccepted(crypto.randomBytes(32).toString("base64"))).toBe(true);
    expect(isProductionEncryptionKeyAccepted("development-database-encryption-key-must-be-changed-in-production")).toBe(
      false
    );
    expect(isProductionEncryptionKeyAccepted("a".repeat(32))).toBe(false);
    expect(isProductionEncryptionKeyAccepted("a".repeat(64))).toBe(true);
  });
});
