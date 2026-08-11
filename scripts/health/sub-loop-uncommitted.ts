/**
 * SUB-LOOP-UNCOMMITTED — Batch Quality Verification for Uncommitted Files
 *
 * This is an extension of sub-loop.ts that runs the progressive quality loop
 * on ALL uncommitted (staged + unstaged) files, sequentially (NOT in parallel).
 *
 * It uses the SAME project-wide commands as sub-loop.ts (tsgo, biome:check, oxlint)
 * but runs them ONCE globally and filters results for all uncommitted files,
 * rather than running per-file. This is much faster than calling sub-loop.ts
 * once per file, because the per-file overhead is eliminated.
 *
 * Workflow:
 *   1. Get the list of uncommitted files (git status --porcelain)
 *   2. Run each check ONCE project-wide:
 *      - tsgo (project-wide, filter for uncommitted files)
 *      - oxlint (on uncommitted files only)
 *      - biome:check (on uncommitted files only)
 *      - lint:type-aware (via lint service, on uncommitted files only)
 *   3. Report per-file results
 *   4. Exit non-zero if ANY file fails ANY check
 *
 * Usage:
 *   bun run scripts/health/sub-loop-uncommitted.ts [--lifecycle <stage>]
 *
 * Lifecycle stages (same as sub-loop.ts):
 *   tsgo          → only run tsgo
 *   biome         → run tsgo, then oxlint, then biome:check
 *   lint          → run tsgo, oxlint, biome, then lint:type-aware (default)
 *   codescene     → run tsgo, oxlint, biome, lint:type-aware, check:duplicates, codescene
 *   sonar-results → same as codescene
 *
 * Exit codes:
 *   0 = all uncommitted files passed all checks
 *   1 = at least one file failed at least one check
 *   2 = invalid arguments or no uncommitted files
 */

import { spawnSync } from "node:child_process";
import { relative, resolve } from "node:path";
import { isCodeSceneOutputFailed } from "@/scripts/health/codescene/checker";
import { withProcessLock } from "@/scripts/lib/process-lock";
import { type LintResult, requestLint } from "@/scripts/lint-service";

// ─── Types ──────────────────────────────────────────────────────────────────

type Lifecycle = "tsgo" | "biome" | "lint" | "codescene" | "sonar-results";

interface CheckResult {
  name: string;
  passed: boolean;
  output: string;
  failedFiles: string[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PROJECT_ROOT = process.cwd();

const LIFECYCLE_ORDER: Record<Lifecycle, number> = {
  tsgo: 0,
  biome: 1,
  lint: 2,
  codescene: 3,
  "sonar-results": 3,
};

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const NC = "\x1b[0m";

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Type guard: checks if a string is a valid Lifecycle stage. */
function isLifecycle(value: string): value is Lifecycle {
  return value in LIFECYCLE_ORDER;
}

function logInfo(msg: string): void {
  console.log(`${CYAN}ℹ${NC}  ${msg}`);
}

function logPass(msg: string): void {
  console.log(`${GREEN}✅${NC} ${msg}`);
}

function logFail(msg: string): void {
  console.error(`${RED}❌${NC} ${BOLD}${msg}${NC}`);
}

function logWarn(msg: string): void {
  console.log(`${YELLOW}⚠${NC}  ${msg}`);
}

function logFile(msg: string): void {
  console.log(`${CYAN}  📄${NC} ${msg}`);
}

interface CommandRunResult {
  exitCode: number | null;
  output: string;
}

function runCommand(command: string, args: string[]): CommandRunResult {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    cwd: PROJECT_ROOT,
    stdio: ["pipe", "pipe", "pipe"],
    maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large outputs
  });
  return {
    exitCode: result.status,
    output: (result.stdout || "") + (result.stderr || ""),
  };
}

function exitCodePassed(exitCode: number | null): boolean {
  return exitCode === 0;
}

// ─── Uncommitted Files Discovery ───────────────────────────────────────────

/**
 * Get the list of uncommitted files (staged + unstaged, modified + added).
 * Returns relative paths, filtered to .ts/.tsx/.mts/.mts files only.
 * Excludes deleted files (status 'D').
 */
