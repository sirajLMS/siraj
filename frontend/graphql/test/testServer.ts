import { spawn } from "bun";
import { testLogger } from "@/shared/lib/testlogger";

let serverProcess: ReturnType<typeof spawn> | undefined;

export async function startTestServer() {
  if (serverProcess) {
    testLogger.warn("Next.js dev server is already running.");
    return;
  }
  testLogger.info("Starting Next.js dev server for GraphQL integration tests...");
  serverProcess = spawn(["bun", "run", "next", "dev", "-p", "3001"], {
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      NEXT_DIST_DIR: ".next-test",
    },
  });

  const start = Date.now();
  const timeout = 60000; // 60s max
  let isReady = false;

  while (Date.now() - start < timeout) {
    try {
      const res = await fetch("http://localhost:3001/api/graphql", { method: "HEAD" });
      if (res.status === 204) {
        isReady = true;
        break;
      }
    } catch {
      // Polling will fail until the server starts listening.
      // We pass the error to debug log to satisfy eslint's no-ignored-exceptions.
      testLogger.debug("Dev server not ready yet");
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (!isReady) {
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = undefined;
    }
    throw new Error("Next.js dev server failed to start within 30 seconds");
  }
  testLogger.info("Next.js dev server is ready on port 3001!");
}

export function stopTestServer() {
  if (serverProcess) {
    testLogger.info("Stopping Next.js dev server...");
    serverProcess.kill();
    serverProcess = undefined;
  }
}
