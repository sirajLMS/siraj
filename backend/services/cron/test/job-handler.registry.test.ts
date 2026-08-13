import { afterEach, describe, expect, test } from "bun:test";
import { CronJobKind } from "@/backend/enum/cron/cron.enums";
import {
  getHandler,
  getRegisteredKinds,
  registerCoreHandlers,
  registerHandler,
} from "@/backend/services/cron/job-handler-registry";
import type { CronJobPayload, CronJobResult } from "@/backend/types";

/**
 * Build a `CronJobKind` from an arbitrary string for testing.
 * Uses `Object.assign` to override the typed property at runtime without an
 * unsafe `as` narrowing assertion (see pgboss.adapter.test.ts for precedent).
 */
function makeTestKind(value: string): CronJobKind {
  return Object.assign({ kind: CronJobKind.NOOP }, { kind: value }).kind;
}

const TEST_KIND = makeTestKind("TEST_KIND");
const UNREGISTERED_KIND = makeTestKind("UNREGISTERED");

const successHandler = async (): Promise<CronJobResult> => ({ success: true });
const failureHandler = async (): Promise<CronJobResult> => ({ success: false, error: "changed" });

afterEach(() => {
  // Re-register core handlers to reset state
  registerCoreHandlers();
});

describe("job-handler-registry", () => {
  test("registerHandler stores a handler retrievable by getHandler", () => {
    registerHandler(TEST_KIND, successHandler);
    expect(getHandler(TEST_KIND)).toBe(successHandler);
  });

  test("getHandler returns the built-in NOOP handler by default", () => {
    const noopHandler = getHandler(CronJobKind.NOOP);
    expect(noopHandler).not.toBeNull();
  });

  test("getHandler returns null for unregistered kind", () => {
    expect(getHandler(UNREGISTERED_KIND)).toBeNull();
  });

  test("getRegisteredKinds includes NOOP and any registered handlers", () => {
    registerHandler(TEST_KIND, successHandler);
    const kinds = getRegisteredKinds();
    expect(kinds).toContain(CronJobKind.NOOP);
    expect(kinds).toContain(TEST_KIND);
  });

  test("registered handler can be invoked with a CronJobPayload", async () => {
    const result: CronJobResult = { success: true };
    registerHandler(TEST_KIND, async () => result);

    const handler = getHandler(TEST_KIND);
    expect(handler).not.toBeNull();

    const job: CronJobPayload = {
      runId: "test-run-1",
      scheduleId: "test-sched-1",
      jobKind: TEST_KIND,
      payload: null,
      attempt: 1,
      timeoutSeconds: 60,
    };

    const handlerResult = await handler?.(job);
    expect(handlerResult).toEqual(result);
  });

  test("registerHandler overwrites existing handler for same kind", () => {
    registerHandler(TEST_KIND, successHandler);
    expect(getHandler(TEST_KIND)).toBe(successHandler);

    registerHandler(TEST_KIND, failureHandler);
    expect(getHandler(TEST_KIND)).toBe(failureHandler);
  });
});
