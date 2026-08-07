// Parallel Test Runner for Backend Services (prevents Bun module registry/mock pollution across service test files)
import { availableParallelism } from "node:os";
import { Glob } from "bun";
import { isTestCi } from "@/backend/lib/test-ci-env";
import { TEST_ENV_FILE } from "@/scripts/lib/test-build-env";
import { getErrorMessage } from "@/shared/utils/error";

// ANSI escape codes for styling
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const GRAY = "\x1b[90m";

interface TestStats {
  passes: number;
  fails: number;
  expects: number;
  tests: number;
  parsedLines: string[];
}

interface FailureDetail {
  file: string;
  duration: string;
  exitCode: number;
  stdout: string;
  stderr: string;
}

const glob = new Glob("**/*.test.ts");
const testFiles: string[] = [];

for await (const file of glob.scan({ cwd: "backend/services" })) {
  testFiles.push(`backend/services/${file}`);
}

const totalFiles = testFiles.length;
const parallelism = availableParallelism();

// Each worker creates a pg pool (max: 3 in test env via factory.ts).
// Cap workers so total connections stay well within PostgreSQL's max_connections.
// With max 3 per pool: 8 workers x 3 = 24 connections (leaves headroom for other clients).
const MAX_DB_WORKERS = 8;

const startAll = performance.now();
let totalPasses = 0;
let totalFails = 0;
let totalExpects = 0;
let totalTestsRun = 0;
let filesFailedCount = 0;

const failureDetails: FailureDetail[] = [];
const queue = [...testFiles];
const workers: Promise<void>[] = [];

const effectiveWorkers = Math.min(parallelism, queue.length, MAX_DB_WORKERS);

globalThis.console.log(`${BOLD}Bun Parallel Test Runner${RESET}`);
globalThis.console.log(
  `${GRAY}Running ${totalFiles} backend service test files across ${effectiveWorkers} parallel processes (capped from ${parallelism} for DB connection safety)...${RESET}\n`
);

