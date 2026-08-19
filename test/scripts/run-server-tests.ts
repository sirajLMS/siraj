import { type ChildProcess, spawn as spawnChild } from "node:child_process";
import { createWriteStream, existsSync, statSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { spawn as bunSpawn, Glob, type Subprocess } from "bun";
import { killListenersOnPort } from "@/test/helpers";

const DEFAULT_PORT = 3099;
const DEFAULT_TEST_PATH = "frontend/common/graphql/test/";
const SERVER_READY_TIMEOUT_MS = 180_000;
const TUI_REFRESH_INTERVAL_MS = 250;

interface CliOptions {
  port: number;
  bail: boolean;
  coverage: boolean;
  e2e: boolean;
  testPaths: string[];
  help: boolean;
}

interface TestState {
  startTime: number;
  currentFile: string;
  currentTest: string;
  passedTests: number;
  failedTests: number;
  totalExpects: number;
  totalFilesScheduled: number;
  filesPassed: Set<string>;
  filesFailed: Set<string>;
  completedFiles: Set<string>;
  lastServerAction: string;
  failureReason: string;
  failingFile: string;
  failingTest: string;
}

async function discoverTestFiles(testPaths: string[]): Promise<string[]> {
  const files: string[] = [];
  for (const p of testPaths) {
    if (!existsSync(p)) continue;
    const st = statSync(p);
    if (st.isDirectory()) {
      const glob = new Glob("**/*.test.{ts,tsx}");
      for await (const file of glob.scan({ cwd: p })) {
        files.push(join(p, file));
      }
    } else if (p.endsWith(".test.ts") || p.endsWith(".test.tsx")) {
      files.push(p);
    }
  }
  return files;
}

function parseCliArgs(args: string[]): CliOptions {
  let port = DEFAULT_PORT;
  let bail = true;
  let coverage = false;
  let e2e = false;
  const testPaths: string[] = [];
  let help = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (
      arg === "test" ||
      arg === "run" ||
      arg.endsWith("run-server-tests.ts") ||
      arg.endsWith("run-graphql-tests.ts")
    ) {
      continue;
    }
    if (arg === "-h" || arg === "--help") {
      help = true;
    } else if (arg === "--port" && i + 1 < args.length) {
      port = Number(args[++i]) || DEFAULT_PORT;
    } else if (arg === "--no-bail") {
      bail = false;
    } else if (arg === "--coverage" || arg === "-c") {
      coverage = true;
    } else if (arg === "--e2e") {
      e2e = true;
    } else if (arg.startsWith("--port=")) {
      port = Number(arg.split("=")[1]) || DEFAULT_PORT;
    } else if (!arg.startsWith("-")) {
      testPaths.push(arg);
    }
  }

  if (testPaths.length === 0) {
    testPaths.push(DEFAULT_TEST_PATH);
  }

  if (testPaths.some(p => p.includes("test/ui/e2e") || p.includes("test/ui/"))) {
    e2e = true;
  }

  return { port, bail, coverage, e2e, testPaths, help };
}

function printHelp(): void {
  process.stdout.write(`
run-server-tests.ts - Unified Clean TUI Runner for GraphQL Integration & E2E Tests

USAGE:
  bun run test/scripts/run-server-tests.ts [options] [test-files...]

OPTIONS:
  --port <number>     Port for the dedicated test server (default: ${DEFAULT_PORT})
  --e2e               Run E2E suite with Playwright preloads and 5-min timeout
  --coverage, -c      Run tests with coverage instrumentation
  --no-bail           Do not stop immediately on first test failure (default: bails on error)
  -h, --help          Show this help message

EXAMPLES:
  # Run all GraphQL integration tests:
  bun run test:graphql

  # Run all E2E tests:
  bun run test:ui:e2e

  # Run a specific test file:
  bun run test:graphql frontend/common/graphql/test/auth/impersonation.test.ts
\n`);
}

async function pollServerReady(url: string, deadline: number): Promise<boolean> {
  if (Date.now() >= deadline) return false;
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (res.status === 204) return true;
  } catch {
    // Server not ready yet
  }
  await new Promise(resolve => setTimeout(resolve, 500));
  return pollServerReady(url, deadline);
}

