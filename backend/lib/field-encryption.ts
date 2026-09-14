import crypto from "node:crypto";
import { logger } from "@/backend/lib/logger";

const ENCRYPTION_KEY_RAW = process.env.DATABASE_ENCRYPTION_KEY;
if (!ENCRYPTION_KEY_RAW) {
  throw new Error("DATABASE_ENCRYPTION_KEY environment variable is not defined");
}

const nodeEnv = process.env.NODE_ENV ?? "development";
if (nodeEnv === "production" && ENCRYPTION_KEY_RAW.trim().length < 32) {
  throw new Error("DATABASE_ENCRYPTION_KEY must be at least 32 characters in production");
}

// Derive 32-byte key using SHA-256
const ENCRYPTION_KEY = crypto.createHash("sha256").update(ENCRYPTION_KEY_RAW).digest();
const IV_LENGTH = 12;

export function encryptField(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  // Format: iv:cipherText:authTag
  return `${iv.toString("hex")}:${encrypted}:${authTag}`;
}

export function decryptField(encryptedText: string): string | null {
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    // Legacy plain text data fallback — not encrypted, return as-is
    return encryptedText;
  }

  const [ivHex, encryptedHex, authTagHex] = parts;
  try {
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    logger.error("Decryption failed — returning null instead of raw ciphertext", { error });
    return null;
  }
}
