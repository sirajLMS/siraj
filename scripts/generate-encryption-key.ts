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
import { updateEnvFile } from "@/scripts/__shared__";

// Canonical key-material validation shared with backend/lib/field-encryption.ts.
// Re-exported for the script's test suite and consumers.
export {
  decodeEncryptionKeyMaterial,
  isProductionEncryptionKeyAccepted,
  KNOWN_DEV_KEY_CONSTANT,
} from "@/backend/lib/encryption-key-material";

import { decodeEncryptionKeyMaterial, isProductionEncryptionKeyAccepted } from "@/backend/lib/encryption-key-material";

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

function createDefaultOptions(): CliOptions {
  return {
    format: "hex",
    raw: false,
    writeEnv: false,
    allKeys: false,
    jwtOnly: false,
    cronOnly: false,
    targetEnvFiles: [],
  };
}

function applyEnvFileValue(options: CliOptions, file: string | undefined): boolean {
  if (!file) {
    return false;
  }
  options.writeEnv = true;
  options.targetEnvFiles.push(file);
  return true;
}

function resolveEnvFileValue(arg: string): string | undefined {
  return arg.startsWith("--env-file=") ? arg.slice("--env-file=".length) : undefined;
}

/**
 * Handles a single CLI argument, returning the number of argv slots consumed
 * (1 for a standalone flag, 2 for `--env-file <path>` with a following value).
 */
function handleArgument(options: CliOptions, arg: string, nextArg: string | undefined): number {
  switch (arg) {
    case "--hex":
      options.format = "hex";
      return 1;
    case "--base64":
      options.format = "base64";
      return 1;
    case "-r":
    case "--raw":
      options.raw = true;
      return 1;
    case "-w":
    case "--write":
      options.writeEnv = true;
      return 1;
    case "--dry-run":
    case "--print-only":
      options.writeEnv = false;
      return 1;
    case "--all":
      options.allKeys = true;
      return 1;
    case "--jwt":
      options.jwtOnly = true;
      return 1;
    case "--cron":
      options.cronOnly = true;
      return 1;
    case "--env-file":
      return applyEnvFileValue(options, nextArg) ? 2 : 1;
    case "-h":
    case "--help":
      printHelp();
      process.exit(0);
      return 1;
    default:
      applyEnvFileValue(options, resolveEnvFileValue(arg));
      return 1;
  }
}

export function parseArgs(args: string[]): CliOptions {
  const options = createDefaultOptions();

  let i = 0;
  while (i < args.length) {
    i += handleArgument(options, args[i], args[i + 1]);
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