function spawnDevServer(port: number, logStream: NodeJS.WritableStream): ChildProcess {
  const bunBin = process.execPath;
  const serverEnv: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: "development",
    NEXT_DIST_DIR: ".next-dev",
    IS_DEMO: "true",
    TEST_SERVER: "1",
    PORT: String(port),
    GRAPHQL_TEST_PORT: String(port),
    TEST_SERVER_PORT: String(port),
    DISABLE_RATE_LIMITING: "true",
    EXIT_ON_ERROR: "true",
  };

  const proc = spawnChild(
    bunBin,
    ["--env-file=.env.test", "run", "next", "dev", "--turbopack", "-p", String(port), "-H", "0.0.0.0"],
    {
      cwd: process.cwd(),
      env: serverEnv,
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  proc.stdout?.pipe(logStream, { end: false });
  proc.stderr?.pipe(logStream, { end: false });

  return proc;
}

function renderProgressBar(current: number, total: number, width = 16): string {
  if (total <= 0) return "\x1b[90m[────────────────]\x1b[0m";
  const ratio = Math.min(1, Math.max(0, current / total));
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  const percent = Math.round(ratio * 100);
  const bar = "█".repeat(filled) + "░".repeat(empty);
  return `\x1b[36m[${bar}]\x1b[0m \x1b[1m${percent}%\x1b[0m \x1b[90m(${current}/${total} files)\x1b[0m`;
}

function renderTuiFrame(state: TestState, port: number, isTty: boolean): void {
  if (!isTty) return;

  const elapsed = ((performance.now() - state.startTime) / 1000).toFixed(1);
  const width = Math.min(80, process.stdout.columns || 80);
  const rule = "─".repeat(width);

  const file = state.currentFile.length > 55 ? `...${state.currentFile.slice(-52)}` : state.currentFile;
  const test = state.currentTest.length > 55 ? `${state.currentTest.slice(0, 52)}...` : state.currentTest;
  const action =
    state.lastServerAction.length > 55 ? `${state.lastServerAction.slice(0, 52)}...` : state.lastServerAction;

  const filesDone = state.completedFiles.size;
  const totalFiles = Math.max(filesDone, state.totalFilesScheduled);
  const progressBar = renderProgressBar(filesDone, totalFiles);

  let out = "\x1b[H\x1b[0J";
  out += `\x1b[36m\x1b[1m⚡ Siraj Test Runner\x1b[0m \x1b[90m[Port ${port}]\x1b[0m \x1b[33m${elapsed}s elapsed\x1b[0m\n`;
  out += `\x1b[90m${rule}\x1b[0m\n`;
  out += `  \x1b[1m📁 File:\x1b[0m    \x1b[34m${file || "Starting..."}\x1b[0m\n`;
  out += `  \x1b[1m▶ Test:\x1b[0m    \x1b[37m${test || "Initializing..."}\x1b[0m\n`;
  out += `  \x1b[1m📊 Tests:\x1b[0m   \x1b[32m${state.passedTests} passed\x1b[0m • \x1b[31m${state.failedTests} failed\x1b[0m${state.totalExpects > 0 ? ` • \x1b[90m${state.totalExpects} asserts\x1b[0m` : ""}\n`;
  out += `  \x1b[1m📦 Files:\x1b[0m   ${progressBar}\n`;
  out += `  \x1b[1m📡 Server:\x1b[0m  \x1b[90m${action || "Idle"}\x1b[0m\n`;
  out += `\x1b[90m${rule}\x1b[0m\n`;

  process.stdout.write(out);
}

function parseServerChunk(chunk: Buffer | string): string {
  const text = chunk.toString();
  const lines = text.split("\n").filter(l => l.trim());
  if (lines.length === 0) return "";
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.includes("POST /api/graphql") || line.includes("HEAD /api/graphql")) {
      return line.replace(/^.*?((?:POST|HEAD) \/api\/graphql.*)$/, "$1");
    }
    if (line.includes("Executed resolver")) {
      return line.replace(/^.*?Executed resolver (.*? in .*)$/, "$1");
    }
  }
  return lines[lines.length - 1].slice(0, 60);
}

function formatFinalReport(state: TestState, success: boolean, logPath: string, isTty: boolean): string {
  const elapsed = ((performance.now() - state.startTime) / 1000).toFixed(2);
  const width = Math.min(80, process.stdout.columns || 80);
  const rule = "═".repeat(width);
  const thinRule = "─".repeat(width);

  // Mark currently active file as passed if not failed
  if (state.currentFile && !state.filesFailed.has(state.currentFile)) {
    state.filesPassed.add(state.currentFile);
    state.completedFiles.add(state.currentFile);
  }

  const filesPassedCount = state.filesPassed.size;
  const totalFiles = Math.max(state.completedFiles.size, state.totalFilesScheduled);

  let out = isTty ? "\x1b[H\x1b[0J\n" : "\n";
  out += `${rule}\n`;
  if (success) {
    out += `\x1b[32m\x1b[1m✅ ALL TESTS PASSED\x1b[0m\n`;
    out += `${thinRule}\n`;
    out += `  • \x1b[1mTest Files:\x1b[0m    \x1b[32m${totalFiles} passed\x1b[0m / ${totalFiles} total (100%)\n`;
    out += `  • \x1b[1mTotal Tests:\x1b[0m   \x1b[32m${state.passedTests} passed\x1b[0m (0 failed)\n`;
    if (state.totalExpects > 0) {
      out += `  • \x1b[1mAssertions:\x1b[0m    ${state.totalExpects} expect() calls\n`;
    }
    out += `  • \x1b[1mTotal Time:\x1b[0m    \x1b[33m${elapsed}s\x1b[0m (from runner start to teardown)\n`;
    out += `${rule}\n`;
    return out;
  }

  out += `\x1b[31m\x1b[1m❌ TEST FAILURE DETECTED\x1b[0m\n`;
  out += `${thinRule}\n`;
  if (state.failingFile) {
    out += `  \x1b[1m📁 Failed File:\x1b[0m \x1b[34m${state.failingFile}\x1b[0m\n`;
  }
  if (state.failingTest) {
    out += `  \x1b[1m▶ Failed Test:\x1b[0m \x1b[31m${state.failingTest}\x1b[0m\n`;
  }

  out += `\n\x1b[1m🔍 ERROR DETAILS:\x1b[0m\n`;
  out += `${thinRule}\n`;
  out += `${state.failureReason || "Server reported an unhandled exception."}\n`;
  out += `${thinRule}\n`;
  out += `  • \x1b[1mTest Files:\x1b[0m    \x1b[32m${filesPassedCount} passed\x1b[0m, \x1b[31m${Math.max(1, state.filesFailed.size)} failed\x1b[0m \x1b[90m(${state.completedFiles.size} / ${totalFiles} completed)\x1b[0m\n`;
  out += `  • \x1b[1mTotal Tests:\x1b[0m   \x1b[32m${state.passedTests} passed\x1b[0m, \x1b[31m${Math.max(1, state.failedTests)} failed\x1b[0m\n`;
  if (state.totalExpects > 0) {
    out += `  • \x1b[1mAssertions:\x1b[0m    ${state.totalExpects} expect() calls\n`;
  }
  out += `  • \x1b[1mTotal Time:\x1b[0m    \x1b[33m${elapsed}s\x1b[0m (from runner start to teardown)\n`;
  out += `  • \x1b[1mServer Log:\x1b[0m    \x1b[90m${logPath}\x1b[0m\n`;
  out += `${rule}\n`;

  return out;
}

function processTestOutputLine(line: string, state: TestState, onFail: (reason: string) => void): void {
  const esc = String.fromCharCode(27);
  const clean = line.replaceAll(new RegExp(`${esc}\\[\\d*(?:;\\d*)*[a-zA-Z]`, "g"), "").trim();

  // Test file boundary detection
  if (
    clean.endsWith(".test.ts:") ||
    clean.endsWith(".test.ts") ||
    clean.endsWith(".test.tsx:") ||
    clean.endsWith(".test.tsx")
  ) {
    const nextFile = clean.replace(/:$/, "").trim();
    if (state.currentFile && state.currentFile !== nextFile) {
      if (!state.filesFailed.has(state.currentFile)) {
        state.filesPassed.add(state.currentFile);
      }
      state.completedFiles.add(state.currentFile);
    }
    state.currentFile = nextFile;
    state.completedFiles.add(nextFile);
    return;
  }

  // Pass match: ✓ or (pass)
  if (clean.startsWith("✓ ") || clean.startsWith("(pass) ")) {
    state.passedTests++;
    state.currentTest = clean
      .replace(/^(?:✓|\(pass\))\s+/, "")
      .replace(/\s*\[[\d.]+m?s\]$/, "")
      .trim();
    if (state.currentFile) {
      state.completedFiles.add(state.currentFile);
    }
    return;
  }

  // Fail match: ✗ or (fail) or FAIL
  if (clean.startsWith("✗ ") || clean.startsWith("(fail) ") || clean.startsWith("FAIL ")) {
    state.failedTests++;
    state.failingFile = state.currentFile;
    state.failingTest = clean.replace(/^(?:✗|\(fail\)|FAIL)\s+/, "").trim();
    if (state.currentFile) {
      state.filesFailed.add(state.currentFile);
      state.completedFiles.add(state.currentFile);
    }
    onFail(clean);
    return;
  }

  // Summary stats lines
  const passMatch = /^\s*(\d+)\s+pass/i.exec(clean);
  if (passMatch) {
    state.passedTests = Math.max(state.passedTests, Number.parseInt(passMatch[1], 10));
  }

  const failMatch = /^\s*(\d+)\s+fail/i.exec(clean);
  if (failMatch) {
    state.failedTests = Math.max(state.failedTests, Number.parseInt(failMatch[1], 10));
  }

  const expectMatch = /^\s*(\d+)\s+expect\(\)\s+calls/i.exec(clean);
  if (expectMatch) {
    state.totalExpects = Number.parseInt(expectMatch[1], 10);
  }

  const runMatch = /^\s*Ran\s+(\d+)\s+tests?\s+across\s+(\d+)\s+files?/i.exec(clean);
  if (runMatch) {
    state.passedTests = Math.max(state.passedTests, Number.parseInt(runMatch[1], 10));
    const finishedFileCount = Number.parseInt(runMatch[2], 10);
    if (state.filesFailed.size === 0) {
      for (let i = 0; i < finishedFileCount; i++) {
        state.filesPassed.add(`file-${i}`);
      }
    }
  }
}

function setupTestParser(testProc: Subprocess, state: TestState, onFail: (reason: string) => void) {
  const handleTestOutput = async (stream: unknown) => {
    if (!stream || typeof stream !== "object" || !("getReader" in stream)) return;
    const reader = (stream as ReadableStream<Uint8Array>).getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        processTestOutputLine(line, state, onFail);
      }
    }
  };

  void handleTestOutput(testProc.stdout);
  void handleTestOutput(testProc.stderr);
}

