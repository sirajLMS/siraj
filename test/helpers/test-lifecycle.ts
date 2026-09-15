import { beforeAll } from "bun:test";
import { testLogger } from "@/shared/lib/logger/testlogger";
import { ensureDemoUsersForTests } from "@/test/helpers/graphql-test-helpers";
import { getTestPort, getTestServerMode } from "@/test/helpers/test-port";
import { isTestServerRunning, startTestServer } from "@/test/helpers/test-server";

let serverStartPromise: Promise<void> | null = null;

/**
 * Setup the shared Next.js test server for this describe block.
 *
 * - In dev mode: a dedicated test dev server is spawned on port 3099 using .next-test-dev.
 * - In production mode: a `next start` server is spawned on port 3099 using .next-test-prod.
 * - Sequential tests reuse the already-running server instantly.
 * - The server persists across test files during multi-test runs (e.g. test:graphql)
 *   to preserve route compilation state.
 */
export function setupTestServerLifecycle() {
  beforeAll(async () => {
    if (!serverStartPromise || !(await isTestServerRunning())) {
      serverStartPromise = startTestServer();
    }
    await serverStartPromise;
    await ensureDemoUsersForTests();
    testLogger.info(`GraphQL test server ready on port ${getTestPort()} (${getTestServerMode()} mode)`);
  }, 400_000);
}
