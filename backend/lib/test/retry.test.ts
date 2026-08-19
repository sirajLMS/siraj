import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { logger } from "@/backend/lib/logger";
import { isTransientError, retryTransient } from "@/backend/lib/retry";
import { makeTransientError } from "@/backend/lib/test/helpers";

describe("isTransientError", () => {
  it("returns true for ECONNRESET", () => {
    expect(isTransientError(makeTransientError("ECONNRESET"))).toBe(true);
  });

  it("returns true for ETIMEDOUT", () => {
    expect(isTransientError(makeTransientError("ETIMEDOUT"))).toBe(true);
  });

  it("returns true for error messages containing 'timeout'", () => {
    expect(isTransientError(new Error("Request timeout exceeded"))).toBe(true);
  });

  it("returns true for error messages containing 'connection refused'", () => {
    expect(isTransientError(new Error("connection refused"))).toBe(true);
  });

  it("returns true for error messages containing 'connection reset'", () => {
    expect(isTransientError(new Error("connection reset by peer"))).toBe(true);
  });

  it("returns true for error messages containing 'connection terminated'", () => {
    expect(isTransientError(new Error("connection terminated"))).toBe(true);
  });

  it("returns false for error messages containing bare 'connection' without transient pattern", () => {
    expect(isTransientError(new Error("invalid connection string"))).toBe(false);
  });

  it("returns true for error messages containing 'WebSocket'", () => {
    expect(isTransientError(new Error("WebSocket is not open"))).toBe(true);
  });

  it("returns false for non-transient errors", () => {
    expect(isTransientError(new Error("Invalid credentials"))).toBe(false);
  });

  it("returns false for null", () => {
    expect(isTransientError(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isTransientError(undefined)).toBe(false);
  });
});

describe("retryTransient", () => {
  let warnSpy: ReturnType<typeof spyOn>;
  let infoSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    warnSpy = spyOn(logger, "warn").mockImplementation(() => undefined);
    infoSpy = spyOn(logger, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
    infoSpy.mockRestore();
  });

  it("succeeds immediately when fn does not throw", async () => {
    const fn = mock(() => Promise.resolve("ok"));
    const result = await retryTransient(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries transient error then succeeds", async () => {
    const fn = mock(() => {
      if (fn.mock.calls.length < 2) {
        return Promise.reject(makeTransientError("ECONNRESET"));
      }
      return Promise.resolve("recovered");
    });

    const result = await retryTransient(fn, { baseDelayMs: 1 });
    expect(result).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
    expect(infoSpy).toHaveBeenCalledTimes(1);
  });

  it("throws after exhausting retries on persistent transient error", async () => {
    const fn = mock(() => Promise.reject(makeTransientError("ETIMEDOUT")));
    const error = await retryTransient(fn, { maxRetries: 2, baseDelayMs: 1 }).catch(e => e);
    expect(error).toBeInstanceOf(Error);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does NOT retry non-transient errors", async () => {
    const fn = mock(() => Promise.reject(new Error("Invalid credentials")));
    const error = await retryTransient(fn, { baseDelayMs: 1 }).catch(e => e);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Invalid credentials");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does NOT retry when maxRetries is 0", async () => {
    const fn = mock(() => Promise.reject(makeTransientError("ECONNRESET")));
    const error = await retryTransient(fn, { maxRetries: 0, baseDelayMs: 1 }).catch(e => e);
    expect(error).toBeInstanceOf(Error);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("logs warning on each retry attempt", async () => {
    const fn = mock(() => {
      if (fn.mock.calls.length < 3) {
        return Promise.reject(makeTransientError("ECONNRESET"));
      }
      return Promise.resolve("ok");
    });

    await retryTransient(fn, { maxRetries: 3, baseDelayMs: 1 });
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });
});
