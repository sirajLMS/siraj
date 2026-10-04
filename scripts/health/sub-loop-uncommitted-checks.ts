/**
 * Sub-loop-uncommitted batch checks — project-wide check implementations with
 * per-file failure attribution.
 *
 * Extracted from `scripts/health/sub-loop-uncommitted.ts`. Every check runs
 * ONCE globally and filters results for the uncommitted file set, instead of
 * running per-file. The orchestration (collectResults, summary, staging)
 * stays in `sub-loop-uncommitted-cli.ts` / `sub-loop-uncommitted-report.ts`.
 *
 * `console.*` is allowed in `scripts/**`.
 */

import { relative, resolve } from "node:path";
import {
  type CheckResult,
  exitCodePassed,
  logFail,
  logInfo,
  logPass,
  runCommand,
} from "@/scripts/health/__shared__/sub-loop-types";
import { isCodeSceneOutputFailed } from "@/scripts/health/codescene/checker";
import { requestLint } from "@/scripts/lint-service";

// ─── Constants ──────────────────────────────────────────────────────────────

const PROJECT_ROOT = process.cwd();

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * Batch-mode extension of {@link CheckResult} that tracks which specific
 * uncommitted files failed the check. `sub-loop-uncommitted.ts` runs each
 * check once across all uncommitted files, so per-file failure attribution
 * is needed for the summary report.
 */
export interface BatchCheckResult extends CheckResult {
  failedFiles: string[];
}

// ─── Uncommitted Files Discovery ───────────────────────────────────────────

/**
 * Get the list of uncommitted files (staged + unstaged, modified + added + untracked).
 * Returns relative paths, filtered to .ts/.tsx/.mts/.mjs/.js/.jsx files only.
 * Excludes deleted files (status 'D').
 */
export function getUncommittedFiles(): string[] {
  // -uall ensures untracked directories are expanded to individual files
  const result = runCommand("git", ["status", "--porcelain", "-uall", "-z"]);
  if (result.exitCode !== 0) {
    throw new Error(`git status failed: ${result.output}`);
  }

  const files: string[] = [];
  const entries = result.output.split("\0");
  let i = 0;

  while (i < entries.length) {
    const entry = entries[i];
    if (!entry) {
      i++;
      continue;
    }

    const status = entry.substring(0, 2);
    const isRename = status[0] === "R" || status[1] === "R";

    if (isRename) {
      // For renames in NUL format, entry i is "R  old/path.ts", entry i+1 is "new/path.ts"
      const newPath = entries[i + 1];
      if (newPath && /\.(ts|tsx|mts|mjs|js|jsx)$/.test(newPath)) {
        files.push(newPath);
      }
      i += 2;
      continue;
    }

    // Skip deleted files
    const isDeleted = status[0] === "D" || status[1] === "D";
    if (!isDeleted) {
      const path = entry.substring(3);
      if (/\.(ts|tsx|mts|mjs|js|jsx)$/.test(path)) {
        files.push(path);
      }
    }
    i++;
  }

  return [...new Set(files)];
}

// ─── Output Filtering ──────────────────────────────────────────────────────

/**
 * Check if a line mentions any of the target files.
 */
function lineMentionsAnyFile(line: string, files: string[]): boolean {
  return files.some(f => line.includes(f));
}

/**
 * Collect continuation lines following an error-block header.
 * Stops at the next error-block header or a blank line.
 * Returns the collected lines and the index of the last consumed line.
 */
function collectErrorBlockContinuation(
  lines: string[],
  startIndex: number,
  errorBlockRegex: RegExp
): { continuationLines: string[]; lastIndex: number } {
  const continuationLines: string[] = [];
  let lastIndex = startIndex;
  for (let j = startIndex + 1; j < lines.length; j++) {
    if (errorBlockRegex.exec(lines[j]) || lines[j].trim() === "") break;
    continuationLines.push(lines[j]);
    lastIndex = j;
  }
  return { continuationLines, lastIndex };
}

/**
 * Filter tsgo output for lines mentioning any of the target files.
 */
