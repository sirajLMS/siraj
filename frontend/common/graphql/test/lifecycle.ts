import { beforeAll } from "bun:test";
import { ensureDemoUsersForTests } from "@/frontend/common/graphql/test/helpers";
import { getTestPort, getTestServerMode } from "@/frontend/common/graphql/test/testPort";
import { isTestServerRunning, startTestServer } from "@/frontend/common/graphql/test/testServer";
import { testLogger } from "@/shared/lib/logger/testlogger";

let serverStartPromise: Promise<void> | null = null;

/**
 * Setup the shared Next.js test server for this describe block.
 *
 * - In dev mode: if a dev server is already running on port 3000, it is reused
 *   (no separate test server is spawned). This avoids the Next.js 16 dist-dir
 *   conflict that prevents a second dev server from starting.
 * - In dev mode with no dev server running: a separate test dev server is
 *   spawned on port 3066 using .next-dev.
 * - In production mode: a `next start` server is spawned on port 3066 using
 *   .next-test-prod (requires `bun run build:test` beforehand).
 * - Sequential tests reuse the already-running server instantly.
 * - The server persists across test files during multi-test runs (e.g. test:graphql,
 *   test:ui:e2e) to preserve route warmup and compilation state.
 */
export function setupTestServerLifecycle() {
  beforeAll(async () => {
    if (!serverStartPromise || !(await isTestServerRunning())) {
      serverStartPromise = startTestServer();
    }
    await serverStartPromise;
    await ensureDemoUsersForTests();
    testLogger.info(`GraphQL test server ready on port ${getTestPort()} (${getTestServerMode()} mode)`);
  }, 180_000);
}
