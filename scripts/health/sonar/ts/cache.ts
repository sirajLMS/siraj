import { existsSync, readFileSync, statSync, unlinkSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { glob } from "glob";
import { PROJECT_ROOT, SONAR_DIR } from "@/scripts/health/sonar/ts/config";

const CACHE_FILE = join(SONAR_DIR, ".sonar-cache");

/**
 * 📄 Get modification time of a file
 */
export function getFileMtime(filePath: string): number {
  try {
    return Math.floor(statSync(filePath).mtimeMs / 1000);
  } catch {
    return 0;
  }
}

/**
 * 📄 Calculate a project-wide fingerprint based on file modification times
 */
export async function getProjectFingerprint(): Promise<string> {
  // Use properties to get exclusions
  const propsPath = join(PROJECT_ROOT, "sonar-project.properties");
  let exclusions: string[] = [];
  if (existsSync(propsPath)) {
    const props = readFileSync(propsPath, "utf8");
    const exclusionsLine = props.split("\n").find(l => l.startsWith("sonar.exclusions="));
    if (exclusionsLine) {
      exclusions = exclusionsLine
        .split("=")[1]
        .split(",")
        .map(e => e.trim())
        .filter(Boolean);
    }
  }

  // Find all relevant files
  //   **/.*/**  — ignores ALL dot-directories anywhere in the tree (e.g. .next, .git,
  //               .scannerwork, .ai, ...). One pattern replaces the previous
  //               hand-maintained list that missed new dot dirs.
  const files = await glob("**/*.{ts,tsx,js,jsx}", {
    cwd: PROJECT_ROOT,
    ignore: ["**/.*/**", "**/node_modules/**", "**/dist/**", "**/coverage/**", "**/scripts/**", ...exclusions],
  });

  // Sort files for consistent order
  files.sort((a, b) => a.localeCompare(b));

  let totalMtime = 0;
  for (const file of files) {
    totalMtime += getFileMtime(join(PROJECT_ROOT, file));
  }

  return `${files.length}-${totalMtime}`;
}

/**
 * 📄 Check if project has changed since last scan
 */
export async function isProjectChanged(): Promise<boolean> {
  const current = await getProjectFingerprint();
  const cached = getCachedFingerprint();
  return current !== cached;
}

/**
 * 📄 Get the cached fingerprint
 */
export function getCachedFingerprint(): string | null {
  if (!existsSync(CACHE_FILE)) return null;
  try {
    return readFileSync(CACHE_FILE, "utf8").trim();
  } catch {
    return null;
  }
}

/**
 * 📄 Save the current fingerprint
 */
export async function saveProjectFingerprint(): Promise<void> {
  const current = await getProjectFingerprint();
  await writeFile(CACHE_FILE, current, "utf8");
}

/**
 * 📄 Clear the cache
 */
export function clearSonarCache(): void {
  if (existsSync(CACHE_FILE)) {
    try {
      unlinkSync(CACHE_FILE);
    } catch {
      // Ignore
    }
  }
}
