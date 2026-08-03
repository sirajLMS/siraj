import { afterEach, describe, expect, test } from "bun:test";
import { CronJobKind } from "@/backend/enum/cron/cron.enums";
import {
  getHandler,
  getRegisteredKinds,
  registerCoreHandlers,
  registerHandler,
} from "@/backend/services/cron/job-handler-registry";
import type { CronJobPayload, CronJobResult } from "@/backend/types/cron/cron.types";

const TEST_KIND = "TEST_KIND" as never;

afterEach(() => {
  // Re-register core handlers to reset state
  registerCoreHandlers();
});

describe("job-handler-registry", () => {
  test("registerHandler stores a handler retrievable by getHandler", () => {
    const handler = async (): Promise<CronJobResult> => ({ success: true });
    registerHandler(TEST_KIND, handler);
    expect(getHandler(TEST_KIND)).toBe(handler);
  });

  test("getHandler returns the built-in NOOP handler by default", () => {
    const noopHandler = getHandler(CronJobKind.NOOP);
    expect(noopHandler).not.toBeNull();
  });

  test("getHandler returns null for unregistered kind", () => {
    expect(getHandler("UNREGISTERED" as never)).toBeNull();
  });

  test("getRegisteredKinds includes NOOP and any registered handlers", () => {
    registerHandler(TEST_KIND, async () => ({ success: true }));
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
    const handler1 = async (): Promise<CronJobResult> => ({ success: true });
    const handler2 = async (): Promise<CronJobResult> => ({ success: false, error: "changed" });

    registerHandler(TEST_KIND, handler1);
    expect(getHandler(TEST_KIND)).toBe(handler1);

    registerHandler(TEST_KIND, handler2);
    expect(getHandler(TEST_KIND)).toBe(handler2);
  });
});
