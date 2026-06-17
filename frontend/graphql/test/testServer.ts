import { afterAll, beforeAll } from "bun:test";
import { spawn } from "bun";
import { testLogger } from "@/shared/lib/testlogger";
import { TEST_GRAPHQL_URL, TEST_PORT } from "./testClient";

let serverProcess: ReturnType<typeof spawn> | undefined;

export function setupTestServer() {
  beforeAll(async () => {
    testLogger.info("Starting Next.js dev server for GraphQL integration tests...");
    serverProcess = spawn(["bunx", "next", "dev", "-p", TEST_PORT.toString()], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const start = Date.now();
    const timeout = 30000; // 30s max
    let isReady = false;

    while (Date.now() - start < timeout) {
      try {
        const res = await fetch(TEST_GRAPHQL_URL, { method: "HEAD" });
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
      if (serverProcess) serverProcess.kill();
      throw new Error("Next.js dev server failed to start within 30 seconds");
    }
    testLogger.info(`Next.js dev server is ready on port ${TEST_PORT}!`);
  }, 35000);

  afterAll(() => {
    if (serverProcess) {
      testLogger.info("Stopping Next.js dev server...");
      serverProcess.kill();
    }
  });
}
