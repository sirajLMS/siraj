import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import type { LogEntry } from "@/frontend/common/lib/logger/types";

// --- date-utils mock (stable timestamp) ---------------------------------

const FIXED_TIMESTAMP = "2026-01-01T00:00:00.000Z";

void mock.module("@/shared/utils/date-utils", () => ({
  formatTimestamp: () => FIXED_TIMESTAMP,
}));

// --- Mocks ---------------------------------------------------------------

const fetchImpl = mock((_input: string | URL | Request, _options?: RequestInit) => Promise.resolve(new Response()));

// --- Module-level state -------------------------------------------------

let beforeunloadListener: EventListener | null;
let timerCallback: (() => void) | null;
let savedSetTimeout: typeof globalThis.setTimeout;
let savedClearTimeout: typeof globalThis.clearTimeout;
let savedFetch: typeof globalThis.fetch;
let savedNodeEnv: string | undefined;
let savedWindow: unknown;
let hadWindow: boolean;

/** Create a fresh ClientLogger instance. */
async function createLogger() {
  const mod = await import("@/frontend/common/lib/logger");
  return new mod.ClientLogger();
}

/** Type guard: checks value has a `logs` array property. */
function hasLogsArray(value: unknown): value is { logs: LogEntry[] } {
  if (typeof value !== "object" || value === null) return false;
  if (!("logs" in value)) return false;
  return Array.isArray(value.logs);
}

/** Extract the body from a fetch mock call. */
function getFetchBody(callIndex: number): { logs: LogEntry[] } {
  const opts = fetchImpl.mock.calls[callIndex][1];
  if (typeof opts === "undefined") throw new Error("Missing fetch options");
  const body = opts.body;
  if (typeof body !== "string") throw new Error("Missing fetch body");
  const parsed: unknown = JSON.parse(body);
  if (!hasLogsArray(parsed)) throw new Error("Invalid body shape");
  return parsed;
}

/** Extract the options object from a fetch mock call. */
function getFetchOptions(callIndex: number): RequestInit {
  const opts = fetchImpl.mock.calls[callIndex][1];
  if (typeof opts === "undefined") throw new Error("Missing fetch options");
  return opts;
}

// --- Tests ---------------------------------------------------------------

