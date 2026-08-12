import { expect, test } from "bun:test";
import type { DBTransaction } from "@/backend/types";
import { runInRollback } from "@/backend/db/test/test-utils";

/**
 * Shared test helpers for scheduling repository tests.
 * Extracted to reduce file size and improve CodeScene scores.
 */

export async function expectRepositoryError(fn: () => Promise<unknown>): Promise<Error> {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
  if (errorCaught instanceof Error) return errorCaught;
  throw new Error(String(errorCaught));
}

/**
 * HELPER: testRepoError
 * Wrapper to drastically reduce CodeScene structural duplication issues.
 */
export function testRepoError(name: string, logic: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    await runInRollback(async tx => {
      await expectRepositoryError(() => logic(tx));
    });
  });
}