async function main(): Promise<void> {
  const { port, bail, coverage, e2e, testPaths, help } = parseCliArgs(process.argv.slice(2));

  if (help) {
    printHelp();
    process.exit(0);
  }

  const scheduledFiles = await discoverTestFiles(testPaths);
  const isTty = Boolean(process.stdout.isTTY);
  const state: TestState = {
    startTime: performance.now(),
    currentFile: "",
    currentTest: "",
    passedTests: 0,
    failedTests: 0,
    totalExpects: 0,
    totalFilesScheduled: scheduledFiles.length > 0 ? scheduledFiles.length : testPaths.length,
    filesPassed: new Set<string>(),
    filesFailed: new Set<string>(),
    completedFiles: new Set<string>(),
    lastServerAction: "Starting server...",
    failureReason: "",
    failingFile: "",
    failingTest: "",
  };

  const logDir = join(process.cwd(), "logs");
  await mkdir(logDir, { recursive: true });
  const logFilePath = `logs/next-dev-server-${port}.log`;
  const fullLogPath = join(process.cwd(), logFilePath);

  killListenersOnPort(port);
  const logStream = createWriteStream(fullLogPath, { flags: "w" });
  const serverProc = spawnDevServer(port, logStream);

  if (isTty) {
    process.stdout.write("\x1b[?25l"); // Hide cursor
  }

  let isCleanedUp = false;
  let activeTestProc: Subprocess | undefined;

  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    if (isTty) {
      process.stdout.write("\x1b[?25h"); // Restore cursor
    }
    try {
      serverProc.kill("SIGKILL");
    } catch {
      // ignore
    }
    logStream.end();
    killListenersOnPort(port);
  };

  process.on("SIGINT", () => {
    cleanup();
    process.exit(1);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(1);
  });

  let errorCaptured = false;
  const handleAbort = (reason: string) => {
    if (errorCaptured) return;
    errorCaptured = true;
    state.failureReason = reason;
    state.failingFile = state.failingFile || state.currentFile;
    state.failingTest = state.failingTest || state.currentTest;
    if (state.failingFile) {
      state.filesFailed.add(state.failingFile);
    }
    try {
      activeTestProc?.kill();
    } catch {
      // ignore
    }
  };

  serverProc.stdout?.on("data", (chunk: Buffer) => {
    const action = parseServerChunk(chunk);
    if (action) {
      state.lastServerAction = action;
    }
  });

  let serverErrBuffer = "";
  serverProc.stderr?.on("data", (chunk: Buffer) => {
    const text = chunk.toString();
    serverErrBuffer += text;
    if (text.includes("[ERROR]") || text.includes("DrizzleQueryError")) {
      handleAbort(serverErrBuffer.trim());
    }
  });

  serverProc.on("exit", (code, signal) => {
    if (!isCleanedUp && !errorCaptured) {
      handleAbort(`Dev server exited unexpectedly (code: ${code}, signal: ${signal})\n${serverErrBuffer}`);
    }
  });

  const ticker = setInterval(() => renderTuiFrame(state, port, isTty), TUI_REFRESH_INTERVAL_MS);

  try {
    state.lastServerAction = "Waiting for server to become ready...";
    renderTuiFrame(state, port, isTty);

    const isReady = await pollServerReady(`http://localhost:${port}/api/graphql`, Date.now() + SERVER_READY_TIMEOUT_MS);

    if (!isReady) {
      clearInterval(ticker);
      cleanup();
      process.stderr.write(
        `\n❌ Dev server failed to respond within ${SERVER_READY_TIMEOUT_MS / 1000}s on port ${port}.\n`
      );
      process.exit(1);
    }

    state.lastServerAction = "Server ready. Executing tests...";

    const bunBin = process.execPath;
    const timeout = e2e ? "300000" : "120000";
    const testArgs = [bunBin, "--env-file=.env.test", "test", "--parallel=1", `--timeout=${timeout}`];

    if (e2e) {
      testArgs.push("--preload", "./test/ui/test-env.ts");
    }
    if (coverage) {
      testArgs.push("--coverage");
    }
    if (bail) {
      testArgs.push("--bail=1");
    }
    testArgs.push(...testPaths);

    const testProc = bunSpawn(testArgs, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        SIRAJ_TEST_RUNNER_OK: "1",
        GRAPHQL_TEST_PORT: String(port),
        TEST_SERVER_PORT: String(port),
        TEST_SERVER_MODE: "dev",
        TEST_E2E_WARMUP: e2e ? "1" : "0",
        NEXT_DIST_DIR: ".next-dev",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    activeTestProc = testProc;

    setupTestParser(testProc, state, reason => handleAbort(reason));

    const exitCode = await testProc.exited;
    clearInterval(ticker);
    cleanup();

    const isSuccess = exitCode === 0 && !errorCaptured;
    const report = formatFinalReport(state, isSuccess, logFilePath, isTty);
    process.stdout.write(report);
    process.exit(isSuccess ? 0 : 1);
  } catch (err) {
    clearInterval(ticker);
    cleanup();
    state.failureReason = err instanceof Error ? err.message : String(err);
    process.stdout.write(formatFinalReport(state, false, logFilePath, isTty));
    process.exit(1);
  }
}

main().catch(err => {
  process.stderr.write(`[run-server-tests] Fatal error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
