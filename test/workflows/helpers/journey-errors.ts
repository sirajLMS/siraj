import { expect } from "bun:test";

/**
 * try/catch error capture for journey negative steps. `expect(...).rejects.toThrow()`
 * is forbidden in this layer: the rejected promise interacts badly with the
 * service-level transactions that journey services open. Callers assert on the
 * returned error's translated message (never the raw translation key).
 */
export async function expectJourneyError(fn: () => Promise<unknown>): Promise<Error> {
  try {
    await fn();
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    return error instanceof Error ? error : new Error("Unexpected rejection shape");
  }
  throw new Error("expected the wrapped service call to throw");
}
