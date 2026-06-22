import { expect, test } from "bun:test";
import type { DbTransaction } from "../test-utils";
import { runInRollback } from "../test-utils";

/**
 * Shared test helpers for scheduling repository tests.
 * Extracted to reduce file size and improve CodeScene scores.
 */

export async function expectRepositoryError(fn: () => Promise<unknown>) {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
}

/**
 * HELPER: testRepoError
 * Wrapper to drastically reduce CodeScene structural duplication issues.
 */
export function testRepoError(name: string, logic: (tx: DbTransaction) => Promise<void>) {
  test(name, async () => {
    await runInRollback(async tx => {
      await expectRepositoryError(() => logic(tx));
    });
  });
}
