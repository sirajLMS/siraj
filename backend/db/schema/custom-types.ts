import crypto from "node:crypto";
import { customType } from "drizzle-orm/pg-core";

const ENCRYPTION_KEY_RAW = process.env.DATABASE_ENCRYPTION_KEY;
if (!ENCRYPTION_KEY_RAW) {
  throw new Error("DATABASE_ENCRYPTION_KEY environment variable is not defined");
}

// Derive 32-byte key using SHA-256
const ENCRYPTION_KEY = crypto.createHash("sha256").update(ENCRYPTION_KEY_RAW).digest();
const IV_LENGTH = 12;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  // Format: iv:cipherText:authTag
  return `${iv.toString("hex")}:${encrypted}:${authTag}`;
}

function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    return encryptedText; // Legacy plain text data fallback
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
  } catch {
    return encryptedText; // Graceful fallback
  }
}

export const encryptedText = (name: string) =>
  customType<{ data: string; driverData: string }>({
    dataType() {
      return "text";
    },
    toDriver(value: string): string {
      return encrypt(value);
    },
    fromDriver(value: string): string {
      return decrypt(value);
    },
  })(name);
