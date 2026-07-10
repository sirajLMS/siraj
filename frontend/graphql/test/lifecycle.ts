import { afterAll, beforeAll } from "bun:test";
import { testLogger } from "@/shared/lib/logger/testlogger";
import { getTestPort } from "./testPort";
import { startTestServer, stopTestServer } from "./testServer";

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
    serverStartPromise ??= startTestServer();
    await serverStartPromise;
    testLogger.info(`GraphQL test server ready on port ${getTestPort()}`);
  }, 240000);

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