function stripAnsi(str: string): string {
  const ESC = String.fromCharCode(27);
  return str
    .split(ESC)
    .map(part => part.replace(/^\[[0-9;]*m/, ""))
    .join("");
}

function extractSummaryStats(line: string, stats: TestStats): boolean {
  const cleanLine = stripAnsi(line);

  const passMatch = /^\s*(\d+)\s+pass/.exec(cleanLine);
  if (passMatch) {
    stats.passes = parseInt(passMatch[1], 10);
    return true;
  }
  const failMatch = /^\s*(\d+)\s+fail/.exec(cleanLine);
  if (failMatch) {
    stats.fails = parseInt(failMatch[1], 10);
    return true;
  }
  const expectMatch = /^\s*(\d+)\s+expect\(\)\s+calls/.exec(cleanLine);
  if (expectMatch) {
    stats.expects = parseInt(expectMatch[1], 10);
    return true;
  }
  const runMatch = /^\s*Ran\s+(\d+)\s+tests?\s+across/.exec(cleanLine);
  if (runMatch) {
    stats.tests = parseInt(runMatch[1], 10);
    return true;
  }
  return false;
}

function shouldSkipLine(line: string, file: string, normalizedFile: string): boolean {
  const cleanLine = stripAnsi(line);
  const cleanTrimmed = cleanLine.trim();

  if (cleanLine.includes("bun test v") && /bun test v\d+\.\d+\.\d+/.exec(cleanLine)) return true;
  if (cleanTrimmed === `${file}:` || cleanTrimmed === `${normalizedFile}:`) return true;
  return false;
}

function formatTestLine(line: string, trimmed: string): string | null {
  if (line.includes("(pass)")) return line.replace("(pass)", `${GREEN}✓${RESET}`).trimEnd();
  if (line.includes("(fail)")) return line.replace("(fail)", `${RED}✗${RESET}`).trimEnd();
  if (trimmed !== "") return line;
  return null;
}

function parseTestOutput(stdoutText: string, file: string): TestStats {
  const lines = stdoutText.split(/\r?\n/);
  const normalizedFile = file.replace(/\//g, "\\");
  const stats: TestStats = { passes: 0, fails: 0, expects: 0, tests: 0, parsedLines: [] };

  for (const line of lines) {
    const trimmed = line.trim();

    if (extractSummaryStats(line, stats)) continue;
    if (shouldSkipLine(line, file, normalizedFile)) continue;

    const formatted = formatTestLine(line, trimmed);
    if (formatted !== null) {
      stats.parsedLines.push(formatted);
    }
  }

  stats.tests = stats.tests || stats.passes + stats.fails;
  return stats;
}

async function runSingleTestFile(file: string): Promise<void> {
  const start = performance.now();

  try {
    const workerEnv: Record<string, string | undefined> = {
      ...process.env,
      FORCE_COLOR: "1",
      NODE_ENV: "test",
    };

    // Local: drop parent DATABASE_URL so `--env-file=.env.test` is authoritative.
    // CI (TEST_CI=true): keep workflow DATABASE_URL (Postgres service) over .env.test.
    if (!isTestCi()) {
      workerEnv.DATABASE_URL = undefined;
    }

    const proc = Bun.spawn(["bun", `--env-file=${TEST_ENV_FILE}`, "test", file, "--timeout=60000"], {
      stdout: "pipe",
      stderr: "pipe",
      env: workerEnv,
    });

    const stdoutText = await new Response(proc.stdout).text();
    const stderrText = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    const durationMs = (performance.now() - start).toFixed(0);
    const durationStr = `${durationMs}ms`;

    globalThis.console.log(`\n${BOLD}${file}:${RESET}`);

    // Bun test writes test progress, checkmarks, and summaries to stderr, while stdout receives console logs.
    const combinedOutput = stdoutText + "\n" + stderrText;
    const stats = parseTestOutput(combinedOutput, file);
    for (const line of stats.parsedLines) {
      globalThis.console.log(line);
    }

    totalPasses += stats.passes;
    totalFails += stats.fails;
    totalExpects += stats.expects;
    totalTestsRun += stats.tests;

    if (exitCode !== 0) {
      filesFailedCount++;
      failureDetails.push({
        file,
        duration: durationStr,
        exitCode,
        stdout: stdoutText,
        stderr: stderrText,
      });
    }
  } catch (err: unknown) {
    const durationMs = (performance.now() - start).toFixed(0);
    globalThis.console.log(`\n${BOLD}${RED}✗ ${file}${RESET} ${GRAY}(${durationMs}ms) - Process crashed${RESET}`);
    filesFailedCount++;
    failureDetails.push({
      file,
      duration: `${durationMs}ms`,
      exitCode: -1,
      stdout: "",
      stderr: getErrorMessage(err),
    });
  }
}

async function worker() {
  while (queue.length > 0) {
    const file = queue.shift();
    if (!file) break;
    await runSingleTestFile(file);
  }
}

// Start workers up to the concurrency limit
const limit = Math.min(parallelism, queue.length, MAX_DB_WORKERS);
for (let i = 0; i < limit; i++) {
  workers.push(worker());
}

await Promise.all(workers);

const totalDurationSec = ((performance.now() - startAll) / 1000).toFixed(2);

// If there are failures, print the detailed logs at the bottom
if (failureDetails.length > 0) {
  globalThis.console.log(`\n\n${BOLD}${RED}Failures Summary:${RESET}`);
  for (const detail of failureDetails) {
    globalThis.console.log(`\n${RED}------------------------------------------------------------${RESET}`);
    globalThis.console.log(
      `${BOLD}${RED}✗ ${detail.file}${RESET} ${GRAY}(${detail.duration}, exit code ${detail.exitCode})${RESET}`
    );
    globalThis.console.log(`${RED}------------------------------------------------------------${RESET}`);
    if (detail.stdout.trim()) {
      globalThis.console.log(`${BOLD}STDOUT:${RESET}\n${detail.stdout.trim()}`);
    }
    if (detail.stderr.trim()) {
      globalThis.console.log(`${BOLD}STDERR:${RESET}\n${detail.stderr.trim()}`);
    }
  }
  globalThis.console.log(`${RED}------------------------------------------------------------${RESET}\n`);
}

// Print final summary stats in a style similar to Bun test
globalThis.console.log(`\n${RESET}`);
if (totalPasses > 0) {
  globalThis.console.log(` ${GREEN}${totalPasses} pass${RESET}`);
}
if (totalFails > 0) {
  globalThis.console.log(` ${RED}${totalFails} fail${RESET}`);
}
if (totalExpects > 0) {
  globalThis.console.log(` ${totalExpects} expect() calls${RESET}`);
}

const fileWord = totalFiles === 1 ? "file" : "files";
const testWord = totalTestsRun === 1 ? "test" : "tests";
globalThis.console.log(`Ran ${totalTestsRun} ${testWord} across ${totalFiles} ${fileWord}. [${totalDurationSec}s]`);

if (filesFailedCount > 0) {
  process.exit(1);
} else {
  globalThis.console.log(`\n${GREEN}${BOLD}All tests passed!${RESET}`);
  process.exit(0);
}
