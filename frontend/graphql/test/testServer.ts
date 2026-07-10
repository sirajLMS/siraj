import { appendFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn, spawnSync } from "bun";
import { testLogger } from "@/shared/lib/logger/testlogger";
import {
  allocateTestPort,
  clearTestPort,
  getTestDistDir,
  getTestGraphqlUrl,
  getTestPort,
  getTestServerLogPath,
  releaseAllocatedTestPort,
  releaseTcpPortReservation,
  setTestPort,
} from "./testPort";

let serverProcess: ReturnType<typeof spawn> | undefined;
let serverRootPid: number | undefined;
let logFilePath: string | undefined;

async function writeNextLog(text: string) {
  if (!logFilePath) return;
  try {
    await appendFile(join(process.cwd(), logFilePath), text);
  } catch {
    // ignore
  }
}

function getChildPids(parentPid: number): number[] {
  try {
    const result = spawnSync(["pgrep", "-P", String(parentPid)], { stdout: "pipe", stderr: "ignore" });
    return result.stdout?.toString().trim().split("\n").filter(Boolean).map(Number) ?? [];
  } catch {
    return [];
  }
}

function killProcessTree(rootPid: number) {
  const visited = new Set<number>();
  const queue = [rootPid];

  while (queue.length > 0) {
    const pid = queue.shift();
    if (pid === undefined || visited.has(pid)) continue;
    visited.add(pid);

    for (const childPid of getChildPids(pid)) {
      queue.push(childPid);
    }

    try {
      process.kill(pid, "SIGKILL");
    } catch {
      // Process may already be dead
    }
  }
}

function pipeStreamLogs(proc: ReturnType<typeof spawn>) {
  if (proc.stderr && typeof proc.stderr === "object" && "getReader" in proc.stderr) {
    const stderrStream = proc.stderr as ReadableStream<Uint8Array>;
    (async () => {
      try {
        const reader = stderrStream.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writeNextLog(`[ERROR] ${decoder.decode(value)}`);
        }
      } catch (err) {
        testLogger.error("Error reading next dev server stderr:", err);
      }
    })();
  }

  if (proc.stdout && typeof proc.stdout === "object" && "getReader" in proc.stdout) {
    const stdoutStream = proc.stdout as ReadableStream<Uint8Array>;
    (async () => {
      try {
        const reader = stdoutStream.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writeNextLog(`[DEBUG] ${decoder.decode(value)}`);
        }
      } catch (err) {
        testLogger.error("Error reading next dev server stdout:", err);
      }
    })();
  }
}

async function waitForServerReady(timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  const url = getTestGraphqlUrl();
  const fetchFn = typeof Bun === "undefined" ? fetch : Bun.fetch;
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetchFn(url, { method: "HEAD" });
      if (res.status === 204) {
        return true;
      }
    } catch {
      testLogger.debug("Dev server not ready yet");
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return false;
}

async function spawnServerOnPort(port: number): Promise<ReturnType<typeof spawn>> {
  logFilePath = getTestServerLogPath(port);

  try {
    await writeFile(join(process.cwd(), logFilePath), "");
  } catch {
    // ignore
  }

  await releaseTcpPortReservation();

  const proc = spawn(["bun", "run", "next", "dev", "-p", String(port)], {
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      NEXT_DIST_DIR: getTestDistDir(port),
      IS_DEMO: "true",
    },
  });

  pipeStreamLogs(proc);
  return proc;
}

async function startServerWithRetry(): Promise<void> {
  const triedPorts: number[] = [];
  let lastError: Error | undefined;

  while (triedPorts.length < 2) {
    const port = await allocateTestPort(triedPorts);
    triedPorts.push(port);
    setTestPort(port);
    testLogger.info(`Starting Next.js dev server for GraphQL integration tests on port ${port}...`);

    const proc = await spawnServerOnPort(port);
    serverProcess = proc;
    serverRootPid = proc.pid;

    const isReady = await waitForServerReady(180000);
    if (isReady) {
      testLogger.info(`Next.js dev server is ready on port ${port}!`);
      return;
    }

    testLogger.warn(`Next.js dev server failed to become ready on port ${port}.`);
    if (serverRootPid !== undefined) {
      killProcessTree(serverRootPid);
    }
    serverProcess = undefined;
    serverRootPid = undefined;
    logFilePath = undefined;
    clearTestPort();
    await releaseAllocatedTestPort();
    lastError = new Error(
      `Next.js dev server failed to start within 180 seconds on port ${port}. See ${getTestServerLogPath(port)} for details.`
    );

    if (process.env.GRAPHQL_TEST_PORT) {
      break;
    }
  }

  throw lastError ?? new Error("Next.js dev server failed to start.");
}

export async function startTestServer() {
  if (serverProcess) {
    testLogger.warn("Next.js dev server is already running.");
    return;
  }

  await startServerWithRetry();
}

export function stopTestServer() {
  if (!serverProcess && serverRootPid === undefined) {
    return;
  }

  const port = allocatedPortForShutdown();
  testLogger.info(`Stopping Next.js dev server on port ${port ?? "unknown"}...`);

  if (serverRootPid !== undefined) {
    killProcessTree(serverRootPid);
  } else if (serverProcess) {
    try {
      serverProcess.kill();
    } catch {
      // Process may already be dead
    }
  }

  serverProcess = undefined;
  serverRootPid = undefined;
  logFilePath = undefined;
  clearTestPort();
  void releaseAllocatedTestPort();
}

function allocatedPortForShutdown(): number | undefined {
  try {
    return getTestPort();
  } catch {
    return undefined;
  }
}

// Ensure the Next.js dev server process is killed when the main test runner process exits
process.on("exit", () => {
  stopTestServer();
});
process.on("SIGINT", () => {
  stopTestServer();
  process.exit(0);
});
process.on("SIGTERM", () => {
  stopTestServer();
  process.exit(0);
});
