import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const SCRIPT_DIR = __dirname;
export const PROJECT_ROOT = join(SCRIPT_DIR, "..", "..", "..");

export const CONFIG = {
  CACHE_DIR: join(SCRIPT_DIR, ".cache"),
  TIMESTAMP_FILE: join(SCRIPT_DIR, ".cache", "file-timestamps.txt"),
  RESULTS_FILE: join(SCRIPT_DIR, ".cache", "results.txt"),
  CS_TOKEN: process.env.CS_ACCESS_TOKEN || "",
  CODESCENE_BIN: process.env.CODESCENE_BIN || "cs",
};

let resolvedCsBin: string | null = null;

export function resolveCodesceneBin(): string {
  if (resolvedCsBin) return resolvedCsBin;

  const bin = CONFIG.CODESCENE_BIN;
  if (bin.includes("/") || bin.includes("\\")) {
    // It's already an absolute or relative path
    resolvedCsBin = bin;
    return bin;
  }

  // It's a command name, try to resolve it securely
  try {
    const isWin = os.platform() === "win32";
    const searchCmd = isWin ? String.raw`C:\Windows\System32\where.exe` : "/usr/bin/which";

    const result = spawnSync(searchCmd, [bin], {
      encoding: "utf8",
      env: { ...process.env, PATH: process.env.PATH },
    });

    if (result.status === 0 && result.stdout) {
      const absolutePath = result.stdout.split("\n")[0].trim();
      if (fs.existsSync(absolutePath)) {
        resolvedCsBin = absolutePath;
        return absolutePath;
      }
    }
  } catch {
    // Ignore error and fallback
  }

  resolvedCsBin = bin;
  return bin;
}

export function getPowershellCmd(): string {
  return String.raw`C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`;
}

export const COLORS = {
  RED: "\x1b[0;31m",
  GREEN: "\x1b[0;32m",
  YELLOW: "\x1b[1;33m",
  BLUE: "\x1b[0;34m",
  CYAN: "\x1b[0;36m",
  MAGENTA: "\x1b[0;35m",
  NC: "\x1b[0m",
};

export function logInfo(msg: string) {
  globalThis.console.log(`${COLORS.BLUE}ℹ${COLORS.NC} ${msg}`);
}

export function logSuccess(msg: string) {
  globalThis.console.log(`${COLORS.GREEN}✓${COLORS.NC} ${msg}`);
}

export function logWarning(msg: string) {
  globalThis.console.log(`${COLORS.YELLOW}⚠${COLORS.NC} ${msg}`);
}

export function logError(msg: string) {
  globalThis.console.log(`${COLORS.RED}✖${COLORS.NC} ${msg}`);
}
