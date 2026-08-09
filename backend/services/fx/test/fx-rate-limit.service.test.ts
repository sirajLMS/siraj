import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const incrMock = mock(async (): Promise<number> => 1);
const expireMock = mock(async (): Promise<void> => {});

const cacheInstance = {
  incr: incrMock,
  expire: expireMock,
};

await mock.module("@/backend/services/cache", () => ({
  cacheService: cacheInstance,
}));

await mock.module("@/backend/lib", () => ({
  logger: {
    log: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  },
}));

// Service now calls getServerTranslations(locale).errorsTranslations (real import).
// fxRefreshRateLimitExceeded is preserved as a raw literal — no schema counterpart.
// (No mock needed here: fx-rate-limit.service does not call getServerTranslations.)

// ---------------------------------------------------------------------------
// SUT import (deferred so mocks are registered first)
// ---------------------------------------------------------------------------

async function importService(): Promise<{
  FxRateLimitService: { checkManualRefreshRateLimit: (userId: string) => Promise<void> };
}> {
  return import("@/backend/services/fx/fx-rate-limit.service");
}

function resetMocks(): void {
  incrMock.mockReset();
  incrMock.mockResolvedValue(1);
  expireMock.mockReset();
  expireMock.mockResolvedValue(undefined);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  resetMocks();
});

afterEach(() => {
  mock.restore();
});

describe("FxRateLimitService.checkManualRefreshRateLimit", () => {
  test("allows up to 3 refreshes within window", async () => {
    const { FxRateLimitService } = await importService();

    for (let i = 1; i <= 3; i++) {
      incrMock.mockResolvedValueOnce(i);
      await FxRateLimitService.checkManualRefreshRateLimit("user-1");
    }

    expect(incrMock).toHaveBeenCalledTimes(3);
  });

  test("on 4th call within window -> throws fxRefreshRateLimitExceeded", async () => {
    const { FxRateLimitService } = await importService();

    incrMock.mockResolvedValueOnce(1);
    await FxRateLimitService.checkManualRefreshRateLimit("user-1");
    incrMock.mockResolvedValueOnce(2);
    await FxRateLimitService.checkManualRefreshRateLimit("user-1");
    incrMock.mockResolvedValueOnce(3);
    await FxRateLimitService.checkManualRefreshRateLimit("user-1");

    incrMock.mockResolvedValueOnce(4);

    let thrown: unknown = null;
    try {
      await FxRateLimitService.checkManualRefreshRateLimit("user-1");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toBe("fxRefreshRateLimitExceeded");

    expect(incrMock).toHaveBeenCalledTimes(4);
  });

  test("redis expire only called on first incr (current === 1)", async () => {
    const { FxRateLimitService } = await importService();

    incrMock.mockResolvedValueOnce(1);
    await FxRateLimitService.checkManualRefreshRateLimit("user-1");
    expect(expireMock).toHaveBeenCalledTimes(1);

    incrMock.mockResolvedValueOnce(2);
    await FxRateLimitService.checkManualRefreshRateLimit("user-1");
    expect(expireMock).toHaveBeenCalledTimes(1);

    incrMock.mockResolvedValueOnce(3);
    await FxRateLimitService.checkManualRefreshRateLimit("user-1");
    expect(expireMock).toHaveBeenCalledTimes(1);

    incrMock.mockResolvedValueOnce(4);
    let thrown: unknown = null;
    try {
      await FxRateLimitService.checkManualRefreshRateLimit("user-1");
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(Error);
    expect(expireMock).toHaveBeenCalledTimes(1);

    expect(incrMock).toHaveBeenCalledTimes(4);
  });
});