function filterTsgoForFiles(tsgoOutput: string, files: string[]): string {
  const lines = tsgoOutput.split("\n");
  const matchingLines: string[] = [];
  const errorBlockRegex = /^(.+\.tsx?)\(\d+,\d+\):/;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const isErrorBlock = errorBlockRegex.exec(line);
    if (!lineMentionsAnyFile(line, files)) {
      i++;
      continue;
    }
    matchingLines.push(line);

    if (!isErrorBlock) {
      i++;
      continue;
    }
    // Collect the error block (header + continuation lines)
    const { continuationLines, lastIndex } = collectErrorBlockContinuation(lines, i, errorBlockRegex);
    matchingLines.push(...continuationLines);
    i = lastIndex + 1;
  }

  return matchingLines.length > 0 ? matchingLines.join("\n") : "";
}

/**
 * Extract the list of files that have errors in the filtered output.
 */
function extractFailedFiles(filteredOutput: string, allFiles: string[]): string[] {
  const failed = new Set<string>();
  for (const file of allFiles) {
    if (filteredOutput.includes(file)) {
      failed.add(file);
    }
  }
  return [...failed];
}

// ─── Shared Batch Check Helper ──────────────────────────────────────────────

/**
 * Config for {@link runFileFilterCheck} — a check that runs a single command
 * over the uncommitted file set and attributes failures per file.
 */
interface FileFilterCheckConfig {
  name: string;
  command: string;
  args: string[];
  startMessage: (fileCount: number) => string;
  passMessage: string;
  failMessage: (failedCount: number) => string;
}

/**
 * Run one command across all uncommitted files, then filter its output for
 * per-file failure attribution. Shared by biome:check and oxlint, which have
 * identical run/exit-code/log flows and differ only in command and messages.
 */
function runFileFilterCheck(config: FileFilterCheckConfig, files: string[]): BatchCheckResult {
  if (files.length === 0) {
    return { name: config.name, passed: true, output: "", failedFiles: [] };
  }
  logInfo(config.startMessage(files.length));
  const result = runCommand(config.command, [...config.args, ...files]);

  if (exitCodePassed(result.exitCode)) {
    logPass(config.passMessage);
    return { name: config.name, passed: true, output: "", failedFiles: [] };
  }

  const failedFiles = extractFailedFiles(result.output, files);
  logFail(config.failMessage(failedFiles.length));
  console.log(result.output);
  return { name: config.name, passed: false, output: result.output, failedFiles };
}

/**
 * Per-check config for biome:check and oxlint — both share the identical
 * run/exit-code/log flow in {@link runFileFilterCheck} and differ only in
 * command, arguments, and messages.
 */
const FILTER_CHECK_CONFIGS = {
  "biome:check": {
    name: "biome:check",
    command: "bunx",
    args: ["@biomejs/biome", "check", "--write", "--unsafe"],
    startMessage: (fileCount: number) => `Running biome:check on ${fileCount} uncommitted file(s)...`,
    passMessage: "biome:check passed for all uncommitted files",
    failMessage: (failedCount: number) => `biome:check FAILED — ${failedCount} file(s) have issues`,
  },
  oxlint: {
    name: "oxlint",
    command: "bunx",
    args: ["oxlint", "--deny-warnings", "--ignore-path", ".gitignore"],
    startMessage: (fileCount: number) => `Running oxlint on ${fileCount} uncommitted file(s)...`,
    passMessage: "oxlint passed for all uncommitted files",
    failMessage: (failedCount: number) => `oxlint FAILED — ${failedCount} file(s) have violations`,
  },
} satisfies Record<string, FileFilterCheckConfig>;

// ─── Checks (run once, project-wide, then filter) ──────────────────────────

