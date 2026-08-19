import { beforeAll } from "bun:test";
import { ensureDemoUsersForTests } from "@/frontend/common/graphql/test/helpers";
import { getTestPort, getTestServerMode } from "@/frontend/common/graphql/test/testPort";
import { isTestServerRunning, startTestServer } from "@/frontend/common/graphql/test/testServer";
import { testLogger } from "@/shared/lib/logger/testlogger";

let serverStartPromise: Promise<void> | null = null;

/**
 * Setup the shared Next.js test server for cold-start simulation tests.
 *
 * Identical to setupTestServerLifecycle(), but kept separate so cold-start
 * tests can later override env vars (e.g. DISABLE_RATE_LIMITING) without
 * affecting standard GraphQL integration tests.
 */
export function setupColdStartTestLifecycle() {
  beforeAll(async () => {
    if (!serverStartPromise || !(await isTestServerRunning())) {
      serverStartPromise = startTestServer();
    }
    await serverStartPromise;
    await ensureDemoUsersForTests();
    testLogger.info(`Cold-start test server ready on port ${getTestPort()} (${getTestServerMode()} mode)`);
  }, 180_000);
}

/** Extracts the GraphQL error code from an Apollo mutation result. */
export function getGraphQLErrorCode(result: {
  errors?: { extensions?: { code?: string } }[] | null;
}): string | undefined {
  return result.errors?.[0]?.extensions?.code;
}

/** Extracts the GraphQL error message from an Apollo mutation result. */
export function getGraphQLErrorMessage(result: { errors?: { message?: string }[] | null }): string | undefined {
  return result.errors?.[0]?.message;
}

/** Constructs a transient error for consistent cold-start simulation. */
export function makeTransientError(message: string): Error {
  const err = new Error(message);
  Object.defineProperty(err, "code", { value: "ETIMEDOUT", enumerable: true });
  return err;
}
