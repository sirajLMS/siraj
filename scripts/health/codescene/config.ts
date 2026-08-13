import fs from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveBinOnPATH } from "@/scripts/health/__shared__/bin-resolver";
import { COLORS, logError, logInfo, logSuccess, logWarning } from "@/scripts/health/__shared__/log";

const currentDir = dirname(fileURLToPath(import.meta.url));
export const SCRIPT_DIR = currentDir;
export const PROJECT_ROOT = join(SCRIPT_DIR, "..", "..", "..");

export const CONFIG = {
  CACHE_DIR: join(SCRIPT_DIR, ".cache"),
  TIMESTAMP_FILE: join(SCRIPT_DIR, ".cache", "file-timestamps.txt"),
  RESULTS_FILE: join(SCRIPT_DIR, ".cache", "results.txt"),
  TOKEN_FILE: join(SCRIPT_DIR, "token.txt"),
  CS_TOKEN: "",
  CODESCENE_BIN: process.env.CODESCENE_BIN ?? "cs",
};

// Disable automatic version check on every run to prevent console clutter during parallel execution
process.env.CS_DISABLE_VERSION_CHECK = "true";

// 1. Try to load token from local file first (highest priority for persistence)
if (fs.existsSync(CONFIG.TOKEN_FILE)) {
  try {
    const localToken = fs.readFileSync(CONFIG.TOKEN_FILE, "utf8").trim();
    if (localToken) {
      CONFIG.CS_TOKEN = localToken;
      process.env.CS_ACCESS_TOKEN = localToken;
    }
  } catch {
    // Ignore read errors
  }
}

// 2. Fallback to environment if file was missing or empty
if (!CONFIG.CS_TOKEN) {
  CONFIG.CS_TOKEN = process.env.CS_ACCESS_TOKEN ?? "";
}

// Disable automatic version check to prevent spam during parallel execution
process.env.CS_DISABLE_VERSION_CHECK = "true";

export function resolveCodesceneBin(): string {
  const bin = CONFIG.CODESCENE_BIN;
  if (bin.includes("/") || bin.includes("\\")) {
    return bin;
  }
  return resolveBinOnPATH(bin);
}

export function getPowershellCmd(): string {
  return String.raw`C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`;
}

export { COLORS, logError, logInfo, logSuccess, logWarning };
