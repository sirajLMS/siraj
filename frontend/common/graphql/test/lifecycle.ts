import { afterAll, beforeAll } from "bun:test";
import { getTestPort, getTestServerMode } from "@/frontend/common/graphql/test/testPort";
import { isTestServerRunning, startTestServer, stopTestServer } from "@/frontend/common/graphql/test/testServer";
import { testLogger } from "@/shared/lib/logger/testlogger";

let startedSuitesCount = 0;
let stopTimeout: Timer | null = null;
let serverStartPromise: Promise<void> | null = null;

export function setupTestServerLifecycle() {
  beforeAll(async () => {
    startedSuitesCount++;
    if (stopTimeout) {
      testLogger.debug("Cancelling pending test server stop timeout.");
      clearTimeout(stopTimeout);
      stopTimeout = null;
    }
    if (!serverStartPromise || !(await isTestServerRunning())) {
      serverStartPromise = startTestServer();
    }
    await serverStartPromise;
    testLogger.info(`GraphQL test server ready on port ${getTestPort()} (${getTestServerMode()} mode)`);
  });

  afterAll(() => {
    startedSuitesCount--;
    if (startedSuitesCount === 0) {
      testLogger.debug("All active test suites finished. Scheduling test server stop...");
      stopTimeout = setTimeout(() => {
        stopTestServer();
        serverStartPromise = null;
        stopTimeout = null;
      }, 2000);
      if (stopTimeout && typeof stopTimeout.unref === "function") {
        stopTimeout.unref();
      }
    }
  });
}
