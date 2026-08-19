import { type ChildProcess, spawn as spawnChild } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { spawn as bunSpawn, type Subprocess } from "bun";
import { killListenersOnPort } from "@/frontend/common/graphql/test/testPort";

const DEFAULT_PORT = 3099;
const DEFAULT_TEST_PATH = "frontend/common/graphql/test/";
const SERVER_READY_TIMEOUT_MS = 180_000;
const TUI_REFRESH_INTERVAL_MS = 250;

interface CliOptions {
  port: number;
  bail: boolean;
  testPaths: string[];
  help: boolean;
}

interface TestState {
  startTime: number;
  currentFile: string;
  currentTest: string;
  passedTests: number;
  failedTests: number;
  filesCompleted: number;
  lastServerAction: string;
  failureReason: string;
  failingFile: string;
  failingTest: string;
}

function parseCliArgs(args: string[]): CliOptions {
  let port = DEFAULT_PORT;
  let bail = true;
  const testPaths: string[] = [];
  let help = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      help = true;
    } else if (arg === "--port" && i + 1 < args.length) {
      port = Number(args[++i]) || DEFAULT_PORT;
    } else if (arg === "--no-bail") {
      bail = false;
    } else if (arg.startsWith("--port=")) {
      port = Number(arg.split("=")[1]) || DEFAULT_PORT;
    } else if (!arg.startsWith("-")) {
      testPaths.push(arg);
    }
  }

  if (testPaths.length === 0) {
    testPaths.push(DEFAULT_TEST_PATH);
  }

  return { port, bail, testPaths, help };
}

function printHelp(): void {
  process.stdout.write(`
run-graphql-tests.ts - Clean, minimal TUI GraphQL Integration Test Runner

USAGE:
  bun run scripts/run-graphql-tests.ts [options] [test-files...]

OPTIONS:
  --port <number>     Port for the dedicated test server (default: ${DEFAULT_PORT})
  --no-bail           Do not stop immediately on first test failure (default: bails on error)
  -h, --help          Show this help message

EXAMPLES:
  # Run all GraphQL tests with clean in-place TUI:
  bun run scripts/run-graphql-tests.ts

  # Run a specific test file:
  bun run scripts/run-graphql-tests.ts frontend/common/graphql/test/auth/impersonation.test.ts
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

function renderTuiFrame(state: TestState, port: number, isTty: boolean): void {
  if (!isTty) return;

  const elapsed = ((performance.now() - state.startTime) / 1000).toFixed(1);
  const width = Math.min(80, process.stdout.columns || 80);
  const rule = "─".repeat(width);

  const file = state.currentFile.length > 55 ? `...${state.currentFile.slice(-52)}` : state.currentFile;
  const test = state.currentTest.length > 55 ? `${state.currentTest.slice(0, 52)}...` : state.currentTest;
  const action =
    state.lastServerAction.length > 55 ? `${state.lastServerAction.slice(0, 52)}...` : state.lastServerAction;

  let out = "\x1b[H\x1b[0J";
  out += `\x1b[36m\x1b[1m⚡ Siraj GraphQL Test Runner\x1b[0m \x1b[90m[Port ${port}]\x1b[0m \x1b[33m${elapsed}s elapsed\x1b[0m\n`;
  out += `\x1b[90m${rule}\x1b[0m\n`;
  out += `  \x1b[1m📁 File:\x1b[0m   \x1b[34m${file || "Starting..."}\x1b[0m\n`;
  out += `  \x1b[1m▶ Test:\x1b[0m   \x1b[37m${test || "Initializing..."}\x1b[0m\n`;
  out += `  \x1b[1m📊 Status:\x1b[0m \x1b[32m${state.passedTests} passed\x1b[0m • \x1b[31m${state.failedTests} failed\x1b[0m \x1b[90m(${state.filesCompleted} files done)\x1b[0m\n`;
  out += `  \x1b[1m📡 Server:\x1b[0m \x1b[90m${action || "Idle"}\x1b[0m\n`;
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

  let out = isTty ? "\x1b[H\x1b[0J\n" : "\n";
  out += `${rule}\n`;
  if (success) {
    out += `\x1b[32m\x1b[1m✅ ALL GRAPHQL INTEGRATION TESTS PASSED\x1b[0m\n`;
    out += `${thinRule}\n`;
    out += `  • \x1b[1mTests Run:\x1b[0m     \x1b[32m${state.passedTests} passed\x1b[0m (0 failed)\n`;
    out += `  • \x1b[1mFiles Run:\x1b[0m     ${state.filesCompleted} files completed\n`;
    out += `  • \x1b[1mTotal Time:\x1b[0m    \x1b[33m${elapsed}s\x1b[0m (from runner start to teardown)\n`;
    out += `${rule}\n`;
    return out;
  }

  out += `\x1b[31m\x1b[1m❌ GRAPHQL TEST FAILURE DETECTED\x1b[0m\n`;
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
  out += `  • \x1b[1mTests Run:\x1b[0m     \x1b[32m${state.passedTests} passed\x1b[0m, \x1b[31m${Math.max(1, state.failedTests)} failed\x1b[0m\n`;
  out += `  • \x1b[1mFiles Run:\x1b[0m     ${state.filesCompleted} files completed\n`;
  out += `  • \x1b[1mTotal Time:\x1b[0m    \x1b[33m${elapsed}s\x1b[0m (from runner start to teardown)\n`;
  out += `  • \x1b[1mServer Log:\x1b[0m    \x1b[90m${logPath}\x1b[0m\n`;
  out += `${rule}\n`;

  return out;
}

function processTestOutputLine(line: string, state: TestState, onFail: (reason: string) => void): void {
  const esc = String.fromCharCode(27);
  const clean = line.replaceAll(new RegExp(`${esc}\\[\\d*(?:;\\d*)*[a-zA-Z]`, "g"), "").trim();
  if (clean.endsWith(".test.ts:") || clean.endsWith(".test.ts")) {
    state.currentFile = clean.replace(/:$/, "");
    state.filesCompleted++;
  } else if (clean.startsWith("✓ ")) {
    state.passedTests++;
    state.currentTest = clean.slice(2).trim();
  } else if (clean.startsWith("✗ ") || clean.startsWith("fail:")) {
    state.failedTests++;
    state.failingFile = state.currentFile;
    state.failingTest = clean.replace(/^[✗\s]*fail:\s*/, "");
    onFail(clean);
  } else if (/^\d+\s+pass/i.test(clean)) {
    const m = clean.match(/^(\d+)\s+pass/i);
    if (m) state.passedTests = Math.max(state.passedTests, Number(m[1]));
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
  const { port, bail, testPaths, help } = parseCliArgs(process.argv.slice(2));

  if (help) {
    printHelp();
    process.exit(0);
  }

  const isTty = Boolean(process.stdout.isTTY);
  const state: TestState = {
    startTime: performance.now(),
    currentFile: "",
    currentTest: "",
    passedTests: 0,
    failedTests: 0,
    filesCompleted: 0,
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
    const testArgs = [bunBin, "--env-file=.env.test", "test", "--parallel=1", "--timeout=120000"];
    if (bail) testArgs.push("--bail");
    testArgs.push(...testPaths);

    const testProc = bunSpawn(testArgs, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        SIRAJ_TEST_RUNNER_OK: "1",
        GRAPHQL_TEST_PORT: String(port),
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
  process.stderr.write(`[run-graphql-tests] Fatal error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
