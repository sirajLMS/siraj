#!/usr/bin/env bun
/**
 * Generate cryptographically secure database encryption keys (AES-256-GCM)
 * and environment secrets satisfying production requirements.
 *
 * Requirements for DATABASE_ENCRYPTION_KEY:
 * - Must decode to exactly 32 bytes of key material (64-char hex or base64)
 * - Must not match the committed development fallback constant
 *
 * Usage:
 *   bun run scripts/generate-encryption-key.ts                 # generates key and updates .env & .env.local
 *   bun run scripts/generate-encryption-key.ts --base64        # generate as 32-byte base64
 *   bun run scripts/generate-encryption-key.ts --raw           # print raw key to stdout only
 *   bun run scripts/generate-encryption-key.ts --dry-run       # print without writing files
 *   bun run scripts/generate-encryption-key.ts --all           # generate DATABASE_ENCRYPTION_KEY, JWT_SECRET, CRON_SECRET
 *   bun run scripts/generate-encryption-key.ts --env-file <f>  # update specific env file
 */

import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const PROJECT_ROOT = process.cwd();

/** Committed dev key constant that must never be accepted in production. */
export const KNOWN_DEV_KEY_CONSTANT = "development-database-encryption-key-must-be-changed-in-production";

/**
 * Validates that the raw key string decodes to exactly 32 bytes.
 * Matches backend/lib/field-encryption.ts decodeEncryptionKeyMaterial.
 */
export function decodeEncryptionKeyMaterial(raw: string): Buffer | null {
  const trimmed = raw.trim();
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, "hex");
  }
  if (trimmed.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(trimmed)) {
    const decoded = Buffer.from(trimmed, "base64");
    if (decoded.length === 32) {
      return decoded;
    }
  }
  return null;
}

/**
 * Validates whether the key passes the production strength gate.
 * Matches backend/lib/field-encryption.ts isProductionEncryptionKeyAccepted.
 */
export function isProductionEncryptionKeyAccepted(raw: string): boolean {
  return raw.trim() !== KNOWN_DEV_KEY_CONSTANT && decodeEncryptionKeyMaterial(raw) !== null;
}

/**
 * Generates a cryptographically secure 32-byte database encryption key.
 */
export function generateDatabaseEncryptionKey(format: "hex" | "base64" = "hex"): string {
  const bytes = randomBytes(32);
  const key = format === "hex" ? bytes.toString("hex") : bytes.toString("base64");
  if (!isProductionEncryptionKeyAccepted(key)) {
    throw new Error("Generated key failed production validation checks");
  }
  return key;
}

/**
 * Generates a cryptographically secure JWT secret (64 bytes / 512 bits).
 */
export function generateJwtSecret(format: "hex" | "base64" = "hex"): string {
  const bytes = randomBytes(64);
  return format === "hex" ? bytes.toString("hex") : bytes.toString("base64");
}

/**
 * Generates a cryptographically secure CRON secret (32 bytes / 256 bits).
 */
export function generateCronSecret(format: "hex" | "base64" = "hex"): string {
  const bytes = randomBytes(32);
  return format === "hex" ? bytes.toString("hex") : bytes.toString("base64");
}

/**
 * Updates or appends a key=value pair in an environment file.
 */
export function updateEnvFile(filePath: string, secretKey: string, secretValue: string): boolean {
  const absPath = resolve(PROJECT_ROOT, filePath);
  if (!existsSync(absPath)) {
    return false;
  }

  const content = readFileSync(absPath, "utf8");
  const regex = new RegExp(`^${secretKey}=.*$`, "m");

  let updatedContent: string;
  if (regex.test(content)) {
    updatedContent = content.replace(regex, `${secretKey}=${secretValue}`);
  } else {
    const trailingNewline = content.endsWith("\n") ? "" : "\n";
    updatedContent = `${content}${trailingNewline}${secretKey}=${secretValue}\n`;
  }

  writeFileSync(absPath, updatedContent, "utf8");
  return true;
}

export interface CliOptions {
  format: "hex" | "base64";
  raw: boolean;
  writeEnv: boolean;
  allKeys: boolean;
  jwtOnly: boolean;
  cronOnly: boolean;
  targetEnvFiles: string[];
}

