import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Interface } from "node:readline";
import { config } from "dotenv";
import { clearDbConnectionSingleton } from "@/backend/db/drizzleDb";
import { resetEnvironmentCache } from "@/backend/lib/env";
import { sanitizeUrlCredentials } from "@/backend/lib/utils/url";
import { DESTRUCTIVE_GUARD_ENV_KEYS } from "@/scripts/lib/destructiveDbGuard";

export const DEFAULT_ENV_FILE = ".env";

const ENV_FILE_PREFIX = ".env";
const EXCLUDED_ENV_FILES = new Set([".env.example"]);

export interface EnvFileOption {
  fileName: string;
  databaseUrl: string;
}

let selectedEnvFile: string | null = null;

/**
 * Returns the env file selected for this db CLI session (used by child bun processes).
 */
export function getSelectedEnvFile(): string | null {
  return selectedEnvFile;
}

/**
 * Whether a DATABASE_URL value is usable for db commands.
 */
export function isValidDatabaseUrl(databaseUrl: string | undefined): databaseUrl is string {
  if (!databaseUrl?.trim()) {
    return false;
  }

  const trimmed = databaseUrl.trim();
  if (trimmed.includes("<") || trimmed.includes(">")) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
      return false;
    }
    return parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

/**
 * Reads DATABASE_URL from an env file without mutating process.env.
 */
export function readDatabaseUrlFromEnvFile(fileName: string, rootDir = process.cwd()): string | undefined {
  const filePath = join(rootDir, fileName);
  if (!existsSync(filePath)) {
    return undefined;
  }

  const parsed = config({ path: filePath, processEnv: {} }).parsed;
  return parsed?.DATABASE_URL;
}

function isDiscoverableEnvFile(fileName: string): boolean {
  if (!fileName.startsWith(ENV_FILE_PREFIX)) {
    return false;
  }
  if (EXCLUDED_ENV_FILES.has(fileName)) {
    return false;
  }
  return true;
}

function compareEnvFileNames(a: string, b: string): number {
  if (a === DEFAULT_ENV_FILE) return -1;
  if (b === DEFAULT_ENV_FILE) return 1;
  return a.localeCompare(b);
}

/**
 * Finds root-level .env* files that contain a valid DATABASE_URL.
 */
export function discoverEnvFilesWithDatabaseUrl(rootDir = process.cwd()): EnvFileOption[] {
  const entries = readdirSync(rootDir);
  const options: EnvFileOption[] = [];

  for (const entry of entries) {
    if (!isDiscoverableEnvFile(entry)) {
      continue;
    }

    const filePath = join(rootDir, entry);
    if (!statSync(filePath).isFile()) {
      continue;
    }

    const databaseUrl = readDatabaseUrlFromEnvFile(entry, rootDir);
    if (!isValidDatabaseUrl(databaseUrl)) {
      continue;
    }

    options.push({ fileName: entry, databaseUrl });
  }

  return options.sort((a, b) => compareEnvFileNames(a.fileName, b.fileName));
}

/**
 * Loads the selected env file into process.env, invalidates in-memory environment
 * and database connection singletons, and records the active env file for child processes.
 *
 * @param fileName The environment file to load (e.g. `.env`, `.env.vercel`, `.env.mishkah`).
 * @param rootDir The root directory containing the env files (defaults to current working directory).
 */
export function applyEnvFile(fileName: string, rootDir = process.cwd()): void {
  const filePath = join(rootDir, fileName);
  if (!existsSync(filePath)) {
    throw new Error(`Env file not found: ${fileName}`);
  }

  const databaseUrl = readDatabaseUrlFromEnvFile(fileName, rootDir);
  if (!isValidDatabaseUrl(databaseUrl)) {
    throw new Error(`Env file "${fileName}" does not contain a valid DATABASE_URL.`);
  }

  const result = config({ path: filePath, processEnv: {} });
  const parsed = result.parsed;
  if (!parsed) {
    throw new Error(`Could not parse env file: ${fileName}`);
  }

  for (const key of DESTRUCTIVE_GUARD_ENV_KEYS) {
    delete process.env[key];
  }

  for (const [key, value] of Object.entries(parsed)) {
    process.env[key] = value;
  }

  resetEnvironmentCache();
  clearDbConnectionSingleton();

  selectedEnvFile = fileName;
}

export function formatEnvFileLabel(option: EnvFileOption): string {
  return `${option.fileName} (${sanitizeUrlCredentials(option.databaseUrl)})`;
}

/**
 * Displays env file choices and returns the selected file name.
 */
export async function selectEnvFileInteractive(rl: Interface, rootDir = process.cwd()): Promise<string> {
  const options = discoverEnvFilesWithDatabaseUrl(rootDir);

  if (options.length === 0) {
    throw new Error(
      [
        "No .env files with a valid DATABASE_URL were found in the project root.",
        `Add DATABASE_URL=postgresql://... to ${DEFAULT_ENV_FILE} or another .env* file.`,
      ].join("\n")
    );
  }

  globalThis.console.log("\n--- Select Environment ---");
  for (const [index, option] of options.entries()) {
    globalThis.console.log(`${index + 1}. ${formatEnvFileLabel(option)}`);
  }
  globalThis.console.log("0. Exit");

  while (true) {
    const choice = (
      await new Promise<string>(resolve => {
        rl.question("\nEnvironment: ", answer => {
          resolve(answer);
        });
      })
    ).trim();

    if (choice === "0") {
      throw new Error("Cancelled.");
    }

    const selectedIndex = Number.parseInt(choice, 10);
    if (Number.isInteger(selectedIndex) && selectedIndex >= 1 && selectedIndex <= options.length) {
      const selected = options[selectedIndex - 1];
      if (!selected) {
        continue;
      }
      return selected.fileName;
    }

    globalThis.console.error(`Invalid choice: ${choice}`);
  }
}

export interface ParsedDbCliArgs {
  showHelp: boolean;
  envFile?: string;
  actionArg?: string;
}

/**
 * Parses db CLI args, extracting --env-file before action dispatch.
 */
export function parseDbCliArgs(args: string[]): ParsedDbCliArgs {
  const parsed: ParsedDbCliArgs = { showHelp: false };
  const positional: string[] = [];

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (!arg) {
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      parsed.showHelp = true;
      continue;
    }

    if (arg.startsWith("--env-file=")) {
      parsed.envFile = arg.slice("--env-file=".length);
      continue;
    }

    if (arg === "--env-file") {
      const nextArg = args[index + 1];
      if (!nextArg) {
        throw new Error("--env-file requires a file path argument.");
      }
      parsed.envFile = nextArg;
      index++;
      continue;
    }

    positional.push(arg);
  }

  parsed.actionArg = positional[0];
  return parsed;
}