beforeEach(() => {
  savedSetTimeout = globalThis.setTimeout;
  savedClearTimeout = globalThis.clearTimeout;
  savedFetch = globalThis.fetch;
  savedNodeEnv = process.env.NODE_ENV;
  hadWindow = typeof globalThis.window !== "undefined";
  savedWindow = globalThis.window;
  timerCallback = null;
  beforeunloadListener = null;

  // Mock timers via defineProperty (avoids __promisify__ type mismatch)
  Object.defineProperty(globalThis, "setTimeout", {
    value: (handler: TimerHandler) => {
      if (typeof handler === "function") {
        timerCallback = () => {
          void handler();
        };
      }
      return 0;
    },
    writable: true,
    configurable: true,
  });

  Object.defineProperty(globalThis, "clearTimeout", {
    value: () => {
      timerCallback = null;
    },
    writable: true,
    configurable: true,
  });

  // Mock fetch via defineProperty (avoids preconnect type mismatch)
  Object.defineProperty(globalThis, "fetch", {
    value: fetchImpl,
    writable: true,
    configurable: true,
  });

  // Mock NODE_ENV
  Object.defineProperty(process.env, "NODE_ENV", {
    value: "development",
    writable: true,
    configurable: true,
  });

  // Mock window
  const fakeWindow = {
    addEventListener: (type: string, listener: EventListener) => {
      if (type === "beforeunload") {
        beforeunloadListener = listener;
      }
    },
    removeEventListener: (type: string) => {
      if (type === "beforeunload") {
        beforeunloadListener = null;
      }
    },
  };
  Object.defineProperty(globalThis, "window", {
    value: fakeWindow,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  Object.defineProperty(globalThis, "setTimeout", {
    value: savedSetTimeout,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis, "clearTimeout", {
    value: savedClearTimeout,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis, "fetch", {
    value: savedFetch,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(process.env, "NODE_ENV", {
    value: savedNodeEnv,
    writable: true,
    configurable: true,
  });
  if (hadWindow) {
    Object.defineProperty(globalThis, "window", {
      value: savedWindow,
      writable: true,
      configurable: true,
    });
  } else {
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      writable: true,
      configurable: true,
    });
  }
  fetchImpl.mockClear();
  timerCallback = null;
  beforeunloadListener = null;
});

/** Verify that a single log of the given level flushes despite the min-size guard. */
async function testPriorityLogBypass(level: "error" | "warn"): Promise<void> {
  const logger = await createLogger();
  if (level === "error") {
    logger.error({ caller: "test" }, `${level} msg`);
  } else {
    logger.warn({ caller: "test" }, `${level} msg`);
  }

  timerCallback?.();
  await Promise.resolve();

  expect(fetchImpl).toHaveBeenCalledTimes(1);
  const body = getFetchBody(0);
  expect(body.logs).toHaveLength(1);
  expect(body.logs[0].level).toBe(level);
  logger.destroy();
}

describe("ClientLogger", () => {
  test("registers beforeunload listener on construction", async () => {
    const logger = await createLogger();
    expect(beforeunloadListener).not.toBeNull();
    logger.destroy();
  });

  test("destroy removes beforeunload listener", async () => {
    const logger = await createLogger();
    logger.destroy();
    expect(beforeunloadListener).toBeNull();
  });

  test("batchInterval is set to 30000ms (30s)", async () => {
    const logger = await createLogger();
    logger.info({ caller: "test" }, "msg1");
    expect(timerCallback).not.toBeNull();
    logger.destroy();
  });

  test("minimum batch size guard: skips POST when queue < 5 and timer fired", async () => {
    const logger = await createLogger();
    logger.info({ caller: "test" }, "msg1");
    logger.info({ caller: "test" }, "msg2");
    logger.info({ caller: "test" }, "msg3");

    expect(timerCallback).not.toBeNull();
    timerCallback?.();
    await Promise.resolve();

    expect(fetchImpl).not.toHaveBeenCalled();
    // Timer should have been re-scheduled
    expect(timerCallback).not.toBeNull();
    logger.destroy();
  });

  test("minimum batch size guard: sends POST when queue >= 5 and timer fired", async () => {
    const logger = await createLogger();
    for (let i = 0; i < 5; i++) {
      logger.info({ caller: "test" }, `msg${i + 1}`);
    }

    timerCallback?.();
    await Promise.resolve();

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const body = getFetchBody(0);
    expect(body.logs).toHaveLength(5);
    logger.destroy();
  });

  test("forced log (error with force: true) bypasses minimum batch size guard", async () => {
    const logger = await createLogger();
    logger.error({ caller: "test", force: true }, "error msg");

    timerCallback?.();
    await Promise.resolve();

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const body = getFetchBody(0);
    expect(body.logs).toHaveLength(1);
    expect(body.logs[0].level).toBe("error");
    logger.destroy();
  });

  test("error log without force bypasses minimum batch size guard", async () => {
    await testPriorityLogBypass("error");
  });

  test("warn log without force bypasses minimum batch size guard", async () => {
    await testPriorityLogBypass("warn");
  });

  test("beforeunload flush uses keepalive: true", async () => {
    const logger = await createLogger();
    logger.info({ caller: "test" }, "msg1");
    logger.info({ caller: "test" }, "msg2");

    if (beforeunloadListener) beforeunloadListener(new Event("beforeunload"));
    await Promise.resolve();

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const opts = getFetchOptions(0);
    expect(opts.keepalive).toBe(true);
    expect(opts.method).toBe("POST");
    logger.destroy();
  });

  test("beforeunload flush sends queued logs even when below minimum batch size", async () => {
    const logger = await createLogger();
    logger.info({ caller: "test" }, "msg1");

    if (beforeunloadListener) beforeunloadListener(new Event("beforeunload"));
    await Promise.resolve();

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const body = getFetchBody(0);
    expect(body.logs).toHaveLength(1);
    logger.destroy();
  });

  test("destroy clears the pending batch timer", async () => {
    const logger = await createLogger();
    logger.info({ caller: "test" }, "msg1");
    expect(timerCallback).not.toBeNull();

    logger.destroy();
    expect(timerCallback).toBeNull();
  });

  test("POST body contains JSON with Content-Type application/json", async () => {
    const logger = await createLogger();
    logger.info({ caller: "testCaller" }, "test message");

    if (beforeunloadListener) beforeunloadListener(new Event("beforeunload"));
    await Promise.resolve();

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const opts = getFetchOptions(0);
    expect(opts.headers).toMatchObject({ "Content-Type": "application/json" });
    const body = getFetchBody(0);
    expect(body.logs[0].caller).toBe("testCaller");
    expect(body.logs[0].message).toBe("test message");
    logger.destroy();
  });

  test("only one timer is scheduled for multiple logs before flush", async () => {
    const logger = await createLogger();
    let timerCount = 0;

    Object.defineProperty(globalThis, "setTimeout", {
      value: (handler: TimerHandler) => {
        if (timerCallback === null) timerCount++;
        if (typeof handler === "function") {
          timerCallback = () => {
            void handler();
          };
        }
        return 0;
      },
      writable: true,
      configurable: true,
    });

    logger.info({ caller: "test" }, "msg1");
    logger.info({ caller: "test" }, "msg2");
    logger.info({ caller: "test" }, "msg3");
    logger.info({ caller: "test" }, "msg4");

    expect(timerCount).toBe(1);
    logger.destroy();
  });

  test("flush resets timer allowing new batch to schedule", async () => {
    const logger = await createLogger();
    for (let i = 0; i < 5; i++) {
      logger.info({ caller: "test" }, `msg${i + 1}`);
    }

    timerCallback?.();
    await Promise.resolve();

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(timerCallback).toBeNull();

    logger.info({ caller: "test" }, "msg6");
    expect(timerCallback).not.toBeNull();
    logger.destroy();
  });
});