function printHelp(): void {
  console.log(`
Database Encryption Key & Secrets Generator for Siraj

Usage:
  bun run scripts/generate-encryption-key.ts [options]

Default behavior:
  Generates and displays cryptographically validated keys WITHOUT modifying any environment files.

Options:
  --hex                Generate key as 64-char Hex (default)
  --base64             Generate key as 32-byte Base64 (44 chars)
  -r, --raw            Print raw key only to stdout (no formatting or env writes)
  -w, --write          Update default environment files (.env and .env.local)
  --env-file <path>    Update a specific environment file (e.g. .env, .env.production)
  --all                Generate DATABASE_ENCRYPTION_KEY, JWT_SECRET, and CRON_SECRET
  --jwt                Generate JWT_SECRET
  --cron               Generate CRON_SECRET
  -h, --help           Show this help message
`);
}

export function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    format: "hex",
    raw: false,
    writeEnv: false,
    allKeys: false,
    jwtOnly: false,
    cronOnly: false,
    targetEnvFiles: [],
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    switch (arg) {
      case "--hex":
        options.format = "hex";
        break;
      case "--base64":
        options.format = "base64";
        break;
      case "-r":
      case "--raw":
        options.raw = true;
        break;
      case "-w":
      case "--write":
        options.writeEnv = true;
        break;
      case "--dry-run":
      case "--print-only":
        options.writeEnv = false;
        break;
      case "--all":
        options.allKeys = true;
        break;
      case "--jwt":
        options.jwtOnly = true;
        break;
      case "--cron":
        options.cronOnly = true;
        break;
      case "--env-file": {
        const file = args[i + 1];
        if (file) {
          options.writeEnv = true;
          options.targetEnvFiles.push(file);
          i++;
        }
        break;
      }
      case "-h":
      case "--help":
        printHelp();
        process.exit(0);
        break;
      default: {
        if (arg.startsWith("--env-file=")) {
          const file = arg.slice("--env-file=".length);
          if (file) {
            options.writeEnv = true;
            options.targetEnvFiles.push(file);
          }
        }
        break;
      }
    }
    i++;
  }

  return options;
}

function resolveKeysToGenerate(options: CliOptions): Record<string, string> {
  const keys: Record<string, string> = {};
  if (options.allKeys) {
    keys.DATABASE_ENCRYPTION_KEY = generateDatabaseEncryptionKey(options.format);
    keys.JWT_SECRET = generateJwtSecret(options.format);
    keys.CRON_SECRET = generateCronSecret(options.format);
  } else if (options.jwtOnly) {
    keys.JWT_SECRET = generateJwtSecret(options.format);
  } else if (options.cronOnly) {
    keys.CRON_SECRET = generateCronSecret(options.format);
  } else {
    keys.DATABASE_ENCRYPTION_KEY = generateDatabaseEncryptionKey(options.format);
  }
  return keys;
}

function printKeysSummary(keys: Record<string, string>, format: "hex" | "base64"): void {
  console.log("\nGenerated keys:");
  for (const [name, val] of Object.entries(keys)) {
    console.log(`  ${name}=${val}`);
    if (name === "DATABASE_ENCRYPTION_KEY") {
      const decoded = decodeEncryptionKeyMaterial(val);
      console.log(`  └─ Validated: ${decoded?.length ?? 0} bytes of key material (${format})`);
    }
  }
}

function applyEnvUpdates(keys: Record<string, string>, targetEnvFiles: string[]): void {
  const envFiles = targetEnvFiles.length > 0 ? targetEnvFiles : [".env", ".env.local"];

  console.log("\nUpdating environment files:");
  let updatedAny = false;
  for (const file of envFiles) {
    for (const [name, val] of Object.entries(keys)) {
      if (updateEnvFile(file, name, val)) {
        console.log(`  ✓ Updated ${name} in ${file}`);
        updatedAny = true;
      }
    }
  }

  if (!updatedAny) {
    console.log("  ⚠️  No existing environment files were found to update.");
  }
}

export function main(): void {
  const args = process.argv.slice(2);
  const options = parseArgs(args);
  const keys = resolveKeysToGenerate(options);

  if (options.raw) {
    for (const value of Object.values(keys)) {
      console.log(value);
    }
    return;
  }

  printKeysSummary(keys, options.format);

  if (!options.writeEnv) {
    console.log("\n(No files were modified. To update env files, pass -w/--write or --env-file <path>)");
    return;
  }

  applyEnvUpdates(keys, options.targetEnvFiles);
}

if (import.meta.main) {
  main();
}
