import { spawnSync } from "node:child_process";
import os from "node:os";
import { join, relative } from "node:path";
import { glob } from "glob";
import {
  ensureCacheDir,
  getCachedMtime,
  getCachedResult,
  getFileMtime,
  loadCache,
  saveCache,
} from "@/scripts/health/codescene/cache";
import {
  getTsConfigIgnores,
  parseCodeSceneIssues,
  pool,
  processChangedFile,
} from "@/scripts/health/codescene/checker.execution";
import {
  type CheckResults,
  printSummary,
  processCachedFile,
  updateQualityStateIfOwned,
} from "@/scripts/health/codescene/checker.results";
import {
  COLORS,
  logError,
  logInfo,
  logSuccess,
  PROJECT_ROOT,
  resolveCodesceneBin,
} from "@/scripts/health/codescene/config";

export function checkSingleFile(filePath: string): void {
  const absolutePath =
    filePath.startsWith("/") || /^[A-Za-z]:\\/.test(filePath) ? filePath : join(PROJECT_ROOT, filePath);
  // Ensure we use relative path for CodeScene matching
  const relPath = relative(PROJECT_ROOT, absolutePath);

  const csBin = resolveCodesceneBin();
  const result = spawnSync(csBin, ["check", relPath], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    env: { ...process.env, CS_DISABLE_VERSION_CHECK: "true" },
  });
  const output = (result.stdout || "") + (result.stderr || "");
  globalThis.console.log(output);

  if (result.error) {
    logError(`Failed to run CodeScene CLI: ${result.error.message}`);
    process.exit(1);
  }

  const issues = output
    .split("\n")
    .map(l => l.trim())
    .filter(line => {
      if (/info:.*Code health score:/i.test(line)) return false;
      return /^(warn|error|info|arn|err|nfo):/i.test(line) || /License check failed|unauthorized/i.test(line);
    });

  const hasError = result.status !== 0 || issues.some(i => /^(error|err|license|unauthorized)/i.test(i));
  const hasWarning = issues.some(i => /^(warn|arn|info|nfo)/i.test(i));

  if (hasError) {
    logError(`${relPath}: errors found`);
    process.exit(1);
  } else if (hasWarning) {
    globalThis.console.log(`${COLORS.YELLOW}⚠️  ${relPath}: warnings found${COLORS.NC}`);
    process.exit(1);
  } else {
    logSuccess(`${relPath}: perfect health ✨`);
  }
}

export async function runHealthCheck(forceFull = false): Promise<void> {
  loadCache();
  ensureCacheDir();

  const tsConfigIgnores = getTsConfigIgnores();
  //   **/.*/**  — ignores ALL dot-directories anywhere in the tree (e.g. .next, .ai,
  //               .scannerwork, .git, ...). One pattern replaces the previous
  //               hand-maintained list that missed new dot dirs.
  const baseIgnores = ["**/.*/**", "**/node_modules/**", "**/dist/**"];
  const allIgnores = [...new Set([...baseIgnores, ...tsConfigIgnores])];

  logInfo("Finding all TypeScript files...");
  const files = await glob("**/*.{ts,tsx}", {
    cwd: PROJECT_ROOT,
    ignore: allIgnores,
  });

  if (files.length === 0) {
    logError("No TypeScript files found");
    return;
  }

  logInfo(`📊 Found ${files.length} TypeScript files`);

  const filesToCheck = selectFilesToCheck(files, forceFull);

  if (filesToCheck.length === 0) {
    logSuccess("✨ All files are up to date (no changes detected)");
  } else {
    logInfo(`🔄 Checking ${filesToCheck.length} changed file(s)`);
    logInfo(`⚡ Skipping ${files.length - filesToCheck.length} unchanged file(s)`);
  }

  const results: CheckResults = {
    perfectCount: 0,
    warningCount: 0,
    errorCount: 0,
    cachedCount: 0,
    warningFiles: [],
    errorFiles: [],
  };

  const concurrency = resolveConcurrency();
  logInfo(`🚀 Using ${concurrency} threads`);

  await pool(files, concurrency, async file => {
    const isChanged = filesToCheck.includes(file);
    if (isChanged) {
      await processChangedFile(file, results);
    } else {
      processCachedFile(file, results);
    }
  });

  saveCache();
  printSummary(results);
  updateQualityStateIfOwned(results);

  if (results.errorCount > 0 || results.warningCount > 0) {
    process.exit(1);
  }
}

/** Files need a re-scan when never scanned, previously failed, or modified since the last run. */
function selectFilesToCheck(files: string[], forceFull: boolean): string[] {
  return files.filter(file => {
    if (forceFull) return true;
    const cachedResult = getCachedResult(file);
    if (!cachedResult || cachedResult.status === "error") return true;
    const currentMtime = getFileMtime(join(PROJECT_ROOT, file));
    const cachedMtime = getCachedMtime(file);
    return currentMtime !== cachedMtime;
  });
}

function resolveConcurrency(): number {
  const envConcurrency = Number.parseInt(process.env.CS_CONCURRENCY ?? "", 10);
  const maxThreads = Number.isNaN(envConcurrency) ? 4 : envConcurrency;
  return Math.max(1, Math.min(maxThreads, os.cpus().length - 1));
}

/** True when CodeScene CLI output indicates errors or warnings (not just non-zero exit). */
export function isCodeSceneOutputFailed(output: string, exitCode: number | null): boolean {
  const issues = parseCodeSceneIssues(output);
  const hasError = exitCode !== 0 || issues.some(i => /^(error|err|license|unauthorized)/i.test(i));
  const hasWarning = issues.some(i => /^(warn|arn|info|nfo)/i.test(i));
  return hasError || hasWarning;
}
