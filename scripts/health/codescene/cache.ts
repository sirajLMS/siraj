import { existsSync, mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { CONFIG } from "@/scripts/health/codescene/config";

export interface CachedResult {
  file: string;
  status: "perfect" | "warning" | "error";
  details: string;
}

// In-memory cache
const mtimeCache: Map<string, number> = new Map();
const resultCache: Map<string, { status: string; details: string }> = new Map();
let isLoaded = false;

export function ensureCacheDir(): void {
  if (!existsSync(CONFIG.CACHE_DIR)) {
    mkdirSync(CONFIG.CACHE_DIR, { recursive: true });
  }
}

export function removeCachedResult(filePath: string): void {
  loadCache();
  mtimeCache.delete(filePath);
  resultCache.delete(filePath);
}

export function loadCache(): void {
  if (isLoaded) return;
  ensureCacheDir();

  if (existsSync(CONFIG.TIMESTAMP_FILE)) {
    const content = readFileSync(CONFIG.TIMESTAMP_FILE, "utf8");
    content.split("\n").forEach(line => {
      const parts = line.split(" ");
      if (parts.length >= 2) {
        mtimeCache.set(parts[0], Number.parseInt(parts[1], 10));
      }
    });
  }

  if (existsSync(CONFIG.RESULTS_FILE)) {
    const content = readFileSync(CONFIG.RESULTS_FILE, "utf8");
    content.split("\n").forEach(line => {
      const parts = line.split("§§§");
      if (parts.length >= 2) {
        // Never load error results into memory cache — error files must always be rescanned
        if (parts[1] === "error") {
          mtimeCache.delete(parts[0]);
          return;
        }
        resultCache.set(parts[0], {
          status: parts[1],
          details: (parts[2] || "").replaceAll("|||NEWLINE|||", "\n"),
        });
      }
    });
  }

  isLoaded = true;
}

export function saveCache(): void {
  ensureCacheDir();

  const mtimeContent = Array.from(mtimeCache.entries())
    .map(([file, mtime]) => `${file} ${mtime}`)
    .join("\n");
  writeFileSync(CONFIG.TIMESTAMP_FILE, mtimeContent + (mtimeContent ? "\n" : ""), "utf8");

  const resultsContent = Array.from(resultCache.entries())
    .map(([file, { status, details }]) => {
      const encodedDetails = details.replaceAll("\n", "|||NEWLINE|||");
      return `${file}§§§${status}§§§${encodedDetails}`;
    })
    .join("\n");
  writeFileSync(CONFIG.RESULTS_FILE, resultsContent + (resultsContent ? "\n" : ""), "utf8");
}

export function getFileMtime(filePath: string): number {
  try {
    return Math.floor(statSync(filePath).mtimeMs / 1000);
  } catch {
    return 0;
  }
}

export function getCachedMtime(filePath: string): number {
  loadCache();
  return mtimeCache.get(filePath) || 0;
}

export function updateCachedMtime(filePath: string, mtime: number): void {
  loadCache();
  mtimeCache.set(filePath, mtime);
}

export function saveResult(filePath: string, status: string, details: string): void {
  loadCache();
  if (status === "error") {
    removeCachedResult(filePath);
    return;
  }
  resultCache.set(filePath, { status, details });
}

export function getCachedResult(filePath: string): CachedResult | null {
  loadCache();
  const cached = resultCache.get(filePath);
  if (!cached) return null;

  return {
    file: filePath,
    status: cached.status as "perfect" | "warning" | "error",
    details: cached.details,
  };
}

export function clearCache(): void {
  if (existsSync(CONFIG.TIMESTAMP_FILE)) {
    unlinkSync(CONFIG.TIMESTAMP_FILE);
  }
  if (existsSync(CONFIG.RESULTS_FILE)) {
    unlinkSync(CONFIG.RESULTS_FILE);
  }
  mtimeCache.clear();
  resultCache.clear();
  isLoaded = true; // Mark as loaded to prevent reloading empty files
}