function getUncommittedFiles(): string[] {
  const result = runCommand("git", ["status", "--porcelain", "-z"]);
  if (result.exitCode !== 0) {
    throw new Error(`git status failed: ${result.output}`);
  }

  const files: string[] = [];
  // -z separates entries with NUL bytes; each entry is "XY PATH\0"
  // where XY is the 2-char status code
  const entries = result.output.split("\0");
  for (const entry of entries) {
    if (!entry) continue;
    // Status code is first 2 chars, then a space, then the path
    const status = entry.substring(0, 2);
    const path = entry.substring(3);
    // Skip deleted files (D in either position)
    if (status[0] === "D" || status[1] === "D") continue;
    // Skip renames source (R) — the new path is a separate entry
    if (status[0] === "R" && entry.includes(" -> ")) continue;
    // Filter to TypeScript/JavaScript files
    if (/\.(ts|tsx|mts|mjs|js|jsx)$/.test(path)) {
      files.push(path);
    }
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

// ─── Checks (run once, project-wide, then filter) ──────────────────────────

function checkTsgoAll(files: string[]): CheckResult {
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

function checkBiomeAll(files: string[]): CheckResult {
  if (files.length === 0) {
    return { name: "biome:check", passed: true, output: "", failedFiles: [] };
  }
  logInfo(`Running biome:check on ${files.length} uncommitted file(s)...`);
  // Run biome on all uncommitted files at once
  const result = runCommand("bunx", ["@biomejs/biome", "check", "--write", "--unsafe", ...files]);

  if (exitCodePassed(result.exitCode)) {
    logPass("biome:check passed for all uncommitted files");
    return { name: "biome:check", passed: true, output: "", failedFiles: [] };
  }

  const failedFiles = extractFailedFiles(result.output, files);
  logFail(`biome:check FAILED — ${failedFiles.length} file(s) have issues`);
  console.log(result.output);
  return { name: "biome:check", passed: false, output: result.output, failedFiles };
}

function checkOxlintAll(files: string[]): CheckResult {
  if (files.length === 0) {
    return { name: "oxlint", passed: true, output: "", failedFiles: [] };
  }
  logInfo(`Running oxlint on ${files.length} uncommitted file(s)...`);
  // Run oxlint on all uncommitted files at once, with --deny-warnings
  const result = runCommand("bunx", ["oxlint", "--deny-warnings", "--ignore-path", ".gitignore", ...files]);

  if (exitCodePassed(result.exitCode)) {
    logPass("oxlint passed for all uncommitted files");
    return { name: "oxlint", passed: true, output: "", failedFiles: [] };
  }

  const failedFiles = extractFailedFiles(result.output, files);
  logFail(`oxlint FAILED — ${failedFiles.length} file(s) have violations`);
  console.log(result.output);
  return { name: "oxlint", passed: false, output: result.output, failedFiles };
}

async function checkLintTypeAwareAll(files: string[]): Promise<CheckResult> {
  if (files.length === 0) {
    return { name: "lint:type-aware", passed: true, output: "", failedFiles: [] };
  }
  logInfo(`Submitting lint:type-aware via in-process service for ${files.length} uncommitted file(s)...`);
  try {
    const relPaths = files.map(f => relative(PROJECT_ROOT, resolve(PROJECT_ROOT, f)));
    const result: LintResult = await requestLint("sub-loop-uncommitted", relPaths, {
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

function checkDuplicatesAll(files: string[]): CheckResult {
  if (files.length === 0) {
    return { name: "check:duplicates", passed: true, output: "", failedFiles: [] };
  }
  logInfo(`Running check:duplicates (jscpd) on uncommitted files...`);
  // jscpd doesn't support per-file args well; run project-wide and filter
  const result = runCommand("bunx", ["jscpd"]);

  if (exitCodePassed(result.exitCode)) {
    logPass("check:duplicates passed");
    return { name: "check:duplicates", passed: true, output: "", failedFiles: [] };
  }

  const failedFiles = extractFailedFiles(result.output, files);
  logFail(`check:duplicates found duplicates in ${failedFiles.length} file(s)`);
  console.log(result.output);
  return { name: "check:duplicates", passed: false, output: result.output, failedFiles };
}

function checkCodesceneAll(files: string[]): CheckResult {
  if (files.length === 0) {
    return { name: "codescene", passed: true, output: "", failedFiles: [] };
  }
  logInfo(`Running codescene on uncommitted files...`);
  // codescene runs per-file; run sequentially
  const failedFiles: string[] = [];
  let combinedOutput = "";

  for (const file of files) {
    const result = runCommand("bun", ["run", "scripts/health/codescene/main.ts", "--file", file]);
    if (!exitCodePassed(result.exitCode) || isCodeSceneOutputFailed(result.output, result.exitCode)) {
      failedFiles.push(file);
      combinedOutput += `\n--- ${file} ---\n${result.output}\n`;
    }
  }

  if (failedFiles.length === 0) {
    logPass("codescene passed for all uncommitted files");
    return { name: "codescene", passed: true, output: "", failedFiles: [] };
  }

  logFail(`codescene FAILED — ${failedFiles.length} file(s) have issues`);
  console.log(combinedOutput);
  return { name: "codescene", passed: false, output: combinedOutput, failedFiles };
}

// ─── Main ──────────────────────────────────────────────────────────────────

/** Parse the --lifecycle flag from CLI args. */
function parseLifecycle(args: string[]): Lifecycle {
  let lifecycle: Lifecycle = "lint";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--lifecycle" && i + 1 < args.length) {
      const val = args[i + 1];
      if (isLifecycle(val)) {
        lifecycle = val;
      } else {
        console.error(`Invalid lifecycle: ${val}`);
        console.error(`Valid values: ${Object.keys(LIFECYCLE_ORDER).join(", ")}`);
        process.exit(2);
      }
      i++;
    }
  }
  return lifecycle;
}

/** Print the header and uncommitted files list. */
function printHeader(lifecycle: Lifecycle, files: string[]): void {
  console.log(`${BOLD}━━━ SUB-LOOP-UNCOMMITTED ━━━${NC}`);
  console.log(`  Lifecycle: ${lifecycle} (depth: ${LIFECYCLE_ORDER[lifecycle]})`);
  console.log("");
  console.log(`${BOLD}Uncommitted files (${files.length}):${NC}`);
  for (const f of files) {
    logFile(f);
  }
  console.log("");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const lifecycle = parseLifecycle(args);

  const files = getUncommittedFiles();
  if (files.length === 0) {
    logWarn("No uncommitted TypeScript/JavaScript files found.");
    process.exit(0);
  }

  const exitCode = await withProcessLock("sub-loop-uncommitted", async () => {
    printHeader(lifecycle, files);

    const depth = LIFECYCLE_ORDER[lifecycle];
    const results: CheckResult[] = [];

    // tsgo (depth 0+)
    results.push(checkTsgoAll(files));
    if (!results[results.length - 1].passed) {
      printSummary(results, files);
      return 1;
    }

    // biome (depth 1+)
    if (depth >= 1) {
      results.push(checkOxlintAll(files));
      if (!results[results.length - 1].passed) {
        printSummary(results, files);
        return 1;
      }
      results.push(checkBiomeAll(files));
      if (!results[results.length - 1].passed) {
        printSummary(results, files);
        return 1;
      }
    }

    // lint:type-aware (depth 2+)
    if (depth >= 2) {
      results.push(await checkLintTypeAwareAll(files));
      if (!results[results.length - 1].passed) {
        printSummary(results, files);
        return 1;
      }
    }

    // check:duplicates + codescene (depth 3+)
    if (depth >= 3) {
      results.push(checkDuplicatesAll(files));
      if (!results[results.length - 1].passed) {
        printSummary(results, files);
        return 1;
      }
      results.push(checkCodesceneAll(files));
      if (!results[results.length - 1].passed) {
        printSummary(results, files);
        return 1;
      }
    }

    printSummary(results, files);
    return 0;
  });

  process.exit(exitCode);
}

function printSummary(results: CheckResult[], files: string[]): void {
  console.log("");
  console.log(`${BOLD}━━━ Summary ━━━${NC}`);
  console.log(`  Files checked: ${files.length}`);
  for (const r of results) {
    const mark = r.passed ? `${GREEN}✅${NC}` : `${RED}❌${NC}`;
    const failedInfo = r.failedFiles.length > 0 ? ` (${r.failedFiles.length} failed)` : "";
    console.log(`  ${mark} ${r.name}${failedInfo}`);
  }
  const allPassed = results.every(r => r.passed);
  if (allPassed) {
    console.log("");
    console.log(`${GREEN}${BOLD}✅ All checks passed for all uncommitted files.${NC}`);
  } else {
    console.log("");
    console.log(`${RED}${BOLD}❌ Some checks failed. Fix the errors above before committing.${NC}`);
  }
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
