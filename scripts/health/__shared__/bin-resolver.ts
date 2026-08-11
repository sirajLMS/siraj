import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";

interface ResolveBinOptions {
  /** Cache the resolved path (default: true) */
  cache?: boolean;
}

const binCache = new Map<string, string>();

/**
 * Resolves a binary on PATH across platforms (Unix: `which`, Windows: `where.exe`).
 * Used by codescene and sonar config scripts. If the binary cannot be resolved
 * via the platform's path-search tool, or the resolved path does not exist, the
 * original `binName` is returned as a fallback so callers may still attempt a
 * direct spawn. Results are cached per process unless `cache: false` is passed.
 */
export function resolveBinOnPATH(binName: string, options: ResolveBinOptions = {}): string {
  const { cache = true } = options;
  if (cache) {
    const cached = binCache.get(binName);
    if (cached) return cached;
  }

  const isWin = os.platform() === "win32";
  const searchCmd = isWin ? String.raw`C:\Windows\System32\where.exe` : "/usr/bin/which";

  try {
    const result = spawnSync(searchCmd, [binName], {
      encoding: "utf8",
      env: { ...process.env, PATH: process.env.PATH },
    });

    if (result.status === 0 && result.stdout) {
      const absolutePath = result.stdout.split("\n")[0].trim();
      if (fs.existsSync(absolutePath)) {
        if (cache) binCache.set(binName, absolutePath);
        return absolutePath;
      }
    }
  } catch {
    // Ignore error and fallback to the original bin name
  }

  if (cache) binCache.set(binName, binName);
  return binName;
}
