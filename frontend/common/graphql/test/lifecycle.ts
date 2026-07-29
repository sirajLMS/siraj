import { afterAll, beforeAll } from "bun:test";
import { ensureDemoUsersForTests } from "@/frontend/common/graphql/test/helpers";
import {
  anyPeerHeartbeatsAlive,
  registerWorkerHeartbeat,
  releaseHeartbeatSync,
} from "@/frontend/common/graphql/test/shared-workers";
import { getTestPort, getTestServerMode } from "@/frontend/common/graphql/test/testPort";
import { isTestServerRunning, startTestServer, stopTestServer } from "@/frontend/common/graphql/test/testServer";
import { testLogger } from "@/shared/lib/logger/testlogger";

let startedSuitesCount = 0;
let stopTimeout: Timer | null = null;
let serverStartPromise: Promise<void> | null = null;

const STOP_POLL_INTERVAL_MS = 500;
const MAX_STOP_POLL_ROUNDS = 60;

/**
 * Setup the shared Next.js test server for this describe block.
 *
 * - First worker to call this spawns the server on a shared port.
 * - Peer workers (parallel `bun test` workers) detect the running server and
 *   reuse it, registering a heartbeat so the owner does not kill the server
 *   while peers are still running tests.
 * - On suite completion (`afterAll`), each worker releases its heartbeat. The
 *   owner polls {@link anyPeerHeartbeatsAlive} before tearing the server down,
 *   so peers with in-flight tests are never cut off.
 */
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
    await registerWorkerHeartbeat();
    await ensureDemoUsersForTests();
    testLogger.info(`GraphQL test server ready on port ${getTestPort()} (${getTestServerMode()} mode)`);
  });

  afterAll(() => {
    startedSuitesCount--;
    if (startedSuitesCount === 0) {
      testLogger.debug("All active test suites finished. Scheduling test server stop...");
      stopTimeout = setTimeout(() => {
        void stopServerWhenPeersDone();
      }, 2_000);
      if (stopTimeout && typeof stopTimeout.unref === "function") {
        stopTimeout.unref();
      }
    }
  });
}

async function stopServerWhenPeersDone(): Promise<void> {
  stopTimeout = null;
  releaseHeartbeatSync();

  const ownerPid = process.pid;
  for (let round = 0; round < MAX_STOP_POLL_ROUNDS; round++) {
    const peersAlive = await anyPeerHeartbeatsAlive(ownerPid);
    if (!peersAlive) {
      stopTestServer();
      serverStartPromise = null;
      return;
    }
    testLogger.debug(`Deferring test server stop: ${peersAlive ? "peer worker(s) still active" : "no peers"}.`);
    await new Promise(resolve => setTimeout(resolve, STOP_POLL_INTERVAL_MS));
  }

  testLogger.warn("Test server stop poll timed out; forcing stop.");
  stopTestServer();
  serverStartPromise = null;
}
