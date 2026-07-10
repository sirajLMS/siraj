import { appendFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn, spawnSync } from "bun";
import { testLogger } from "@/shared/lib/logger/testlogger";

let serverProcess: ReturnType<typeof spawn> | undefined;

async function writeNextLog(text: string) {
  try {
    await appendFile(join(process.cwd(), "logs", "next-dev-server.log"), text);
  } catch {
    // ignore
  }
}

function killPort(port: number) {
  try {
    if (process.platform === "win32") {
      testLogger.info(`Killing any process on port ${port} (Windows)...`);
      spawnSync([
        String.raw`C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`,
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        "scripts/ps1/kill_port.ps1",
        String(port),
      ]);
    } else {
      testLogger.info(`Killing any process on port ${port} (Unix)...`);
      try {
        const lsof = spawnSync(["lsof", "-ti", `:${port}`], { stdout: "pipe", stderr: "ignore" });
        const pids = lsof.stdout?.toString().trim().split("\n").filter(Boolean) ?? [];
        for (const pid of pids) {
          try {
            process.kill(Number(pid), "SIGKILL");
          } catch {
            /* dead */
          }
        }
      } catch {
        /* lsof unavailable */
      }
      // Try fuser first (works without sudo), fall back to pgrep+kill
      try {
        spawnSync(["fuser", "-k", "-9", `${port}/tcp`], { stdout: "ignore", stderr: "ignore" });
      } catch {
        try {
          const result = spawnSync(["pgrep", "-f", `next dev -p ${port}|next-server`], { stdout: "pipe", stderr: "ignore" });
          const pids = result.stdout?.toString().trim().split("\n").filter(Boolean) || [];
          for (const pid of pids) {
            try {
              process.kill(Number(pid), "SIGKILL");
            } catch {
              /* dead */
            }
          }
        } catch {
          spawnSync(["bash", "scripts/kill_port.sh", String(port)]);
        }
      }
    }
  } catch (error) {
    testLogger.error("Failed to execute port-killing script:", error);
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

async function waitForServerReady(port: number, timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  const url = `http://localhost:${port}/api/graphql`;
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

export async function startTestServer() {
  if (serverProcess) {
    testLogger.warn("Next.js dev server is already running.");
    return;
  }
  testLogger.info("Starting Next.js dev server for GraphQL integration tests...");

  // Initialize/clear the log file
  try {
    await writeFile(join(process.cwd(), "logs", "next-dev-server.log"), "");
  } catch {
    // ignore
  }

  killPort(3001);

  serverProcess = spawn(["bun", "run", "next", "dev", "-p", "3001"], {
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      NEXT_DIST_DIR: ".next-test",
      IS_DEMO: "true",
    },
  });

  pipeStreamLogs(serverProcess);

  const isReady = await waitForServerReady(3001, 120000);

  if (!isReady) {
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = undefined;
    }
    throw new Error("Next.js dev server failed to start within 120 seconds. See logs/next-dev-server.log for details.");
  }
  testLogger.info("Next.js dev server is ready on port 3001!");
}

export function stopTestServer() {
  if (serverProcess) {
    testLogger.info("Stopping Next.js dev server...");
    try {
      serverProcess.kill();
    } catch {
      // Process may already be dead
    }
    serverProcess = undefined;
    // The next-server child process survives parent kill — clean it up
    setTimeout(() => {
      try {
        const result = spawnSync(["pgrep", "-f", "next-server.*3001"], { stdout: "pipe", stderr: "ignore" });
        const pids = result.stdout?.toString().trim().split("\n").filter(Boolean) || [];
        for (const pid of pids) {
          try {
            process.kill(Number(pid), "SIGKILL");
          } catch {
            // Already dead
          }
        }
      } catch {
        // Best effort
      }
      killPort(3001);
    }, 500);
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