export function checkTsgoAll(files: string[]): BatchCheckResult {
  logInfo(`Running tsgo (project-wide, filtering for ${files.length} uncommitted files)...`);
  const result = runCommand("bun", ["tsgo"]);

  if (exitCodePassed(result.exitCode)) {
    logPass("tsgo passed (no errors for any uncommitted file)");
    return { name: "tsgo", passed: true, output: "", failedFiles: [] };
  }

  // tsgo failed — filter output for uncommitted files
  const filtered = filterTsgoForFiles(result.output, files);
  const failedFiles = extractFailedFiles(filtered, files);

  if (failedFiles.length === 0) {
    logPass("tsgo passed (errors exist but not in uncommitted files)");
    return { name: "tsgo", passed: true, output: "", failedFiles: [] };
  }

  logFail(`tsgo FAILED — ${failedFiles.length} uncommitted file(s) have errors`);
  console.log(filtered);
  return { name: "tsgo", passed: false, output: filtered, failedFiles };
}

export function checkBiomeAll(files: string[]): BatchCheckResult {
  return runFileFilterCheck(FILTER_CHECK_CONFIGS["biome:check"], files);
}

export function checkOxlintAll(files: string[]): BatchCheckResult {
  return runFileFilterCheck(FILTER_CHECK_CONFIGS.oxlint, files);
}

export async function checkLintTypeAwareAll(files: string[]): Promise<BatchCheckResult> {
  if (files.length === 0) {
    return { name: "lint:type-aware", passed: true, output: "", failedFiles: [] };
  }
  logInfo(`Submitting lint:type-aware via in-process service for ${files.length} uncommitted file(s)...`);
  try {
    const relPaths = files.map(f => relative(PROJECT_ROOT, resolve(PROJECT_ROOT, f)));
    const result = await requestLint("sub-loop-uncommitted", relPaths, {
      typeAware: true,
      maxWarnings: 0,
    });

    if (result.success) {
      logPass("lint:type-aware passed for all uncommitted files");
      return { name: "lint:type-aware", passed: true, output: "", failedFiles: [] };
    }

    const failedFiles = extractFailedFiles(result.output || "", files);
    logFail(`lint:type-aware FAILED — ${failedFiles.length} file(s) have issues`);
    console.log(result.output);
    return { name: "lint:type-aware", passed: false, output: result.output || "", failedFiles };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logFail(`lint:type-aware errored: ${msg}`);
    return { name: "lint:type-aware", passed: false, output: msg, failedFiles: files };
  }
}

export function checkDuplicatesAll(files: string[]): BatchCheckResult {
  if (files.length === 0) {
    return { name: "check:duplicates", passed: true, output: "", failedFiles: [] };
  }
  logInfo(`Running check:duplicates (jscpd) on uncommitted files...`);
  // jscpd doesn't support per-file args well; run project-wide and filter
  const result = runCommand("bunx", ["jscpd", "--exit-code"]);
  const hasClones = /Clone found/.test(result.output) || /Found [1-9]\d* clones/.test(result.output);

  if (exitCodePassed(result.exitCode) && !hasClones) {
    logPass("check:duplicates passed");
    return { name: "check:duplicates", passed: true, output: "", failedFiles: [] };
  }

  const failedFiles = extractFailedFiles(result.output, files);
  logFail(`check:duplicates found duplicates in ${failedFiles.length} file(s)`);
  console.log(result.output);
  return { name: "check:duplicates", passed: false, output: result.output, failedFiles };
}

export function checkCodesceneAll(files: string[]): BatchCheckResult {
  if (files.length === 0) {
    return { name: "codescene", passed: true, output: "", failedFiles: [] };
  }
  logInfo(`Running codescene on uncommitted files...`);
  // Run codescene --scan ONCE project-wide (zero per-file loops) and filter for uncommitted files
  const result = runCommand("bun", ["run", "scripts/health/codescene/main.ts", "--scan"]);

  if (exitCodePassed(result.exitCode) && !isCodeSceneOutputFailed(result.output, result.exitCode)) {
    logPass("codescene passed for all uncommitted files");
    return { name: "codescene", passed: true, output: "", failedFiles: [] };
  }

  const failedFiles = extractFailedFiles(result.output, files);
  if (failedFiles.length === 0) {
    logPass("codescene passed (issues exist but not in uncommitted files)");
    return { name: "codescene", passed: true, output: "", failedFiles: [] };
  }

  logFail(`codescene FAILED — ${failedFiles.length} file(s) have issues`);
  console.log(result.output);
  return { name: "codescene", passed: false, output: result.output, failedFiles };
}
