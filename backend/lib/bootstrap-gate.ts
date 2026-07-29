import { isTestHelperEnabled } from "@/backend/lib/test-helper-gate";

/**
 * Safety gate for **seed and test-harness writes only**.
 *
 * Production GraphQL/API handlers must never call seed services. This gate blocks
 * those writes when `NODE_ENV=production` unless an explicit test harness is active
 * (`TEST_SERVER=1`, `TEST_CI=true`). Always hard-denied on Vercel production
 * (`VERCEL_ENV=production`).
 *
 * @see backend/services/seed/ — services that call {@link assertSeedWriteAllowed}
 * @see backend/lib/test-helper-gate.ts — GraphQL test-helper mutation gate
 */
export function isSeedWriteAllowed(): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }
  return isTestHelperEnabled();
}

/**
 * Throws when seed/test-harness writes must not run in the current environment.
 *
 * @param operationLabel - Human-readable label for error messages (e.g. `"Demo user seed writes"`)
 */
export function assertSeedWriteAllowed(operationLabel: string): void {
  if (!isSeedWriteAllowed()) {
    throw new Error(`${operationLabel} are not allowed in production.`);
  }
}
