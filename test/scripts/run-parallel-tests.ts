/**
 * Shared parallel test runner for all test suites.
 */
import { availableParallelism } from "node:os";
import { Glob } from "bun";
import { isTestCi } from "@/backend/lib/test-ci-env";
import { withProcessLock } from "@/scripts/lib/process-lock";
import { TEST_ENV_FILE } from "@/scripts/lib/test-build-env";
import { getErrorMessage } from "@/shared/utils/error";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const GRAY = "\x1b[90m";

const DEFAULT_TIMEOUT_MS = 60_000;

export interface RunParallelTestsConfig {
  pattern: string;
  cwd: string;
  maxWorkers: number;
  label: string;
  timeoutMs?: number;
}

export interface TestRunResult {
  passed: number;
  failed: number;
  duration: number;
  errors: Error[];
}

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

interface RunAccumulators {
  totalPasses: number;
  totalFails: number;
  totalExpects: number;
  totalTestsRun: number;
  filesFailedCount: number;
  failureDetails: FailureDetail[];
}

async function runSingleTestFile(file: string, timeoutMs: number, acc: RunAccumulators): Promise<void> {
  const start = performance.now();

  try {
    const workerEnv: Record<string, string | undefined> = {
      ...process.env,
      FORCE_COLOR: "1",
      NODE_ENV: "test",
      SIRAJ_TEST_RUNNER_OK: "1",
    };

    if (!isTestCi()) {
      workerEnv.DATABASE_URL = undefined;
    }

    const proc = Bun.spawn(["bun", `--env-file=${TEST_ENV_FILE}`, "test", file, `--timeout=${timeoutMs}`], {
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

    const combinedOutput = stdoutText + "\n" + stderrText;
    const stats = parseTestOutput(combinedOutput, file);
    for (const line of stats.parsedLines) {
      globalThis.console.log(line);
    }

    acc.totalPasses += stats.passes;
    acc.totalFails += stats.fails;
    acc.totalExpects += stats.expects;
    acc.totalTestsRun += stats.tests;

    if (exitCode !== 0) {
      acc.filesFailedCount++;
      acc.failureDetails.push({ file, duration: durationStr, exitCode, stdout: stdoutText, stderr: stderrText });
    }
  } catch (err: unknown) {
    const durationMs = (performance.now() - start).toFixed(0);
    globalThis.console.log(`\n${BOLD}${RED}✗ ${file}${RESET} ${GRAY}(${durationMs}ms) - Process crashed${RESET}`);
    acc.filesFailedCount++;
    acc.failureDetails.push({
      file,
      duration: `${durationMs}ms`,
      exitCode: -1,
      stdout: "",
      stderr: getErrorMessage(err),
    });
  }
}

async function processQueue(queue: string[], timeoutMs: number, acc: RunAccumulators): Promise<void> {
  const file = queue.shift();
  if (!file) return;
  await runSingleTestFile(file, timeoutMs, acc);
  return processQueue(queue, timeoutMs, acc);
}

function printFailureSummary(details: FailureDetail[]): void {
  globalThis.console.log(`\n\n${BOLD}${RED}Failures Summary:${RESET}`);
  for (const detail of details) {
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

function printFinalSummary(
  totalPasses: number,
  totalFails: number,
  totalExpects: number,
  totalTestsRun: number,
  totalFiles: number,
  totalDurationSec: string
): void {
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
}

export async function runParallelTests(config: RunParallelTestsConfig): Promise<TestRunResult> {
  const { pattern, cwd, maxWorkers, label, timeoutMs = DEFAULT_TIMEOUT_MS } = config;

  return withProcessLock(`test-suite: ${label}`, async () => {
    const glob = new Glob(pattern);
    const testFiles: string[] = [];

    for await (const file of glob.scan({ cwd })) {
      testFiles.push(`${cwd}/${file}`);
    }

    const totalFiles = testFiles.length;
    const parallelism = availableParallelism();
    const effectiveWorkers = Math.min(parallelism, totalFiles, maxWorkers);

    globalThis.console.log(`${BOLD}Bun Parallel Test Runner${RESET}`);
    globalThis.console.log(
      `${GRAY}Running ${totalFiles} ${label} test files across ${effectiveWorkers} parallel processes (capped from ${parallelism} for ${label} safety)...${RESET}\n`
    );

    const startAll = performance.now();
    const acc: RunAccumulators = {
      totalPasses: 0,
      totalFails: 0,
      totalExpects: 0,
      totalTestsRun: 0,
      filesFailedCount: 0,
      failureDetails: [],
    };

    const queue = [...testFiles];
    const workers: Promise<void>[] = [];
    const limit = Math.min(parallelism, totalFiles, maxWorkers);
    for (let i = 0; i < limit; i++) {
      workers.push(processQueue(queue, timeoutMs, acc));
    }

    await Promise.all(workers);

    const totalDurationSec = ((performance.now() - startAll) / 1000).toFixed(2);

    if (acc.failureDetails.length > 0) {
      printFailureSummary(acc.failureDetails);
    }

    printFinalSummary(
      acc.totalPasses,
      acc.totalFails,
      acc.totalExpects,
      acc.totalTestsRun,
      totalFiles,
      totalDurationSec
    );

    if (acc.filesFailedCount > 0) {
      process.exit(1);
    } else {
      globalThis.console.log(`\n${GREEN}${BOLD}All tests passed!${RESET}`);
      process.exit(0);
    }
  });
}
